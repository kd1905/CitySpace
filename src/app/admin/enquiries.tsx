import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Linking,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { enquiryService } from '@/services/enquiryService';
import { agentService } from '@/services/agentService';
import { PropertyEnquiry, PipelineStage } from '@/types/enquiry';
import { Feather } from '@expo/vector-icons';

const PIPELINE_STAGES: Array<{ key: PipelineStage; label: string; color: string; bg: string }> = [
  { key: 'new', label: 'New Leads', color: '#2563EB', bg: '#EFF6FF' },
  { key: 'contacted', label: 'Contacted', color: '#6366F1', bg: '#EEF2FF' },
  { key: 'interested', label: 'Interested', color: '#8B5CF6', bg: '#F5F3FF' },
  { key: 'site_visit', label: 'Site Visit', color: '#D97706', bg: '#FFFBEB' },
  { key: 'negotiation', label: 'Negotiation', color: '#EC4899', bg: '#FDF2F8' },
  { key: 'closed', label: 'Closed / Lost', color: '#10B981', bg: '#ECFDF5' },
];

export default function AdminCRMEnquiriesScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ stage?: string }>();

  const [activeStage, setActiveStage] = useState<string>(searchParams.stage || 'all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Selected Lead Modal / Drawer
  const [selectedLead, setSelectedLead] = useState<PropertyEnquiry | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editFollowUp, setEditFollowUp] = useState('');
  const [editAgentId, setEditAgentId] = useState('');
  const [editStage, setEditStage] = useState<PipelineStage>('new');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    Promise.all([
      enquiryService.refreshFromBackend(),
      agentService.refreshFromBackend(),
    ]).then(() => {
      setRefreshKey((k) => k + 1);
    });
  }, []);

  const allEnquiries = useMemo(() => {
    return enquiryService.getAll();
  }, [refreshKey]);

  const allAgents = useMemo(() => {
    return agentService.getAll();
  }, [refreshKey]);

  // Stage counts
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allEnquiries.length };
    PIPELINE_STAGES.forEach((s) => {
      counts[s.key] = allEnquiries.filter((e) => (e.pipelineStage || 'new') === s.key).length;
    });
    return counts;
  }, [allEnquiries]);

  // Filtered list
  const filteredLeads = useMemo(() => {
    return allEnquiries.filter((lead) => {
      const stage = lead.pipelineStage || 'new';
      if (activeStage !== 'all' && stage !== activeStage) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = lead.visitorName.toLowerCase().includes(q);
        const matchPhone = lead.phone.includes(q);
        const matchProp = (lead.propertyTitle || '').toLowerCase().includes(q);
        const matchLoc = (lead.buyerLocation || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchProp && !matchLoc) return false;
      }
      return true;
    });
  }, [allEnquiries, activeStage, searchQuery]);

  const openLeadDrawer = (lead: PropertyEnquiry) => {
    setSelectedLead(lead);
    setEditNotes(lead.notes || '');
    setEditBudget(lead.buyerBudget || '');
    setEditLocation(lead.buyerLocation || '');
    setEditFollowUp(lead.followUpDate || '');
    setEditAgentId(lead.agentId || lead.assignedAgentId || '');
    setEditStage((lead.pipelineStage as PipelineStage) || 'new');
  };

  const handleSaveLead = async () => {
    if (!selectedLead) return;
    const ag = allAgents.find((a) => a.id === editAgentId);
    await enquiryService.updateCRMDetails(selectedLead.id, {
      pipelineStage: editStage,
      buyerBudget: editBudget,
      buyerLocation: editLocation,
      notes: editNotes,
      followUpDate: editFollowUp,
      agentId: editAgentId || undefined,
      agentName: ag?.name || undefined,
      agentPhone: ag?.phone || undefined,
    });
    showToast(`Updated lead details for "${selectedLead.visitorName}".`);
    setSelectedLead(null);
    setRefreshKey((k) => k + 1);
  };

  const handleMoveStage = async (leadId: string, nextStage: PipelineStage) => {
    await enquiryService.updatePipelineStage(leadId, nextStage);
    showToast(`Lead moved to ${nextStage.toUpperCase()}`);
    setRefreshKey((k) => k + 1);
  };

  const handleDeleteLead = (id: string) => {
    if (Platform.OS === 'web' && !window.confirm('Delete this customer lead permanently?')) return;
    enquiryService.delete(id);
    if (selectedLead?.id === id) setSelectedLead(null);
    showToast('Lead deleted from pipeline.');
    setRefreshKey((k) => k + 1);
  };

  const handleCall = (phone: string) => {
    const clean = phone.replace(/\s+/g, '');
    if (Platform.OS === 'web') {
      window.open(`tel:${clean}`);
    } else {
      Linking.openURL(`tel:${clean}`);
    }
  };

  const handleWhatsApp = (phone: string, name: string, title?: string) => {
    const clean = phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hello ${name}, this is Cityspace Real Estate Advisory regarding your enquiry on "${title || 'Cityspace properties'}". How may we assist you today?`
    );
    const url = `https://wa.me/${clean}?text=${text}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  const handleEmail = (email?: string, name?: string) => {
    if (!email) return;
    const url = `mailto:${email}?subject=Cityspace Property Consultation&body=Hello ${name || ''},`;
    if (Platform.OS === 'web') {
      window.open(url);
    } else {
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.pageTitle}>CRM & Leads Pipeline</Text>
            <Text style={styles.pageSubtitle}>
              Manage client inquiries, track pipeline stages from initial contact to closing, and assign agents.
            </Text>
          </View>

          <View style={styles.topActions}>
            <View style={styles.viewToggle}>
              <TouchableOpacity
                onPress={() => setViewMode('kanban')}
                style={[styles.viewToggleBtn, viewMode === 'kanban' && styles.viewToggleBtnActive]}
              >
                <Feather name="columns" size={14} color={viewMode === 'kanban' ? '#0F172A' : '#64748B'} style={{ marginRight: 4 }} />
                <Text style={[styles.viewToggleText, viewMode === 'kanban' && styles.viewToggleTextActive]}>Pipeline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setViewMode('list')}
                style={[styles.viewToggleBtn, viewMode === 'list' && styles.viewToggleBtnActive]}
              >
                <Feather name="list" size={14} color={viewMode === 'list' ? '#0F172A' : '#64748B'} style={{ marginRight: 4 }} />
                <Text style={[styles.viewToggleText, viewMode === 'list' && styles.viewToggleTextActive]}>List</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stage Tabs & Search Filter */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stageTabsScroll}>
            <TouchableOpacity
              onPress={() => setActiveStage('all')}
              style={[styles.stageTab, activeStage === 'all' && styles.stageTabActive]}
            >
              <Text style={[styles.stageTabText, activeStage === 'all' && styles.stageTabTextActive]}>All Leads</Text>
              <View style={[styles.stageBadge, activeStage === 'all' && styles.stageBadgeActive]}>
                <Text style={[styles.stageBadgeText, activeStage === 'all' && styles.stageBadgeTextActive]}>
                  {stageCounts.all || 0}
                </Text>
              </View>
            </TouchableOpacity>

            {PIPELINE_STAGES.map((s) => {
              const isActive = activeStage === s.key;
              return (
                <TouchableOpacity
                  key={s.key}
                  onPress={() => setActiveStage(s.key)}
                  style={[styles.stageTab, isActive && styles.stageTabActive]}
                >
                  <Text style={[styles.stageTabText, isActive && styles.stageTabTextActive]}>{s.label}</Text>
                  <View style={[styles.stageBadge, isActive && styles.stageBadgeActive]}>
                    <Text style={[styles.stageBadgeText, isActive && styles.stageBadgeTextActive]}>
                      {stageCounts[s.key] || 0}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.searchBar}>
            <Feather name="search" size={14} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by client, phone, or requirement..."
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
            />
          </View>
        </View>

        {/* Kanban Board View */}
        {viewMode === 'kanban' ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.kanbanScroll}>
            <View style={styles.kanbanColumnsRow}>
              {PIPELINE_STAGES.map((stageCol) => {
                const stageLeads = allEnquiries.filter((e) => (e.pipelineStage || 'new') === stageCol.key);
                return (
                  <View key={stageCol.key} style={styles.kanbanColumn}>
                    <View style={[styles.kanbanColHeader, { borderLeftColor: stageCol.color }]}>
                      <Text style={styles.kanbanColTitle}>{stageCol.label}</Text>
                      <View style={[styles.kanbanCountBadge, { backgroundColor: stageCol.bg }]}>
                        <Text style={[styles.kanbanCountText, { color: stageCol.color }]}>{stageLeads.length}</Text>
                      </View>
                    </View>

                    <ScrollView style={styles.kanbanCardList} showsVerticalScrollIndicator={false}>
                      {stageLeads.length === 0 ? (
                        <View style={styles.emptyColBox}>
                          <Text style={styles.emptyColText}>No leads in this stage</Text>
                        </View>
                      ) : (
                        stageLeads.map((lead) => (
                          <TouchableOpacity
                            key={lead.id}
                            activeOpacity={0.85}
                            onPress={() => openLeadDrawer(lead)}
                            style={styles.leadCard}
                          >
                            <View style={styles.leadCardHeader}>
                              <Text style={styles.leadCardName}>{lead.visitorName}</Text>
                              <View style={styles.leadCardActions}>
                                <TouchableOpacity onPress={() => handleCall(lead.phone)} style={styles.quickActionIcon}>
                                  <Feather name="phone" size={12} color="#0284C7" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleWhatsApp(lead.phone, lead.visitorName, lead.propertyTitle)} style={styles.quickActionIcon}>
                                  <Feather name="message-circle" size={12} color="#059669" />
                                </TouchableOpacity>
                              </View>
                            </View>

                            <Text style={styles.leadCardPhone}>{lead.phone}</Text>

                            {lead.propertyTitle ? (
                              <Text style={styles.leadCardProp} numberOfLines={1}>
                                <Feather name="home" size={11} color="#64748B" /> {lead.propertyTitle}
                              </Text>
                            ) : null}

                            {lead.buyerBudget ? (
                              <Text style={styles.leadCardBudget}>Budget: {lead.buyerBudget}</Text>
                            ) : null}

                            {lead.followUpDate ? (
                              <View style={styles.leadFollowUpBadge}>
                                <Feather name="calendar" size={10} color="#D97706" style={{ marginRight: 4 }} />
                                <Text style={styles.leadFollowUpText}>Follow-up: {lead.followUpDate}</Text>
                              </View>
                            ) : null}

                            <View style={styles.leadCardFooter}>
                              <Text style={styles.leadAgentName} numberOfLines={1}>
                                {lead.agentName || 'Unassigned'}
                              </Text>
                              <Text style={styles.leadCardDate}>
                                {new Date(lead.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          /* List View */
          <View style={styles.listCard}>
            {filteredLeads.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Feather name="users" size={40} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Leads Found</Text>
                <Text style={styles.emptySub}>No client inquiries match the current filter.</Text>
              </View>
            ) : (
              filteredLeads.map((lead) => {
                const stageObj = PIPELINE_STAGES.find((s) => s.key === (lead.pipelineStage || 'new')) || PIPELINE_STAGES[0];
                return (
                  <View key={lead.id} style={styles.listRow}>
                    <View style={styles.listColInfo}>
                      <Text style={styles.listLeadName}>{lead.visitorName}</Text>
                      <Text style={styles.listLeadPhone}>{lead.phone} {lead.email ? `• ${lead.email}` : ''}</Text>
                      <Text style={styles.listLeadProp} numberOfLines={1}>{lead.propertyTitle || 'General Inquiry'}</Text>
                    </View>

                    <View style={styles.listColStage}>
                      <View style={[styles.listStageBadge, { backgroundColor: stageObj.bg }]}>
                        <Text style={[styles.listStageText, { color: stageObj.color }]}>{stageObj.label}</Text>
                      </View>
                      <Text style={styles.listAgent}>{lead.agentName || 'Unassigned'}</Text>
                    </View>

                    <View style={styles.listColActions}>
                      <TouchableOpacity onPress={() => handleCall(lead.phone)} style={styles.listIconBtn}>
                        <Feather name="phone" size={13} color="#0284C7" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleWhatsApp(lead.phone, lead.visitorName, lead.propertyTitle)} style={styles.listIconBtn}>
                        <Feather name="message-circle" size={13} color="#059669" />
                      </TouchableOpacity>
                      {lead.email ? (
                        <TouchableOpacity onPress={() => handleEmail(lead.email, lead.visitorName)} style={styles.listIconBtn}>
                          <Feather name="mail" size={13} color="#6366F1" />
                        </TouchableOpacity>
                      ) : null}
                      <TouchableOpacity onPress={() => openLeadDrawer(lead)} style={styles.listDetailsBtn}>
                        <Text style={styles.listDetailsBtnText}>Manage</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Lead Details & CRM Drawer Modal */}
      {selectedLead && (
        <Modal
          transparent={true}
          visible={true}
          animationType="fade"
          onRequestClose={() => setSelectedLead(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalHeading}>{selectedLead.visitorName}</Text>
                  <Text style={styles.modalSub}>Inquiry ID: {selectedLead.id}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedLead(null)} style={styles.closeBtn}>
                  <Feather name="x" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} contentContainerStyle={{ gap: 16, padding: 20 }}>
                {/* One-Click Communication Bar */}
                <View style={styles.commBar}>
                  <TouchableOpacity onPress={() => handleCall(selectedLead.phone)} style={styles.commBtnCall}>
                    <Feather name="phone" size={13} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.commBtnText}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleWhatsApp(selectedLead.phone, selectedLead.visitorName, selectedLead.propertyTitle)} style={styles.commBtnWA}>
                    <Feather name="message-circle" size={13} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.commBtnText}>WhatsApp</Text>
                  </TouchableOpacity>
                  {selectedLead.email ? (
                    <TouchableOpacity onPress={() => handleEmail(selectedLead.email, selectedLead.visitorName)} style={styles.commBtnMail}>
                      <Feather name="mail" size={13} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.commBtnText}>Email</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity onPress={() => handleDeleteLead(selectedLead.id)} style={styles.commBtnDelete}>
                    <Feather name="trash-2" size={13} color="#DC2626" />
                  </TouchableOpacity>
                </View>

                {/* Pipeline Stage Selector */}
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>CRM PIPELINE STAGE</Text>
                  <View style={styles.stagePickerRow}>
                    {PIPELINE_STAGES.map((s) => {
                      const isChosen = editStage === s.key;
                      return (
                        <TouchableOpacity
                          key={s.key}
                          onPress={() => setEditStage(s.key)}
                          style={[styles.stagePickBtn, isChosen && { backgroundColor: s.color, borderColor: s.color }]}
                        >
                          <Text style={[styles.stagePickText, isChosen && { color: '#FFFFFF', fontWeight: '700' }]}>
                            {s.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Buyer Requirements */}
                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>BUYER BUDGET</Text>
                    <TextInput
                      value={editBudget}
                      onChangeText={setEditBudget}
                      placeholder="e.g. ₹1.5 Cr - ₹2.2 Cr"
                      placeholderTextColor="#94A3B8"
                      style={styles.input}
                    />
                  </View>

                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>PREFERRED LOCATION</Text>
                    <TextInput
                      value={editLocation}
                      onChangeText={setEditLocation}
                      placeholder="e.g. Bandra West, Mumbai"
                      placeholderTextColor="#94A3B8"
                      style={styles.input}
                    />
                  </View>
                </View>

                {/* Follow-up Date & Assign Agent */}
                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>FOLLOW-UP DATE</Text>
                    <TextInput
                      value={editFollowUp}
                      onChangeText={setEditFollowUp}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94A3B8"
                      style={styles.input}
                    />
                  </View>

                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>ASSIGNED AGENT</Text>
                    <View style={styles.agentSelector}>
                      {allAgents.length === 0 ? (
                        <Text style={{ fontSize: 12, color: '#94A3B8' }}>No active agents</Text>
                      ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingVertical: 4 }}>
                          {allAgents.map((ag) => (
                            <TouchableOpacity
                              key={ag.id}
                              onPress={() => setEditAgentId(ag.id)}
                              style={[
                                styles.agentChip,
                                editAgentId === ag.id && styles.agentChipActive,
                              ]}
                            >
                              <Text style={[styles.agentChipText, editAgentId === ag.id && styles.agentChipTextActive]}>
                                {ag.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  </View>
                </View>

                {/* Internal Notes */}
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>CLIENT NOTES & CONVERSATION LOGS</Text>
                  <TextInput
                    value={editNotes}
                    onChangeText={setEditNotes}
                    placeholder="Document conversation highlights, buyer specifications, timeline, decision makers..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={4}
                    style={styles.textArea}
                  />
                </View>
              </ScrollView>

              {/* Modal Footer */}
              <View style={styles.modalFooter}>
                <TouchableOpacity onPress={() => setSelectedLead(null)} style={styles.btnCancel}>
                  <Text style={styles.btnCancelText}>Close</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSaveLead} style={styles.btnSave}>
                  <Feather name="check" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.btnSaveText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <View style={styles.toast}>
          <Feather name="check-circle" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingVertical: 28,
    gap: 20,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  pageSubtitle: {
    fontSize: 13.5,
    color: '#64748B',
    marginTop: 4,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  viewToggleBtnActive: {
    backgroundColor: '#FFFFFF',
    ...Shadows.subtle,
  },
  viewToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  viewToggleTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  filterSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  stageTabsScroll: {
    flex: 1,
  },
  stageTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
    gap: 6,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  stageTabActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  stageTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  stageTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stageBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  stageBadgeActive: {
    backgroundColor: '#334155',
  },
  stageBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  stageBadgeTextActive: {
    color: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: 280,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#0F172A',
    outlineStyle: 'none',
    padding: 0,
  } as any,
  kanbanScroll: {
    width: '100%',
  },
  kanbanColumnsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 16,
  },
  kanbanColumn: {
    width: 280,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    maxHeight: 650,
  },
  kanbanColHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 8,
    borderLeftWidth: 3,
    marginBottom: 12,
  },
  kanbanColTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  kanbanCountBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  kanbanCountText: {
    fontSize: 11,
    fontWeight: '800',
  },
  kanbanCardList: {
    flex: 1,
    gap: 10,
  },
  emptyColBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyColText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  leadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    marginBottom: 10,
    ...Shadows.subtle,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  leadCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leadCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  leadCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickActionIcon: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#F8FAFC',
  },
  leadCardPhone: {
    fontSize: 11.5,
    color: '#64748B',
  },
  leadCardProp: {
    fontSize: 11.5,
    color: '#334155',
    fontWeight: '500',
  },
  leadCardBudget: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  leadFollowUpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  leadFollowUpText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  leadCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 6,
    marginTop: 4,
  },
  leadAgentName: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
    maxWidth: 140,
  },
  leadCardDate: {
    fontSize: 10.5,
    color: '#94A3B8',
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Shadows.card,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 16,
    flexWrap: 'wrap',
  },
  listColInfo: {
    flex: 1,
    minWidth: 200,
    gap: 2,
  },
  listLeadName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  listLeadPhone: {
    fontSize: 12,
    color: '#64748B',
  },
  listLeadProp: {
    fontSize: 11.5,
    color: '#334155',
  },
  listColStage: {
    width: 140,
    gap: 4,
  },
  listStageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  listStageText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  listAgent: {
    fontSize: 11,
    color: '#64748B',
  },
  listColActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  listDetailsBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  listDetailsBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  emptySub: {
    fontSize: 12.5,
    color: '#94A3B8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    ...Shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  modalBody: {
    flex: 1,
  },
  commBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  commBtnCall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  commBtnWA: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  commBtnMail: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  commBtnDelete: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  commBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  formGroup: {
    gap: 6,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  stagePickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stagePickBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  stagePickText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12.5,
    color: '#0F172A',
    outlineStyle: 'none',
  } as any,
  agentSelector: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 38,
    justifyContent: 'center',
  },
  agentChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    marginRight: 6,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  agentChipActive: {
    backgroundColor: '#0F172A',
  },
  agentChipText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '600',
  },
  agentChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    padding: 10,
    fontSize: 12.5,
    color: '#0F172A',
    outlineStyle: 'none',
  } as any,
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 10,
  },
  btnCancel: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  btnCancelText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  btnSave: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  btnSaveText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  toast: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.card,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
