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
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { analyticsService, DashboardMetrics } from '@/services/analyticsService';
import { agentService } from '@/services/agentService';
import { Agent } from '@/types/agent';
import { formatCurrency } from '@/utils/formatters';

export default function AdminAnalyticsScreen() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, aList] = await Promise.all([
        analyticsService.getDashboardMetrics(),
        agentService.refreshFromBackend(),
      ]);
      if (m) setMetrics(m);
      setAgents(aList);
    } catch (err) {
      console.warn('[Analytics] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const conversionRate = metrics?.crm.totalEnquiries
    ? Math.round((metrics.crm.closedWon / metrics.crm.totalEnquiries) * 100)
    : 0;

  return (
    <View style={styles.screenContainer}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.pageTitle}>Analytics & Operational Intelligence</Text>
            <Text style={styles.pageSubtitle}>
              Real-time insights across inventory, client demand, city breakdown, and sales funnel performance.
            </Text>
          </View>

          <TouchableOpacity onPress={loadData} style={styles.btnRefresh}>
            <Feather name="refresh-cw" size={13} color="#475569" style={{ marginRight: 6 }} />
            <Text style={styles.btnRefreshText}>Refresh Data</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ padding: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={{ marginTop: 12, color: '#64748B', fontSize: 13 }}>Loading database metrics...</Text>
          </View>
        ) : (
          <>
            {/* KPI Metric Cards */}
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <View style={styles.kpiTop}>
                  <Text style={styles.kpiLabel}>Total Properties</Text>
                  <View style={[styles.kpiIcon, { backgroundColor: '#F1F5F9' }]}>
                    <Feather name="home" size={15} color="#0F172A" />
                  </View>
                </View>
                <Text style={styles.kpiValue}>{metrics?.properties.total || 0}</Text>
                <Text style={styles.kpiSub}>{metrics?.properties.published || 0} published live</Text>
              </View>

              <View style={styles.kpiCard}>
                <View style={styles.kpiTop}>
                  <Text style={styles.kpiLabel}>Total Property Views</Text>
                  <View style={[styles.kpiIcon, { backgroundColor: '#EFF6FF' }]}>
                    <Feather name="eye" size={15} color="#2563EB" />
                  </View>
                </View>
                <Text style={styles.kpiValue}>{metrics?.overview.totalViews || 0}</Text>
                <Text style={styles.kpiSub}>Catalog impressions</Text>
              </View>

              <View style={styles.kpiCard}>
                <View style={styles.kpiTop}>
                  <Text style={styles.kpiLabel}>Total Leads</Text>
                  <View style={[styles.kpiIcon, { backgroundColor: '#EDE9FE' }]}>
                    <Feather name="trending-up" size={15} color="#7C3AED" />
                  </View>
                </View>
                <Text style={styles.kpiValue}>{metrics?.crm.totalEnquiries || 0}</Text>
                <Text style={styles.kpiSub}>{metrics?.crm.newLeads || 0} new incoming</Text>
              </View>

              <View style={styles.kpiCard}>
                <View style={styles.kpiTop}>
                  <Text style={styles.kpiLabel}>Lead Conversion</Text>
                  <View style={[styles.kpiIcon, { backgroundColor: '#ECFDF5' }]}>
                    <Feather name="check-circle" size={15} color="#059669" />
                  </View>
                </View>
                <Text style={styles.kpiValue}>{conversionRate}%</Text>
                <Text style={styles.kpiSub}>{metrics?.crm.closedWon || 0} deals closed</Text>
              </View>
            </View>

            {/* City Distribution & Property Types */}
            <View style={styles.twoColSection}>
              {/* City Breakdown */}
              <View style={styles.chartCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>City-Wise Inventory</Text>
                  <Text style={styles.cardSub}>Listings distribution across active markets</Text>
                </View>

                <View style={styles.chartBody}>
                  {!metrics?.cityBreakdown || metrics.cityBreakdown.length === 0 ? (
                    <View style={styles.emptyChart}>
                      <Text style={styles.emptyChartText}>No city location data available</Text>
                    </View>
                  ) : (
                    metrics.cityBreakdown.map((item) => {
                      const maxCount = Math.max(...metrics.cityBreakdown.map((c) => c.count), 1);
                      const percent = Math.round((item.count / maxCount) * 100);
                      return (
                        <View key={item.city} style={styles.barRow}>
                          <Text style={styles.barLabel}>{item.city}</Text>
                          <View style={styles.barTrack}>
                            <View style={[styles.barFill, { width: `${percent}%`, backgroundColor: '#0284C7' }]} />
                          </View>
                          <Text style={styles.barCount}>{item.count}</Text>
                        </View>
                      );
                    })
                  )}
                </View>
              </View>

              {/* Property Type Breakdown */}
              <View style={styles.chartCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Property Category Mix</Text>
                  <Text style={styles.cardSub}>Inventory volume by property category</Text>
                </View>

                <View style={styles.chartBody}>
                  {!metrics?.typeDistribution || metrics.typeDistribution.length === 0 ? (
                    <View style={styles.emptyChart}>
                      <Text style={styles.emptyChartText}>No category distribution available</Text>
                    </View>
                  ) : (
                    metrics.typeDistribution.map((item) => {
                      const maxCount = Math.max(...metrics.typeDistribution.map((c) => c.count), 1);
                      const percent = Math.round((item.count / maxCount) * 100);
                      return (
                        <View key={item.category} style={styles.barRow}>
                          <Text style={styles.barLabel}>{item.category.toUpperCase()}</Text>
                          <View style={styles.barTrack}>
                            <View style={[styles.barFill, { width: `${percent}%`, backgroundColor: '#8B5CF6' }]} />
                          </View>
                          <Text style={styles.barCount}>{item.count}</Text>
                        </View>
                      );
                    })
                  )}
                </View>
              </View>
            </View>

            {/* CRM Sales Funnel & Agent Performance */}
            <View style={styles.twoColSection}>
              {/* Pipeline Funnel */}
              <View style={styles.chartCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>CRM Pipeline Funnel</Text>
                  <Text style={styles.cardSub}>Conversion stages from prospect to closing</Text>
                </View>

                <View style={styles.funnelList}>
                  {(metrics?.crm.pipeline || []).map((step, idx) => (
                    <View key={step.stage} style={styles.funnelStep}>
                      <View style={styles.funnelStepLeft}>
                        <View style={[styles.funnelStepNum, { backgroundColor: step.color }]}>
                          <Text style={styles.funnelStepNumText}>{idx + 1}</Text>
                        </View>
                        <Text style={styles.funnelStepName}>{step.stage}</Text>
                      </View>
                      <View style={styles.funnelStepRight}>
                        <Text style={styles.funnelStepCount}>{step.count} leads</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Agent Performance Table */}
              <View style={styles.chartCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Advisor Team Performance</Text>
                  <Text style={styles.cardSub}>Client assignments and advisory rating</Text>
                </View>

                <View style={styles.agentList}>
                  {agents.length === 0 ? (
                    <View style={styles.emptyChart}>
                      <Text style={styles.emptyChartText}>No active agents registered</Text>
                    </View>
                  ) : (
                    agents.map((ag) => (
                      <View key={ag.id} style={styles.agentRow}>
                        <View style={styles.agentAvatarBox}>
                          <Feather name="user" size={14} color="#64748B" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.agentName}>{ag.name}</Text>
                          <Text style={styles.agentRole}>{ag.designation || 'Property Advisor'}</Text>
                        </View>
                        <View style={styles.agentRatingBox}>
                          <Feather name="star" size={11} color="#B45309" style={{ marginRight: 3 }} />
                          <Text style={styles.agentRatingText}>{Number(ag.rating || 5).toFixed(1)}</Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
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
    gap: 24,
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
  btnRefresh: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  btnRefreshText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.subtle,
    gap: 4,
  },
  kpiTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  kpiIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
  },
  kpiSub: {
    fontSize: 11.5,
    color: '#94A3B8',
  },
  twoColSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  chartCard: {
    flex: 1,
    minWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.card,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  chartBody: {
    gap: 12,
  },
  emptyChart: {
    padding: 32,
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: 12.5,
    color: '#94A3B8',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  barLabel: {
    width: 100,
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barCount: {
    width: 30,
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right',
  },
  funnelList: {
    gap: 10,
  },
  funnelStep: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  funnelStepLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  funnelStepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  funnelStepNumText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  funnelStepName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  funnelStepRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  funnelStepCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  agentList: {
    gap: 10,
  },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 10,
  },
  agentAvatarBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  agentRole: {
    fontSize: 11,
    color: '#64748B',
  },
  agentRatingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  agentRatingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
});
