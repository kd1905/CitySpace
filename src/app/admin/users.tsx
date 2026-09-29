import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { useAuth } from '@/features/auth/AuthContext';
import { agentService } from '@/services/agentService';
import { enquiryService } from '@/services/enquiryService';
import { apiClient } from '@/services/apiClient';

interface ClientUserRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'buyer' | 'tenant' | 'owner' | 'agent' | 'admin';
  avatar?: string;
  joined: string;
  status: 'active' | 'inactive';
  inquiries?: string[];
  notes?: string;
}

export default function AdminUsersScreen() {
  const { user, switchRole } = useAuth();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'clients' | 'agents' | 'admins'>('all');
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<ClientUserRecord | null>(null);

  useEffect(() => {
    Promise.all([
      apiClient.get<any[]>('/users'),
      agentService.refreshFromBackend(),
      enquiryService.refreshFromBackend(),
    ]).then(([uRes]) => {
      if (uRes.success && Array.isArray(uRes.data)) {
        setDbUsers(uRes.data);
      }
    });
  }, []);

  const dynamicUsers: ClientUserRecord[] = useMemo(() => {
    const list: ClientUserRecord[] = [];

    // Current session user
    if (user) {
      list.push({
        id: user.id || 'curr-admin',
        name: user.fullName || 'Super Administrator',
        email: user.email || 'admin@cityspace.in',
        phone: user.phone || '+91 98000 00000',
        role: (user.role as any) || 'admin',
        avatar: user.avatar || '',
        joined: user.memberSince ? `Member since ${user.memberSince}` : 'Administrator',
        status: 'active',
        notes: 'Primary system administrator account',
      });
    }

    // Backend registered users
    dbUsers.forEach((u) => {
      if (!list.some((existing) => existing.email.toLowerCase() === (u.email || '').toLowerCase())) {
        list.push({
          id: u.id,
          name: u.full_name || u.name || 'Cityspace Client',
          email: u.email,
          phone: u.phone || '',
          role: u.role || 'buyer',
          avatar: u.avatar || '',
          joined: u.created_at ? new Date(u.created_at).toLocaleDateString([], { dateStyle: 'medium' }) : 'Registered User',
          status: 'active',
          notes: u.notes || '',
        });
      }
    });

    // Agents
    const agents = agentService.getAll();
    agents.forEach((ag) => {
      if (!list.some((u) => u.email.toLowerCase() === (ag.email || '').toLowerCase())) {
        list.push({
          id: ag.id,
          name: ag.name,
          email: ag.email,
          phone: ag.phone,
          role: 'agent',
          avatar: ag.avatar || '',
          joined: 'Cityspace Advisory Group',
          status: ag.status === 'inactive' ? 'inactive' : 'active',
          notes: `Certified Agent. Rating: ${ag.rating || 5.0}. Properties: ${ag.propertiesHandled || 0}`,
        });
      }
    });

    // Enquiries visitors as Client Leads
    const enquiries = enquiryService.getAll();
    enquiries.forEach((enq) => {
      const email = enq.email || `${enq.phone}@client.cityspace.in`;
      const existing = list.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        if (!existing.inquiries) existing.inquiries = [];
        if (enq.propertyTitle && !existing.inquiries.includes(enq.propertyTitle)) {
          existing.inquiries.push(enq.propertyTitle);
        }
      } else {
        list.push({
          id: enq.id,
          name: enq.visitorName,
          email: enq.email || '—',
          phone: enq.phone,
          role: 'buyer',
          joined: 'Lead / Inquiry Client',
          status: 'active',
          inquiries: enq.propertyTitle ? [enq.propertyTitle] : [],
          notes: enq.notes || enq.message || '',
        });
      }
    });

    return list;
  }, [user, dbUsers]);

  const filtered = useMemo(() => {
    return dynamicUsers.filter((u) => {
      if (activeTab === 'clients' && !(u.role === 'buyer' || u.role === 'tenant' || u.role === 'owner')) return false;
      if (activeTab === 'agents' && u.role !== 'agent') return false;
      if (activeTab === 'admins' && u.role !== 'admin') return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = u.name.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchPhone = (u.phone || '').includes(q);
        const matchRole = u.role.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchRole) return false;
      }
      return true;
    });
  }, [dynamicUsers, activeTab, search]);

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Users & Clients Directory</Text>
            <Text style={styles.subtitle}>
              Manage registered buyers, prospective tenants, certified agents, and administrator access privileges.
            </Text>
          </View>

          <View style={styles.searchBox}>
            <Feather name="search" size={15} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search by name, email, phone..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
          </View>
        </View>

        {/* Tab Filters */}
        <View style={styles.tabsRow}>
          {(
            [
              { key: 'all', label: 'All Users', count: dynamicUsers.length },
              { key: 'clients', label: 'Buyers & Clients', count: dynamicUsers.filter((u) => u.role === 'buyer' || u.role === 'tenant' || u.role === 'owner').length },
              { key: 'agents', label: 'Agents', count: dynamicUsers.filter((u) => u.role === 'agent').length },
              { key: 'admins', label: 'Administrators', count: dynamicUsers.filter((u) => u.role === 'admin').length },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              >
                <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>{tab.label}</Text>
                <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>{tab.count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Users Table */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 3 }]}>USER</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>PHONE</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>ROLE</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>JOINED / TYPE</Text>
            <Text style={[styles.th, { width: 90 }]}>ACTION</Text>
          </View>

          {filtered.length === 0 ? (
            <View style={{ padding: 48, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <Feather name="users" size={36} color="#CBD5E1" />
              <Text style={{ fontSize: 14, color: '#64748B', fontWeight: '600' }}>
                No users found matching your search.
              </Text>
            </View>
          ) : (
            filtered.map((u, i) => (
              <TouchableOpacity
                key={u.id}
                onPress={() => setSelectedUser(u)}
                style={[styles.tableRow, i % 2 === 0 ? styles.even : styles.odd]}
              >
                <View style={[styles.td, { flex: 3, flexDirection: 'row', alignItems: 'center' }]}>
                  {u.avatar ? (
                    <Image source={{ uri: u.avatar }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <Feather name="user" size={16} color="#64748B" />
                    </View>
                  )}
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.userName}>{u.name}</Text>
                    <Text style={styles.userEmail}>{u.email}</Text>
                  </View>
                </View>

                <View style={[styles.td, { flex: 1.5 }]}>
                  <Text style={styles.phoneText}>{u.phone || '—'}</Text>
                </View>

                <View style={[styles.td, { flex: 1.5 }]}>
                  <View
                    style={[
                      styles.roleBadge,
                      u.role === 'admin' && styles.adminBadge,
                      u.role === 'agent' && styles.agentBadge,
                      (u.role === 'buyer' || u.role === 'tenant') && styles.clientBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleBadgeText,
                        u.role === 'admin' && styles.adminBadgeText,
                        u.role === 'agent' && styles.agentBadgeText,
                        (u.role === 'buyer' || u.role === 'tenant') && styles.clientBadgeText,
                      ]}
                    >
                      {u.role.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={[styles.td, { flex: 1.5 }]}>
                  <Text style={styles.joinedText}>{u.joined}</Text>
                </View>

                <View style={[styles.td, { width: 90 }]}>
                  <TouchableOpacity
                    onPress={() => setSelectedUser(u)}
                    style={styles.viewProfileBtn}
                  >
                    <Text style={styles.viewProfileBtnText}>View</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* User Details Modal */}
      {selectedUser && (
        <Modal
          transparent={true}
          visible={true}
          animationType="fade"
          onRequestClose={() => setSelectedUser(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeading}>User Profile</Text>
                <TouchableOpacity onPress={() => setSelectedUser(null)} style={styles.closeBtn}>
                  <Feather name="x" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 16 }}>
                <View style={styles.profileTopRow}>
                  {selectedUser.avatar ? (
                    <Image source={{ uri: selectedUser.avatar }} style={styles.modalAvatar} />
                  ) : (
                    <View style={[styles.modalAvatar, styles.avatarPlaceholder]}>
                      <Feather name="user" size={28} color="#64748B" />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalUserName}>{selectedUser.name}</Text>
                    <Text style={styles.modalUserEmail}>{selectedUser.email}</Text>
                    <Text style={styles.modalUserPhone}>{selectedUser.phone || 'No phone recorded'}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>ACCOUNT TYPE / ROLE</Text>
                  <Text style={styles.detailValue}>{selectedUser.role.toUpperCase()}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>REGISTRATION / ENGAGEMENT</Text>
                  <Text style={styles.detailValue}>{selectedUser.joined}</Text>
                </View>

                {selectedUser.inquiries && selectedUser.inquiries.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>INQUIRED PROPERTIES</Text>
                    {selectedUser.inquiries.map((prop, idx) => (
                      <View key={idx} style={styles.inquiredPropItem}>
                        <Feather name="home" size={12} color="#0284C7" style={{ marginRight: 6 }} />
                        <Text style={styles.inquiredPropText}>{prop}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {selectedUser.notes ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>INTERNAL NOTES & LOGS</Text>
                    <Text style={styles.notesBox}>{selectedUser.notes}</Text>
                  </View>
                ) : null}
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity onPress={() => setSelectedUser(null)} style={styles.btnClose}>
                  <Text style={styles.btnCloseText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#64748B',
    marginTop: 4,
  },
  searchBox: {
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
  tabsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  tabBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  tabBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  tabBadgeActive: {
    backgroundColor: '#334155',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Shadows.card,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  th: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  even: {
    backgroundColor: '#FFFFFF',
  },
  odd: {
    backgroundColor: '#FAFAFA',
  },
  td: {
    justifyContent: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  userEmail: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  phoneText: {
    fontSize: 12,
    color: '#475569',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
  },
  adminBadge: { backgroundColor: '#FEF3C7' },
  agentBadge: { backgroundColor: '#EFF6FF' },
  clientBadge: { backgroundColor: '#F0FDF4' },
  roleBadgeText: { fontSize: 10, fontWeight: '800', color: '#64748B' },
  adminBadgeText: { color: '#B45309' },
  agentBadgeText: { color: '#1D4ED8' },
  clientBadgeText: { color: '#15803D' },
  joinedText: {
    fontSize: 12,
    color: '#64748B',
  },
  viewProfileBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    alignItems: 'center',
  },
  viewProfileBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
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
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    ...Shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  modalUserName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalUserEmail: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  modalUserPhone: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginTop: 1,
  },
  detailSection: {
    gap: 4,
  },
  detailLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  detailValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  inquiredPropItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
  },
  inquiredPropText: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '600',
  },
  notesBox: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  btnClose: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#0F172A',
  },
  btnCloseText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
