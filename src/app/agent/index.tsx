import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { useAuth } from '@/features/auth/AuthContext';
import { apiClient } from '@/services/apiClient';
import { formatCurrency } from '@/utils/formatters';

interface AgentDashboardData {
  agent: any;
  metrics: {
    newLeadsCount: number;
    followUpsDueCount: number;
    todayVisitsCount: number;
    activeDealsCount: number;
    closedDealsCount: number;
    assignedPropertiesCount: number;
  };
  priorityLeads: any[];
  upcomingVisits: any[];
  myProperties: any[];
  pipelineStages: { pipeline_stage: string; count: number }[];
}

export default function AgentDashboardScreen() {
  const router = useRouter();
  const { user, updateAgentPassword } = useAuth();
  const agentId = user?.id || '';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AgentDashboardData | null>(null);

  // Password change / first-time security state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [dismissedAlert, setDismissedAlert] = useState(false);

  const isDefaultPasswordActive = Boolean(
    !passwordSuccess &&
    (data?.agent?.requiresPasswordChange || data?.agent?.isDefaultPassword || user?.requiresPasswordChange || user?.isDefaultPassword)
  );

  // Automatically prompt on first load if default password is active
  useEffect(() => {
    if (isDefaultPasswordActive && !dismissedAlert) {
      setIsPasswordModalOpen(true);
    }
  }, [isDefaultPasswordActive]);

  const handleSaveNewPassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword === 'agent123') {
      setPasswordError('Please choose a new password different from the default "agent123".');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match. Please verify both fields.');
      return;
    }

    setSavingPassword(true);
    try {
      const ok = await updateAgentPassword(newPassword);
      if (ok) {
        setPasswordSuccess('Password successfully updated! Your account is now secured.');
        setTimeout(() => {
          setIsPasswordModalOpen(false);
          setDismissedAlert(true);
          setPasswordSuccess('');
        }, 2000);
      } else {
        setPasswordError('Failed to update password on server. Please try again.');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Error updating password.');
    } finally {
      setSavingPassword(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const timer = setInterval(loadDashboard, 10000); // Auto-refresh in background every 10s
    return () => clearInterval(timer);
  }, [agentId]);

  const loadDashboard = async () => {
    if (!agentId) return;
    try {
      const res = await apiClient.get<AgentDashboardData>(`/agents/${agentId}/dashboard`);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.warn('[AgentDashboard] Failed to fetch agent dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phone?: string) => {
    if (!phone) return;
    const clean = phone.replace(/\s+/g, '');
    if (Platform.OS === 'web') {
      window.open(`tel:${clean}`);
    } else {
      Linking.openURL(`tel:${clean}`);
    }
  };

  const handleWhatsApp = (phone?: string, name?: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hello ${name || 'Client'}, this is ${user?.fullName || 'your Cityspace Property Advisor'}. Following up on your property enquiry on Cityspace.`
    );
    const url = `https://wa.me/${cleanPhone}?text=${text}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  const metrics = data?.metrics || {
    newLeadsCount: 0,
    followUpsDueCount: 0,
    todayVisitsCount: 0,
    activeDealsCount: 0,
    closedDealsCount: 0,
    assignedPropertiesCount: 0,
  };

  const pipelineStagesList = [
    { key: 'new', label: 'New Leads', color: '#0284C7' },
    { key: 'contacted', label: 'Contacted', color: '#6366F1' },
    { key: 'qualified', label: 'Qualified', color: '#8B5CF6' },
    { key: 'site_visit', label: 'Site Visit', color: '#F59E0B' },
    { key: 'negotiation', label: 'Negotiation', color: '#EC4899' },
    { key: 'closed_won', label: 'Closed / Won', color: '#10B981' },
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      {/* Default Password Security Alert Banner */}
      {isDefaultPasswordActive && !dismissedAlert && (
        <View style={styles.passwordBanner}>
          <View style={styles.passwordBannerLeft}>
            <View style={styles.passwordBannerIcon}>
              <Feather name="shield" size={20} color="#D97706" />
            </View>
            <View style={styles.passwordBannerTextCol}>
              <View style={styles.passwordBannerBadgeRow}>
                <Text style={styles.passwordBannerBadgeText}>SECURITY NOTICE</Text>
              </View>
              <Text style={styles.passwordBannerTitle}>
                First-Time Login with Default Password ("agent123")
              </Text>
              <Text style={styles.passwordBannerSub}>
                Your advisor portal is currently using the initial default password. Please update to your personal password to protect your client leads and listings.
              </Text>
            </View>
          </View>

          <View style={styles.passwordBannerActions}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setIsPasswordModalOpen(true)}
              style={styles.passwordBannerBtn}
            >
              <Feather name="lock" size={13} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.passwordBannerBtnText}>Change Password Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Welcome Hero Banner */}
      <View style={styles.heroBanner}>
        <View style={styles.heroTextCol}>
          <View style={styles.badgeRow}>
            <View style={styles.verifiedBadge}>
              <Feather name="shield" size={13} color="#0284C7" style={{ marginRight: 5 }} />
              <Text style={styles.verifiedBadgeText}>Certified Property Advisor</Text>
            </View>
            <View style={styles.liveAutoBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveAutoText}>Live Real-Time Data</Text>
            </View>
          </View>
          <Text style={styles.welcomeTitle}>Welcome back, {user?.fullName || 'Advisor'}</Text>
          <Text style={styles.welcomeSubtitle}>
            Managing assigned real-estate listings, active buyer pipeline, and scheduled client site visits.
          </Text>
        </View>

        <View style={styles.heroActionsRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/agent/leads' as any)}
            style={styles.heroActionBtn}
          >
            <Feather name="trending-up" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.heroActionBtnText}>Manage My Leads</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 5 Primary Metric Cards */}
      <View style={styles.metricsGrid}>
        {/* 1. New Leads */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/agent/leads' as any)}
          style={styles.metricCard}
        >
          <View style={[styles.metricIconWrap, { backgroundColor: '#E0F2FE' }]}>
            <Feather name="user-plus" size={18} color="#0284C7" />
          </View>
          <Text style={styles.metricValue}>{metrics.newLeadsCount}</Text>
          <Text style={styles.metricLabel}>New Leads</Text>
          <Text style={styles.metricHint}>Awaiting initial contact</Text>
        </TouchableOpacity>

        {/* 2. Follow-ups Due */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/agent/follow-ups' as any)}
          style={styles.metricCard}
        >
          <View style={[styles.metricIconWrap, { backgroundColor: '#FEF3C7' }]}>
            <Feather name="clock" size={18} color="#D97706" />
          </View>
          <Text style={styles.metricValue}>{metrics.followUpsDueCount}</Text>
          <Text style={styles.metricLabel}>Follow-ups Due</Text>
          <Text style={styles.metricHint}>Client reminders scheduled</Text>
        </TouchableOpacity>

        {/* 3. Today's Site Visits */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/agent/site-visits' as any)}
          style={styles.metricCard}
        >
          <View style={[styles.metricIconWrap, { backgroundColor: '#EDE9FE' }]}>
            <Feather name="calendar" size={18} color="#7C3AED" />
          </View>
          <Text style={styles.metricValue}>{metrics.todayVisitsCount}</Text>
          <Text style={styles.metricLabel}>Today's Visits</Text>
          <Text style={styles.metricHint}>Property tours on schedule</Text>
        </TouchableOpacity>

        {/* 4. Active Deals */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/agent/leads' as any)}
          style={styles.metricCard}
        >
          <View style={[styles.metricIconWrap, { backgroundColor: '#FCE7F3' }]}>
            <Feather name="activity" size={18} color="#DB2777" />
          </View>
          <Text style={styles.metricValue}>{metrics.activeDealsCount}</Text>
          <Text style={styles.metricLabel}>Active Deals</Text>
          <Text style={styles.metricHint}>Qualified & negotiating</Text>
        </TouchableOpacity>

        {/* 5. Closed Deals */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/agent/performance' as any)}
          style={styles.metricCard}
        >
          <View style={[styles.metricIconWrap, { backgroundColor: '#DCFCE7' }]}>
            <Feather name="award" size={18} color="#059669" />
          </View>
          <Text style={styles.metricValue}>{metrics.closedDealsCount}</Text>
          <Text style={styles.metricLabel}>Closed Deals</Text>
          <Text style={styles.metricHint}>Successfully concluded</Text>
        </TouchableOpacity>
      </View>

      {/* Lead Pipeline Overview Bar */}
      <View style={styles.cardSection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Lead Conversion Pipeline</Text>
            <Text style={styles.sectionSubtitle}>
              Progress of buyer inquiries assigned to you across sales stages
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/agent/leads' as any)}
            style={styles.textLinkBtn}
          >
            <Text style={styles.textLink}>View Full Pipeline</Text>
            <Feather name="arrow-right" size={13} color="#0284C7" />
          </TouchableOpacity>
        </View>

        <View style={styles.pipelineBarGrid}>
          {pipelineStagesList.map((stage) => {
            const count =
              data?.pipelineStages?.find((s) => s.pipeline_stage === stage.key)?.count || 0;
            return (
              <View key={stage.key} style={styles.pipelineBarCol}>
                <View style={styles.pipelineBarTop}>
                  <Text style={[styles.pipelineCount, { color: stage.color }]}>{count}</Text>
                  <View style={[styles.pipelineDot, { backgroundColor: stage.color }]} />
                </View>
                <Text style={styles.pipelineStageName}>{stage.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* 2 Columns: Priority Leads (Left) & Today's Schedule (Right) */}
      <View style={styles.twoColumnRow}>
        {/* Left: Priority Leads */}
        <View style={[styles.cardSection, { flex: 1.5, minWidth: 320 }]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Priority Leads</Text>
              <Text style={styles.sectionSubtitle}>Recent inquiries needing attention</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/agent/leads' as any)}>
              <Text style={styles.textLink}>All Leads</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 24 }} />
          ) : !data?.priorityLeads || data.priorityLeads.length === 0 ? (
            <View style={styles.emptyCard}>
              <Feather name="inbox" size={32} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Assigned Leads Yet</Text>
              <Text style={styles.emptySub}>
                When administrators assign buyer enquiries or site visitors to you, they will appear here.
              </Text>
            </View>
          ) : (
            <View style={styles.leadsList}>
              {data.priorityLeads.map((lead) => (
                <View key={lead.id} style={styles.leadCardItem}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.leadName}>{lead.visitor_name}</Text>
                      <View style={styles.stageTag}>
                        <Text style={styles.stageTagText}>
                          {(lead.pipeline_stage || 'NEW').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.leadMeta}>
                      {lead.phone} • {lead.email || 'No email provided'}
                    </Text>
                    {lead.message ? (
                      <Text style={styles.leadMsg} numberOfLines={1}>
                        "{lead.message}"
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.leadActionsCol}>
                    <TouchableOpacity
                      onPress={() => handleCall(lead.phone)}
                      style={styles.quickCallBtn}
                      accessibilityLabel="Call Client"
                    >
                      <Feather name="phone" size={13} color="#059669" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleWhatsApp(lead.phone, lead.visitor_name)}
                      style={styles.quickWaBtn}
                      accessibilityLabel="WhatsApp"
                    >
                      <Feather name="message-circle" size={13} color="#0284C7" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Right: Today's Schedule & Site Visits */}
        <View style={[styles.cardSection, { flex: 1, minWidth: 280 }]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Today's Schedule</Text>
              <Text style={styles.sectionSubtitle}>Upcoming tours & meetings</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/agent/site-visits' as any)}>
              <Text style={styles.textLink}>All Visits</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 24 }} />
          ) : !data?.upcomingVisits || data.upcomingVisits.length === 0 ? (
            <View style={styles.emptyCard}>
              <Feather name="calendar" size={32} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Tours Scheduled</Text>
              <Text style={styles.emptySub}>
                You have no property tours or client meetings scheduled for today.
              </Text>
            </View>
          ) : (
            <View style={styles.scheduleList}>
              {data.upcomingVisits.map((visit) => (
                <View key={visit.id} style={styles.scheduleItem}>
                  <View style={styles.scheduleTimeBox}>
                    <Feather name="clock" size={12} color="#0284C7" />
                    <Text style={styles.scheduleTimeText}>{visit.visit_time || 'TBD'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.scheduleClientName}>{visit.client_name}</Text>
                    <Text style={styles.schedulePropTitle} numberOfLines={1}>
                      {visit.property_title || 'Listing Tour'}
                    </Text>
                    <Text style={styles.scheduleDate}>{visit.visit_date}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleCall(visit.client_phone)}
                    style={styles.quickCallSmall}
                  >
                    <Feather name="phone" size={12} color="#059669" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* My Properties Snapshot */}
      <View style={styles.cardSection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>My Assigned Portfolio</Text>
            <Text style={styles.sectionSubtitle}>
              Exclusive verified inventory assigned to your advisory handling
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/agent/properties' as any)}
            style={styles.textLinkBtn}
          >
            <Text style={styles.textLink}>View All ({metrics.assignedPropertiesCount})</Text>
            <Feather name="arrow-right" size={13} color="#0284C7" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 24 }} />
        ) : !data?.myProperties || data.myProperties.length === 0 ? (
          <View style={styles.emptyCard}>
            <Feather name="home" size={32} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Properties Assigned</Text>
            <Text style={styles.emptySub}>
              Administrators have not assigned any active properties to your account yet.
            </Text>
          </View>
        ) : (
          <View style={styles.propertiesGrid}>
            {data.myProperties.map((prop) => (
              <View key={prop.id} style={styles.propCardItem}>
                <View style={styles.propCardBody}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={styles.propTypePill}>
                      <Text style={styles.propTypePillText}>
                        {(prop.type || 'BUY').toUpperCase()} • {(prop.category || 'RESIDENTIAL').toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.propPriceText}>₹{Number(prop.price).toLocaleString()}</Text>
                  </View>

                  <Text style={styles.propTitle} numberOfLines={1}>
                    {prop.title}
                  </Text>
                  <Text style={styles.propLoc} numberOfLines={1}>
                    <Feather name="map-pin" size={11} color="#64748B" />{' '}
                    {prop.location_locality || prop.location_city || 'India'}
                  </Text>

                  <View style={styles.propSpecsRow}>
                    <Text style={styles.propSpecItem}>{prop.specs_bedrooms || 0} BHK</Text>
                    <Text style={styles.propSpecDot}>•</Text>
                    <Text style={styles.propSpecItem}>{prop.specs_bathrooms || 0} Baths</Text>
                    <Text style={styles.propSpecDot}>•</Text>
                    <Text style={styles.propSpecItem}>{prop.specs_area_sqft || 0} sq.ft</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* First-Time Password Change Modal */}
      <Modal
        visible={isPasswordModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPasswordModalOpen(false)}
      >
        <View style={styles.pwdModalOverlay}>
          <View style={styles.pwdModalCard}>
            <View style={styles.pwdModalHeader}>
              <View style={styles.pwdModalHeaderLeft}>
                <View style={styles.pwdSecurityPill}>
                  <Feather name="lock" size={12} color="#0284C7" style={{ marginRight: 5 }} />
                  <Text style={styles.pwdSecurityPillText}>Initial Security Setup</Text>
                </View>
                <Text style={styles.pwdModalTitle}>Update Your Default Password</Text>
                <Text style={styles.pwdModalSubtitle}>
                  You are currently logged in with the initial default password <Text style={{ fontWeight: '700', color: '#0F172A' }}>agent123</Text>. Please set your private password to protect your advisor account.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsPasswordModalOpen(false)} style={styles.pwdCloseBtn}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {passwordError ? (
              <View style={styles.pwdErrorBox}>
                <Feather name="alert-circle" size={14} color="#DC2626" style={{ marginRight: 6 }} />
                <Text style={styles.pwdErrorText}>{passwordError}</Text>
              </View>
            ) : null}

            {passwordSuccess ? (
              <View style={styles.pwdSuccessBox}>
                <Feather name="check-circle" size={14} color="#059669" style={{ marginRight: 6 }} />
                <Text style={styles.pwdSuccessText}>{passwordSuccess}</Text>
              </View>
            ) : null}

            <View style={styles.pwdFormBody}>
              <View style={styles.pwdInputGroup}>
                <Text style={styles.pwdInputLabel}>CURRENT DEFAULT PASSWORD</Text>
                <View style={styles.pwdDisabledBox}>
                  <Feather name="key" size={14} color="#94A3B8" style={{ marginRight: 8 }} />
                  <TextInput
                    editable={false}
                    value="agent123"
                    style={styles.pwdDisabledInput}
                  />
                  <View style={styles.pwdDefaultBadge}>
                    <Text style={styles.pwdDefaultBadgeText}>Default</Text>
                  </View>
                </View>
              </View>

              <View style={styles.pwdInputGroup}>
                <Text style={styles.pwdInputLabel}>NEW PASSWORD (MINIMUM 6 CHARACTERS) *</Text>
                <View style={styles.pwdInputBox}>
                  <Feather name="lock" size={14} color="#64748B" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.pwdTextInput}
                    placeholder="Enter new private password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                    <Feather name={showPassword ? 'eye-off' : 'eye'} size={15} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.pwdInputGroup}>
                <Text style={styles.pwdInputLabel}>CONFIRM NEW PASSWORD *</Text>
                <View style={styles.pwdInputBox}>
                  <Feather name="shield" size={14} color="#64748B" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.pwdTextInput}
                    placeholder="Re-enter your new password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </View>

            <View style={styles.pwdModalFooter}>
              <TouchableOpacity
                onPress={() => {
                  setIsPasswordModalOpen(false);
                  setDismissedAlert(true);
                }}
                style={styles.pwdDismissBtn}
              >
                <Text style={styles.pwdDismissBtnText}>Remind Me Later</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveNewPassword}
                style={styles.pwdSubmitBtn}
                disabled={savingPassword}
              >
                <Feather name="check" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.pwdSubmitBtnText}>
                  {savingPassword ? 'Updating...' : 'Update & Secure Account'}
                </Text>
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
    padding: 24,
    paddingBottom: 60,
    gap: 24,
  },
  heroBanner: {
    backgroundColor: '#0F172A',
    borderRadius: BorderRadius.xl,
    padding: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 20,
    ...Shadows.md,
  },
  heroTextCol: {
    flex: 1,
    minWidth: 280,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0369A1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  liveAutoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  liveAutoText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A7F3D0',
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
    maxWidth: 580,
  },
  heroActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  heroActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  metricIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  metricHint: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  cardSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
    flexWrap: 'wrap',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  textLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  textLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  pipelineBarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pipelineBarCol: {
    flex: 1,
    minWidth: 110,
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pipelineBarTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  pipelineCount: {
    fontSize: 20,
    fontWeight: '900',
  },
  pipelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pipelineStageName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  twoColumnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 18,
  },
  leadsList: {
    gap: 10,
  },
  leadCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  leadName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  stageTag: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stageTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369A1',
  },
  leadMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  leadMsg: {
    fontSize: 11,
    color: '#475569',
    fontStyle: 'italic',
  },
  leadActionsCol: {
    flexDirection: 'row',
    gap: 6,
  },
  quickCallBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  quickWaBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  scheduleList: {
    gap: 10,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  scheduleTimeBox: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    gap: 2,
  },
  scheduleTimeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369A1',
  },
  scheduleClientName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  schedulePropTitle: {
    fontSize: 11,
    color: '#64748B',
  },
  scheduleDate: {
    fontSize: 10,
    color: '#94A3B8',
  },
  quickCallSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  propertiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  propCardItem: {
    flex: 1,
    minWidth: 260,
    maxWidth: 360,
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  propCardBody: {
    gap: 6,
  },
  propTypePill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  propTypePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
  },
  propPriceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  propTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  propLoc: {
    fontSize: 12,
    color: '#64748B',
  },
  propSpecsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  propSpecItem: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  propSpecDot: {
    fontSize: 10,
    color: '#CBD5E1',
  },

  // Password Security Banner Styles
  passwordBanner: {
    backgroundColor: '#FFFBEB',
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
    ...Shadows.sm,
  },
  passwordBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    minWidth: 280,
  },
  passwordBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  passwordBannerTextCol: {
    flex: 1,
    gap: 3,
  },
  passwordBannerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordBannerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    letterSpacing: 0.5,
  },
  passwordBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#92400E',
  },
  passwordBannerSub: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 17,
  },
  passwordBannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D97706',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  passwordBannerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Password Modal Styles
  pwdModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pwdModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    width: '100%',
    maxWidth: 520,
    padding: 26,
    gap: 16,
    ...Shadows.lg,
  },
  pwdModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  pwdModalHeaderLeft: {
    flex: 1,
    gap: 4,
  },
  pwdSecurityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 4,
  },
  pwdSecurityPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  pwdModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  pwdModalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    marginTop: 2,
  },
  pwdCloseBtn: {
    padding: 4,
  },
  pwdErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 10,
    borderRadius: BorderRadius.md,
  },
  pwdErrorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    flex: 1,
  },
  pwdSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 10,
    borderRadius: BorderRadius.md,
  },
  pwdSuccessText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    flex: 1,
  },
  pwdFormBody: {
    gap: 14,
    marginVertical: 4,
  },
  pwdInputGroup: {
    gap: 5,
  },
  pwdInputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  pwdDisabledBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    height: 42,
  },
  pwdDisabledInput: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  pwdDefaultBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pwdDefaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  pwdInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    height: 42,
  },
  pwdTextInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    outlineStyle: 'none' as any,
  },
  pwdModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexWrap: 'wrap',
  },
  pwdDismissBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
  },
  pwdDismissBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  pwdSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  pwdSubmitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
