import { Router, Request, Response } from 'express';
import { queryAll, queryOne } from '../db/database';

const router = Router();

// GET /api/analytics/dashboard - All aggregated stats for the real-time admin dashboard
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    // 1. Property Counts
    const propRows = await queryAll(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS drafts,
        SUM(CASE WHEN status = 'pending_approval' OR verification_status = 'submitted' OR verification_status = 'under_review' THEN 1 ELSE 0 END) AS pending_approval,
        SUM(CASE WHEN featured = 1 THEN 1 ELSE 0 END) AS featured,
        SUM(CASE WHEN verified = 1 OR verification_status = 'verified' THEN 1 ELSE 0 END) AS verified,
        SUM(CASE WHEN status = 'sold' OR status = 'rented' THEN 1 ELSE 0 END) AS closed_properties
      FROM properties
    `);
    const pCounts = propRows[0] || {};

    // 2. Enquiry & CRM Leads Counts
    const enquiryRows = await queryAll(`
      SELECT 
        COUNT(*) AS total_enquiries,
        SUM(CASE WHEN pipeline_stage = 'new' OR status = 'new' THEN 1 ELSE 0 END) AS new_leads,
        SUM(CASE WHEN pipeline_stage = 'contacted' THEN 1 ELSE 0 END) AS contacted_leads,
        SUM(CASE WHEN pipeline_stage = 'interested' THEN 1 ELSE 0 END) AS interested_leads,
        SUM(CASE WHEN pipeline_stage = 'site_visit' THEN 1 ELSE 0 END) AS visit_leads,
        SUM(CASE WHEN pipeline_stage = 'negotiation' THEN 1 ELSE 0 END) AS negotiation_leads,
        SUM(CASE WHEN pipeline_stage = 'closed_won' THEN 1 ELSE 0 END) AS closed_won,
        SUM(CASE WHEN pipeline_stage = 'closed_lost' THEN 1 ELSE 0 END) AS closed_lost
      FROM enquiries
    `);
    const eCounts = enquiryRows[0] || {};

    // 3. Site Visits Counts
    const visitRows = await queryAll(`
      SELECT 
        COUNT(*) AS total_visits,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) AS upcoming_visits,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_visits,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_visits
      FROM site_visits
    `);
    const vCounts = visitRows[0] || {};

    // 4. Agents & Users
    const agentCount = await queryOne('SELECT COUNT(*) AS c FROM agents WHERE status = "active"') || { c: 0 };
    const userCount = await queryOne('SELECT COUNT(*) AS c FROM users') || { c: 0 };

    // 5. Total Property Views
    const viewCount = await queryOne('SELECT COUNT(*) AS c FROM property_views') || { c: 0 };

    // 6. City Breakdown
    const cityRows = await queryAll(`
      SELECT l.city, COUNT(p.id) AS count
      FROM properties p
      JOIN property_locations l ON l.property_id = p.id
      GROUP BY l.city
      ORDER BY count DESC
      LIMIT 6
    `);

    // 7. Property Type Distribution
    const typeRows = await queryAll(`
      SELECT category, COUNT(*) AS count
      FROM properties
      GROUP BY category
      ORDER BY count DESC
    `);

    // 8. Recent Activities
    const activityRows = await queryAll(`
      SELECT * FROM activity_logs
      ORDER BY created_at DESC
      LIMIT 8
    `);

    // 9. Pipeline Funnel
    const pipelineFunnel = [
      { stage: 'New Leads', count: Number(eCounts.new_leads) || 0, color: '#3B82F6' },
      { stage: 'Contacted', count: Number(eCounts.contacted_leads) || 0, color: '#6366F1' },
      { stage: 'Interested', count: Number(eCounts.interested_leads) || 0, color: '#8B5CF6' },
      { stage: 'Site Visit', count: Number(eCounts.visit_leads) || 0, color: '#F59E0B' },
      { stage: 'Negotiation', count: Number(eCounts.negotiation_leads) || 0, color: '#EC4899' },
      { stage: 'Closed Won', count: Number(eCounts.closed_won) || 0, color: '#10B981' },
    ];

    res.json({
      success: true,
      data: {
        properties: {
          total: Number(pCounts.total) || 0,
          published: Number(pCounts.published) || 0,
          drafts: Number(pCounts.drafts) || 0,
          pendingApproval: Number(pCounts.pending_approval) || 0,
          featured: Number(pCounts.featured) || 0,
          verified: Number(pCounts.verified) || 0,
          closed: Number(pCounts.closed_properties) || 0,
        },
        leads: {
          total: Number(eCounts.total_enquiries) || 0,
          newLeads: Number(eCounts.new_leads) || 0,
          contacted: Number(eCounts.contacted_leads) || 0,
          interested: Number(eCounts.interested_leads) || 0,
          siteVisit: Number(eCounts.visit_leads) || 0,
          negotiation: Number(eCounts.negotiation_leads) || 0,
          closedWon: Number(eCounts.closed_won) || 0,
          closedLost: Number(eCounts.closed_lost) || 0,
        },
        siteVisits: {
          total: Number(vCounts.total_visits) || 0,
          upcoming: Number(vCounts.upcoming_visits) || 0,
          completed: Number(vCounts.completed_visits) || 0,
          cancelled: Number(vCounts.cancelled_visits) || 0,
        },
        views: Number(viewCount.c) || 0,
        agentsCount: Number(agentCount.c) || 0,
        usersCount: Number(userCount.c) || 0,
        cities: cityRows.map((r) => ({ city: r.city || 'Unknown', count: Number(r.count) || 0 })),
        types: typeRows.map((r) => ({ type: r.category || 'Other', count: Number(r.count) || 0 })),
        pipelineFunnel,
        recentActivities: activityRows.map((r) => ({
          id: r.id,
          userName: r.user_name,
          action: r.action,
          entityType: r.entity_type,
          entityName: r.entity_name,
          details: r.details,
          createdAt: r.created_at,
        })),
      },
    });
  } catch (error: any) {
    console.error('[API] Error in analytics dashboard:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
