import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { propertyVisitService, PropertyVisit, VisitStatus } from '@/services/propertyVisitService';
import { useNotifications } from '@/features/notifications/NotificationContext';

const STATUS_TABS: { id: string; label: string }[] = [
  { id: 'pending_approval', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rescheduled', label: 'Rescheduled' },
  { id: 'completed', label: 'Completed' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'no_show', label: 'No Show' },
  { id: 'all', label: 'All' },
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

export default function AdminSiteVisitsScreen() {
  const { refresh: refreshNotifications } = useNotifications();
  const [visits, setVisits] = useState<PropertyVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending_approval');
  const [search, setSearch] = useState('');
  const [pendingCount, setPendingCount] = useState(0);

  // Approve modal
  const [approveTarget, setApproveTarget] = useState<PropertyVisit | null>(null);
  const [confirmDate, setConfirmDate] = useState('');
  const [confirmTime, setConfirmTime] = useState('');
  const [approving, setApproving] = useState(false);

  // Reject modal
  const [rejectTarget, setRejectTarget] = useState<PropertyVisit | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Reschedule modal
  const [rescheduleTarget, setRescheduleTarget] = useState<PropertyVisit | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  // Detail modal
  const [detailVisit, setDetailVisit] = useState<PropertyVisit | null>(null);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    try {
      const [list, count] = await Promise.all([
        propertyVisitService.getAll(),
        propertyVisitService.getPendingCount(),
      ]);
      setVisits(list);
      setPendingCount(count);
    } catch (err) {
      console.warn('[AdminVisits] loadData error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  const filtered = useMemo(() => {
    return visits.filter((v) => {
      const matchTab = activeTab === 'all' || v.status === activeTab;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        v.clientName.toLowerCase().includes(q) ||
        v.clientPhone.includes(q) ||
        v.propertyTitle.toLowerCase().includes(q) ||
        v.agentName.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [visits, activeTab, search]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: visits.length };
    STATUS_TABS.forEach((t) => {
      if (t.id !== 'all') counts[t.id] = visits.filter((v) => v.status === t.id).length;
    });
    return counts;
  }, [visits]);

  // ── Approve ─────────────────────────────────────────────────────────────
  const openApprove = (visit: PropertyVisit) => {
    setApproveTarget(visit);
    setConfirmDate(visit.visitDate);
    setConfirmTime(visit.visitTime);
  };

  const handleApprove = async () => {
    if (!approveTarget) return;
    setApproving(true);
    const ok = await propertyVisitService.approve(approveTarget.id, confirmDate, confirmTime);
    setApproving(false);
    setApproveTarget(null);
    if (ok) {
      showToast('✅ Visit approved! Notifications sent to agent and user.');
      await loadData();
      refreshNotifications();
    } else {
      showToast('Failed to approve visit. Please try again.', 'error');
    }
  };

  // ── Reject ──────────────────────────────────────────────────────────────
  const openReject = (visit: PropertyVisit) => {
    setRejectTarget(visit);
    setRejectReason('');
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      showToast('Please enter a rejection reason.', 'error');
      return;
    }
    setRejecting(true);
    const ok = await propertyVisitService.reject(rejectTarget.id, rejectReason.trim());
    setRejecting(false);
    setRejectTarget(null);
    if (ok) {
      showToast('❌ Visit rejected. Notifications sent.');
      await loadData();
      refreshNotifications();
    } else {
      showToast('Failed to reject visit.', 'error');
    }
  };

  // ── Reschedule ───────────────────────────────────────────────────────────
  const openReschedule = (visit: PropertyVisit) => {
    setRescheduleTarget(visit);
    setRescheduleDate(visit.confirmedDate || visit.visitDate);
    setRescheduleTime(visit.confirmedTime || visit.visitTime);
    setRescheduleReason('');
  };

  const handleReschedule = async () => {
    if (!rescheduleTarget) return;
    if (!rescheduleDate || !rescheduleTime) {
      showToast('Please select a new date and time.', 'error');
      return;
    }
    setRescheduling(true);
    const ok = await propertyVisitService.adminReschedule(
      rescheduleTarget.id,
      rescheduleDate,
      rescheduleTime,
      rescheduleReason
    );
    setRescheduling(false);
    setRescheduleTarget(null);
    if (ok) {
      showToast('🔄 Visit rescheduled. Notifications sent.');
      await loadData();
      refreshNotifications();
    } else {
      showToast('Failed to reschedule visit.', 'error');
    }
  };

  const renderVisitCard = (visit: PropertyVisit) => {
    const isPending = visit.status === 'pending_approval';
    const isApproved = visit.status === 'approved';
    const isRescheduled = visit.status === 'rescheduled';

    return (
      <TouchableOpacity
        key={visit.id}
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => setDetailVisit(visit)}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            {visit.propertyImage ? (
              <Image source={{ uri: visit.propertyImage }} style={styles.propThumb} />
            ) : (
              <View style={styles.propThumbPlaceholder}>
                <Feather name="home" size={18} color="#94A3B8" />
              </View>
            )}
            <View style={styles.cardHeaderInfo}>
              <Text style={styles.propTitle} numberOfLines={1}>{visit.propertyTitle}</Text>
              <Text style={styles.propCity}>{visit.propertyCity}</Text>
            </View>
          </View>
          <StatusBadge status={visit.status} />
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Details Grid */}
        <View style={styles.detailGrid}>
          <View style={styles.detailItem}>
            <Feather name="user" size={13} color="#64748B" />
            <View style={{ marginLeft: 6 }}>
              <Text style={styles.detailLabel}>Client</Text>
              <Text style={styles.detailValue}>{visit.clientName}</Text>
              <Text style={styles.detailSub}>{visit.clientPhone}</Text>
            </View>
          </View>
          <View style={styles.detailItem}>
            <Feather name="briefcase" size={13} color="#64748B" />
            <View style={{ marginLeft: 6 }}>
              <Text style={styles.detailLabel}>Agent</Text>
              <Text style={styles.detailValue}>{visit.agentName || '—'}</Text>
              <Text style={styles.detailSub}>{visit.agentPhone || ''}</Text>
            </View>
          </View>
          <View style={styles.detailItem}>
            <Feather name="calendar" size={13} color="#64748B" />
            <View style={{ marginLeft: 6 }}>
              <Text style={styles.detailLabel}>Requested</Text>
              <Text style={styles.detailValue}>{visit.visitDate}</Text>
              <Text style={styles.detailSub}>{visit.visitTime}</Text>
            </View>
          </View>
          {(isApproved || isRescheduled) && visit.confirmedDate && (
            <View style={styles.detailItem}>
              <Feather name="check-circle" size={13} color="#059669" />
              <View style={{ marginLeft: 6 }}>
                <Text style={[styles.detailLabel, { color: '#059669' }]}>Confirmed</Text>
                <Text style={[styles.detailValue, { color: '#059669' }]}>{visit.confirmedDate}</Text>
                <Text style={[styles.detailSub, { color: '#059669' }]}>{visit.confirmedTime}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Alt Slots */}
        {visit.altSlot1Date && (
          <View style={styles.altSlots}>
            <Text style={styles.altSlotLabel}>Alt slots: </Text>
            <Text style={styles.altSlotValue}>
              {visit.altSlot1Date} {visit.altSlot1Time}
              {visit.altSlot2Date ? ` · ${visit.altSlot2Date} ${visit.altSlot2Time}` : ''}
            </Text>
          </View>
        )}

        {/* Notes / Reason */}
        {visit.notes ? (
          <Text style={styles.notesText} numberOfLines={2}>📝 {visit.notes}</Text>
        ) : null}
        {visit.rejectionReason ? (
          <Text style={styles.rejectionText} numberOfLines={2}>❌ {visit.rejectionReason}</Text>
        ) : null}
        {visit.rescheduleReason ? (
          <Text style={styles.rescheduleText} numberOfLines={2}>🔄 {visit.rescheduleReason}</Text>
        ) : null}

        {/* Actions */}
        {isPending && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.approveBtn}
              onPress={() => openApprove(visit)}
              activeOpacity={0.8}
            >
              <Feather name="check-circle" size={14} color="#fff" />
              <Text style={styles.approveBtnText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rescheduleBtn}
              onPress={() => openReschedule(visit)}
              activeOpacity={0.8}
            >
              <Feather name="refresh-cw" size={14} color="#2563EB" />
              <Text style={styles.rescheduleBtnText}>Reschedule</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => openReject(visit)}
              activeOpacity={0.8}
            >
              <Feather name="x-circle" size={14} color="#DC2626" />
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
        {(isApproved || isRescheduled) && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.rescheduleBtn}
              onPress={() => openReschedule(visit)}
              activeOpacity={0.8}
            >
              <Feather name="refresh-cw" size={14} color="#2563EB" />
              <Text style={styles.rescheduleBtnText}>Reschedule</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Site Visit Requests</Text>
          <Text style={styles.headerSub}>{visits.length} total visits</Text>
        </View>
        {pendingCount > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{pendingCount} Pending</Text>
          </View>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Feather name="search" size={16} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by client, property or agent..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Feather name="x" size={15} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = tabCounts[tab.id] || 0;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
              {count > 0 && (
                <View style={[styles.tabCount, isActive && styles.tabCountActive,
                  tab.id === 'pending_approval' && !isActive && styles.tabCountPending]}>
                  <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive,
                    tab.id === 'pending_approval' && !isActive && { color: '#fff' }]}>
                    {count}
                  </Text>
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
          <Text style={styles.loadingText}>Loading visits...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Feather name="calendar" size={40} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No visits found</Text>
          <Text style={styles.emptyText}>
            {activeTab === 'pending_approval'
              ? 'No pending visit requests at this time.'
              : 'No visits match your filters.'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={{ padding: 16, gap: 12 }}>
          {filtered.map(renderVisitCard)}
        </ScrollView>
      )}

      {/* Toast */}
      {toast && (
        <View style={[styles.toast, { backgroundColor: toast.type === 'success' ? '#059669' : '#DC2626' }]}>
          <Text style={styles.toastText}>{toast.msg}</Text>
        </View>
      )}

      {/* ── Approve Modal ── */}
      <Modal visible={!!approveTarget} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Approve Visit Request</Text>
            <Text style={styles.modalSub}>
              Confirm or adjust the visit date and time for{' '}
              <Text style={{ fontWeight: '700' }}>{approveTarget?.clientName}</Text>
            </Text>

            <Text style={styles.fieldLabel}>Confirmed Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={confirmDate}
              onChangeText={setConfirmDate}
              placeholder="2026-09-25"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.fieldLabel}>Confirmed Time</Text>
            <TextInput
              style={styles.input}
              value={confirmTime}
              onChangeText={setConfirmTime}
              placeholder="11:00 AM"
              placeholderTextColor="#94A3B8"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setApproveTarget(null)}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleApprove}
                disabled={approving}
              >
                {approving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="check-circle" size={15} color="#fff" />
                    <Text style={styles.confirmBtnText}>Approve & Notify</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Reject Modal ── */}
      <Modal visible={!!rejectTarget} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reject Visit Request</Text>
            <Text style={styles.modalSub}>
              Rejecting visit for{' '}
              <Text style={{ fontWeight: '700' }}>{rejectTarget?.clientName}</Text>. The agent and client will be notified.
            </Text>

            <Text style={styles.fieldLabel}>Rejection Reason *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="e.g. Property unavailable on that date..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setRejectTarget(null)}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: '#DC2626' }]}
                onPress={handleReject}
                disabled={rejecting}
              >
                {rejecting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="x-circle" size={15} color="#fff" />
                    <Text style={styles.confirmBtnText}>Reject & Notify</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Reschedule Modal ── */}
      <Modal visible={!!rescheduleTarget} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reschedule Visit</Text>
            <Text style={styles.modalSub}>
              Set a new date and time for{' '}
              <Text style={{ fontWeight: '700' }}>{rescheduleTarget?.clientName}</Text>
            </Text>

            <Text style={styles.fieldLabel}>New Date (YYYY-MM-DD) *</Text>
            <TextInput
              style={styles.input}
              value={rescheduleDate}
              onChangeText={setRescheduleDate}
              placeholder="2026-09-28"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.fieldLabel}>New Time *</Text>
            <TextInput
              style={styles.input}
              value={rescheduleTime}
              onChangeText={setRescheduleTime}
              placeholder="2:00 PM"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.fieldLabel}>Reason (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={rescheduleReason}
              onChangeText={setRescheduleReason}
              placeholder="e.g. Owner not available on original date..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={2}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setRescheduleTarget(null)}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: '#2563EB' }]}
                onPress={handleReschedule}
                disabled={rescheduling}
              >
                {rescheduling ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="refresh-cw" size={15} color="#fff" />
                    <Text style={styles.confirmBtnText}>Reschedule & Notify</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Detail Modal ── */}
      <Modal visible={!!detailVisit} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.modalCard, { maxHeight: '80%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.modalTitle}>Visit Details</Text>
              <TouchableOpacity onPress={() => setDetailVisit(null)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            {detailVisit && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <StatusBadge status={detailVisit.status} />
                <Text style={[styles.propTitle, { marginTop: 10 }]}>{detailVisit.propertyTitle}</Text>
                <Text style={styles.propCity}>{detailVisit.propertyCity}</Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailRowLabel}>Client</Text>
                  <Text style={styles.detailRowValue}>{detailVisit.clientName} · {detailVisit.clientPhone}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailRowLabel}>Email</Text>
                  <Text style={styles.detailRowValue}>{detailVisit.clientEmail || '—'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailRowLabel}>Agent</Text>
                  <Text style={styles.detailRowValue}>{detailVisit.agentName || '—'} · {detailVisit.agentPhone || ''}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailRowLabel}>Requested</Text>
                  <Text style={styles.detailRowValue}>{detailVisit.visitDate} at {detailVisit.visitTime}</Text>
                </View>
                {detailVisit.altSlot1Date && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailRowLabel}>Alt Slot 1</Text>
                    <Text style={styles.detailRowValue}>{detailVisit.altSlot1Date} at {detailVisit.altSlot1Time}</Text>
                  </View>
                )}
                {detailVisit.altSlot2Date && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailRowLabel}>Alt Slot 2</Text>
                    <Text style={styles.detailRowValue}>{detailVisit.altSlot2Date} at {detailVisit.altSlot2Time}</Text>
                  </View>
                )}
                {detailVisit.confirmedDate && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailRowLabel, { color: '#059669' }]}>Confirmed</Text>
                    <Text style={[styles.detailRowValue, { color: '#059669' }]}>
                      {detailVisit.confirmedDate} at {detailVisit.confirmedTime}
                    </Text>
                  </View>
                )}
                {detailVisit.notes ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailRowLabel}>Notes</Text>
                    <Text style={styles.detailRowValue}>{detailVisit.notes}</Text>
                  </View>
                ) : null}
                {detailVisit.rejectionReason ? (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailRowLabel, { color: '#DC2626' }]}>Rejection Reason</Text>
                    <Text style={[styles.detailRowValue, { color: '#DC2626' }]}>{detailVisit.rejectionReason}</Text>
                  </View>
                ) : null}
                {detailVisit.rescheduleReason ? (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailRowLabel, { color: '#2563EB' }]}>Reschedule Reason</Text>
                    <Text style={[styles.detailRowValue, { color: '#2563EB' }]}>{detailVisit.rescheduleReason}</Text>
                  </View>
                ) : null}
                <Text style={styles.detailTimestamp}>Created: {new Date(detailVisit.createdAt).toLocaleString('en-IN')}</Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 13, color: '#64748B', marginTop: 2 },
  pendingBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pendingBadgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#0F172A',
    ...Platform.select({ web: { outlineWidth: 0 } as any }),
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 4,
    maxHeight: 46,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    marginRight: 6,
    backgroundColor: '#F1F5F9',
  },
  tabActive: { backgroundColor: '#6366F1' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#fff' },
  tabCount: {
    marginLeft: 5,
    minWidth: 20,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  tabCountPending: { backgroundColor: '#DC2626' },
  tabCountText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  tabCountTextActive: { color: '#fff' },
  list: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { marginTop: 12, color: '#64748B', fontSize: 14 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#334155', marginTop: 12 },
  emptyText: { fontSize: 14, color: '#94A3B8', marginTop: 6, textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E8EDF5',
    padding: 16,
    ...Shadows.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  propThumb: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#F1F5F9' },
  propThumbPlaceholder: {
    width: 44, height: 44, borderRadius: 8,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  cardHeaderInfo: { marginLeft: 10, flex: 1 },
  propTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  propCity: { fontSize: 12, color: '#64748B', marginTop: 1 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'flex-start', width: '45%' },
  detailLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' },
  detailValue: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginTop: 2 },
  detailSub: { fontSize: 12, color: '#64748B' },
  altSlots: { flexDirection: 'row', marginTop: 8, flexWrap: 'wrap' },
  altSlotLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  altSlotValue: { fontSize: 12, color: '#6366F1' },
  notesText: { fontSize: 12, color: '#64748B', marginTop: 8, fontStyle: 'italic' },
  rejectionText: { fontSize: 12, color: '#DC2626', marginTop: 8 },
  rescheduleText: { fontSize: 12, color: '#2563EB', marginTop: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  approveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#059669', borderRadius: BorderRadius.sm,
    paddingVertical: 9, gap: 5,
  },
  approveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  rescheduleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#EFF6FF', borderRadius: BorderRadius.sm,
    paddingVertical: 9, gap: 5, borderWidth: 1, borderColor: '#BFDBFE',
  },
  rescheduleBtnText: { color: '#2563EB', fontWeight: '700', fontSize: 13 },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FEF2F2', borderRadius: BorderRadius.sm,
    paddingVertical: 9, gap: 5, borderWidth: 1, borderColor: '#FECACA',
  },
  rejectBtnText: { color: '#DC2626', fontWeight: '700', fontSize: 13 },
  toast: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    borderRadius: BorderRadius.md,
    padding: 14,
    ...Shadows.elevated,
  },
  toastText: { color: '#fff', fontWeight: '600', fontSize: 14, textAlign: 'center' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.xl,
    padding: 24,
    width: '100%',
    maxWidth: 480,
    ...Shadows.elevated,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  modalSub: { fontSize: 13, color: '#64748B', marginBottom: 16, lineHeight: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    ...Platform.select({ web: { outlineWidth: 0 } as any }),
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelModalBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 11,
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: BorderRadius.sm,
  },
  cancelModalBtnText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  confirmBtn: {
    flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#059669', borderRadius: BorderRadius.sm, paddingVertical: 11, gap: 6,
  },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  detailRow: { marginTop: 10 },
  detailRowLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' },
  detailRowValue: { fontSize: 14, color: '#0F172A', fontWeight: '600', marginTop: 2 },
  detailTimestamp: { fontSize: 11, color: '#CBD5E1', marginTop: 16 },
});
