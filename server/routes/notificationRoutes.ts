import { Router, Request, Response } from 'express';
import { queryAll, queryOne, execute } from '../db/database';

const router = Router();

// ─── GET /api/notifications ──────────────────────────────────────────────────
// Query params: role, recipientId, unreadOnly
router.get('/', async (req: Request, res: Response) => {
  try {
    const { role, recipientId, unreadOnly, limit = '50' } = req.query;

    let sql = `SELECT * FROM notifications WHERE 1=1`;
    const params: any[] = [];

    if (role) {
      // Match notifications for this role OR broadcast 'all'
      sql += ` AND (recipient_role = ? OR recipient_role = 'all')`;
      params.push(role);
    }

    if (recipientId) {
      // Match specific recipient OR all-of-role (NULL recipient_id)
      sql += ` AND (recipient_id = ? OR recipient_id IS NULL)`;
      params.push(recipientId);
    }

    if (unreadOnly === 'true') {
      sql += ` AND is_read = 0`;
    }

    sql += ` ORDER BY created_at DESC LIMIT ${parseInt(String(limit), 10) || 50}`;

    const rows = await queryAll(sql, params);
    const notifications = rows.map((r: any) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      message: r.message,
      link: r.link || '',
      isRead: Boolean(r.is_read),
      recipientRole: r.recipient_role || 'admin',
      recipientId: r.recipient_id || null,
      visitId: r.visit_id || null,
      createdAt: r.created_at,
    }));

    res.json({ success: true, count: notifications.length, data: notifications });
  } catch (error: any) {
    console.error('[API] Error fetching notifications:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET /api/notifications/unread-count ─────────────────────────────────────
router.get('/unread-count', async (req: Request, res: Response) => {
  try {
    const { role, recipientId } = req.query;

    let sql = `SELECT COUNT(*) as cnt FROM notifications WHERE is_read = 0`;
    const params: any[] = [];

    if (role) {
      sql += ` AND (recipient_role = ? OR recipient_role = 'all')`;
      params.push(role);
    }

    if (recipientId) {
      sql += ` AND (recipient_id = ? OR recipient_id IS NULL)`;
      params.push(recipientId);
    }

    const row = await queryOne(sql, params);
    res.json({ success: true, count: (row as any)?.cnt || 0 });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── PATCH /api/notifications/:id/read ───────────────────────────────────────
router.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await execute(`UPDATE notifications SET is_read = 1 WHERE id = ?`, [id]);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── PATCH /api/notifications/read-all ───────────────────────────────────────
router.patch('/read-all', async (req: Request, res: Response) => {
  try {
    const { role, recipientId } = req.body;

    let sql = `UPDATE notifications SET is_read = 1 WHERE 1=1`;
    const params: any[] = [];

    if (role) {
      sql += ` AND (recipient_role = ? OR recipient_role = 'all')`;
      params.push(role);
    }

    if (recipientId) {
      sql += ` AND (recipient_id = ? OR recipient_id IS NULL)`;
      params.push(recipientId);
    }

    await execute(sql, params);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
