import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { propertyService } from '@/services/propertyService';
import { analyticsService, DashboardMetrics } from '@/services/analyticsService';
import { Property, PropertyStatus } from '@/types/property';
import { StatCard } from '@/components/admin/StatCard';
import { PropertyTable } from '@/components/admin/PropertyTable';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentProperties, setRecentProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, props] = await Promise.all([
        analyticsService.getDashboardMetrics(),
        propertyService.refreshFromBackend(),
      ]);
      if (m) setMetrics(m);
      setRecentProperties(props.slice(0, 6));
    } catch (err) {
      console.warn('[Dashboard] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = [
    {
      label: 'Total Properties',
      value: metrics?.properties.total ?? 0,
      subtext: 'Registered listings',
      icon: 'layers' as const,
      accentColor: '#0F172A',
      path: '/admin/properties',
    },
    {
      label: 'Published',
      value: metrics?.properties.published ?? 0,
      subtext: 'Live & searchable',
      icon: 'check-circle' as const,
      accentColor: '#059669',
      path: '/admin/properties?status=published',
    },
    {
      label: 'Drafts',
      value: metrics?.properties.drafts ?? 0,
      subtext: 'Work in progress',
      icon: 'file-text' as const,
      accentColor: '#D97706',
      path: '/admin/properties?status=draft',
    },
    {
      label: 'Pending Approval',
      value: metrics?.properties.pendingApproval ?? 0,
      subtext: 'Needs verification review',
      icon: 'clock' as const,
      accentColor: '#DC2626',
      path: '/admin/verification',
    },
    {
      label: 'Featured',
      value: metrics?.properties.featured ?? 0,
      subtext: 'Promoted on Home',
      icon: 'star' as const,
      accentColor: '#B45309',
      path: '/admin/properties?status=featured',
    },
    {
      label: 'Verified',
      value: metrics?.properties.verified ?? 0,
      subtext: 'Physical & legal checked',
      icon: 'shield' as const,
      accentColor: '#0284C7',
      path: '/admin/verification',
    },
    {
      label: 'Total Enquiries',
      value: metrics?.crm.totalEnquiries ?? 0,
      subtext: 'Client enquiries received',
      icon: 'message-square' as const,
      accentColor: '#7C3AED',
      path: '/admin/enquiries',
    },
    {
      label: 'New Leads',
      value: metrics?.crm.newLeads ?? 0,
      subtext: 'Awaiting first contact',
      icon: 'user-plus' as const,
      accentColor: '#2563EB',
      path: '/admin/enquiries?stage=new',
    },
    {
      label: 'Upcoming Site Visits',
      value: metrics?.siteVisits.upcoming ?? 0,
      subtext: 'Scheduled appointments',
      icon: 'calendar' as const,
      accentColor: '#0D9488',
      path: '/admin/site-visits',
    },
    {
      label: 'Property Views',
      value: metrics?.overview.totalViews ?? 0,
      subtext: 'Visitor impressions',
      icon: 'eye' as const,
      accentColor: '#4F46E5',
      path: '/admin/analytics',
    },
  ];

  const quickActions = [
    { label: 'Add Property', icon: 'plus-circle' as const, color: '#0F172A', bg: '#F1F5F9', path: '/admin/add-property' },
    { label: 'Verify Properties', icon: 'shield' as const, color: '#0284C7', bg: '#E0F2FE', path: '/admin/verification' },
    { label: 'CRM Pipeline', icon: 'trending-up' as const, color: '#7C3AED', bg: '#EDE9FE', path: '/admin/enquiries' },
    { label: 'Schedule Visit', icon: 'calendar' as const, color: '#0D9488', bg: '#CCFBF1', path: '/admin/site-visits' },
    { label: 'Manage Agents', icon: 'user-check' as const, color: '#D97706', bg: '#FEF3C7', path: '/admin/agents' },
    { label: 'Deep Analytics', icon: 'bar-chart-2' as const, color: '#2563EB', bg: '#DBEAFE', path: '/admin/analytics' },
  ];

  const handleView = (property: Property) => {
    router.push(`/properties/${property.id}` as any);
  };

  const handleEdit = (property: Property) => {
    router.push(`/admin/edit-property?id=${property.id}` as any);
  };

  const handleDelete = (property: Property) => {
    propertyService.deleteProperty(property.id);
    loadData();
  };

  const handleTogglePublish = (property: Property) => {
    const nextStatus: PropertyStatus =
      property.status === 'published' ? 'unpublished' : 'published';
    propertyService.setPublishStatus(property.id, nextStatus);
    loadData();
  };

  const handleToggleVerified = (property: Property) => {
    propertyService.toggleVerified(property.id);
    loadData();
  };

  const handleToggleFeatured = (property: Property) => {
    propertyService.toggleFeatured(property.id);
    loadData();
  };

  const handleMarkSold = (property: Property) => {
    if (property.status === 'sold') {
      propertyService.setPublishStatus(property.id, 'published');
    } else {
      propertyService.markSold(property.id);
    }
    loadData();
  };

  const handleMarkRented = (property: Property) => {
    if (property.status === 'rented') {
      propertyService.setPublishStatus(property.id, 'published');
    } else {
      propertyService.markRented(property.id);
    }
    loadData();
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      {/* Dashboard Top Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.greetingTitle}>Cityspace Management Console</Text>
          <Text style={styles.greetingSubtitle}>
            Live operational intelligence, property lifecycle control, and real-time CRM pipeline.
          </Text>
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => loadData()}
            style={styles.refreshBtn}
          >
            <Feather name="refresh-cw" size={14} color="#475569" style={{ marginRight: 6 }} />
            <Text style={styles.refreshBtnText}>Refresh</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/admin/add-property')}
            style={styles.addPropertyBtn}
          >
            <Feather name="plus" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.addPropertyBtnText}>Add Property</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions Bar */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionHeadingSmall}>QUICK ACTIONS</Text>
        <View style={styles.quickActionsRow}>
          {quickActions.map((qa) => (
            <TouchableOpacity
              key={qa.label}
              activeOpacity={0.8}
              onPress={() => router.push(qa.path as any)}
              style={styles.quickActionCard}
            >
              <View style={[styles.quickActionIconBox, { backgroundColor: qa.bg }]}>
                <Feather name={qa.icon} size={16} color={qa.color} />
              </View>
              <Text style={styles.quickActionLabel}>{qa.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Real-time Statistics Cards Grid */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionHeadingSmall}>KEY PERFORMANCE METRICS</Text>
        <View style={styles.statsGrid}>
          {stats.map((s) => (
            <StatCard
              key={s.label}
              label={s.label}
              value={s.value}
              subtext={s.subtext}
              icon={s.icon}
              accentColor={s.accentColor}
              trend={(s as any).trend}
              onPress={() => router.push(s.path as any)}
            />
          ))}
        </View>
      </View>

      {/* CRM Funnel & Activity Grid */}
      <View style={styles.twoColumnSection}>
        {/* CRM Pipeline Funnel Preview */}
        <View style={styles.funnelCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardHeaderTitle}>CRM Leads Pipeline</Text>
              <Text style={styles.cardHeaderSub}>Active client lead stages</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/admin/enquiries' as any)}>
              <Text style={styles.linkText}>View CRM →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pipelineBars}>
            {(metrics?.crm.pipeline || [
              { stage: 'New Leads', count: 0, color: '#3B82F6' },
              { stage: 'Contacted', count: 0, color: '#6366F1' },
              { stage: 'Interested', count: 0, color: '#8B5CF6' },
              { stage: 'Site Visit', count: 0, color: '#F59E0B' },
              { stage: 'Negotiation', count: 0, color: '#EC4899' },
              { stage: 'Closed Won', count: 0, color: '#10B981' },
            ]).map((item) => (
              <View key={item.stage} style={styles.pipelineRow}>
                <View style={styles.pipelineLabelCol}>
                  <View style={[styles.pipelineDot, { backgroundColor: item.color }]} />
                  <Text style={styles.pipelineStageName}>{item.stage}</Text>
                </View>
                <View style={styles.pipelineProgressTrack}>
                  <View
                    style={[
                      styles.pipelineProgressBar,
                      {
                        backgroundColor: item.color,
                        width: `${Math.min(100, Math.max(8, item.count * 15))}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.pipelineCountText}>{item.count}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Live Recent Activity */}
        <View style={styles.activityCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardHeaderTitle}>Recent System Activity</Text>
              <Text style={styles.cardHeaderSub}>Audit trail & operations log</Text>
            </View>
          </View>

          <View style={styles.activityList}>
            {!metrics?.recentActivity || metrics.recentActivity.length === 0 ? (
              <View style={styles.emptyActivityBox}>
                <Feather name="clock" size={20} color="#94A3B8" />
                <Text style={styles.emptyActivityText}>No recent activity logged yet.</Text>
                <Text style={styles.emptyActivitySub}>Actions like adding properties or updating leads will show up here.</Text>
              </View>
            ) : (
              metrics.recentActivity.map((act) => (
                <View key={act.id} style={styles.activityItem}>
                  <View style={styles.activityIconCircle}>
                    <Feather name="activity" size={13} color="#0284C7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityItemText}>
                      <Text style={{ fontWeight: '700', color: '#0F172A' }}>{act.userName || 'Admin'}</Text>{' '}
                      {act.action}{' '}
                      {act.entityName ? <Text style={{ fontWeight: '600' }}>{act.entityName}</Text> : ''}
                    </Text>
                    <Text style={styles.activityItemTime}>
                      {new Date(act.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </View>

      {/* Recent Properties Section */}
      <View style={styles.recentSection}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionHeading}>Recent Properties</Text>
            <Text style={styles.sectionSub}>
              Latest added and modified properties in inventory
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/admin/properties')}
            style={styles.viewAllBtn}
          >
            <Text style={styles.viewAllBtnText}>View All Properties</Text>
            <Feather name="arrow-right" size={14} color={Colors.primary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <PropertyTable
            properties={recentProperties}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onTogglePublish={handleTogglePublish}
            onToggleVerified={handleToggleVerified}
            onToggleFeatured={handleToggleFeatured}
            onMarkSold={handleMarkSold}
            onMarkRented={handleMarkRented}
            emptyMessage="No properties found in database inventory."
          />
        )}
      </View>
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
    gap: 24,
    width: '100%',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  greetingSubtitle: {
    fontSize: 13.5,
    color: '#64748B',
    marginTop: 4,
    maxWidth: 620,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  refreshBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  addPropertyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  addPropertyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  quickActionsSection: {
    gap: 10,
  },
  sectionHeadingSmall: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.2,
  },
  quickActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  quickActionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  statsSection: {
    gap: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  twoColumnSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  funnelCard: {
    flex: 1,
    minWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.card,
  },
  activityCard: {
    flex: 1,
    minWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.card,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardHeaderSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  linkText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0284C7',
  },
  pipelineBars: {
    gap: 12,
  },
  pipelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pipelineLabelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
    gap: 6,
  },
  pipelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pipelineStageName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  pipelineProgressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  pipelineProgressBar: {
    height: '100%',
    borderRadius: 4,
  },
  pipelineCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    width: 28,
    textAlign: 'right',
  },
  activityList: {
    gap: 12,
  },
  emptyActivityBox: {
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyActivityText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  emptyActivitySub: {
    fontSize: 11.5,
    color: '#94A3B8',
    textAlign: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  activityIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  activityItemText: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
  },
  activityItemTime: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  recentSection: {
    gap: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 12,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#F1F5F9',
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  viewAllBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
});
