import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { useAuth } from '@/features/auth/AuthContext';
import { propertyVisitService, PropertyVisit, VisitStatus } from '@/services/propertyVisitService';
import { apiClient } from '@/services/apiClient';

const VISIT_TABS: { id: string; label: string; color: string; bg: string }[] = [
  { id: 'all', label: 'All', color: '#0F172A', bg: '#F1F5F9' },
  { id: 'pending_approval', label: 'Pending', color: '#D97706', bg: '#FEF3C7' },
  { id: 'approved', label: 'Approved', color: '#059669', bg: '#D1FAE5' },
  { id: 'rescheduled', label: 'Rescheduled', color: '#2563EB', bg: '#DBEAFE' },
  { id: 'completed', label: 'Completed', color: '#065F46', bg: '#A7F3D0' },
  { id: 'rejected', label: 'Rejected', color: '#DC2626', bg: '#FEE2E2' },
  { id: 'cancelled', label: 'Cancelled', color: '#64748B', bg: '#F1F5F9' },
  { id: 'no_show', label: 'No Show', color: '#EA580C', bg: '#FFEDD5' },
];

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending_approval: { label: 'Pending Approval', color: '#D97706', bg: '#FEF3C7', icon: 'clock' },
  approved: { label: 'Approved', color: '#059669', bg: '#D1FAE5', icon: 'check-circle' },
  rejected: { label: 'Rejected', color: '#DC2626', bg: '#FEE2E2', icon: 'x-circle' },
  rescheduled: { label: 'Rescheduled', color: '#2563EB', bg: '#DBEAFE', icon: 'refresh-cw' },
  completed: { label: 'Completed', color: '#065F46', bg: '#A7F3D0', icon: 'check-square' },
  cancelled: { label: 'Cancelled', color: '#64748B', bg: '#F1F5F9', icon: 'slash' },
  no_show: { label: 'No Show', color: '#EA580C', bg: '#FFEDD5', icon: 'alert-triangle' },
  scheduled: { label: 'Scheduled', color: '#0284C7', bg: '#E0F2FE', icon: 'calendar' },
};

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] || { label: status, color: '#64748B', bg: '#F1F5F9', icon: 'circle' };
  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <Feather name={meta.icon as any} size={11} color={meta.color} style={{ marginRight: 4 }} />
      <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

interface AgentProperty {
  id: string;
  title: string;
  city: string;
}

export default function AgentSiteVisitsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const agentId = user?.id || '';

  const [visits, setVisits] = useState<PropertyVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // New Visit Request Modal
  const [showNewVisitModal, setShowNewVisitModal] = useState(false);
  const [properties, setProperties] = useState<AgentProperty[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('11:00 AM');
  const [altSlot1Date, setAltSlot1Date] = useState('');
  const [altSlot1Time, setAltSlot1Time] = useState('');
  const [altSlot2Date, setAltSlot2Date] = useState('');
  const [altSlot2Time, setAltSlot2Time] = useState('');
  const [visitNotes, setVisitNotes] = useState('');
  const [showAltSlots, setShowAltSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Complete / Cancel / No-Show modals
  const [actionTarget, setActionTarget] = useState<{ visit: PropertyVisit; action: 'complete' | 'cancel' | 'no_show' } | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actioning, setActioning] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchVisits = useCallback(async () => {
    if (!agentId) return;
    try {
      const list = await propertyVisitService.getAll({ agentId });
      setVisits(list);
    } catch (err) {
      console.warn('[AgentVisits] fetchVisits error:', err);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  const fetchProperties = useCallback(async () => {
    try {
      const res = await apiClient.get<any[]>('/properties', { assignedAgentId: agentId, limit: 100 });
      if (res.success && Array.isArray(res.data)) {
        setProperties(res.data.map((p: any) => ({
          id: p.id,
          title: p.title,
          city: p.locationCity || p.city || '',
        })));
      }
    } catch (err) {
      console.warn('[AgentVisits] fetchProperties error:', err);
    }
  }, [agentId]);

  useEffect(() => {
    fetchVisits();
    fetchProperties();
    const interval = setInterval(fetchVisits, 15000);
    return () => clearInterval(interval);
  }, [fetchVisits, fetchProperties]);

  const filtered = useMemo(() => {
    return visits.filter((v) => {
      const matchTab = activeTab === 'all' || v.status === activeTab;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        v.clientName.toLowerCase().includes(q) ||
        v.clientPhone.includes(q) ||
        v.propertyTitle.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [visits, activeTab, searchQuery]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: visits.length };
    VISIT_TABS.forEach((t) => {
      if (t.id !== 'all') counts[t.id] = visits.filter((v) => v.status === t.id).length;
    });
    return counts;
  }, [visits]);

  // ── Submit New Visit ──────────────────────────────────────────────────────
  const handleSubmitVisit = async () => {
    if (!selectedPropertyId) { showToast('Please select a property.', 'error'); return; }
    if (!clientName.trim()) { showToast('Please enter the client name.', 'error'); return; }
    if (!clientPhone.trim()) { showToast('Please enter the client phone.', 'error'); return; }
    if (!visitDate.trim()) { showToast('Please enter a visit date.', 'error'); return; }

    setSubmitting(true);
    const result = await propertyVisitService.createVisitRequest({
      propertyId: selectedPropertyId,
      agentId,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail.trim(),
      visitDate: visitDate.trim(),
      visitTime: visitTime.trim(),
      altSlot1Date: altSlot1Date.trim() || undefined,
      altSlot1Time: altSlot1Time.trim() || undefined,
      altSlot2Date: altSlot2Date.trim() || undefined,
      altSlot2Time: altSlot2Time.trim() || undefined,
      notes: visitNotes.trim() || undefined,
    });
    setSubmitting(false);

    if (result) {
      showToast('✅ Visit request submitted! Awaiting admin approval.');
      setShowNewVisitModal(false);
      resetNewVisitForm();
      fetchVisits();
    } else {
      showToast('Failed to submit visit request. Please try again.', 'error');
    }
  };

  const resetNewVisitForm = () => {
    setSelectedPropertyId('');
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setVisitDate('');
    setVisitTime('11:00 AM');
    setAltSlot1Date('');
    setAltSlot1Time('');
    setAltSlot2Date('');
    setAltSlot2Time('');
    setVisitNotes('');
    setShowAltSlots(false);
  };

  // ── Action (Complete / Cancel / No-Show) ──────────────────────────────────
  const handleAction = async () => {
    if (!actionTarget) return;
    setActioning(true);

    let ok = false;
    if (actionTarget.action === 'complete') {
      ok = await propertyVisitService.complete(actionTarget.visit.id, actionNotes);
    } else if (actionTarget.action === 'cancel') {
      ok = await propertyVisitService.cancel(actionTarget.visit.id, actionNotes);
    } else if (actionTarget.action === 'no_show') {
      ok = await propertyVisitService.markNoShow(actionTarget.visit.id);
    }

    setActioning(false);
    setActionTarget(null);
    setActionNotes('');

    if (ok) {
      showToast(`✅ Visit ${actionTarget.action === 'complete' ? 'completed' : actionTarget.action === 'cancel' ? 'cancelled' : 'marked as no-show'}.`);
      fetchVisits();
    } else {
      showToast('Action failed. Please try again.', 'error');
    }
  };

  const renderCard = (visit: PropertyVisit) => {
    const displayDate = (visit.status === 'approved' || visit.status === 'rescheduled') && visit.confirmedDate
      ? visit.confirmedDate
      : visit.visitDate;
    const displayTime = (visit.status === 'approved' || visit.status === 'rescheduled') && visit.confirmedTime
      ? visit.confirmedTime
      : visit.visitTime;

    const canComplete = visit.status === 'approved' || visit.status === 'rescheduled';
    const canCancel = ['pending_approval', 'approved'].includes(visit.status);
    const canNoShow = visit.status === 'approved' || visit.status === 'rescheduled';

    return (
      <View key={visit.id} style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            {visit.propertyImage ? (
              <Image source={{ uri: visit.propertyImage }} style={styles.propThumb} />
            ) : (
              <View style={styles.propThumbPlaceholder}>
                <Feather name="home" size={16} color="#94A3B8" />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.propTitle} numberOfLines={1}>{visit.propertyTitle}</Text>
              <Text style={styles.propCity}>{visit.propertyCity}</Text>
            </View>
          </View>
          <StatusBadge status={visit.status} />
        </View>

        <View style={styles.divider} />

        {/* Details */}
        <View style={styles.detailRow}>
          <Feather name="user" size={13} color="#64748B" />
          <Text style={styles.detailText}>{visit.clientName} · {visit.clientPhone}</Text>
        </View>
        <View style={styles.detailRow}>
          <Feather name="calendar" size={13} color="#64748B" />
          <Text style={styles.detailText}>
            {(visit.status === 'approved' || visit.status === 'rescheduled') && visit.confirmedDate
              ? `✓ Confirmed: ${displayDate} at ${displayTime}`
              : `Requested: ${displayDate} at ${displayTime}`}
          </Text>
        </View>

        {/* Status-specific info */}
        {visit.status === 'pending_approval' && (
          <View style={styles.infoAlert}>
            <Feather name="clock" size={12} color="#D97706" />
            <Text style={styles.infoAlertText}>Awaiting admin approval</Text>
          </View>
        )}
        {visit.rejectionReason ? (
          <Text style={styles.rejectionText}>❌ {visit.rejectionReason}</Text>
        ) : null}
        {visit.rescheduleReason ? (
          <Text style={styles.rescheduleText}>🔄 Rescheduled: {visit.rescheduleReason}</Text>
        ) : null}
        {visit.notes ? (
          <Text style={styles.notesText}>📝 {visit.notes}</Text>
        ) : null}

        {/* Actions */}
        {(canComplete || canCancel || canNoShow) && (
          <View style={styles.cardActions}>
            {canComplete && (
              <TouchableOpacity
                style={styles.completeBtn}
                onPress={() => setActionTarget({ visit, action: 'complete' })}
              >
                <Feather name="check-square" size={13} color="#fff" />
                <Text style={styles.completeBtnText}>Complete</Text>
              </TouchableOpacity>
            )}
            {canNoShow && (
              <TouchableOpacity
                style={styles.noShowBtn}
                onPress={() => setActionTarget({ visit, action: 'no_show' })}
              >
                <Feather name="user-x" size={13} color="#EA580C" />
                <Text style={styles.noShowBtnText}>No Show</Text>
              </TouchableOpacity>
            )}
            {canCancel && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setActionTarget({ visit, action: 'cancel' })}
              >
                <Feather name="slash" size={13} color="#64748B" />
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Site Visits</Text>
          <Text style={styles.headerSub}>{visits.length} total visits</Text>
        </View>
        <TouchableOpacity style={styles.newVisitBtn} onPress={() => setShowNewVisitModal(true)}>
          <Feather name="plus" size={15} color="#fff" />
          <Text style={styles.newVisitBtnText}>Schedule Visit</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Feather name="search" size={15} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by client or property..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {VISIT_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = tabCounts[tab.id] || 0;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && { backgroundColor: tab.color }]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, isActive && { color: '#fff' }]}>{tab.label}</Text>
              {count > 0 && (
                <View style={[styles.tabCount, isActive && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                  <Text style={[styles.tabCountText, isActive && { color: '#fff' }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Feather name="calendar" size={40} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No visits</Text>
          <Text style={styles.emptyText}>
            {activeTab === 'all'
              ? 'Schedule a property visit to get started.'
              : `No ${activeTab.replace(/_/g, ' ')} visits.`}
          </Text>
          <TouchableOpacity style={styles.newVisitBtn} onPress={() => setShowNewVisitModal(true)}>
            <Feather name="plus" size={14} color="#fff" />
            <Text style={styles.newVisitBtnText}>Schedule Visit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={{ padding: 16, gap: 12 }}>
          {filtered.map(renderCard)}
        </ScrollView>
      )}

      {/* Toast */}
      {toast && (
        <View style={[styles.toast, { backgroundColor: toast.type === 'success' ? '#059669' : '#DC2626' }]}>
          <Text style={styles.toastText}>{toast.msg}</Text>
        </View>
      )}

      {/* ── New Visit Request Modal ── */}
      <Modal visible={showNewVisitModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule Property Visit</Text>
              <TouchableOpacity onPress={() => { setShowNewVisitModal(false); resetNewVisitForm(); }}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Property */}
              <Text style={styles.fieldLabel}>Property *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                {properties.length === 0 ? (
                  <Text style={styles.noPropsText}>No assigned properties found</Text>
                ) : (
                  properties.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.propChip, selectedPropertyId === p.id && styles.propChipSelected]}
                      onPress={() => setSelectedPropertyId(p.id)}
                    >
                      <Text style={[styles.propChipText, selectedPropertyId === p.id && { color: '#fff' }]}>
                        {p.title}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>

              {/* Client Info */}
              <Text style={styles.fieldLabel}>Client Name *</Text>
              <TextInput style={styles.input} value={clientName} onChangeText={setClientName}
                placeholder="Full name" placeholderTextColor="#94A3B8" />

              <Text style={styles.fieldLabel}>Client Phone *</Text>
              <TextInput style={styles.input} value={clientPhone} onChangeText={setClientPhone}
                placeholder="+91 9000000000" placeholderTextColor="#94A3B8" keyboardType="phone-pad" />

              <Text style={styles.fieldLabel}>Client Email</Text>
              <TextInput style={styles.input} value={clientEmail} onChangeText={setClientEmail}
                placeholder="email@example.com" placeholderTextColor="#94A3B8" keyboardType="email-address" />

              {/* Primary Slot */}
              <Text style={styles.sectionHeading}>Primary Visit Slot</Text>

              <Text style={styles.fieldLabel}>Date (YYYY-MM-DD) *</Text>
              <TextInput style={styles.input} value={visitDate} onChangeText={setVisitDate}
                placeholder="2026-09-28" placeholderTextColor="#94A3B8" />

              <Text style={styles.fieldLabel}>Time *</Text>
              <TextInput style={styles.input} value={visitTime} onChangeText={setVisitTime}
                placeholder="11:00 AM" placeholderTextColor="#94A3B8" />

              {/* Alternative Slots */}
              <TouchableOpacity
                style={styles.altSlotToggle}
                onPress={() => setShowAltSlots(!showAltSlots)}
              >
                <Feather name={showAltSlots ? 'chevron-up' : 'chevron-down'} size={14} color="#6366F1" />
                <Text style={styles.altSlotToggleText}>
                  {showAltSlots ? 'Hide' : 'Add'} Alternative Time Slots (optional)
                </Text>
              </TouchableOpacity>

              {showAltSlots && (
                <>
                  <Text style={styles.sectionHeading}>Alt Slot 1</Text>
                  <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 6 }}>
                      <Text style={styles.fieldLabel}>Date</Text>
                      <TextInput style={styles.input} value={altSlot1Date} onChangeText={setAltSlot1Date}
                        placeholder="YYYY-MM-DD" placeholderTextColor="#94A3B8" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>Time</Text>
                      <TextInput style={styles.input} value={altSlot1Time} onChangeText={setAltSlot1Time}
                        placeholder="3:00 PM" placeholderTextColor="#94A3B8" />
                    </View>
                  </View>

                  <Text style={styles.sectionHeading}>Alt Slot 2</Text>
                  <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 6 }}>
                      <Text style={styles.fieldLabel}>Date</Text>
                      <TextInput style={styles.input} value={altSlot2Date} onChangeText={setAltSlot2Date}
                        placeholder="YYYY-MM-DD" placeholderTextColor="#94A3B8" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>Time</Text>
                      <TextInput style={styles.input} value={altSlot2Time} onChangeText={setAltSlot2Time}
                        placeholder="5:00 PM" placeholderTextColor="#94A3B8" />
                    </View>
                  </View>
                </>
              )}

              {/* Notes */}
              <Text style={styles.fieldLabel}>Notes (optional)</Text>
              <TextInput style={[styles.input, styles.textArea]} value={visitNotes} onChangeText={setVisitNotes}
                placeholder="Additional context for the admin..." placeholderTextColor="#94A3B8"
                multiline numberOfLines={3} />

              <View style={styles.infoBox}>
                <Feather name="info" size={14} color="#6366F1" />
                <Text style={styles.infoBoxText}>
                  This request will be sent to the admin for approval. You'll be notified once it's reviewed.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => { setShowNewVisitModal(false); resetNewVisitForm(); }}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmitVisit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="send" size={14} color="#fff" />
                    <Text style={styles.submitBtnText}>Submit Request</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Action Confirmation Modal ── */}
      <Modal visible={!!actionTarget} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {actionTarget?.action === 'complete' ? '✔️ Mark as Completed' :
               actionTarget?.action === 'cancel' ? '🚫 Cancel Visit' :
               '⚠️ Mark as No-Show'}
            </Text>
            <Text style={styles.modalSub}>
              {actionTarget?.visit.clientName} · {actionTarget?.visit.propertyTitle}
            </Text>

            {actionTarget?.action !== 'no_show' && (
              <>
                <Text style={styles.fieldLabel}>
                  {actionTarget?.action === 'complete' ? 'Notes (optional)' : 'Cancellation Reason (optional)'}
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={actionNotes}
                  onChangeText={setActionNotes}
                  placeholder={actionTarget?.action === 'complete' ? 'Add visit feedback...' : 'Reason for cancellation...'}
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                />
              </>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => { setActionTarget(null); setActionNotes(''); }}>
                <Text style={styles.cancelModalBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn,
                  actionTarget?.action === 'cancel' && { backgroundColor: '#64748B' },
                  actionTarget?.action === 'no_show' && { backgroundColor: '#EA580C' },
                ]}
                onPress={handleAction}
                disabled={actioning}
              >
                {actioning ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 13, color: '#64748B', marginTop: 2 },
  newVisitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#6366F1', paddingHorizontal: 14, paddingVertical: 9, borderRadius: BorderRadius.md,
  },
  newVisitBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: BorderRadius.md, borderWidth: 1, borderColor: '#E2E8F0',
    marginHorizontal: 16, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10,
  },
  searchInput: {
    flex: 1, marginLeft: 8, fontSize: 14, color: '#0F172A',
    ...Platform.select({ web: { outlineWidth: 0 } as any }),
  },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 4, maxHeight: 46 },
  tab: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full,
    marginRight: 6, backgroundColor: '#F1F5F9',
  },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabCount: {
    marginLeft: 5, minWidth: 20, height: 18, borderRadius: 9,
    backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  tabCountText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  list: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#334155', marginTop: 12 },
  emptyText: { fontSize: 14, color: '#94A3B8', textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: '#E8EDF5', padding: 16, ...Shadows.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  propThumb: { width: 42, height: 42, borderRadius: 8, backgroundColor: '#F1F5F9' },
  propThumbPlaceholder: {
    width: 42, height: 42, borderRadius: 8,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  propTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  propCity: { fontSize: 12, color: '#64748B', marginTop: 1 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  detailText: { fontSize: 13, color: '#334155', flex: 1 },
  infoAlert: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FEF3C7', borderRadius: 6, padding: 8, marginTop: 6,
  },
  infoAlertText: { fontSize: 12, color: '#D97706', fontWeight: '600' },
  rejectionText: { fontSize: 12, color: '#DC2626', marginTop: 6 },
  rescheduleText: { fontSize: 12, color: '#2563EB', marginTop: 6 },
  notesText: { fontSize: 12, color: '#64748B', marginTop: 6, fontStyle: 'italic' },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  completeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#059669', borderRadius: 6, paddingVertical: 8, gap: 4,
  },
  completeBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  noShowBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFEDD5', borderRadius: 6, paddingVertical: 8, gap: 4,
    borderWidth: 1, borderColor: '#FED7AA',
  },
  noShowBtnText: { color: '#EA580C', fontWeight: '700', fontSize: 12 },
  cancelBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F1F5F9', borderRadius: 6, paddingVertical: 8, gap: 4,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  cancelBtnText: { color: '#64748B', fontWeight: '700', fontSize: 12 },
  toast: {
    position: 'absolute', bottom: 24, left: 20, right: 20,
    borderRadius: BorderRadius.md, padding: 14, ...Shadows.elevated,
  },
  toastText: { color: '#fff', fontWeight: '600', fontSize: 14, textAlign: 'center' },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'flex-end',
    ...Platform.select({ web: { justifyContent: 'center' } as any }),
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    ...Platform.select({ web: { borderRadius: BorderRadius.xl } as any }),
    padding: 24, width: '100%', maxWidth: 520, ...Shadows.elevated,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  modalSub: { fontSize: 13, color: '#64748B', marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 5, marginTop: 12 },
  sectionHeading: { fontSize: 13, fontWeight: '700', color: '#6366F1', marginTop: 16, marginBottom: 4 },
  input: {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: BorderRadius.sm, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: '#0F172A',
    ...Platform.select({ web: { outlineWidth: 0 } as any }),
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  propChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
    marginRight: 8, marginBottom: 8,
  },
  propChipSelected: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  propChipText: { fontSize: 13, fontWeight: '600', color: '#334155' },
  noPropsText: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic' },
  altSlotToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingVertical: 4 },
  altSlotToggleText: { fontSize: 13, color: '#6366F1', fontWeight: '600' },
  infoBox: {
    flexDirection: 'row', gap: 8, backgroundColor: '#EEF2FF',
    borderRadius: 8, padding: 12, marginTop: 16,
  },
  infoBoxText: { fontSize: 12, color: '#6366F1', flex: 1, lineHeight: 18 },
  modalFooter: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelModalBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 11,
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: BorderRadius.sm,
  },
  cancelModalBtnText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  submitBtn: {
    flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#6366F1', borderRadius: BorderRadius.sm, paddingVertical: 11, gap: 6,
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
