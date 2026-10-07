const pool = require('../config/db');

// Browse & filter organizations with live queue summary
const getOrganizations = async (req, res) => {
  try {
    const { search, category, location, status } = req.query;

    let query = `
      SELECT o.*,
        (SELECT COUNT(*) FROM services s WHERE s.organization_id = o.id AND s.status = 'ACTIVE') as active_services_count,
        (SELECT COUNT(*) FROM queue_tokens qt 
         WHERE qt.organization_id = o.id 
           AND qt.token_date = CURDATE() 
           AND qt.status IN ('WAITING', 'NEAR_TURN', 'SERVING', 'ON_HOLD')
        ) as current_queue_size
      FROM organizations o
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (o.name LIKE ? OR o.address LIKE ? OR o.location LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (category && category !== 'All') {
      query += ` AND o.category = ?`;
      params.push(category);
    }

    if (location && location !== 'All') {
      query += ` AND o.location = ?`;
      params.push(location);
    }

    if (status) {
      query += ` AND o.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY o.name ASC`;

    const [organizations] = await pool.query(query, params);

    // Compute estimated wait time based on average service time of 15 min per person
    const enriched = organizations.map(org => ({
      ...org,
      estimated_wait_minutes: Math.max(org.current_queue_size * 10, 5)
    }));

    res.json({
      success: true,
      count: enriched.length,
      organizations: enriched
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve organizations', error: error.message });
  }
};

// Get single organization details with all its services & live status
const getOrganizationById = async (req, res) => {
  try {
    const { id } = req.params;

    const [orgRows] = await pool.query('SELECT * FROM organizations WHERE id = ?', [id]);
    if (orgRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Organization not found.' });
    }
    const organization = orgRows[0];

    // Fetch branches
    const [branches] = await pool.query('SELECT * FROM branches WHERE organization_id = ?', [id]);

    // Fetch services with live queue stats
    const [services] = await pool.query(
      `SELECT s.*,
        (SELECT COUNT(*) FROM queue_tokens qt 
         WHERE qt.service_id = s.id AND qt.token_date = CURDATE() AND qt.status IN ('WAITING', 'NEAR_TURN')
        ) as waiting_count,
        (SELECT qt2.token_number FROM queue_tokens qt2 
         WHERE qt2.service_id = s.id AND qt2.token_date = CURDATE() AND qt2.status = 'SERVING'
         ORDER BY qt2.called_at DESC LIMIT 1
        ) as current_serving_token,
        (SELECT COUNT(*) FROM queue_tokens qt3 
         WHERE qt3.service_id = s.id AND qt3.token_date = CURDATE() AND qt3.status = 'COMPLETED'
        ) as completed_today
       FROM services s 
       WHERE s.organization_id = ?
       ORDER BY s.id ASC`,
      [id]
    );

    const enrichedServices = services.map(srv => ({
      ...srv,
      estimated_wait_minutes: (srv.waiting_count || 0) * (srv.average_service_time || 15)
    }));

    res.json({
      success: true,
      organization: {
        ...organization,
        branches,
        services: enrichedServices
      }
    });
  } catch (error) {
    console.error('Error fetching organization details:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Admin: Create organization
const createOrganization = async (req, res) => {
  try {
    const { name, category, address, location, phone, email, opening_time, closing_time, status } = req.body;

    if (!name || !category || !address || !location || !phone || !email) {
      return res.status(400).json({ success: false, message: 'All required fields must be supplied.' });
    }

    const [result] = await pool.query(
      `INSERT INTO organizations (name, category, address, location, phone, email, opening_time, closing_time, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        category,
        address.trim(),
        location.trim(),
        phone.trim(),
        email.trim(),
        opening_time || '09:00:00',
        closing_time || '18:00:00',
        status || 'OPEN'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Organization created successfully!',
      organizationId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create organization', error: error.message });
  }
};

// Admin: Update organization
const updateOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, address, location, phone, email, opening_time, closing_time, status } = req.body;

    const [check] = await pool.query('SELECT id FROM organizations WHERE id = ?', [id]);
    if (check.length === 0) {
      return res.status(404).json({ success: false, message: 'Organization not found.' });
    }

    await pool.query(
      `UPDATE organizations 
       SET name = COALESCE(?, name),
           category = COALESCE(?, category),
           address = COALESCE(?, address),
           location = COALESCE(?, location),
           phone = COALESCE(?, phone),
           email = COALESCE(?, email),
           opening_time = COALESCE(?, opening_time),
           closing_time = COALESCE(?, closing_time),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [name, category, address, location, phone, email, opening_time, closing_time, status, id]
    );

    res.json({
      success: true,
      message: 'Organization updated successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update organization', error: error.message });
  }
};

// Admin: Delete organization
const deleteOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM organizations WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Organization not found.' });
    }
    res.json({ success: true, message: 'Organization deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete organization', error: error.message });
  }
};

module.exports = {
  getOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization
};
