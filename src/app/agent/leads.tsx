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
import { propertyService } from '@/services/propertyService';
import { propertyVisitService } from '@/services/propertyVisitService';
import { PropertyEnquiry, PipelineStage } from '@/types/enquiry';
import { Property } from '@/types/property';
import { formatCurrency } from '@/utils/formatters';

const PIPELINE_STAGES: { id: PipelineStage | 'all'; label: string; color: string; bg: string }[] = [
  { id: 'all', label: 'All Leads', color: '#0F172A', bg: '#F1F5F9' },
  { id: 'new', label: 'New', color: '#0284C7', bg: '#E0F2FE' },
  { id: 'contacted', label: 'Contacted', color: '#D97706', bg: '#FEF3C7' },
  { id: 'qualified', label: 'Qualified', color: '#7C3AED', bg: '#EDE9FE' },
  { id: 'site_visit', label: 'Site Visit', color: '#2563EB', bg: '#DBEAFE' },
  { id: 'negotiation', label: 'Negotiation', color: '#EA580C', bg: '#FFEDD5' },
  { id: 'closed', label: 'Closed', color: '#059669', bg: '#D1FAE5' },
  { id: 'lost', label: 'Lost', color: '#DC2626', bg: '#FEE2E2' },
];

export default function AgentLeadsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const agentId = user?.id || '';

  const [leads, setLeads] = useState<PropertyEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStage, setActiveStage] = useState<PipelineStage | 'all'>('all');
  const [visitToast, setVisitToast] = useState<string | null>(null);

  // Modal States
  const [selectedLead, setSelectedLead] = useState<PropertyEnquiry | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSiteVisitModalOpen, setIsSiteVisitModalOpen] = useState(false);
  const [isMatchingModalOpen, setIsMatchingModalOpen] = useState(false);

  // Edit Lead Form State
  const [editBudget, setEditBudget] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editFollowUpDate, setEditFollowUpDate] = useState('');
  const [editStage, setEditStage] = useState<PipelineStage>('new');
  const [savingLead, setSavingLead] = useState(false);

  // Site Visit Form State
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('11:00 AM');
  const [visitNotes, setVisitNotes] = useState('');
  const [schedulingVisit, setSchedulingVisit] = useState(false);

  // Properties for Matching
  const [allProperties, setAllProperties] = useState<Property[]>([]);

  const fetchLeads = useCallback(async () => {
    if (!agentId) return;
    try {
      const res = await apiClient.get<PropertyEnquiry[]>(`/enquiries?agentId=${agentId}`);
      if (res.success && Array.isArray(res.data)) {
        setLeads(res.data);
      }
    } catch (err) {
      console.warn('[AgentLeads] Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchLeads();
    const props = propertyService.getAllAdmin();
    setAllProperties(props);

    const interval = setInterval(fetchLeads, 12000);
    return () => clearInterval(interval);
  }, [fetchLeads]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesStage =
        activeStage === 'all'
          ? true
          : lead.pipelineStage === activeStage ||
            (activeStage === 'qualified' && (lead.pipelineStage as string) === 'interested');

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        lead.visitorName.toLowerCase().includes(q) ||
        lead.phone.toLowerCase().includes(q) ||
        (lead.email && lead.email.toLowerCase().includes(q)) ||
        (lead.propertyTitle && lead.propertyTitle.toLowerCase().includes(q)) ||
        (lead.buyerLocation && lead.buyerLocation.toLowerCase().includes(q));

      return matchesStage && matchesQuery;
    });
  }, [leads, activeStage, searchQuery]);

  // Stage counts
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = { all: leads.length };
    PIPELINE_STAGES.forEach((s) => {
      if (s.id !== 'all') {
        counts[s.id] = leads.filter(
          (l) => l.pipelineStage === s.id || (s.id === 'qualified' && (l.pipelineStage as string) === 'interested')
        ).length;
      }
    });
    return counts;
  }, [leads]);

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
      `Hello ${lead.visitorName}, I am ${user?.fullName || 'your Property Advisor'} from Cityspace regarding your inquiry on "${lead.propertyTitle || 'properties'}". How can I assist you today?`
    );
    const url = `https://wa.me/${clean}?text=${text}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  const handleQuickStageChange = async (leadId: string, newStage: PipelineStage) => {
    try {
      await apiClient.patch(`/enquiries/${leadId}/stage`, { pipelineStage: newStage });
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, pipelineStage: newStage, updatedAt: new Date().toISOString() } : l))
      );
    } catch (err) {
      console.error('[AgentLeads] Error updating stage:', err);
    }
  };

  const openEditModal = (lead: PropertyEnquiry) => {
    setSelectedLead(lead);
    setEditBudget(lead.buyerBudget || '');
    setEditLocation(lead.buyerLocation || '');
    setEditNotes(lead.notes || '');
    setEditFollowUpDate(lead.followUpDate || '');
    setEditStage(lead.pipelineStage || 'new');
    setIsEditModalOpen(true);
  };

  const handleSaveLead = async () => {
    if (!selectedLead) return;
    setSavingLead(true);
    try {
      const updates = {
        buyerBudget: editBudget,
        buyerLocation: editLocation,
        notes: editNotes,
        followUpDate: editFollowUpDate,
        pipelineStage: editStage,
      };
      await apiClient.patch(`/enquiries/${selectedLead.id}`, updates);
      setLeads((prev) =>
        prev.map((l) => (l.id === selectedLead.id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l))
      );
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('[AgentLeads] Error saving lead:', err);
    } finally {
      setSavingLead(false);
    }
  };

  const openSiteVisitModal = (lead: PropertyEnquiry) => {
    setSelectedLead(lead);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setVisitDate(tomorrow.toISOString().split('T')[0]);
    setVisitTime('11:00 AM');
    setVisitNotes(`Site visit with ${lead.visitorName} for ${lead.propertyTitle || 'Property'}`);
    setIsSiteVisitModalOpen(true);
  };

  const handleScheduleVisit = async () => {
    if (!selectedLead || !visitDate) return;
    setSchedulingVisit(true);
    try {
      const result = await propertyVisitService.createVisitRequest({
        propertyId: selectedLead.propertyId || '',
        agentId: agentId,
        clientName: selectedLead.visitorName,
        clientPhone: selectedLead.phone,
        clientEmail: selectedLead.email || '',
        visitDate: visitDate,
        visitTime: visitTime,
        notes: visitNotes,
      });

      if (result) {
        // Update lead stage to site_visit
        await handleQuickStageChange(selectedLead.id, 'site_visit');
        setIsSiteVisitModalOpen(false);
        setVisitToast('✅ Visit request submitted! Awaiting admin approval.');
        setTimeout(() => setVisitToast(null), 3500);
      } else {
        setVisitToast('❌ Failed to submit visit request. Please try again.');
        setTimeout(() => setVisitToast(null), 3500);
      }
    } catch (err: any) {
      console.error('[AgentLeads] Error scheduling visit:', err);
      setVisitToast('❌ ' + (err.message || 'Failed to schedule site visit.'));
      setTimeout(() => setVisitToast(null), 3500);
    } finally {
      setSchedulingVisit(false);
    }
  };

  // Property Matching Algorithm
  const openMatchingModal = (lead: PropertyEnquiry) => {
    setSelectedLead(lead);
    setIsMatchingModalOpen(true);
  };

  const matchedProperties = useMemo(() => {
    if (!selectedLead) return [];
    const loc = (selectedLead.buyerLocation || selectedLead.propertyCity || '').toLowerCase().trim();
    const budget = selectedLead.buyerBudget || '';

    return allProperties
      .filter((p) => p.status === 'published')
      .map((p) => {
        let score = 0;
        const reasons: string[] = [];

        // Location match
        const pCity = p.location.city.toLowerCase();
        const pNeigh = p.location.neighborhood.toLowerCase();
        if (loc && (pCity.includes(loc) || loc.includes(pCity) || pNeigh.includes(loc))) {
          score += 40;
          reasons.push('Location Match');
        }

        // Budget match heuristic
        if (budget) {
          score += 30;
          reasons.push('Within Price Profile');
        } else {
          score += 10;
        }

        // Assigned directly to this agent
        if (p.assignedAgentId === agentId) {
          score += 30;
          reasons.push('Assigned to You');
        }

        return { property: p, score, reasons };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [selectedLead, allProperties, agentId]);

  const handleSharePropertyWhatsApp = (lead: PropertyEnquiry, property: Property) => {
    const clean = lead.phone.replace(/[^0-9]/g, '');
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cityspace.in';
    const link = `${origin}/properties/${property.id}?ref=${agentId}`;
    const text = encodeURIComponent(
      `Hello ${lead.visitorName}, based on your requirements, here is an exclusive verified property you might like:\n\n*${property.title}*\nLocation: ${property.location.neighborhood}, ${property.location.city}\nPrice: ${formatCurrency(property.price, property.currency, property.type)}\nBrochure: ${link}\n\nLet me know when we can schedule a walkthrough tour!`
    );
    const url = `https://wa.me/${clean}?text=${text}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitles}>
          <Text style={styles.overline}>AGENT CRM / PIPELINE</Text>
          <Text style={styles.title}>My Leads & Pipeline</Text>
          <Text style={styles.subtitle}>
            Manage buyer inquiries, track deal stages from contact to closed, and match properties.
          </Text>
        </View>

        <TouchableOpacity onPress={fetchLeads} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={14} color="#0284C7" style={{ marginRight: 6 }} />
          <Text style={styles.refreshBtnText}>Refresh Leads</Text>
        </TouchableOpacity>
      </View>

      {/* Pipeline Stage Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stageTabsContainer}>
        {PIPELINE_STAGES.map((stage) => {
          const isActive = activeStage === stage.id;
          const count = stageCounts[stage.id] || 0;
          return (
            <TouchableOpacity
              key={stage.id}
              onPress={() => setActiveStage(stage.id)}
              style={[
                styles.stageTab,
                isActive && styles.stageTabActive,
                isActive && { borderColor: stage.id === 'all' ? '#0F172A' : stage.color },
              ]}
            >
              <Text
                style={[
                  styles.stageTabLabel,
                  isActive && { color: stage.id === 'all' ? '#0F172A' : stage.color, fontWeight: '700' },
                ]}
              >
                {stage.label}
              </Text>
              <View style={[styles.stageTabCount, { backgroundColor: isActive ? stage.color : '#E2E8F0' }]}>
                <Text style={[styles.stageTabCountText, isActive && { color: '#FFFFFF' }]}>{count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by client name, phone, email, or property..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={16} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={styles.leadCountText}>Showing {filteredLeads.length} leads</Text>
      </View>

      {/* Leads List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Syncing leads with database...</Text>
        </View>
      ) : filteredLeads.length === 0 ? (
        <View style={styles.emptyBox}>
          <Feather name="inbox" size={44} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No Leads Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? `No inquiries match "${searchQuery}" in this pipeline stage.`
              : `No leads are currently at the "${activeStage.toUpperCase()}" stage. Inquiries assigned by admin or submitted through your listings appear here in real-time.`}
          </Text>
        </View>
      ) : (
        <View style={styles.leadsList}>
          {filteredLeads.map((lead) => {
            const currentStageInfo =
              PIPELINE_STAGES.find((s) => s.id === lead.pipelineStage) ||
              PIPELINE_STAGES.find((s) => s.id === 'new')!;

            return (
              <View key={lead.id} style={styles.leadCard}>
                {/* Top Row: Client Info & Stage */}
                <View style={styles.leadTopRow}>
                  <View style={styles.clientInfoCol}>
                    <View style={styles.clientNameRow}>
                      <Text style={styles.clientName}>{lead.visitorName}</Text>
                      <View style={[styles.stageBadge, { backgroundColor: currentStageInfo.bg }]}>
                        <Text style={[styles.stageBadgeText, { color: currentStageInfo.color }]}>
                          {currentStageInfo.label.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.contactsRow}>
                      <TouchableOpacity onPress={() => handleCall(lead.phone)} style={styles.contactItem}>
                        <Feather name="phone" size={13} color="#0284C7" />
                        <Text style={styles.contactItemText}>{lead.phone}</Text>
                      </TouchableOpacity>
                      {lead.email ? (
                        <View style={styles.contactItem}>
                          <Feather name="mail" size={13} color="#64748B" />
                          <Text style={styles.contactItemText}>{lead.email}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {/* Quick Action Buttons */}
                  <View style={styles.quickActionsCol}>
                    <TouchableOpacity onPress={() => handleCall(lead.phone)} style={styles.callBtn}>
                      <Feather name="phone-call" size={14} color="#0284C7" />
                      <Text style={styles.callBtnText}>Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleWhatsApp(lead)} style={styles.whatsAppBtn}>
                      <Feather name="message-circle" size={14} color="#059669" />
                      <Text style={styles.whatsAppBtnText}>WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Middle: Inquired Property & Message */}
                <View style={styles.leadPropertyBox}>
                  <View style={styles.propHeader}>
                    <Feather name="home" size={14} color="#0F172A" style={{ marginRight: 6 }} />
                    <Text style={styles.propTitle} numberOfLines={1}>
                      {lead.propertyTitle || 'General Property Inquiry'}
                    </Text>
                  </View>
                  {lead.message ? (
                    <Text style={styles.leadMessage} numberOfLines={2}>
                      "{lead.message}"
                    </Text>
                  ) : null}
                </View>

                {/* Buyer Requirements & Follow-up Row */}
                <View style={styles.leadDetailsRow}>
                  {lead.buyerBudget ? (
                    <View style={styles.detailBadge}>
                      <Feather name="tag" size={12} color="#475569" style={{ marginRight: 4 }} />
                      <Text style={styles.detailBadgeText}>Budget: {lead.buyerBudget}</Text>
                    </View>
                  ) : null}

                  {lead.buyerLocation ? (
                    <View style={styles.detailBadge}>
                      <Feather name="map-pin" size={12} color="#475569" style={{ marginRight: 4 }} />
                      <Text style={styles.detailBadgeText}>Pref: {lead.buyerLocation}</Text>
                    </View>
                  ) : null}

                  {lead.followUpDate ? (
                    <View style={[styles.detailBadge, styles.followUpBadge]}>
                      <Feather name="clock" size={12} color="#D97706" style={{ marginRight: 4 }} />
                      <Text style={[styles.detailBadgeText, { color: '#B45309', fontWeight: '600' }]}>
                        Follow-up: {lead.followUpDate}
                      </Text>
                    </View>
                  ) : null}

                  <Text style={styles.leadDate}>
                    Received: {new Date(lead.createdAt).toLocaleDateString()}
                  </Text>
                </View>

                {/* Notes Preview if available */}
                {lead.notes ? (
                  <View style={styles.notesBox}>
                    <Feather name="file-text" size={12} color="#64748B" style={{ marginRight: 6, marginTop: 2 }} />
                    <Text style={styles.notesText} numberOfLines={2}>
                      <Text style={{ fontWeight: '700' }}>Note: </Text>
                      {lead.notes}
                    </Text>
                  </View>
                ) : null}

                {/* Bottom Actions Bar */}
                <View style={styles.leadBottomBar}>
                  {/* Stage Advance Selector */}
                  <View style={styles.stageSelectorRow}>
                    <Text style={styles.stageSelectorLabel}>Stage:</Text>
                    {(['new', 'contacted', 'qualified', 'site_visit', 'negotiation', 'closed', 'lost'] as PipelineStage[]).map(
                      (stg) => {
                        const isCurrent =
                          lead.pipelineStage === stg ||
                          (stg === 'qualified' && (lead.pipelineStage as string) === 'interested');
                        return (
                          <TouchableOpacity
                            key={stg}
                            onPress={() => handleQuickStageChange(lead.id, stg)}
                            style={[styles.miniStageBtn, isCurrent && styles.miniStageBtnActive]}
                          >
                            <Text style={[styles.miniStageText, isCurrent && styles.miniStageTextActive]}>
                              {stg.replace('_', ' ').slice(0, 4).toUpperCase()}
                            </Text>
                          </TouchableOpacity>
                        );
                      }
                    )}
                  </View>

                  {/* Secondary Tools */}
                  <View style={styles.secondaryToolsRow}>
                    <TouchableOpacity onPress={() => openMatchingModal(lead)} style={styles.toolBtn}>
                      <Feather name="target" size={13} color="#7C3AED" style={{ marginRight: 4 }} />
                      <Text style={[styles.toolBtnText, { color: '#7C3AED' }]}>Match Props</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => openSiteVisitModal(lead)} style={styles.toolBtn}>
                      <Feather name="calendar" size={13} color="#2563EB" style={{ marginRight: 4 }} />
                      <Text style={[styles.toolBtnText, { color: '#2563EB' }]}>Tour</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => openEditModal(lead)} style={styles.toolBtn}>
                      <Feather name="edit-3" size={13} color="#475569" style={{ marginRight: 4 }} />
                      <Text style={styles.toolBtnText}>Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* MODAL 1: Edit Lead / CRM Details */}
      <Modal visible={isEditModalOpen} transparent animationType="fade" onRequestClose={() => setIsEditModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Lead CRM Details</Text>
                <Text style={styles.modalSub}>{selectedLead?.visitorName} ({selectedLead?.phone})</Text>
              </View>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Pipeline Stage */}
              <Text style={styles.fieldLabel}>Pipeline Stage</Text>
              <View style={styles.modalStageGrid}>
                {PIPELINE_STAGES.filter((s) => s.id !== 'all').map((stg) => {
                  const isSel = editStage === stg.id;
                  return (
                    <TouchableOpacity
                      key={stg.id}
                      onPress={() => setEditStage(stg.id as PipelineStage)}
                      style={[styles.modalStageChip, isSel && { backgroundColor: stg.color, borderColor: stg.color }]}
                    >
                      <Text style={[styles.modalStageChipText, isSel && { color: '#FFFFFF' }]}>{stg.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Budget */}
              <Text style={styles.fieldLabel}>Buyer Budget</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. ₹75 Lakhs - ₹1.1 Crore"
                value={editBudget}
                onChangeText={setEditBudget}
              />

              {/* Preferred Location */}
              <Text style={styles.fieldLabel}>Preferred Location / City</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Bandra West, Mumbai or Whitefield, Bengaluru"
                value={editLocation}
                onChangeText={setEditLocation}
              />

              {/* Follow-up Date */}
              <Text style={styles.fieldLabel}>Next Follow-up Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 2026-09-25"
                value={editFollowUpDate}
                onChangeText={setEditFollowUpDate}
              />

              {/* Notes */}
              <Text style={styles.fieldLabel}>Client Notes & Preferences</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                multiline
                numberOfLines={3}
                placeholder="Write specific requirements, preferred payment mode, family size, timeline to purchase..."
                value={editNotes}
                onChangeText={setEditNotes}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveLead} style={styles.modalSaveBtn} disabled={savingLead}>
                <Text style={styles.modalSaveText}>{savingLead ? 'Saving...' : 'Save Details'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Schedule Site Visit */}
      <Modal
        visible={isSiteVisitModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSiteVisitModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Schedule Site Visit</Text>
                <Text style={styles.modalSub}>{selectedLead?.visitorName} - {selectedLead?.propertyTitle}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsSiteVisitModalOpen(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.fieldLabel}>Visit Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 2026-09-24"
                value={visitDate}
                onChangeText={setVisitDate}
              />

              <Text style={styles.fieldLabel}>Visit Time Slot</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 11:00 AM, 3:30 PM"
                value={visitTime}
                onChangeText={setVisitTime}
              />

              <Text style={styles.fieldLabel}>Visit Notes / Instructions</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                multiline
                numberOfLines={3}
                placeholder="Meet at sales lounge, key at security gate, etc."
                value={visitNotes}
                onChangeText={setVisitNotes}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setIsSiteVisitModalOpen(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleScheduleVisit} style={styles.modalSaveBtn} disabled={schedulingVisit}>
                <Text style={styles.modalSaveText}>{schedulingVisit ? 'Scheduling...' : 'Confirm Schedule'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: Property Matcher */}
      <Modal
        visible={isMatchingModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMatchingModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 680 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Property Matcher for {selectedLead?.visitorName}</Text>
                <Text style={styles.modalSub}>
                  Matching available verified listings against buyer criteria: {selectedLead?.buyerLocation || 'All Locations'} | Budget: {selectedLead?.buyerBudget || 'Any'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsMatchingModalOpen(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={[styles.modalBody, { maxHeight: 420 }]} showsVerticalScrollIndicator={true}>
              {matchedProperties.length === 0 ? (
                <View style={styles.noMatchBox}>
                  <Feather name="alert-circle" size={32} color="#94A3B8" />
                  <Text style={styles.noMatchTitle}>No Exact Matches Found</Text>
                  <Text style={styles.noMatchSub}>
                    Try updating the buyer's preferred location or budget in CRM details to match current inventory.
                  </Text>
                </View>
              ) : (
                <View style={styles.matchList}>
                  {matchedProperties.map(({ property, score, reasons }) => (
                    <View key={property.id} style={styles.matchCard}>
                      <View style={styles.matchCardLeft}>
                        <View style={styles.matchScoreBadge}>
                          <Text style={styles.matchScoreText}>{score}% MATCH</Text>
                        </View>
                        <Text style={styles.matchPropTitle} numberOfLines={1}>
                          {property.title}
                        </Text>
                        <Text style={styles.matchPropLoc}>
                          {property.location.neighborhood}, {property.location.city} • {property.specs.bedrooms} BHK • {property.categoryLabel}
                        </Text>
                        <Text style={styles.matchPropPrice}>
                          {formatCurrency(property.price, property.currency, property.type)}
                        </Text>
                        <View style={styles.matchReasonsRow}>
                          {reasons.map((r) => (
                            <View key={r} style={styles.reasonPill}>
                              <Text style={styles.reasonText}>{r}</Text>
                            </View>
                          ))}
                        </View>
                      </View>

                      <View style={styles.matchCardRight}>
                        <TouchableOpacity
                          onPress={() => handleSharePropertyWhatsApp(selectedLead!, property)}
                          style={styles.shareMatchBtn}
                        >
                          <Feather name="send" size={13} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.shareMatchText}>Send WhatsApp</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            setIsMatchingModalOpen(false);
                            router.push(`/properties/${property.id}` as any);
                          }}
                          style={styles.viewMatchBtn}
                        >
                          <Feather name="external-link" size={12} color="#475569" style={{ marginRight: 4 }} />
                          <Text style={styles.viewMatchText}>View Details</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setIsMatchingModalOpen(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Visit Toast */}
      {visitToast && (
        <View style={styles.visitToast}>
          <Text style={styles.visitToastText}>{visitToast}</Text>
        </View>
      )}
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
  stageTabsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  stageTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  stageTabActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    ...Shadows.sm,
  },
  stageTabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  stageTabCount: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  stageTabCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
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
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    outlineStyle: 'none' as any,
  },
  leadCountText: {
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
  emptyBox: {
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
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 480,
    lineHeight: 20,
  },
  leadsList: {
    gap: 16,
  },
  leadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    gap: 14,
    ...Shadows.sm,
  },
  leadTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  clientInfoCol: {
    gap: 6,
    flex: 1,
    minWidth: 240,
  },
  clientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  clientName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stageBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  contactsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  contactItemText: {
    fontSize: 13,
    color: '#475569',
  },
  quickActionsCol: {
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
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  callBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  whatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  whatsAppBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  leadPropertyBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 12,
    gap: 4,
  },
  propHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  propTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  leadMessage: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  leadDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  detailBadgeText: {
    fontSize: 12,
    color: '#334155',
  },
  followUpBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  leadDate: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 'auto',
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FEF08A',
    padding: 10,
    borderRadius: BorderRadius.sm,
  },
  notesText: {
    flex: 1,
    fontSize: 12,
    color: '#854D0E',
    lineHeight: 17,
  },
  leadBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexWrap: 'wrap',
    gap: 12,
  },
  stageSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  stageSelectorLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginRight: 4,
  },
  miniStageBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
  },
  miniStageBtnActive: {
    backgroundColor: '#0F172A',
  },
  miniStageText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  miniStageTextActive: {
    color: '#FFFFFF',
  },
  secondaryToolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toolBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },

  // MODAL STYLES
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
    maxWidth: 520,
    padding: 24,
    gap: 18,
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
    gap: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  modalStageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  modalStageChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalStageChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 10,
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

  // Matcher styles
  noMatchBox: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 8,
  },
  noMatchTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  noMatchSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 380,
  },
  matchList: {
    gap: 12,
  },
  matchCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 12,
    flexWrap: 'wrap',
  },
  matchCardLeft: {
    flex: 1,
    minWidth: 260,
    gap: 4,
  },
  matchScoreBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  matchScoreText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7C3AED',
  },
  matchPropTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  matchPropLoc: {
    fontSize: 12,
    color: '#64748B',
  },
  matchPropPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0284C7',
  },
  matchReasonsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  reasonPill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reasonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  matchCardRight: {
    gap: 6,
    justifyContent: 'center',
  },
  shareMatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  shareMatchText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewMatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  viewMatchText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  visitToast: {
    position: 'absolute' as any,
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: '#059669',
    borderRadius: 10,
    padding: 14,
    zIndex: 9999,
    elevation: 10,
  },
  visitToastText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
});
