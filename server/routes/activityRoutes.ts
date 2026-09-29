import { Router, Request, Response } from 'express';
import { queryAll, queryOne, execute } from '../db/database';

const router = Router();

// GET /api/activity
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const entityType = req.query.entityType as string;

    let sql = 'SELECT * FROM activity_logs';
    const params: any[] = [];

    if (entityType) {
      sql += ' WHERE entity_type = ?';
      params.push(entityType);
    }
    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const rows = await queryAll(sql, params);
    const data = rows.map((r: any) => ({
      id: r.id,
      userName: r.user_name,
      action: r.action,
      entityType: r.entity_type,
      entityId: r.entity_id,
      entityName: r.entity_name,
      details: r.details,
      createdAt: r.created_at,
    }));

    res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    console.error('[API] Error fetching activity logs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/activity
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userName, action, entityType, entityId, entityName, details } = req.body;
    const id = `act-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO activity_logs (id, user_name, action, entity_type, entity_id, entity_name, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userName || 'Admin', action, entityType, entityId || null, entityName || null, details || null, now]
    );

    res.status(201).json({ success: true, id });
  } catch (error: any) {
    console.error('[API] Error creating activity log:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/activity/notifications
router.get('/notifications', async (req: Request, res: Response) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    let sql = 'SELECT * FROM notifications';
    const params: any[] = [];

    if (unreadOnly) {
      sql += ' WHERE is_read = 0';
    }
    sql += ' ORDER BY created_at DESC LIMIT 50';

    const rows = await queryAll(sql, params);
    const data = rows.map((r: any) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      message: r.message,
      link: r.link,
      isRead: Boolean(r.is_read),
      createdAt: r.created_at,
    }));

    res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    console.error('[API] Error fetching notifications:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/activity/notifications/:id/read
router.patch('/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await execute('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error: any) {
    console.error('[API] Error updating notification:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/activity/notifications/mark-all-read
router.post('/notifications/mark-all-read', async (req: Request, res: Response) => {
  try {
    await execute('UPDATE notifications SET is_read = 1 WHERE is_read = 0');
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    console.error('[API] Error marking all notifications read:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
