import { Router, Request, Response } from 'express';
import { queryAll, queryOne, execute } from '../db/database';

const router = Router();

const SELECT_ENQUIRY_JOIN_SQL = `
  SELECT 
    e.*,
    p.title AS property_title,
    p.slug AS property_slug,
    a.name AS agent_name,
    a.phone AS agent_phone
  FROM enquiries e
  LEFT JOIN properties p ON p.id = e.property_id
  LEFT JOIN agents a ON a.id = e.agent_id
`;

function formatEnquiryRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    propertyId: row.property_id,
    propertyTitle: row.property_title || 'General Property Inquiry',
    propertySlug: row.property_slug || '',
    visitorName: row.visitor_name,
    email: row.email || '',
    phone: row.phone,
    message: row.message,
    status: row.status,
    pipelineStage: row.pipeline_stage || (row.status === 'new' ? 'new' : row.status === 'resolved' ? 'closed' : 'contacted'),
    buyerBudget: row.buyer_budget || '',
    buyerLocation: row.buyer_location || '',
    notes: row.notes || '',
    followUpDate: row.follow_up_date || '',
    agentId: row.agent_id || undefined,
    agentName: row.agent_name || undefined,
    agentPhone: row.agent_phone || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /api/enquiries
router.get('/', async (req: Request, res: Response) => {
  try {
    const { agentId, status, propertyId } = req.query;
    let sql = `${SELECT_ENQUIRY_JOIN_SQL} WHERE 1=1`;
    const params: any[] = [];

    if (agentId) {
      sql += ' AND e.agent_id = ?';
      params.push(agentId);
    }
    if (status && status !== 'all') {
      sql += ' AND e.status = ?';
      params.push(status);
    }
    if (propertyId) {
      sql += ' AND e.property_id = ?';
      params.push(propertyId);
    }
    sql += ' ORDER BY e.created_at DESC';

    const rows = await queryAll(sql, params);
    const enquiries = rows.map(formatEnquiryRow);
    res.json({ success: true, count: enquiries.length, data: enquiries });
  } catch (error: any) {
    console.error('[API] Error fetching enquiries:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/enquiries
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const now = new Date().toISOString();
    const id = data.id || `enq-${Date.now()}`;

    const insertSql = `
      INSERT INTO enquiries (
        id, property_id, visitor_name, email, phone, message, status, agent_id,
        pipeline_stage, buyer_budget, buyer_location, notes, follow_up_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await execute(insertSql, [
      id,
      data.propertyId || null,
      data.visitorName || 'Prospective Client',
      data.email || '',
      data.phone || '',
      data.message || '',
      data.status || 'new',
      data.agentId || null,
      data.pipelineStage || 'new',
      data.buyerBudget || '',
      data.buyerLocation || '',
      data.notes || '',
      data.followUpDate || '',
      now,
      now,
    ]);

    const created = await queryOne(`${SELECT_ENQUIRY_JOIN_SQL} WHERE e.id = ?`, [id]);
    res.status(201).json({ success: true, data: formatEnquiryRow(created) });
  } catch (error: any) {
    console.error('[API] Error creating enquiry:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/enquiries/:id (Full CRM update)
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const now = new Date().toISOString();

    const updates: string[] = ['updated_at = ?'];
    const params: any[] = [now];

    if (data.visitorName !== undefined) {
      updates.push('visitor_name = ?');
      params.push(data.visitorName);
    }
    if (data.email !== undefined) {
      updates.push('email = ?');
      params.push(data.email);
    }
    if (data.phone !== undefined) {
      updates.push('phone = ?');
      params.push(data.phone);
    }
    if (data.message !== undefined) {
      updates.push('message = ?');
      params.push(data.message);
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
    }
    if (data.pipelineStage !== undefined) {
      updates.push('pipeline_stage = ?');
      params.push(data.pipelineStage);
    }
    if (data.buyerBudget !== undefined) {
      updates.push('buyer_budget = ?');
      params.push(data.buyerBudget);
    }
    if (data.buyerLocation !== undefined) {
      updates.push('buyer_location = ?');
      params.push(data.buyerLocation);
    }
    if (data.notes !== undefined) {
      updates.push('notes = ?');
      params.push(data.notes);
    }
    if (data.followUpDate !== undefined) {
      updates.push('follow_up_date = ?');
      params.push(data.followUpDate);
    }
    if (data.agentId !== undefined) {
      updates.push('agent_id = ?');
      params.push(data.agentId || null);
    }

    params.push(id);
    await execute(`UPDATE enquiries SET ${updates.join(', ')} WHERE id = ?`, params);

    const updated = await queryOne(`${SELECT_ENQUIRY_JOIN_SQL} WHERE e.id = ?`, [id]);
    res.json({ success: true, data: formatEnquiryRow(updated) });
  } catch (error: any) {
    console.error('[API] Error updating enquiry:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/enquiries/:id/stage (Update pipeline stage)
router.patch('/:id/stage', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { pipelineStage } = req.body;
    const now = new Date().toISOString();

    await execute('UPDATE enquiries SET pipeline_stage = ?, updated_at = ? WHERE id = ?', [pipelineStage, now, id]);
    const updated = await queryOne(`${SELECT_ENQUIRY_JOIN_SQL} WHERE e.id = ?`, [id]);
    res.json({ success: true, data: formatEnquiryRow(updated) });
  } catch (error: any) {
    console.error('[API] Error updating enquiry pipeline stage:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/enquiries/:id/status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const now = new Date().toISOString();

    await execute('UPDATE enquiries SET status = ?, updated_at = ? WHERE id = ?', [status, now, id]);
    const updated = await queryOne(`${SELECT_ENQUIRY_JOIN_SQL} WHERE e.id = ?`, [id]);
    res.json({ success: true, data: formatEnquiryRow(updated) });
  } catch (error: any) {
    console.error('[API] Error updating enquiry status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/enquiries/:id/assign
router.patch('/:id/assign', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { agentId } = req.body;
    const now = new Date().toISOString();

    await execute('UPDATE enquiries SET agent_id = ?, updated_at = ? WHERE id = ?', [agentId, now, id]);
    const updated = await queryOne(`${SELECT_ENQUIRY_JOIN_SQL} WHERE e.id = ?`, [id]);
    res.json({ success: true, data: formatEnquiryRow(updated) });
  } catch (error: any) {
    console.error('[API] Error assigning enquiry agent:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/enquiries/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await execute('DELETE FROM enquiries WHERE id = ?', [id]);
    res.json({ success: true, message: 'Enquiry deleted successfully' });
  } catch (error: any) {
    console.error('[API] Error deleting enquiry:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
