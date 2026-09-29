import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { agentService } from '@/services/agentService';
import { propertyService } from '@/services/propertyService';
import { Agent, AgentStatus } from '@/types/agent';

export default function AdminAgentsScreen() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AgentStatus>('all');

  // Add / Edit Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formExperience, setFormExperience] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formAreas, setFormAreas] = useState('');
  const [formAvatar, setFormAvatar] = useState('');
  const [formStatus, setFormStatus] = useState<AgentStatus>('active');
  const [formPassword, setFormPassword] = useState('');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formCity, setFormCity] = useState('Mumbai');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Assign Properties Modal State
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedAgentForAssign, setSelectedAgentForAssign] = useState<Agent | null>(null);

  // Delete Agent Modal State
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);

  const [agentsList, setAgentsList] = useState<Agent[]>(() => agentService.getAll());

  React.useEffect(() => {
    // Initial sync
    setAgentsList(agentService.getAll());

    // Subscribe to reactive service changes
    const unsubscribe = agentService.subscribe(() => {
      setAgentsList(agentService.getAll());
    });

    // Fetch fresh data from backend on mount
    agentService.refreshFromBackend();

    // Auto-refresh in background every 4 seconds so any changes from database reflect automatically without manual page refresh
    const autoRefreshTimer = setInterval(() => {
      agentService.refreshFromBackend();
    }, 4000);

    return () => {
      unsubscribe();
      clearInterval(autoRefreshTimer);
    };
  }, []);

  const filteredAgents = useMemo(() => {
    return agentsList.filter((agent) => {
      if (statusFilter !== 'all' && agent.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = agent.name.toLowerCase().includes(q);
        const matchEmail = agent.email.toLowerCase().includes(q);
        const matchPhone = agent.phone.toLowerCase().includes(q);
        const matchDesig = agent.designation.toLowerCase().includes(q);
        const matchAreas = agent.areasServed.some((a) => a.toLowerCase().includes(q));
        if (!matchName && !matchEmail && !matchPhone && !matchDesig && !matchAreas) {
          return false;
        }
      }
      return true;
    });
  }, [agentsList, statusFilter, searchQuery]);

  const allProperties = useMemo(() => {
    return propertyService.getAllAdmin();
  }, [refreshKey]);

  const openAddModal = () => {
    setEditingAgent(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormPassword('agent123');
    setShowFormPassword(false);
    setFormCity('Mumbai');
    setFormDesignation('Senior Property Advisor');
    setFormExperience('5+ Years Luxury Real Estate');
    setFormBio('Dedicated Cityspace luxury property advisor specializing in prime residences.');
    setFormAreas('Bandra, Worli, Juhu');
    setFormAvatar('');
    setFormStatus('active');
    setFormErrors({});
    setModalVisible(true);
  };

  const openEditModal = (agent: Agent) => {
    setEditingAgent(agent);
    setFormName(agent.name);
    setFormEmail(agent.email);
    setFormPhone(agent.phone);
    setFormPassword('');
    setShowFormPassword(false);
    setFormCity(agent.city || 'Mumbai');
    setFormDesignation(agent.designation || 'Property Advisor');
    setFormExperience(agent.experience || '');
    setFormBio(agent.bio || '');
    setFormAreas(agent.areasServed?.join(', ') || '');
    setFormAvatar(agent.avatar || '');
    setFormStatus(agent.status);
    setFormErrors({});
    setModalVisible(true);
  };

  const openAssignModal = (agent: Agent) => {
    setSelectedAgentForAssign(agent);
    setAssignModalVisible(true);
  };

  const handleToggleStatus = async (agentId: string) => {
    // Immediate optimistic update
    setAgentsList((prev) =>
      prev.map((a) =>
        a.id === agentId
          ? { ...a, status: a.status === 'active' ? 'inactive' : 'active' }
          : a
      )
    );
    await agentService.toggleStatus(agentId);
  };

  const confirmDeleteAgent = (agent: Agent) => {
    setAgentToDelete(agent);
    setDeleteModalVisible(true);
  };

  const handleExecuteDelete = async () => {
    if (!agentToDelete) return;
    const targetId = agentToDelete.id;
    // Immediate optimistic update: removes card from view instantly!
    setAgentsList((prev) => prev.filter((a) => a.id !== targetId));
    setDeleteModalVisible(false);
    setAgentToDelete(null);
    await agentService.deleteAgent(targetId);
  };

  const handleAssignPropertyToAgent = (propertyId: string) => {
    if (!selectedAgentForAssign) return;
    propertyService.assignAgent(propertyId, {
      id: selectedAgentForAssign.id,
      name: selectedAgentForAssign.name,
      agency: 'Cityspace Advisory Group',
      avatar: selectedAgentForAssign.avatar || '',
      phone: selectedAgentForAssign.phone,
      email: selectedAgentForAssign.email,
      designation: selectedAgentForAssign.designation,
      propertiesHandled: selectedAgentForAssign.propertiesHandled,
      rating: selectedAgentForAssign.rating || 5.0,
      reviewCount: selectedAgentForAssign.reviewCount || 0,
      verified: true,
    });
    agentService.assignProperty(selectedAgentForAssign.id, propertyId);
    setRefreshKey((k) => k + 1);
    if (Platform.OS === 'web') {
      window.alert(`Property successfully assigned to ${selectedAgentForAssign.name}`);
    }
  };

  const handleSaveAgent = async () => {
    const errors: Record<string, string> = {};
    if (!formName.trim()) errors.name = 'Agent name is required';
    if (!formEmail.trim() || !formEmail.includes('@')) errors.email = 'Valid email is required';
    if (!formPhone.trim()) errors.phone = 'Phone number is required';
    if (!formDesignation.trim()) errors.designation = 'Designation is required';
    if (!formBio.trim()) errors.bio = 'Bio is required';
    if (!formCity.trim()) errors.city = 'Primary city is required';
    const effectivePass = formPassword.trim() || 'agent123';
    if (!editingAgent && effectivePass.length < 6) {
      errors.password = 'Login password must be at least 6 characters';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const areasArray = formAreas
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    setModalVisible(false);

    if (editingAgent) {
      // Immediate optimistic update
      setAgentsList((prev) =>
        prev.map((a) =>
          a.id === editingAgent.id
            ? {
                ...a,
                name: formName.trim(),
                email: formEmail.trim(),
                phone: formPhone.trim(),
                designation: formDesignation.trim(),
                experience: formExperience.trim(),
                bio: formBio.trim(),
                areasServed: areasArray,
                avatar: formAvatar.trim() || editingAgent.avatar,
                status: formStatus,
              }
            : a
        )
      );

      await agentService.updateAgent(editingAgent.id, {
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        designation: formDesignation.trim(),
        experience: formExperience.trim(),
        bio: formBio.trim(),
        areasServed: areasArray,
        avatar: formAvatar.trim() || editingAgent.avatar,
        status: formStatus,
        city: formCity.trim(),
        password: formPassword.trim() ? formPassword.trim() : undefined,
      });
    } else {
      const optimisticNew: Agent = {
        id: `ag-${Date.now()}`,
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        designation: formDesignation.trim(),
        experience: formExperience.trim(),
        bio: formBio.trim(),
        areasServed: areasArray,
        avatar: formAvatar.trim() || undefined,
        status: formStatus,
        city: formCity.trim(),
        role: 'agent',
        rating: 5.0,
        reviewCount: 0,
        assignedPropertyIds: [],
        createdAt: new Date().toISOString(),
      };
      // Immediate optimistic update: new card appears instantly!
      setAgentsList((prev) => [optimisticNew, ...prev]);

      await agentService.createAgent({
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        designation: formDesignation.trim(),
        experience: formExperience.trim(),
        bio: formBio.trim(),
        areasServed: areasArray,
        avatar: formAvatar.trim() || undefined,
        status: formStatus,
        city: formCity.trim(),
        password: formPassword.trim() || 'agent123',
        role: 'agent',
        assignedPropertyIds: [],
      });
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.overline}>ADMIN CONSOLE / WORKFORCE</Text>
          <Text style={styles.title}>Agents Management</Text>
          <Text style={styles.subtitle}>
            Create, authenticate, verify, and assign properties to certified Cityspace property advisors.
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>Live Auto-Sync</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={openAddModal}
            style={styles.addBtn}
          >
            <Feather name="user-plus" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.addBtnText}>+ Add New Agent</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter and Search Bar */}
      <View style={styles.filterRow}>
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search agents by name, email, designation, or area..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={14} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.tabs}>
          {[
            { id: 'all', label: `All (${agentsList.length})` },
            { id: 'active', label: `Active (${agentsList.filter((a) => a.status === 'active').length})` },
            { id: 'inactive', label: `Inactive (${agentsList.filter((a) => a.status === 'inactive').length})` },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setStatusFilter(tab.id as any)}
              style={[
                styles.tabPill,
                statusFilter === tab.id && styles.tabPillActive,
              ]}
            >
              <Text
                style={[
                  styles.tabPillText,
                  statusFilter === tab.id && styles.tabPillTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Agents Grid */}
      {filteredAgents.length === 0 ? (
        <View style={{ padding: 48, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 12 }}>
          <Feather name="users" size={36} color="#94A3B8" />
          <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.textPrimary }}>
            No Agents Found
          </Text>
          <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', maxWidth: 440 }}>
            {searchQuery
              ? `No registered advisors matched "${searchQuery}".`
              : 'No agents registered yet. Click "+ Add New Agent" to onboard your first advisor.'}
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {filteredAgents.map((agent) => {
            const isActive = agent.status === 'active';
            return (
              <View key={agent.id} style={styles.card}>
                <View style={styles.topRow}>
                  {agent.avatar ? (
                    <Image source={{ uri: agent.avatar }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center' }]}>
                      <Feather name="user" size={22} color="#64748B" />
                    </View>
                  )}
                  <View style={styles.info}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{agent.name}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        isActive ? styles.badgeActive : styles.badgeInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          isActive ? styles.badgeTextActive : styles.badgeTextInactive,
                        ]}
                      >
                        {agent.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.designation} numberOfLines={1}>
                    {agent.designation}
                  </Text>
                  <View style={styles.ratingRow}>
                    <Feather name="star" size={12} color="#D97706" style={{ marginRight: 4 }} />
                    <Text style={styles.ratingText}>
                      {agent.rating} ({agent.reviewCount} client reviews)
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.bio} numberOfLines={2}>
                "{agent.bio}"
              </Text>

              <View style={styles.areasRow}>
                {agent.areasServed.map((area) => (
                  <View key={area} style={styles.areaTag}>
                    <Text style={styles.areaTagText}>{area}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.divider} />

              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Feather name="layers" size={13} color="#64748B" style={{ marginRight: 5 }} />
                  <Text style={styles.detailText}>
                    {agent.assignedPropertyIds?.length || agent.activeListingsCount} Assigned Properties
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Feather name="phone" size={13} color="#64748B" style={{ marginRight: 5 }} />
                  <Text style={styles.detailText}>{agent.phone}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Feather name="mail" size={13} color="#64748B" style={{ marginRight: 5 }} />
                  <Text style={styles.detailText}>{agent.email}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Action Buttons */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  onPress={() => handleToggleStatus(agent.id)}
                  style={[
                    styles.actionBtn,
                    isActive ? styles.btnDeactivate : styles.btnActivate,
                  ]}
                >
                  <Feather
                    name={isActive ? 'slash' : 'check'}
                    size={12}
                    color={isActive ? '#DC2626' : '#15803D'}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.actionBtnText,
                      isActive ? styles.btnTextDeactivate : styles.btnTextActivate,
                    ]}
                  >
                    {isActive ? 'Deactivate' : 'Activate'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => openAssignModal(agent)}
                  style={styles.actionBtnAssign}
                >
                  <Feather name="link" size={12} color="#0284C7" style={{ marginRight: 4 }} />
                  <Text style={styles.actionBtnAssignText}>Assign</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => openEditModal(agent)}
                  style={styles.actionBtnEdit}
                >
                  <Feather name="edit-2" size={12} color="#334155" style={{ marginRight: 4 }} />
                  <Text style={styles.actionBtnEditText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => confirmDeleteAgent(agent)}
                  style={styles.actionBtnDelete}
                >
                  <Feather name="trash-2" size={12} color="#DC2626" style={{ marginRight: 4 }} />
                  <Text style={styles.actionBtnDeleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
      )}

      {/* Add / Edit Agent Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAgent ? 'Edit Agent Advisor' : 'Add New Certified Agent'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={true}>
              {/* Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>FULL NAME *</Text>
                <TextInput
                  placeholder="e.g. Vikram Singhania"
                  value={formName}
                  onChangeText={setFormName}
                  style={[styles.input, formErrors.name ? styles.inputErr : null]}
                />
                {formErrors.name && <Text style={styles.errText}>{formErrors.name}</Text>}
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL ADDRESS (FOR LOGIN) *</Text>
                <TextInput
                  placeholder="e.g. vikram.s@cityspace.in"
                  value={formEmail}
                  onChangeText={setFormEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.input, formErrors.email ? styles.inputErr : null]}
                />
                {formErrors.email && <Text style={styles.errText}>{formErrors.email}</Text>}
              </View>

              {/* Password / Set Password */}
              <View style={styles.inputGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={styles.inputLabel}>
                    {editingAgent ? 'NEW LOGIN PASSWORD (OPTIONAL)' : 'INITIAL LOGIN PASSWORD'}
                  </Text>
                  {!editingAgent && (
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#0284C7' }}>DEFAULT: agent123</Text>
                  )}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: formErrors.password ? '#EF4444' : '#CBD5E1', borderRadius: BorderRadius.md, backgroundColor: '#FFFFFF', paddingHorizontal: 12 }}>
                  <Feather name="key" size={14} color="#64748B" style={{ marginRight: 8 }} />
                  <TextInput
                    placeholder={editingAgent ? 'Enter new password if changing' : 'agent123'}
                    placeholderTextColor="#94A3B8"
                    value={formPassword}
                    onChangeText={setFormPassword}
                    secureTextEntry={!showFormPassword}
                    autoCapitalize="none"
                    style={{ flex: 1, height: 40, fontSize: 13, color: '#0F172A', outlineStyle: 'none' } as any}
                  />
                  <TouchableOpacity onPress={() => setShowFormPassword(!showFormPassword)} style={{ padding: 6 }}>
                    <Feather name={showFormPassword ? 'eye-off' : 'eye'} size={15} color="#64748B" />
                  </TouchableOpacity>
                </View>
                {!editingAgent && (
                  <Text style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                    Default initial password is <Text style={{ fontWeight: '700', color: '#0284C7' }}>agent123</Text>. The advisor will be prompted to update it on their first login.
                  </Text>
                )}
                {formErrors.password && <Text style={styles.errText}>{formErrors.password}</Text>}
              </View>

              {/* City / Primary Market */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PRIMARY CITY / MARKET *</Text>
                <TextInput
                  placeholder="e.g. Mumbai, Delhi NCR, Bengaluru, Pune"
                  value={formCity}
                  onChangeText={setFormCity}
                  style={[styles.input, formErrors.city ? styles.inputErr : null]}
                />
                {formErrors.city && <Text style={styles.errText}>{formErrors.city}</Text>}
              </View>

              {/* Role Display Badge */}
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', borderRadius: BorderRadius.md, padding: 10, marginVertical: 4 }}>
                <Feather name="shield" size={15} color="#0284C7" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#0369A1' }}>System Role: Certified Agent</Text>
                  <Text style={{ fontSize: 11, color: '#0284C7' }}>Grants direct access to the Cityspace Agent Portal & assigned leads.</Text>
                </View>
              </View>

              {/* Phone */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PHONE NUMBER *</Text>
                <TextInput
                  placeholder="e.g. +91 98220 99881"
                  value={formPhone}
                  onChangeText={setFormPhone}
                  style={[styles.input, formErrors.phone ? styles.inputErr : null]}
                />
                {formErrors.phone && <Text style={styles.errText}>{formErrors.phone}</Text>}
              </View>

              {/* Designation */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>DESIGNATION *</Text>
                <TextInput
                  placeholder="e.g. Senior Luxury Property Advisor"
                  value={formDesignation}
                  onChangeText={setFormDesignation}
                  style={[styles.input, formErrors.designation ? styles.inputErr : null]}
                />
                {formErrors.designation && <Text style={styles.errText}>{formErrors.designation}</Text>}
              </View>

              {/* Experience */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EXPERIENCE NARRATIVE</Text>
                <TextInput
                  placeholder="e.g. 10+ Years in Pune Prime Real Estate"
                  value={formExperience}
                  onChangeText={setFormExperience}
                  style={styles.input}
                />
              </View>

              {/* Bio */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>BIOGRAPHY *</Text>
                <TextInput
                  placeholder="Specializations, luxury estate background..."
                  value={formBio}
                  onChangeText={setFormBio}
                  multiline
                  numberOfLines={3}
                  style={[styles.textArea, formErrors.bio ? styles.inputErr : null]}
                />
                {formErrors.bio && <Text style={styles.errText}>{formErrors.bio}</Text>}
              </View>

              {/* Areas Served */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>AREAS SERVED (COMMA-SEPARATED)</Text>
                <TextInput
                  placeholder="e.g. Baner, Koregaon Park, Kalyani Nagar, Aundh"
                  value={formAreas}
                  onChangeText={setFormAreas}
                  style={styles.input}
                />
              </View>

              {/* Photo URL */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PROFILE PHOTO URL</Text>
                <TextInput
                  placeholder="https://..."
                  value={formAvatar}
                  onChangeText={setFormAvatar}
                  style={styles.input}
                />
              </View>

              {/* Status */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>INITIAL STATUS</Text>
                <View style={styles.statusSelectRow}>
                  {(['active', 'inactive'] as AgentStatus[]).map((st) => (
                    <TouchableOpacity
                      key={st}
                      onPress={() => setFormStatus(st)}
                      style={[
                        styles.statusPillBtn,
                        formStatus === st && styles.statusPillBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillBtnText,
                          formStatus === st && styles.statusPillBtnTextActive,
                        ]}
                      >
                        {st.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              {editingAgent ? (
                <TouchableOpacity
                  onPress={() => {
                    const toDelete = editingAgent;
                    setModalVisible(false);
                    confirmDeleteAgent(toDelete);
                  }}
                  style={styles.deleteModalBtn}
                >
                  <Feather name="trash-2" size={13} color="#DC2626" style={{ marginRight: 4 }} />
                  <Text style={styles.deleteModalBtnText}>Delete Agent</Text>
                </TouchableOpacity>
              ) : null}
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.cancelModalBtn}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveAgent} style={styles.saveModalBtn}>
                <Text style={styles.saveModalText}>
                  {editingAgent ? 'Save Changes' : 'Create Agent'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Assign Property Modal */}
      <Modal
        visible={assignModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setAssignModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Assign Property</Text>
                <Text style={styles.modalSubTitle}>
                  Assign listing to {selectedAgentForAssign?.name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={true}>
              <Text style={styles.assignInstruction}>
                Select a property from the inventory to delegate to this advisor:
              </Text>
              <View style={styles.assignList}>
                {allProperties.map((prop) => {
                  const isAssigned =
                    selectedAgentForAssign?.assignedPropertyIds?.includes(prop.id) ||
                    prop.assignedAgentId === selectedAgentForAssign?.id;

                  return (
                    <View key={prop.id} style={styles.assignItem}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={styles.assignPropTitle} numberOfLines={1}>
                          {prop.title}
                        </Text>
                        <Text style={styles.assignPropMeta}>
                          {prop.location.city} • ₹{prop.price.toLocaleString()} • {prop.status.toUpperCase()}
                        </Text>
                      </View>

                      {isAssigned ? (
                        <View style={styles.assignedBadge}>
                          <Feather name="check" size={12} color="#059669" style={{ marginRight: 4 }} />
                          <Text style={styles.assignedBadgeText}>Assigned</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() => handleAssignPropertyToAgent(prop.id)}
                          style={styles.assignActionBtn}
                        >
                          <Text style={styles.assignActionText}>Assign</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={() => setAssignModalVisible(false)}
                style={styles.saveModalBtn}
              >
                <Text style={styles.saveModalText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Agent Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxWidth: 440 }]}>
            <View style={styles.deleteModalContent}>
              <View style={styles.deleteWarningIconBox}>
                <Feather name="trash-2" size={24} color="#DC2626" />
              </View>
              <Text style={styles.deleteModalTitle}>Delete Property Advisor?</Text>
              <Text style={styles.deleteModalSub}>
                Are you sure you want to permanently delete{' '}
                <Text style={{ fontWeight: '700', color: Colors.textPrimary }}>
                  {agentToDelete?.name}
                </Text>
                {agentToDelete?.email ? ` (${agentToDelete.email})` : ''}?
              </Text>
              <View style={styles.deleteWarningBanner}>
                <Feather name="alert-triangle" size={14} color="#D97706" style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={styles.deleteWarningBannerText}>
                  This action cannot be undone. Any properties or enquiries currently assigned to this agent will be unassigned.
                </Text>
              </View>

              <View style={styles.deleteModalButtons}>
                <TouchableOpacity
                  onPress={() => {
                    setDeleteModalVisible(false);
                    setAgentToDelete(null);
                  }}
                  style={styles.deleteCancelBtn}
                >
                  <Text style={styles.deleteCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleExecuteDelete}
                  style={styles.deleteConfirmBtn}
                >
                  <Feather name="trash-2" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.deleteConfirmBtnText}>Yes, Delete</Text>
                </TouchableOpacity>
              </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  headerText: {
    gap: 4,
  },
  overline: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#64748B',
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.md,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.pill,
    gap: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
    letterSpacing: 0.3,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  searchBox: {
    flex: 1,
    minWidth: 280,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tabPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  tabPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    width: 370,
    gap: 12,
    ...Shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E2E8F0',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  badgeActive: {
    backgroundColor: '#DCFCE7',
  },
  badgeInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  badgeTextActive: {
    color: '#15803D',
  },
  badgeTextInactive: {
    color: '#DC2626',
  },
  designation: {
    fontSize: 12,
    color: '#64748B',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  bio: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  areasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  areaTag: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  areaTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  detailsRow: {
    gap: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#475569',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  btnActivate: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  btnDeactivate: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  btnTextActivate: {
    color: '#15803D',
  },
  btnTextDeactivate: {
    color: '#DC2626',
  },
  actionBtnAssign: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  actionBtnAssignText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  actionBtnEdit: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  actionBtnEditText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  actionBtnDelete: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  actionBtnDeleteText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  deleteModalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  deleteModalBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  deleteModalContent: {
    padding: 24,
    alignItems: 'center',
  },
  deleteWarningIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteModalSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  deleteWarningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    width: '100%',
  },
  deleteWarningBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    width: '100%',
  },
  deleteCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  deleteCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  deleteConfirmBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: '#DC2626',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  deleteConfirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: 24,
    gap: 16,
    ...Shadows.elevated,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalSubTitle: {
    fontSize: 12,
    color: '#64748B',
  },
  modalBody: {
    maxHeight: 480,
  },
  inputGroup: {
    gap: 4,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.textPrimary,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: BorderRadius.md,
    padding: 12,
    fontSize: 13,
    color: Colors.textPrimary,
    backgroundColor: '#FFFFFF',
    minHeight: 70,
  },
  inputErr: {
    borderColor: '#EF4444',
  },
  errText: {
    fontSize: 11,
    color: '#EF4444',
  },
  statusSelectRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusPillBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  statusPillBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  statusPillBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  statusPillBtnTextActive: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  cancelModalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  cancelModalText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  saveModalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 6,
    backgroundColor: '#0284C7',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  saveModalText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  assignInstruction: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  assignList: {
    gap: 10,
  },
  assignItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  assignPropTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  assignPropMeta: {
    fontSize: 11,
    color: '#64748B',
  },
  assignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  assignedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  assignActionBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  assignActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
