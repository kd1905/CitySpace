import { Router, Request, Response } from 'express';
import { queryAll, queryOne, execute } from '../db/database';

const router = Router();

// GET /api/users
router.get('/', async (req: Request, res: Response) => {
  try {
    const rows = await queryAll('SELECT * FROM users ORDER BY created_at DESC');
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error: any) {
    console.error('[API] Error fetching users:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/users
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const now = new Date().toISOString();
    const id = data.id || `usr-${Date.now()}`;

    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [data.email]);
    if (existing) {
      await execute(
        'UPDATE users SET full_name = ?, phone = ?, role = ?, avatar = ? WHERE email = ?',
        [
          data.fullName || data.name || 'Cityspace User',
          data.phone || '',
          data.role || 'user',
          data.avatar || '',
          data.email,
        ]
      );
    } else {
      await execute(
        'INSERT INTO users (id, full_name, email, phone, role, avatar, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          id,
          data.fullName || data.name || 'Cityspace User',
          data.email,
          data.phone || '',
          data.role || 'user',
          data.avatar || '',
          now,
        ]
      );
    }

    const user = await queryOne('SELECT * FROM users WHERE email = ?', [data.email]);
    res.status(201).json({ success: true, data: user });
  } catch (error: any) {
    console.error('[API] Error creating user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/users/profile (Update Admin or User profile, username, phone, email, avatar, password)
router.patch('/profile', async (req: Request, res: Response) => {
  try {
    const { id, email, fullName, phone, avatar, password } = req.body;
    const now = new Date().toISOString();

    let existing = null;
    if (id) {
      existing = await queryOne('SELECT * FROM users WHERE id = ?', [id]);
    }
    if (!existing && email) {
      existing = await queryOne('SELECT * FROM users WHERE email = ?', [email]);
    }

    if (!existing) {
      const newId = id || `usr-${Date.now()}`;
      await execute(
        'INSERT INTO users (id, full_name, email, phone, role, avatar, password, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          newId,
          fullName || 'Administrator',
          email || 'admin@cityspace.in',
          phone || '',
          'admin',
          avatar || '',
          password || null,
          now,
        ]
      );
      existing = await queryOne('SELECT * FROM users WHERE id = ?', [newId]);
    } else {
      const updates: string[] = ['full_name = ?', 'phone = ?'];
      const params: any[] = [fullName || existing.full_name, phone !== undefined ? phone : existing.phone];

      if (avatar !== undefined) {
        updates.push('avatar = ?');
        params.push(avatar);
      }
      if (email && email !== existing.email) {
        updates.push('email = ?');
        params.push(email);
      }
      if (password && password.trim()) {
        updates.push('password = ?');
        params.push(password.trim());
      }
      params.push(existing.id);

      await execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
      existing = await queryOne('SELECT * FROM users WHERE id = ?', [existing.id]);
    }

    res.json({
      success: true,
      message: 'Admin profile updated successfully',
      data: {
        id: existing.id,
        fullName: existing.full_name,
        email: existing.email,
        phone: existing.phone,
        role: existing.role,
        avatar: existing.avatar,
      },
    });
  } catch (error: any) {
    console.error('[API] Error updating profile:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/companies
router.get('/companies', async (req: Request, res: Response) => {
  try {
    const rows = await queryAll('SELECT * FROM companies ORDER BY created_at DESC');
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error: any) {
    console.error('[API] Error fetching companies:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/companies
router.post('/companies', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const now = new Date().toISOString();
    const id = data.id || `comp-${Date.now()}`;

    const insertSql = `
      INSERT INTO companies (id, name, license_no, address, phone, email, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await execute(insertSql, [
      id,
      data.name,
      data.licenseNo || '',
      data.address || '',
      data.phone || '',
      data.email || '',
      now,
    ]);

    const comp = await queryOne('SELECT * FROM companies WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: comp });
  } catch (error: any) {
    console.error('[API] Error creating company:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
