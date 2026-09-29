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
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { useAuth } from '@/features/auth/AuthContext';
import { apiClient } from '@/services/apiClient';
import { PropertyEnquiry, PipelineStage } from '@/types/enquiry';

export default function AgentFollowUpsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const agentId = user?.id || '';

  const [leads, setLeads] = useState<PropertyEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'overdue' | 'upcoming'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Reschedule Follow-up Modal
  const [selectedLead, setSelectedLead] = useState<PropertyEnquiry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState('');
  const [modalNotes, setModalNotes] = useState('');
  const [modalStage, setModalStage] = useState<PipelineStage>('contacted');
  const [saving, setSaving] = useState(false);

  const fetchLeads = useCallback(async () => {
    if (!agentId) return;
    try {
      const res = await apiClient.get<PropertyEnquiry[]>(`/enquiries?agentId=${agentId}`);
      if (res.success && Array.isArray(res.data)) {
        setLeads(res.data);
      }
    } catch (err) {
      console.warn('[AgentFollowUps] Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchLeads();
    const interval = setInterval(fetchLeads, 15000);
    return () => clearInterval(interval);
  }, [fetchLeads]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter leads that have follow up dates
  const leadsWithFollowUps = useMemo(() => {
    return leads.filter((l) => Boolean(l.followUpDate));
  }, [leads]);

  const categorized = useMemo(() => {
    const overdue = leadsWithFollowUps.filter((l) => (l.followUpDate || '') < todayStr);
    const today = leadsWithFollowUps.filter((l) => (l.followUpDate || '') === todayStr);
    const upcoming = leadsWithFollowUps.filter((l) => (l.followUpDate || '') > todayStr);
    return { overdue, today, upcoming, all: leadsWithFollowUps };
  }, [leadsWithFollowUps, todayStr]);

  const filteredList = useMemo(() => {
    const list = categorized[activeFilter] || leadsWithFollowUps;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (l) =>
        l.visitorName.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        (l.propertyTitle && l.propertyTitle.toLowerCase().includes(q))
    );
  }, [categorized, activeFilter, leadsWithFollowUps, searchQuery]);

  // Actions
  const handleCall = (phone: string) => {
    const clean = phone.replace(/[^0-9+]/g, '');
    const url = `tel:${clean}`;
    if (Platform.OS === 'web') {
      window.open(url);
    } else {
      Linking.openURL(url);
    }
  };

  const handleWhatsApp = (lead: PropertyEnquiry) => {
    const clean = lead.phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hello ${lead.visitorName}, this is ${user?.fullName || 'your Cityspace Advisor'} following up on your property inquiry for "${lead.propertyTitle || 'listings'}". How can I assist you with your search today?`
    );
    const url = `https://wa.me/${clean}?text=${text}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  const openRescheduleModal = (lead: PropertyEnquiry) => {
    setSelectedLead(lead);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    setModalDate(lead.followUpDate || tomorrow.toISOString().split('T')[0]);
    setModalNotes(lead.notes || '');
    setModalStage(lead.pipelineStage || 'contacted');
    setIsModalOpen(true);
  };

  const handleSaveFollowUp = async () => {
    if (!selectedLead) return;
    setSaving(true);
    try {
      const updates = {
        followUpDate: modalDate,
        notes: modalNotes,
        pipelineStage: modalStage,
      };
      await apiClient.patch(`/enquiries/${selectedLead.id}`, updates);
      setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? { ...l, ...updates } : l)));
      setIsModalOpen(false);
    } catch (err) {
      console.error('[AgentFollowUps] Error updating follow-up:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkDone = async (lead: PropertyEnquiry) => {
    try {
      await apiClient.patch(`/enquiries/${lead.id}`, { followUpDate: '' });
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, followUpDate: '' } : l)));
    } catch (err) {
      console.error('[AgentFollowUps] Error marking done:', err);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitles}>
          <Text style={styles.overline}>AGENT CRM / TASK REMINDERS</Text>
          <Text style={styles.title}>Client Follow-ups & Reminders</Text>
          <Text style={styles.subtitle}>
            Stay on top of scheduled calls, buyer re-engagements, and hot prospect check-ins.
          </Text>
        </View>

        <TouchableOpacity onPress={fetchLeads} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={14} color="#0284C7" style={{ marginRight: 6 }} />
          <Text style={styles.refreshBtnText}>Sync Reminders</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Filter Cards */}
      <View style={styles.summaryRow}>
        <TouchableOpacity
          onPress={() => setActiveFilter('today')}
          style={[styles.summaryCard, activeFilter === 'today' && styles.summaryCardActive]}
        >
          <Text style={[styles.summaryVal, { color: '#0284C7' }]}>{categorized.today.length}</Text>
          <Text style={styles.summaryLbl}>Due Today</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveFilter('overdue')}
          style={[styles.summaryCard, activeFilter === 'overdue' && styles.summaryCardActive]}
        >
          <Text style={[styles.summaryVal, { color: '#DC2626' }]}>{categorized.overdue.length}</Text>
          <Text style={styles.summaryLbl}>Overdue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveFilter('upcoming')}
          style={[styles.summaryCard, activeFilter === 'upcoming' && styles.summaryCardActive]}
        >
          <Text style={[styles.summaryVal, { color: '#7C3AED' }]}>{categorized.upcoming.length}</Text>
          <Text style={styles.summaryLbl}>Upcoming</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveFilter('all')}
          style={[styles.summaryCard, activeFilter === 'all' && styles.summaryCardActive]}
        >
          <Text style={[styles.summaryVal, { color: '#0F172A' }]}>{categorized.all.length}</Text>
          <Text style={styles.summaryLbl}>All Reminders</Text>
        </TouchableOpacity>
      </View>

      {/* Search Row */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Feather name="search" size={15} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reminders by client name, phone, property..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={15} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={styles.countText}>Showing {filteredList.length} follow-ups</Text>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Syncing reminders...</Text>
        </View>
      ) : filteredList.length === 0 ? (
        <View style={styles.emptyCard}>
          <Feather name="check-circle" size={44} color="#059669" />
          <Text style={styles.emptyTitle}>All Caught Up!</Text>
          <Text style={styles.emptySub}>
            {searchQuery
              ? `No follow-ups match "${searchQuery}".`
              : 'No pending client follow-ups in this category. You can set follow-up dates when editing any lead in My Leads.'}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {filteredList.map((lead) => {
            const isOverdue = (lead.followUpDate || '') < todayStr;
            const isToday = (lead.followUpDate || '') === todayStr;

            return (
              <View key={lead.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View
                    style={[
                      styles.dateBadge,
                      isOverdue && styles.dateBadgeOverdue,
                      isToday && styles.dateBadgeToday,
                    ]}
                  >
                    <Feather
                      name="clock"
                      size={13}
                      color={isOverdue ? '#DC2626' : isToday ? '#D97706' : '#0284C7'}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.dateBadgeText,
                        isOverdue && { color: '#DC2626' },
                        isToday && { color: '#B45309' },
                      ]}
                    >
                      {isToday ? 'DUE TODAY' : isOverdue ? 'OVERDUE' : lead.followUpDate}
                    </Text>
                  </View>

                  <View style={styles.cardActionsCol}>
                    <TouchableOpacity onPress={() => handleCall(lead.phone)} style={styles.callBtn}>
                      <Feather name="phone-call" size={13} color="#0284C7" />
                      <Text style={styles.callBtnText}>Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleWhatsApp(lead)} style={styles.waBtn}>
                      <Feather name="message-circle" size={13} color="#059669" />
                      <Text style={styles.waBtnText}>WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.cardMid}>
                  <View style={styles.clientRow}>
                    <Text style={styles.clientName}>{lead.visitorName}</Text>
                    <Text style={styles.clientPhone}>• {lead.phone}</Text>
                    <View style={styles.stageTag}>
                      <Text style={styles.stageTagText}>{(lead.pipelineStage || 'new').toUpperCase()}</Text>
                    </View>
                  </View>

                  <View style={styles.propRow}>
                    <Feather name="home" size={13} color="#64748B" style={{ marginRight: 4 }} />
                    <Text style={styles.propTitle} numberOfLines={1}>
                      {lead.propertyTitle || 'General Property Inquiry'}
                    </Text>
                  </View>

                  {lead.notes ? (
                    <View style={styles.notesBox}>
                      <Feather name="file-text" size={12} color="#854D0E" style={{ marginRight: 6, marginTop: 2 }} />
                      <Text style={styles.notesText}>{lead.notes}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.cardBottom}>
                  <TouchableOpacity onPress={() => handleMarkDone(lead)} style={styles.doneBtn}>
                    <Feather name="check" size={13} color="#059669" style={{ marginRight: 4 }} />
                    <Text style={styles.doneBtnText}>Mark as Done</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => openRescheduleModal(lead)} style={styles.rescheduleBtn}>
                    <Feather name="calendar" size={13} color="#475569" style={{ marginRight: 4 }} />
                    <Text style={styles.rescheduleBtnText}>Reschedule</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Reschedule Modal */}
      <Modal visible={isModalOpen} transparent animationType="fade" onRequestClose={() => setIsModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Reschedule Follow-up</Text>
                <Text style={styles.modalSub}>{selectedLead?.visitorName} ({selectedLead?.phone})</Text>
              </View>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.fieldLabel}>Next Follow-up Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="2026-09-28"
                value={modalDate}
                onChangeText={setModalDate}
              />

              <Text style={styles.fieldLabel}>Pipeline Stage</Text>
              <View style={styles.stageChipRow}>
                {(['contacted', 'qualified', 'site_visit', 'negotiation'] as PipelineStage[]).map((stg) => (
                  <TouchableOpacity
                    key={stg}
                    onPress={() => setModalStage(stg)}
                    style={[styles.stageChip, modalStage === stg && styles.stageChipActive]}
                  >
                    <Text style={[styles.stageChipText, modalStage === stg && styles.stageChipTextActive]}>
                      {stg.replace('_', ' ').toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Call Notes & Log</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                multiline
                numberOfLines={3}
                placeholder="Add conversation notes, next steps discussed with client..."
                value={modalNotes}
                onChangeText={setModalNotes}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveFollowUp} style={styles.modalSaveBtn} disabled={saving}>
                <Text style={styles.modalSaveText}>{saving ? 'Saving...' : 'Save Follow-up'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingVertical: 28,
    gap: 20,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  headerTitles: {
    gap: 4,
  },
  overline: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#0284C7',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  refreshBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  summaryCard: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 4,
    ...Shadows.sm,
  },
  summaryCardActive: {
    borderColor: '#0284C7',
    borderWidth: 1.5,
  },
  summaryVal: {
    fontSize: 22,
    fontWeight: '800',
  },
  summaryLbl: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  searchBox: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    outlineStyle: 'none' as any,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  emptyCard: {
    paddingVertical: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 480,
    lineHeight: 20,
  },
  list: {
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    gap: 12,
    ...Shadows.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  dateBadgeOverdue: {
    backgroundColor: '#FEE2E2',
  },
  dateBadgeToday: {
    backgroundColor: '#FEF3C7',
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  cardActionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    gap: 5,
  },
  callBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  waBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    gap: 5,
  },
  waBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  cardMid: {
    gap: 6,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  clientName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  clientPhone: {
    fontSize: 13,
    color: '#64748B',
  },
  stageTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stageTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  propRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  propTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FEF08A',
    padding: 8,
    borderRadius: BorderRadius.sm,
    marginTop: 4,
  },
  notesText: {
    fontSize: 12,
    color: '#854D0E',
    flex: 1,
    lineHeight: 16,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  doneBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  rescheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  rescheduleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    width: '100%',
    maxWidth: 500,
    padding: 24,
    gap: 16,
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  modalBody: {
    gap: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  stageChipRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  stageChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stageChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  stageChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  stageChipTextActive: {
    color: '#FFFFFF',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 8,
    outlineStyle: 'none' as any,
  },
  modalTextArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modalSaveBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
