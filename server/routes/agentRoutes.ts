import { Router, Request, Response } from 'express';
import { queryAll, queryOne, execute } from '../db/database';

const router = Router();

function formatAgentRow(row: any) {
  if (!row) return null;
  const isDefaultPassword = !row.password || row.password.trim() === 'agent123';
  const requiresPasswordChange = row.requires_password_change !== undefined && row.requires_password_change !== null
    ? Boolean(Number(row.requires_password_change))
    : isDefaultPassword;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    designation: row.designation || 'Property Advisor',
    experience: row.experience || '',
    bio: row.bio || '',
    avatar: row.avatar || '',
    status: row.status || 'active',
    rating: Number(row.rating) || 5.0,
    reviewCount: Number(row.review_count) || 0,
    areasServed: row.areas_served ? (row.areas_served.startsWith('[') ? JSON.parse(row.areas_served) : row.areas_served.split(',').map((s: string) => s.trim())) : [],
    companyId: row.company_id || undefined,
    city: row.city || '',
    role: row.role || 'agent',
    isDefaultPassword,
    requiresPasswordChange,
    createdAt: row.created_at,
  };
}

// POST /api/agents/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPass = password.trim();

    const agent = await queryOne('SELECT * FROM agents WHERE LOWER(email) = ?', [cleanEmail]);
    if (!agent) {
      return res.status(401).json({ success: false, message: 'No registered advisor account found with this email.' });
    }

    if (agent.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Your advisor account is currently inactive. Please contact administration.' });
    }

    // Check password (default is agent123 if not explicitly set)
    const effectivePass = agent.password && agent.password.trim() ? agent.password.trim() : 'agent123';
    if (effectivePass !== cleanPass) {
      return res.status(401).json({ success: false, message: 'Invalid password. Please check your credentials.' });
    }

    const formatted = formatAgentRow(agent);
    res.json({
      success: true,
      message: 'Agent authenticated successfully',
      data: formatted,
    });
  } catch (error: any) {
    console.error('[API] Error during agent login:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/agents
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM agents';
    const params: any[] = [];

    if (status && status !== 'all') {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    sql += ' ORDER BY created_at DESC';

    const rows = await queryAll(sql, params);
    const agents = rows.map(formatAgentRow);
    res.json({ success: true, count: agents.length, data: agents });
  } catch (error: any) {
    console.error('[API] Error fetching agents:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/agents/:id/dashboard
router.get('/:id/dashboard', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const agent = await queryOne('SELECT * FROM agents WHERE id = ?', [id]);
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    // Real DB queries for this specific agent only
    const newLeadsRow = await queryOne(
      "SELECT count(*) as count FROM enquiries WHERE agent_id = ? AND (pipeline_stage = 'new' OR pipeline_stage IS NULL)",
      [id]
    );
    const followUpsDueRow = await queryOne(
      "SELECT count(*) as count FROM enquiries WHERE agent_id = ? AND follow_up_date IS NOT NULL AND follow_up_date != ''",
      [id]
    );
    const todayVisitsRow = await queryOne(
      "SELECT count(*) as count FROM site_visits WHERE agent_id = ? AND status = 'scheduled'",
      [id]
    );
    const activeDealsRow = await queryOne(
      "SELECT count(*) as count FROM enquiries WHERE agent_id = ? AND pipeline_stage IN ('qualified', 'site_visit', 'negotiation', 'interested', 'contacted')",
      [id]
    );
    const closedDealsRow = await queryOne(
      "SELECT count(*) as count FROM enquiries WHERE agent_id = ? AND (pipeline_stage = 'closed' OR pipeline_stage = 'closed_won')",
      [id]
    );
    const assignedPropsRow = await queryOne(
      "SELECT count(*) as count FROM properties WHERE assigned_agent_id = ?",
      [id]
    );

    // Lists for agent dashboard
    const priorityLeads = await queryAll(
      "SELECT * FROM enquiries WHERE agent_id = ? ORDER BY created_at DESC LIMIT 5",
      [id]
    );

    const upcomingVisits = await queryAll(
      "SELECT sv.*, p.title as property_title, p.price as property_price FROM site_visits sv LEFT JOIN properties p ON sv.property_id = p.id WHERE sv.agent_id = ? ORDER BY sv.visit_date ASC, sv.visit_time ASC LIMIT 5",
      [id]
    );

    const myProperties = await queryAll(
      "SELECT p.*, pl.city as location_city, pl.neighborhood as location_neighborhood FROM properties p LEFT JOIN property_locations pl ON p.id = pl.property_id WHERE p.assigned_agent_id = ? ORDER BY p.created_at DESC LIMIT 6",
      [id]
    );

    const pipelineStages = await queryAll(
      "SELECT pipeline_stage, count(*) as count FROM enquiries WHERE agent_id = ? GROUP BY pipeline_stage",
      [id]
    );

    res.json({
      success: true,
      data: {
        agent: formatAgentRow(agent),
        metrics: {
          newLeadsCount: Number(newLeadsRow?.count || 0),
          followUpsDueCount: Number(followUpsDueRow?.count || 0),
          todayVisitsCount: Number(todayVisitsRow?.count || 0),
          activeDealsCount: Number(activeDealsRow?.count || 0),
          closedDealsCount: Number(closedDealsRow?.count || 0),
          assignedPropertiesCount: Number(assignedPropsRow?.count || 0),
        },
        priorityLeads,
        upcomingVisits,
        myProperties,
        pipelineStages,
      },
    });
  } catch (error: any) {
    console.error('[API] Error fetching agent dashboard:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/agents/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const row = await queryOne('SELECT * FROM agents WHERE id = ?', [id]);
    if (!row) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }
    res.json({ success: true, data: formatAgentRow(row) });
  } catch (error: any) {
    console.error('[API] Error fetching agent:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/agents
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const now = new Date().toISOString();
    const id = data.id || `ag-${Date.now()}`;

    const areas = Array.isArray(data.areasServed)
      ? JSON.stringify(data.areasServed)
      : typeof data.areasServed === 'string'
      ? data.areasServed
      : '[]';

    const initialPassword = data.password && data.password.trim() ? data.password.trim() : 'agent123';
    const reqChange = initialPassword === 'agent123' ? 1 : 0;

    const insertSql = `
      INSERT INTO agents (
        id, company_id, name, email, phone, designation, experience,
        bio, avatar, status, rating, review_count, areas_served, password, city, role, requires_password_change, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await execute(insertSql, [
      id,
      data.companyId || null,
      data.name || 'Unnamed Agent',
      data.email ? data.email.toLowerCase().trim() : '',
      data.phone || '',
      data.designation || 'Property Advisor',
      data.experience || '',
      data.bio || '',
      data.avatar || '',
      data.status || 'active',
      data.rating !== undefined ? Number(data.rating) : 5.0,
      data.reviewCount !== undefined ? Number(data.reviewCount) : 0,
      areas,
      initialPassword,
      data.city || '',
      'agent',
      reqChange,
      now,
    ]);

    const created = await queryOne('SELECT * FROM agents WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: formatAgentRow(created) });
  } catch (error: any) {
    console.error('[API] Error creating agent:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/agents/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existing = await queryOne('SELECT id FROM agents WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    const areas = data.areasServed !== undefined
      ? (Array.isArray(data.areasServed) ? JSON.stringify(data.areasServed) : String(data.areasServed))
      : null;

    const updateFields: string[] = [
      'name = COALESCE(?, name)',
      'email = COALESCE(?, email)',
      'phone = COALESCE(?, phone)',
      'designation = COALESCE(?, designation)',
      'experience = COALESCE(?, experience)',
      'bio = COALESCE(?, bio)',
      'avatar = COALESCE(?, avatar)',
      'status = COALESCE(?, status)',
      'areas_served = COALESCE(?, areas_served)',
    ];

    const params: any[] = [
      data.name !== undefined ? data.name : null,
      data.email !== undefined ? (data.email ? data.email.toLowerCase().trim() : null) : null,
      data.phone !== undefined ? data.phone : null,
      data.designation !== undefined ? data.designation : null,
      data.experience !== undefined ? data.experience : null,
      data.bio !== undefined ? data.bio : null,
      data.avatar !== undefined ? data.avatar : null,
      data.status !== undefined ? data.status : null,
      areas,
    ];

    if (data.password !== undefined && data.password.trim()) {
      updateFields.push('password = ?');
      params.push(data.password.trim());
      updateFields.push('requires_password_change = ?');
      params.push(data.password.trim() === 'agent123' ? 1 : 0);
    }

    if (data.city !== undefined) {
      updateFields.push('city = ?');
      params.push(data.city ?? '');
    }

    params.push(id);

    const updateSql = `UPDATE agents SET ${updateFields.join(', ')} WHERE id = ?`;
    await execute(updateSql, params);

    const updated = await queryOne('SELECT * FROM agents WHERE id = ?', [id]);
    res.json({ success: true, data: formatAgentRow(updated) });
  } catch (error: any) {
    console.error('[API] Error updating agent:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/agents/:id/status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await execute("UPDATE agents SET status = CASE WHEN status = 'active' THEN 'inactive' ELSE 'active' END WHERE id = ?", [id]);
    const updated = await queryOne('SELECT * FROM agents WHERE id = ?', [id]);
    res.json({ success: true, data: formatAgentRow(updated) });
  } catch (error: any) {
    console.error('[API] Error toggling agent status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/agents/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await execute('UPDATE properties SET assigned_agent_id = NULL WHERE assigned_agent_id = ?', [id]);
    await execute('UPDATE enquiries SET agent_id = NULL WHERE agent_id = ?', [id]);
    await execute('UPDATE site_visits SET agent_id = NULL WHERE agent_id = ?', [id]);
    await execute('DELETE FROM agents WHERE id = ?', [id]);
    res.json({ success: true, message: 'Agent deleted successfully' });
  } catch (error: any) {
    console.error('[API] Error deleting agent:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
