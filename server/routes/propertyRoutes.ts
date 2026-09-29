import { Router, Request, Response } from 'express';
import { queryAll, queryOne, execute } from '../db/database';

const router = Router();

function formatPropertyRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline || '',
    description: row.description,
    price: Number(row.price),
    currency: row.currency || 'INR',
    type: row.type,
    category: row.category,
    categoryLabel: row.category_label || row.category,
    status: row.status,
    featured: Boolean(row.featured),
    verified: Boolean(row.verified),
    verificationStatus: row.verification_status || (Boolean(row.verified) ? 'verified' : 'draft'),
    verificationNotes: row.verification_notes || '',
    rejectionReason: row.rejection_reason || '',
    isNew: Boolean(row.is_new),
    assignedAgentId: row.assigned_agent_id || '',
    companyId: row.company_id || undefined,
    specs: {
      bedrooms: Number(row.specs_bedrooms) || 0,
      bathrooms: Number(row.specs_bathrooms) || 0,
      areaSqFt: Number(row.specs_area_sqft) || 0,
      yearBuilt: row.specs_year_built ? Number(row.specs_year_built) : undefined,
      parkingSpaces: Number(row.specs_parking_spaces) || 0,
      furnishing: row.specs_furnishing || 'unfurnished',
    },
    location: {
      address: row.loc_address || '',
      neighborhood: row.loc_neighborhood || row.loc_society || '',
      city: row.loc_city || '',
      state: row.loc_state || '',
      pincode: row.loc_pincode || '',
      coordinates:
        row.loc_latitude !== null &&
        row.loc_longitude !== null &&
        row.loc_latitude !== undefined &&
        row.loc_longitude !== undefined
          ? {
              lat: Number(row.loc_latitude),
              lng: Number(row.loc_longitude),
            }
          : undefined,
    },
    latitude: row.loc_latitude !== null ? Number(row.loc_latitude) : undefined,
    longitude: row.loc_longitude !== null ? Number(row.loc_longitude) : undefined,
    googlePlaceId: row.loc_google_place_id || undefined,
    images: typeof row.images === 'string' ? JSON.parse(row.images || '[]') : (row.images || []),
    amenities: typeof row.amenities === 'string' ? JSON.parse(row.amenities || '[]') : (row.amenities || []),
    agent: row.agent_id
      ? {
          id: row.agent_id,
          name: row.agent_name,
          agency: 'Cityspace Advisory Group',
          avatar: row.agent_avatar || '',
          phone: row.agent_phone,
          email: row.agent_email,
          designation: row.agent_designation || 'Property Advisor',
          propertiesHandled: row.agent_review_count || 0,
          rating: Number(row.agent_rating) || 5.0,
          reviewCount: Number(row.agent_review_count) || 0,
          verified: true,
        }
      : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT_PROPERTY_JOIN_SQL = `
  SELECT 
    p.*,
    l.address AS loc_address,
    l.society AS loc_society,
    l.neighborhood AS loc_neighborhood,
    l.city AS loc_city,
    l.state AS loc_state,
    l.pincode AS loc_pincode,
    l.latitude AS loc_latitude,
    l.longitude AS loc_longitude,
    l.google_place_id AS loc_google_place_id,
    a.id AS agent_id,
    a.name AS agent_name,
    a.email AS agent_email,
    a.phone AS agent_phone,
    a.avatar AS agent_avatar,
    a.designation AS agent_designation,
    a.rating AS agent_rating,
    a.review_count AS agent_review_count
  FROM properties p
  LEFT JOIN property_locations l ON l.property_id = p.id
  LEFT JOIN agents a ON a.id = p.assigned_agent_id
`;

// GET /api/properties (Public - published only by default)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status = 'published', type, category, city, featured, search } = req.query;

    let sql = `${SELECT_PROPERTY_JOIN_SQL} WHERE 1=1`;
    const params: any[] = [];

    if (status && status !== 'all') {
      sql += ' AND p.status = ?';
      params.push(status);
    }
    if (type && type !== 'all') {
      sql += ' AND p.type = ?';
      params.push(type);
    }
    if (category && category !== 'all') {
      sql += ' AND p.category = ?';
      params.push(category);
    }
    if (city && city !== 'all') {
      sql += ' AND LOWER(l.city) = LOWER(?)';
      params.push(city);
    }
    if (featured === 'true' || featured === '1') {
      sql += ' AND p.featured = 1';
    }
    if (search && typeof search === 'string' && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      sql += ' AND (LOWER(p.title) LIKE ? OR LOWER(l.address) LIKE ? OR LOWER(l.city) LIKE ? OR LOWER(l.neighborhood) LIKE ?)';
      params.push(q, q, q, q);
    }

    sql += ' ORDER BY p.featured DESC, p.created_at DESC';

    const rows = await queryAll(sql, params);
    const properties = rows.map(formatPropertyRow);
    res.json({ success: true, count: properties.length, data: properties });
  } catch (error: any) {
    console.error('[API] Error fetching properties:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/properties/admin (Admin - all statuses)
router.get('/admin', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    let sql = `${SELECT_PROPERTY_JOIN_SQL} WHERE 1=1`;
    const params: any[] = [];

    if (status && status !== 'all') {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY p.created_at DESC';

    const rows = await queryAll(sql, params);
    const properties = rows.map(formatPropertyRow);
    res.json({ success: true, count: properties.length, data: properties });
  } catch (error: any) {
    console.error('[API] Error fetching admin properties:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/properties/:id (Single property by ID or slug)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sql = `${SELECT_PROPERTY_JOIN_SQL} WHERE p.id = ? OR p.slug = ? LIMIT 1`;
    const row = await queryOne(sql, [id, id]);

    if (!row) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    res.json({ success: true, data: formatPropertyRow(row) });
  } catch (error: any) {
    console.error('[API] Error fetching property by ID:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/properties (Create new property)
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const now = new Date().toISOString();
    const id = data.id || `prop-${Date.now()}`;
    const slugBase = (data.title || 'property')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const slug = data.slug || `${slugBase}-${Math.floor(Math.random() * 1000)}`;

    const specs = data.specs || {};
    const loc = data.location || {};

    // 1. Insert property
    const insertPropertySql = `
      INSERT INTO properties (
        id, slug, title, tagline, description, price, currency, type,
        category, category_label, status, featured, verified, is_new,
        assigned_agent_id, company_id,
        specs_bedrooms, specs_bathrooms, specs_area_sqft, specs_year_built,
        specs_parking_spaces, specs_furnishing, images, amenities,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?
      )
    `;

    await execute(insertPropertySql, [
      id,
      slug,
      data.title || 'Untitled Property',
      data.tagline || '',
      data.description || '',
      Number(data.price) || 0,
      data.currency || 'INR',
      data.type || 'buy',
      data.category || 'apartment',
      data.categoryLabel || data.category || 'Apartment',
      data.status || 'draft',
      data.featured ? 1 : 0,
      data.verified ? 1 : 0,
      data.isNew ? 1 : 0,
      data.assignedAgentId || null,
      data.companyId || null,
      Number(specs.bedrooms) || 0,
      Number(specs.bathrooms) || 0,
      Number(specs.areaSqFt) || 0,
      specs.yearBuilt ? Number(specs.yearBuilt) : null,
      Number(specs.parkingSpaces) || 0,
      specs.furnishing || 'unfurnished',
      JSON.stringify(data.images || []),
      JSON.stringify(data.amenities || []),
      now,
      now,
    ]);

    // 2. Insert location
    const locationId = `loc-${id}`;
    const lat = loc.coordinates?.lat ?? data.latitude ?? null;
    const lng = loc.coordinates?.lng ?? data.longitude ?? null;

    const insertLocationSql = `
      INSERT INTO property_locations (
        id, property_id, address, society, neighborhood, city, state, pincode,
        latitude, longitude, google_place_id, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `;

    await execute(insertLocationSql, [
      locationId,
      id,
      loc.address || data.address || '',
      loc.neighborhood || data.society || '',
      loc.neighborhood || '',
      loc.city || data.city || '',
      loc.state || data.state || '',
      loc.pincode || data.pincode || '',
      lat !== null ? Number(lat) : null,
      lng !== null ? Number(lng) : null,
      data.googlePlaceId || null,
      now,
    ]);

    // Fetch newly created property
    const createdRow = await queryOne(`${SELECT_PROPERTY_JOIN_SQL} WHERE p.id = ?`, [id]);
    res.status(201).json({ success: true, data: formatPropertyRow(createdRow) });
  } catch (error: any) {
    console.error('[API] Error creating property:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/properties/:id (Update existing property)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const now = new Date().toISOString();

    const existing = await queryOne('SELECT id FROM properties WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const specs = data.specs || {};
    const loc = data.location || {};

    const updatePropertySql = `
      UPDATE properties SET
        title = COALESCE(?, title),
        tagline = COALESCE(?, tagline),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        currency = COALESCE(?, currency),
        type = COALESCE(?, type),
        category = COALESCE(?, category),
        category_label = COALESCE(?, category_label),
        status = COALESCE(?, status),
        featured = COALESCE(?, featured),
        verified = COALESCE(?, verified),
        assigned_agent_id = COALESCE(?, assigned_agent_id),
        specs_bedrooms = COALESCE(?, specs_bedrooms),
        specs_bathrooms = COALESCE(?, specs_bathrooms),
        specs_area_sqft = COALESCE(?, specs_area_sqft),
        specs_parking_spaces = COALESCE(?, specs_parking_spaces),
        specs_furnishing = COALESCE(?, specs_furnishing),
        images = COALESCE(?, images),
        amenities = COALESCE(?, amenities),
        updated_at = ?
      WHERE id = ?
    `;

    await execute(updatePropertySql, [
      data.title,
      data.tagline,
      data.description,
      data.price !== undefined ? Number(data.price) : null,
      data.currency,
      data.type,
      data.category,
      data.categoryLabel,
      data.status,
      data.featured !== undefined ? (data.featured ? 1 : 0) : null,
      data.verified !== undefined ? (data.verified ? 1 : 0) : null,
      data.assignedAgentId,
      specs.bedrooms !== undefined ? Number(specs.bedrooms) : null,
      specs.bathrooms !== undefined ? Number(specs.bathrooms) : null,
      specs.areaSqFt !== undefined ? Number(specs.areaSqFt) : null,
      specs.parkingSpaces !== undefined ? Number(specs.parkingSpaces) : null,
      specs.furnishing,
      data.images ? JSON.stringify(data.images) : null,
      data.amenities ? JSON.stringify(data.amenities) : null,
      now,
      id,
    ]);

    // Update location if provided
    if (data.location || data.latitude !== undefined || data.longitude !== undefined) {
      const lat = loc.coordinates?.lat ?? data.latitude ?? null;
      const lng = loc.coordinates?.lng ?? data.longitude ?? null;

      // Delete old location and re-insert for consistency across engines
      await execute('DELETE FROM property_locations WHERE property_id = ?', [id]);
      const insertLocSql = `
        INSERT INTO property_locations (
          id, property_id, address, society, neighborhood, city, state, pincode,
          latitude, longitude, google_place_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await execute(insertLocSql, [
        `loc-${id}`,
        id,
        loc.address || '',
        loc.neighborhood || '',
        loc.neighborhood || '',
        loc.city || '',
        loc.state || '',
        loc.pincode || '',
        lat !== null ? Number(lat) : null,
        lng !== null ? Number(lng) : null,
        data.googlePlaceId || null,
        now,
      ]);
    }

    const updatedRow = await queryOne(`${SELECT_PROPERTY_JOIN_SQL} WHERE p.id = ?`, [id]);
    res.json({ success: true, data: formatPropertyRow(updatedRow) });
  } catch (error: any) {
    console.error('[API] Error updating property:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/properties/:id/status (Update publish status)
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const now = new Date().toISOString();

    await execute('UPDATE properties SET status = ?, updated_at = ? WHERE id = ?', [status, now, id]);
    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (error: any) {
    console.error('[API] Error updating status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/properties/:id/toggle-verified
router.patch('/:id/toggle-verified', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const now = new Date().toISOString();
    await execute('UPDATE properties SET verified = CASE WHEN verified = 1 THEN 0 ELSE 1 END, updated_at = ? WHERE id = ?', [now, id]);
    res.json({ success: true, message: 'Verified status toggled' });
  } catch (error: any) {
    console.error('[API] Error toggling verified:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/properties/:id/toggle-featured
router.patch('/:id/toggle-featured', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const now = new Date().toISOString();
    await execute('UPDATE properties SET featured = CASE WHEN featured = 1 THEN 0 ELSE 1 END, updated_at = ? WHERE id = ?', [now, id]);
    res.json({ success: true, message: 'Featured status toggled' });
  } catch (error: any) {
    console.error('[API] Error toggling featured:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/properties/:id/duplicate
router.post('/:id/duplicate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const original = await queryOne(`${SELECT_PROPERTY_JOIN_SQL} WHERE p.id = ?`, [id]);
    if (!original) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const newId = `prop-${Date.now()}`;
    const newSlug = `${original.slug}-copy-${Date.now().toString().slice(-4)}`;
    const newTitle = `Copy of ${original.title}`;
    const now = new Date().toISOString();

    const insertPropSql = `
      INSERT INTO properties (
        id, slug, title, tagline, description, price, currency, type, category, category_label,
        status, featured, verified, verification_status, is_new, assigned_agent_id, company_id,
        specs_bedrooms, specs_bathrooms, specs_area_sqft, specs_year_built, specs_parking_spaces,
        specs_furnishing, images, amenities, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await execute(insertPropSql, [
      newId,
      newSlug,
      newTitle,
      original.tagline || '',
      original.description,
      original.price,
      original.currency || 'INR',
      original.type,
      original.category,
      original.category_label,
      'draft',
      0,
      0,
      'draft',
      1,
      original.assigned_agent_id || null,
      original.company_id || null,
      original.specs_bedrooms,
      original.specs_bathrooms,
      original.specs_area_sqft,
      original.specs_year_built,
      original.specs_parking_spaces,
      original.specs_furnishing,
      original.images,
      original.amenities,
      now,
      now,
    ]);

    // Copy location if present
    const loc = await queryOne('SELECT * FROM property_locations WHERE property_id = ?', [id]);
    if (loc) {
      const insertLocSql = `
        INSERT INTO property_locations (
          id, property_id, address, society, neighborhood, city, state, pincode,
          latitude, longitude, google_place_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await execute(insertLocSql, [
        `loc-${newId}`,
        newId,
        loc.address,
        loc.society,
        loc.neighborhood,
        loc.city,
        loc.state,
        loc.pincode,
        loc.latitude,
        loc.longitude,
        loc.google_place_id,
        now,
      ]);
    }

    const created = await queryOne(`${SELECT_PROPERTY_JOIN_SQL} WHERE p.id = ?`, [newId]);
    res.status(201).json({ success: true, data: formatPropertyRow(created) });
  } catch (error: any) {
    console.error('[API] Error duplicating property:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/properties/:id/verification
router.patch('/:id/verification', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { verificationStatus, verificationNotes, rejectionReason } = req.body;
    const now = new Date().toISOString();

    const isVerified = verificationStatus === 'verified' ? 1 : 0;
    // Auto-publish if verified, or retain draft
    let newStatusQuery = '';
    const params: any[] = [verificationStatus, verificationNotes || '', rejectionReason || '', isVerified, now];

    if (verificationStatus === 'verified') {
      newStatusQuery = ', status = "published"';
    } else if (verificationStatus === 'rejected') {
      newStatusQuery = ', status = "draft"';
    }

    await execute(
      `UPDATE properties SET verification_status = ?, verification_notes = ?, rejection_reason = ?, verified = ? ${newStatusQuery}, updated_at = ? WHERE id = ?`,
      [...params, id]
    );

    const updated = await queryOne(`${SELECT_PROPERTY_JOIN_SQL} WHERE p.id = ?`, [id]);
    res.json({ success: true, data: formatPropertyRow(updated) });
  } catch (error: any) {
    console.error('[API] Error updating verification status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/properties/bulk-status
router.post('/bulk-status', async (req: Request, res: Response) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || !status) {
      return res.status(400).json({ success: false, message: 'Invalid ids or status' });
    }
    const now = new Date().toISOString();
    const placeholders = ids.map(() => '?').join(',');
    await execute(`UPDATE properties SET status = ?, updated_at = ? WHERE id IN (${placeholders})`, [status, now, ...ids]);
    res.json({ success: true, message: `Updated ${ids.length} properties to ${status}` });
  } catch (error: any) {
    console.error('[API] Error bulk updating status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/properties/bulk-delete
router.post('/bulk-delete', async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid ids' });
    }
    const placeholders = ids.map(() => '?').join(',');
    await execute(`DELETE FROM property_locations WHERE property_id IN (${placeholders})`, ids);
    await execute(`DELETE FROM properties WHERE id IN (${placeholders})`, ids);
    res.json({ success: true, message: `Deleted ${ids.length} properties` });
  } catch (error: any) {
    console.error('[API] Error bulk deleting properties:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/properties/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await execute('DELETE FROM property_locations WHERE property_id = ?', [id]);
    await execute('DELETE FROM properties WHERE id = ?', [id]);
    res.json({ success: true, message: 'Property deleted successfully' });
  } catch (error: any) {
    console.error('[API] Error deleting property:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
