import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { useAuth } from '@/features/auth/AuthContext';
import { apiClient } from '@/services/apiClient';
import { propertyService } from '@/services/propertyService';
import { PropertyEnquiry } from '@/types/enquiry';
import { formatCurrency } from '@/utils/formatters';

export default function AgentPerformanceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const agentId = user?.id || '';

  const [leads, setLeads] = useState<PropertyEnquiry[]>([]);
  const [siteVisitsCount, setSiteVisitsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!agentId) return;
    try {
      const [leadsRes, visitsRes] = await Promise.all([
        apiClient.get<PropertyEnquiry[]>(`/enquiries?agentId=${agentId}`),
        apiClient.get<any[]>(`/site-visits?agentId=${agentId}`),
      ]);
      if (leadsRes.success && Array.isArray(leadsRes.data)) {
        setLeads(leadsRes.data);
      }
      if (visitsRes.success && Array.isArray(visitsRes.data)) {
        setSiteVisitsCount(visitsRes.data.length);
      }
    } catch (err) {
      console.warn('[AgentPerformance] Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculations
  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const closed = leads.filter((l) => l.pipelineStage === 'closed').length;
    const activeDeals = leads.filter((l) =>
      ['qualified', 'interested', 'site_visit', 'negotiation'].includes(l.pipelineStage || '')
    ).length;
    const conversionRate = totalLeads > 0 ? ((closed / totalLeads) * 100).toFixed(1) : '0.0';

    const myProps = propertyService.getByAgent(agentId);
    const totalInventoryValue = myProps.reduce((sum, p) => sum + (p.price || 0), 0);

    const stagesCount = {
      new: leads.filter((l) => (l.pipelineStage || 'new') === 'new').length,
      contacted: leads.filter((l) => l.pipelineStage === 'contacted').length,
      qualified: leads.filter((l) => l.pipelineStage === 'qualified' || (l.pipelineStage as string) === 'interested').length,
      site_visit: leads.filter((l) => l.pipelineStage === 'site_visit').length,
      negotiation: leads.filter((l) => l.pipelineStage === 'negotiation').length,
      closed: closed,
      lost: leads.filter((l) => l.pipelineStage === 'lost').length,
    };

    return {
      totalLeads,
      closed,
      activeDeals,
      conversionRate,
      totalInventoryValue,
      stagesCount,
      assignedListings: myProps.length,
    };
  }, [leads, agentId]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitles}>
          <Text style={styles.overline}>AGENT PORTAL / ANALYTICS</Text>
          <Text style={styles.title}>Performance & Metrics Scorecard</Text>
          <Text style={styles.subtitle}>
            Real-time conversion pipeline, client engagement metrics, and deal closing velocity.
          </Text>
        </View>

        <TouchableOpacity onPress={fetchData} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={14} color="#0284C7" style={{ marginRight: 6 }} />
          <Text style={styles.refreshBtnText}>Update Metrics</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Calculating agent performance metrics...</Text>
        </View>
      ) : (
        <>
          {/* Top 4 KPI Cards */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <View style={[styles.kpiIconBox, { backgroundColor: '#E0F2FE' }]}>
                <Feather name="trending-up" size={18} color="#0284C7" />
              </View>
              <Text style={styles.kpiVal}>{stats.totalLeads}</Text>
              <Text style={styles.kpiLbl}>Total Inquiries Handled</Text>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiIconBox, { backgroundColor: '#EDE9FE' }]}>
                <Feather name="calendar" size={18} color="#7C3AED" />
              </View>
              <Text style={styles.kpiVal}>{siteVisitsCount}</Text>
              <Text style={styles.kpiLbl}>Site Visits Conducted</Text>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Feather name="zap" size={18} color="#D97706" />
              </View>
              <Text style={styles.kpiVal}>{stats.activeDeals}</Text>
              <Text style={styles.kpiLbl}>Active Deal Pipeline</Text>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiIconBox, { backgroundColor: '#D1FAE5' }]}>
                <Feather name="check-circle" size={18} color="#059669" />
              </View>
              <Text style={[styles.kpiVal, { color: '#059669' }]}>{stats.closed}</Text>
              <Text style={styles.kpiLbl}>Deals Closed</Text>
            </View>
          </View>

          {/* Performance Rate & Portfolio */}
          <View style={styles.midGrid}>
            {/* Conversion Rate Card */}
            <View style={styles.rateCard}>
              <Text style={styles.cardTitle}>Lead Conversion Efficiency</Text>
              <Text style={styles.cardSub}>Percentage of total assigned leads converted into closed deals.</Text>

              <View style={styles.rateHighlightBox}>
                <Text style={styles.ratePercentage}>{stats.conversionRate}%</Text>
                <View style={styles.ratePill}>
                  <Feather name="award" size={14} color="#059669" style={{ marginRight: 4 }} />
                  <Text style={styles.ratePillText}>
                    {Number(stats.conversionRate) > 10 ? 'Top Performer' : 'Active Growth'}
                  </Text>
                </View>
              </View>

              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(100, Math.max(8, Number(stats.conversionRate) * 4))}%` },
                  ]}
                />
              </View>

              <View style={styles.rateStatsRow}>
                <Text style={styles.rateSubStat}>Closed: {stats.closed}</Text>
                <Text style={styles.rateSubStat}>In Negotiation: {stats.stagesCount.negotiation}</Text>
                <Text style={styles.rateSubStat}>Tours: {stats.stagesCount.site_visit}</Text>
              </View>
            </View>

            {/* Managed Portfolio Card */}
            <View style={styles.portfolioCard}>
              <Text style={styles.cardTitle}>Assigned Advisory Portfolio</Text>
              <Text style={styles.cardSub}>Total gross property inventory value under your management.</Text>

              <View style={styles.portfolioHighlight}>
                <Text style={styles.portfolioVal}>
                  {formatCurrency(stats.totalInventoryValue, 'INR')}
                </Text>
                <Text style={styles.portfolioUnits}>Across {stats.assignedListings} verified listings</Text>
              </View>

              <View style={styles.portfolioBadges}>
                <View style={styles.pBadge}>
                  <Feather name="shield" size={13} color="#0284C7" style={{ marginRight: 4 }} />
                  <Text style={styles.pBadgeText}>100% Verified Legal Titles</Text>
                </View>
                <View style={styles.pBadge}>
                  <Feather name="star" size={13} color="#D97706" style={{ marginRight: 4 }} />
                  <Text style={styles.pBadgeText}>Cityspace Certified Advisory Desk</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Pipeline Stage Funnel Breakdown */}
          <View style={styles.funnelCard}>
            <Text style={styles.cardTitle}>CRM Pipeline Distribution</Text>
            <Text style={styles.cardSub}>Current distribution of prospective clients across sales stages.</Text>

            <View style={styles.funnelRows}>
              {[
                { label: '1. New Inquiries', count: stats.stagesCount.new, color: '#0284C7' },
                { label: '2. Contacted', count: stats.stagesCount.contacted, color: '#D97706' },
                { label: '3. Qualified Buyers', count: stats.stagesCount.qualified, color: '#7C3AED' },
                { label: '4. Site Visits Scheduled', count: stats.stagesCount.site_visit, color: '#2563EB' },
                { label: '5. In Negotiation', count: stats.stagesCount.negotiation, color: '#EA580C' },
                { label: '6. Closed Deals', count: stats.stagesCount.closed, color: '#059669' },
                { label: '7. Closed / Lost', count: stats.stagesCount.lost, color: '#DC2626' },
              ].map((stage) => {
                const total = Math.max(1, stats.totalLeads);
                const pct = ((stage.count / total) * 100).toFixed(0);

                return (
                  <View key={stage.label} style={styles.stageRow}>
                    <View style={styles.stageLabelCol}>
                      <Text style={styles.stageName}>{stage.label}</Text>
                    </View>

                    <View style={styles.stageBarWrapper}>
                      <View
                        style={[
                          styles.stageBarFill,
                          {
                            backgroundColor: stage.color,
                            width: `${Math.max(4, Number(pct))}%`,
                          },
                        ]}
                      />
                    </View>

                    <View style={styles.stageCountCol}>
                      <Text style={[styles.stageCountText, { color: stage.color }]}>
                        {stage.count} <Text style={{ color: '#94A3B8', fontSize: 11 }}>({pct}%)</Text>
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </>
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
  loadingBox: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  kpiCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    gap: 8,
    ...Shadows.sm,
  },
  kpiIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiVal: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  kpiLbl: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  midGrid: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  rateCard: {
    flex: 1,
    minWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    gap: 12,
    ...Shadows.sm,
  },
  portfolioCard: {
    flex: 1,
    minWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    gap: 12,
    ...Shadows.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSub: {
    fontSize: 12,
    color: '#64748B',
  },
  rateHighlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  ratePercentage: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0F172A',
  },
  ratePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 4,
  },
  rateStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  rateSubStat: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  portfolioHighlight: {
    gap: 4,
    marginVertical: 4,
  },
  portfolioVal: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0284C7',
  },
  portfolioUnits: {
    fontSize: 13,
    color: '#64748B',
  },
  portfolioBadges: {
    gap: 8,
    marginTop: 6,
  },
  pBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  pBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  funnelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    gap: 16,
    ...Shadows.sm,
  },
  funnelRows: {
    gap: 12,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stageLabelCol: {
    width: 170,
  },
  stageName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  stageBarWrapper: {
    flex: 1,
    height: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    overflow: 'hidden',
  },
  stageBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  stageCountCol: {
    width: 80,
    alignItems: 'flex-end',
  },
  stageCountText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
