import { Router, Request, Response } from 'express';
import { queryAll, queryOne, execute } from '../db/database';

const router = Router();

// ─── Helper: Create Notification ───────────────────────────────────────────
async function createNotification(opts: {
  type: string;
  title: string;
  message: string;
  recipientRole: 'admin' | 'agent' | 'user' | 'all';
  recipientId?: string;
  visitId?: string;
  link?: string;
}) {
  const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  try {
    await execute(
      `INSERT INTO notifications (id, type, title, message, link, is_read, recipient_role, recipient_id, visit_id, created_at)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
      [id, opts.type, opts.title, opts.message, opts.link || null, opts.recipientRole, opts.recipientId || null, opts.visitId || null, now]
    );
  } catch (err) {
    console.warn('[Notification] Failed to create notification:', err);
  }
}

// ─── Helper: Map DB row → client object ────────────────────────────────────
function mapVisit(r: any) {
  let propertyImages: string[] = [];
  try {
    propertyImages = typeof r.property_images === 'string'
      ? JSON.parse(r.property_images || '[]')
      : (r.property_images || []);
  } catch { propertyImages = []; }

  return {
    id: r.id,
    propertyId: r.property_id,
    propertyTitle: r.property_title || 'Property',
    propertyCity: r.property_city || '',
    propertyNeighborhood: r.property_neighborhood || '',
    propertyPrice: r.property_price ? Number(r.property_price) : 0,
    propertyImage: propertyImages[0] || '',
    // Client / User info
    clientName: r.client_name,
    clientPhone: r.client_phone,
    clientEmail: r.client_email || '',
    // Agent info
    agentId: r.agent_id || '',
    agentName: r.agent_name || 'Unassigned',
    agentPhone: r.agent_phone || '',
    agentEmail: r.agent_email || '',
    agentAvatar: r.agent_avatar || '',
    // Requested slot
    visitDate: r.visit_date,
    visitTime: r.visit_time,
    // Alternative slots
    altSlot1Date: r.alt_slot_1_date || '',
    altSlot1Time: r.alt_slot_1_time || '',
    altSlot2Date: r.alt_slot_2_date || '',
    altSlot2Time: r.alt_slot_2_time || '',
    // Confirmed slot (set by admin)
    confirmedDate: r.confirmed_date || '',
    confirmedTime: r.confirmed_time || '',
    // Status & reasons
    status: r.status,
    rejectionReason: r.rejection_reason || '',
    rescheduleReason: r.reschedule_reason || '',
    notes: r.notes || '',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

const JOIN_SQL = `
  SELECT
    sv.*,
    p.title AS property_title,
    p.price AS property_price,
    p.images AS property_images,
    l.city AS property_city,
    l.neighborhood AS property_neighborhood,
    a.name AS agent_name,
    a.phone AS agent_phone,
    a.email AS agent_email,
    a.avatar AS agent_avatar
  FROM site_visits sv
  LEFT JOIN properties p ON p.id = sv.property_id
  LEFT JOIN property_locations l ON l.property_id = p.id
  LEFT JOIN agents a ON a.id = sv.agent_id
`;

// ─── GET /api/site-visits ────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, agentId, userPhone, propertyId, search } = req.query;

    let sql = JOIN_SQL + ' WHERE 1=1';
    const params: any[] = [];

    if (status && status !== 'all') {
      sql += ' AND sv.status = ?';
      params.push(status);
    }
    if (agentId && agentId !== 'all') {
      sql += ' AND sv.agent_id = ?';
      params.push(agentId);
    }
    if (userPhone) {
      sql += ' AND sv.client_phone = ?';
      params.push(userPhone);
    }
    if (propertyId) {
      sql += ' AND sv.property_id = ?';
      params.push(propertyId);
    }
    if (search && typeof search === 'string' && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      sql += ' AND (LOWER(sv.client_name) LIKE ? OR LOWER(sv.client_phone) LIKE ? OR LOWER(p.title) LIKE ?)';
      params.push(q, q, q);
    }

    sql += ' ORDER BY sv.created_at DESC';

    const rows = await queryAll(sql, params);
    const visits = rows.map(mapVisit);

    res.json({ success: true, count: visits.length, data: visits });
  } catch (error: any) {
    console.error('[API] Error fetching site visits:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET /api/site-visits/pending-count ─────────────────────────────────────
router.get('/pending-count', async (req: Request, res: Response) => {
  try {
    const row = await queryOne(
      `SELECT COUNT(*) as cnt FROM site_visits WHERE status = 'pending_approval'`,
      []
    );
    res.json({ success: true, count: (row as any)?.cnt || 0 });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET /api/site-visits/:id ───────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const row = await queryOne(JOIN_SQL + ' WHERE sv.id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ success: false, message: 'Visit not found' });
    res.json({ success: true, data: mapVisit(row) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── POST /api/site-visits ──────────────────────────────────────────────────
// Agent creates a new visit request → status = pending_approval
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      propertyId,
      agentId = '',
      // client / user
      clientName,
      clientPhone,
      clientEmail = '',
      // primary slot
      visitDate,
      visitTime,
      // alt slots
      altSlot1Date = '',
      altSlot1Time = '',
      altSlot2Date = '',
      altSlot2Time = '',
      notes = '',
    } = req.body;

    if (!propertyId || !clientName || !clientPhone || !visitDate || !visitTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: propertyId, clientName, clientPhone, visitDate, visitTime',
      });
    }

    const id = `visit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO site_visits
        (id, property_id, agent_id, client_name, client_phone, client_email,
         visit_date, visit_time, alt_slot_1_date, alt_slot_1_time, alt_slot_2_date, alt_slot_2_time,
         status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval', ?, ?, ?)`,
      [id, propertyId, agentId || null, clientName, clientPhone, clientEmail,
       visitDate, visitTime, altSlot1Date || null, altSlot1Time || null,
       altSlot2Date || null, altSlot2Time || null, notes, now, now]
    );

    // Fetch property title for notification
    const prop = await queryOne('SELECT title FROM properties WHERE id = ?', [propertyId]);
    const propTitle = (prop as any)?.title || 'a property';

    // Fetch agent name for notification
    const agent = agentId ? await queryOne('SELECT name FROM agents WHERE id = ?', [agentId]) : null;
    const agentName = (agent as any)?.name || 'Agent';

    // Notify Admin
    await createNotification({
      type: 'visit_request',
      title: '🏠 New Visit Request',
      message: `${agentName} requested a visit for ${clientName} to ${propTitle} on ${visitDate} at ${visitTime}`,
      recipientRole: 'admin',
      visitId: id,
      link: '/admin/site-visits',
    });

    // Activity log
    await execute(
      `INSERT INTO activity_logs (id, user_name, action, entity_type, entity_id, entity_name, details, created_at)
       VALUES (?, ?, 'Requested Property Visit', 'site_visit', ?, ?, ?, ?)`,
      [`act_${Date.now()}`, agentName, id, clientName, `Requested visit for ${propTitle} on ${visitDate}`, now]
    );

    res.status(201).json({
      success: true,
      message: 'Visit request submitted for admin approval',
      data: { id, status: 'pending_approval' },
    });
  } catch (error: any) {
    console.error('[API] Error creating site visit:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── PATCH /api/site-visits/:id/approve ────────────────────────────────────
router.patch('/:id/approve', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { confirmedDate, confirmedTime } = req.body;

    const visit = await queryOne('SELECT * FROM site_visits WHERE id = ?', [id]);
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });
    const v = visit as any;

    const now = new Date().toISOString();
    const finalDate = confirmedDate || v.visit_date;
    const finalTime = confirmedTime || v.visit_time;

    await execute(
      `UPDATE site_visits SET status = 'approved', confirmed_date = ?, confirmed_time = ?, updated_at = ? WHERE id = ?`,
      [finalDate, finalTime, now, id]
    );

    // Fetch related info for notifications
    const prop = await queryOne('SELECT title FROM properties WHERE id = ?', [v.property_id]);
    const agent = v.agent_id ? await queryOne('SELECT name, email FROM agents WHERE id = ?', [v.agent_id]) : null;
    const propTitle = (prop as any)?.title || 'the property';
    const agentName = (agent as any)?.name || 'Your agent';

    const msg = `Visit for ${v.client_name} to ${propTitle} is APPROVED for ${finalDate} at ${finalTime}`;

    // Notify agent
    if (v.agent_id) {
      await createNotification({
        type: 'visit_approved',
        title: '✅ Visit Approved',
        message: msg,
        recipientRole: 'agent',
        recipientId: v.agent_id,
        visitId: id,
        link: '/agent/site-visits',
      });
    }

    // Notify user (via phone match)
    await createNotification({
      type: 'visit_approved',
      title: '✅ Your Visit is Confirmed!',
      message: `Your property visit to ${propTitle} is confirmed for ${finalDate} at ${finalTime}. Agent: ${agentName}`,
      recipientRole: 'user',
      recipientId: v.client_phone,
      visitId: id,
      link: '/my-visits',
    });

    await execute(
      `INSERT INTO activity_logs (id, user_name, action, entity_type, entity_id, entity_name, details, created_at)
       VALUES (?, 'Admin', 'Approved Visit', 'site_visit', ?, ?, ?, ?)`,
      [`act_${Date.now()}`, id, v.client_name, `Confirmed: ${finalDate} at ${finalTime}`, now]
    );

    res.json({ success: true, message: 'Visit approved and notifications sent' });
  } catch (error: any) {
    console.error('[API] Error approving visit:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── PATCH /api/site-visits/:id/reject ─────────────────────────────────────
router.patch('/:id/reject', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { rejectionReason = 'Visit request rejected by admin.' } = req.body;

    const visit = await queryOne('SELECT * FROM site_visits WHERE id = ?', [id]);
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });
    const v = visit as any;

    const now = new Date().toISOString();

    await execute(
      `UPDATE site_visits SET status = 'rejected', rejection_reason = ?, updated_at = ? WHERE id = ?`,
      [rejectionReason, now, id]
    );

    const prop = await queryOne('SELECT title FROM properties WHERE id = ?', [v.property_id]);
    const propTitle = (prop as any)?.title || 'the property';

    const msg = `Visit request for ${v.client_name} to ${propTitle} was rejected. Reason: ${rejectionReason}`;

    if (v.agent_id) {
      await createNotification({
        type: 'visit_rejected',
        title: '❌ Visit Request Rejected',
        message: msg,
        recipientRole: 'agent',
        recipientId: v.agent_id,
        visitId: id,
        link: '/agent/site-visits',
      });
    }

    await createNotification({
      type: 'visit_rejected',
      title: '❌ Visit Request Not Approved',
      message: `Your visit request for ${propTitle} was not approved. Reason: ${rejectionReason}`,
      recipientRole: 'user',
      recipientId: v.client_phone,
      visitId: id,
      link: '/my-visits',
    });

    await execute(
      `INSERT INTO activity_logs (id, user_name, action, entity_type, entity_id, entity_name, details, created_at)
       VALUES (?, 'Admin', 'Rejected Visit', 'site_visit', ?, ?, ?, ?)`,
      [`act_${Date.now()}`, id, v.client_name, rejectionReason, now]
    );

    res.json({ success: true, message: 'Visit rejected and notifications sent' });
  } catch (error: any) {
    console.error('[API] Error rejecting visit:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── PATCH /api/site-visits/:id/reschedule ──────────────────────────────────
router.patch('/:id/reschedule', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { newDate, newTime, rescheduleReason = '' } = req.body;

    if (!newDate || !newTime) {
      return res.status(400).json({ success: false, message: 'newDate and newTime are required' });
    }

    const visit = await queryOne('SELECT * FROM site_visits WHERE id = ?', [id]);
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });
    const v = visit as any;

    const now = new Date().toISOString();

    await execute(
      `UPDATE site_visits SET status = 'rescheduled', confirmed_date = ?, confirmed_time = ?, reschedule_reason = ?, updated_at = ? WHERE id = ?`,
      [newDate, newTime, rescheduleReason, now, id]
    );

    const prop = await queryOne('SELECT title FROM properties WHERE id = ?', [v.property_id]);
    const propTitle = (prop as any)?.title || 'the property';

    const reasonText = rescheduleReason ? ` Reason: ${rescheduleReason}` : '';
    const msg = `Visit for ${v.client_name} to ${propTitle} has been RESCHEDULED to ${newDate} at ${newTime}.${reasonText}`;

    if (v.agent_id) {
      await createNotification({
        type: 'visit_rescheduled',
        title: '🔄 Visit Rescheduled',
        message: msg,
        recipientRole: 'agent',
        recipientId: v.agent_id,
        visitId: id,
        link: '/agent/site-visits',
      });
    }

    await createNotification({
      type: 'visit_rescheduled',
      title: '🔄 Your Visit Has Been Rescheduled',
      message: `Your visit to ${propTitle} has been rescheduled to ${newDate} at ${newTime}.${reasonText}`,
      recipientRole: 'user',
      recipientId: v.client_phone,
      visitId: id,
      link: '/my-visits',
    });

    await execute(
      `INSERT INTO activity_logs (id, user_name, action, entity_type, entity_id, entity_name, details, created_at)
       VALUES (?, 'Admin', 'Rescheduled Visit', 'site_visit', ?, ?, ?, ?)`,
      [`act_${Date.now()}`, id, v.client_name, `Rescheduled to ${newDate} at ${newTime}`, now]
    );

    res.json({ success: true, message: 'Visit rescheduled and notifications sent' });
  } catch (error: any) {
    console.error('[API] Error rescheduling visit:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── PATCH /api/site-visits/:id/complete ────────────────────────────────────
router.patch('/:id/complete', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { notes = '' } = req.body;

    const visit = await queryOne('SELECT * FROM site_visits WHERE id = ?', [id]);
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });
    const v = visit as any;

    const now = new Date().toISOString();
    const updateNotes = notes ? notes : v.notes;

    await execute(
      `UPDATE site_visits SET status = 'completed', notes = ?, updated_at = ? WHERE id = ?`,
      [updateNotes, now, id]
    );

    const prop = await queryOne('SELECT title FROM properties WHERE id = ?', [v.property_id]);
    const propTitle = (prop as any)?.title || 'the property';

    // Notify admin
    await createNotification({
      type: 'visit_completed',
      title: '✔️ Visit Completed',
      message: `Visit for ${v.client_name} to ${propTitle} has been marked as completed.`,
      recipientRole: 'admin',
      visitId: id,
      link: '/admin/site-visits',
    });

    await execute(
      `INSERT INTO activity_logs (id, user_name, action, entity_type, entity_id, entity_name, details, created_at)
       VALUES (?, 'Agent', 'Completed Visit', 'site_visit', ?, ?, ?, ?)`,
      [`act_${Date.now()}`, id, v.client_name, `Visit to ${propTitle} completed`, now]
    );

    res.json({ success: true, message: 'Visit marked as completed' });
  } catch (error: any) {
    console.error('[API] Error completing visit:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── PATCH /api/site-visits/:id/cancel ──────────────────────────────────────
router.patch('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { reason = '' } = req.body;

    const visit = await queryOne('SELECT * FROM site_visits WHERE id = ?', [id]);
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });
    const v = visit as any;

    const now = new Date().toISOString();

    await execute(
      `UPDATE site_visits SET status = 'cancelled', rejection_reason = ?, updated_at = ? WHERE id = ?`,
      [reason, now, id]
    );

    // Notify relevant parties
    await createNotification({
      type: 'visit_cancelled',
      title: '🚫 Visit Cancelled',
      message: `Visit for ${v.client_name} on ${v.visit_date} has been cancelled.${reason ? ' Reason: ' + reason : ''}`,
      recipientRole: 'admin',
      visitId: id,
      link: '/admin/site-visits',
    });

    await createNotification({
      type: 'visit_cancelled',
      title: '🚫 Visit Cancelled',
      message: `Your property visit on ${v.visit_date} has been cancelled.${reason ? ' Reason: ' + reason : ''}`,
      recipientRole: 'user',
      recipientId: v.client_phone,
      visitId: id,
      link: '/my-visits',
    });

    res.json({ success: true, message: 'Visit cancelled' });
  } catch (error: any) {
    console.error('[API] Error cancelling visit:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── PATCH /api/site-visits/:id/no-show ─────────────────────────────────────
router.patch('/:id/no-show', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const visit = await queryOne('SELECT * FROM site_visits WHERE id = ?', [id]);
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });
    const v = visit as any;

    const now = new Date().toISOString();

    await execute(
      `UPDATE site_visits SET status = 'no_show', updated_at = ? WHERE id = ?`,
      [now, id]
    );

    await createNotification({
      type: 'visit_no_show',
      title: '⚠️ Client No-Show',
      message: `${v.client_name} did not show up for the property visit on ${v.visit_date}.`,
      recipientRole: 'admin',
      visitId: id,
      link: '/admin/site-visits',
    });

    res.json({ success: true, message: 'Visit marked as no-show' });
  } catch (error: any) {
    console.error('[API] Error marking no-show:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── PATCH /api/site-visits/:id (legacy general update) ──────────────────────
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, visitDate, visitTime, agentId, notes } = req.body;

    const existing = await queryOne('SELECT * FROM site_visits WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Site visit not found' });
    }

    const now = new Date().toISOString();
    const updates: string[] = ['updated_at = ?'];
    const params: any[] = [now];

    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (visitDate !== undefined) { updates.push('visit_date = ?'); params.push(visitDate); }
    if (visitTime !== undefined) { updates.push('visit_time = ?'); params.push(visitTime); }
    if (agentId !== undefined) { updates.push('agent_id = ?'); params.push(agentId || null); }
    if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }

    params.push(id);
    await execute(`UPDATE site_visits SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({ success: true, message: 'Site visit updated successfully' });
  } catch (error: any) {
    console.error('[API] Error updating site visit:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── DELETE /api/site-visits/:id ────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await execute('DELETE FROM site_visits WHERE id = ?', [id]);
    res.json({ success: true, message: 'Site visit deleted successfully' });
  } catch (error: any) {
    console.error('[API] Error deleting site visit:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
