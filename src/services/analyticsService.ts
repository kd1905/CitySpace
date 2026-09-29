import { apiClient } from './apiClient';

export interface DashboardMetrics {
  properties: {
    total: number;
    published: number;
    drafts: number;
    pendingApproval: number;
    featured: number;
    verified: number;
    closed: number;
  };
  crm: {
    totalEnquiries: number;
    newLeads: number;
    contactedLeads: number;
    interestedLeads: number;
    visitLeads: number;
    negotiationLeads: number;
    closedWon: number;
    closedLost: number;
    pipeline: Array<{ stage: string; count: number; color: string }>;
  };
  siteVisits: {
    total: number;
    upcoming: number;
    completed: number;
    cancelled: number;
  };
  overview: {
    totalViews: number;
    activeAgents: number;
    totalUsers: number;
  };
  cityBreakdown: Array<{ city: string; count: number }>;
  typeDistribution: Array<{ category: string; count: number }>;
  recentActivity: Array<{
    id: string;
    userName: string;
    action: string;
    entityType: string;
    entityId?: string;
    entityName?: string;
    details?: string;
    createdAt: string;
  }>;
}

class AnalyticsService {
  async getDashboardMetrics(): Promise<DashboardMetrics | null> {
    try {
      const res = await apiClient.get<any>('/analytics/dashboard');
      if (res.success && res.data) {
        const d = res.data;
        return {
          properties: {
            total: Number(d.properties?.total) || 0,
            published: Number(d.properties?.published) || 0,
            drafts: Number(d.properties?.drafts) || 0,
            pendingApproval: Number(d.properties?.pendingApproval) || 0,
            featured: Number(d.properties?.featured) || 0,
            verified: Number(d.properties?.verified) || 0,
            closed: Number(d.properties?.closed) || 0,
          },
          crm: {
            totalEnquiries: Number(d.leads?.total) || 0,
            newLeads: Number(d.leads?.newLeads) || 0,
            contactedLeads: Number(d.leads?.contacted) || 0,
            interestedLeads: Number(d.leads?.interested) || 0,
            visitLeads: Number(d.leads?.siteVisit) || 0,
            negotiationLeads: Number(d.leads?.negotiation) || 0,
            closedWon: Number(d.leads?.closedWon) || 0,
            closedLost: Number(d.leads?.closedLost) || 0,
            pipeline: Array.isArray(d.pipelineFunnel) ? d.pipelineFunnel : [],
          },
          siteVisits: {
            total: Number(d.siteVisits?.total) || 0,
            upcoming: Number(d.siteVisits?.upcoming) || 0,
            completed: Number(d.siteVisits?.completed) || 0,
            cancelled: Number(d.siteVisits?.cancelled) || 0,
          },
          overview: {
            totalViews: Number(d.views) || 0,
            activeAgents: Number(d.agentsCount) || 0,
            totalUsers: Number(d.usersCount) || 0,
          },
          cityBreakdown: Array.isArray(d.cities) ? d.cities : [],
          typeDistribution: Array.isArray(d.types)
            ? d.types.map((t: any) => ({ category: t.type || t.category || 'Other', count: t.count || 0 }))
            : [],
          recentActivity: Array.isArray(d.recentActivities)
            ? d.recentActivities.map((a: any) => ({
                id: a.id,
                userName: a.userName || a.user_name || 'Admin',
                action: a.action,
                entityType: a.entityType || a.entity_type,
                entityId: a.entityId || a.entity_id,
                entityName: a.entityName || a.entity_name,
                details: a.details,
                createdAt: a.createdAt || a.created_at,
              }))
            : [],
        };
      }
    } catch (err) {
      console.warn('[AnalyticsService] Error fetching dashboard metrics:', err);
    }
    return null;
  }
}

export const analyticsService = new AnalyticsService();
