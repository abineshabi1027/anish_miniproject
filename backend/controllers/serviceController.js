const pool = require('../config/db');

// Get services for an organization
const getServicesByOrg = async (req, res) => {
  try {
    const { organizationId } = req.params;

    const [services] = await pool.query(
      `SELECT s.*, 
        o.name as organization_name,
        (SELECT COUNT(*) FROM queue_tokens qt 
         WHERE qt.service_id = s.id AND qt.token_date = CURDATE() AND qt.status IN ('WAITING', 'NEAR_TURN')
        ) as waiting_count,
        (SELECT qt2.token_number FROM queue_tokens qt2 
         WHERE qt2.service_id = s.id AND qt2.token_date = CURDATE() AND qt2.status = 'SERVING'
         ORDER BY qt2.called_at DESC LIMIT 1
        ) as current_serving_token
       FROM services s
       JOIN organizations o ON s.organization_id = o.id
       WHERE s.organization_id = ?
       ORDER BY s.id ASC`,
      [organizationId]
    );

    const enriched = services.map(s => ({
      ...s,
      estimated_wait_minutes: (s.waiting_count || 0) * (s.average_service_time || 15)
    }));

    res.json({
      success: true,
      services: enriched
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve services', error: error.message });
  }
};

// Admin: Create service
const createService = async (req, res) => {
  try {
    const { organization_id, name, token_prefix, average_service_time, max_capacity, status } = req.body;

    if (!organization_id || !name || !token_prefix) {
      return res.status(400).json({ success: false, message: 'Organization, name, and token prefix are required.' });
    }

    const [result] = await pool.query(
      `INSERT INTO services (organization_id, name, token_prefix, average_service_time, max_capacity, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        organization_id,
        name.trim(),
        token_prefix.trim().toUpperCase(),
        average_service_time || 15,
        max_capacity || 100,
        status || 'ACTIVE'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Service created successfully!',
      serviceId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create service', error: error.message });
  }
};

// Admin: Update service
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, token_prefix, average_service_time, max_capacity, status } = req.body;

    const [check] = await pool.query('SELECT id FROM services WHERE id = ?', [id]);
    if (check.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    await pool.query(
      `UPDATE services 
       SET name = COALESCE(?, name),
           token_prefix = COALESCE(?, token_prefix),
           average_service_time = COALESCE(?, average_service_time),
           max_capacity = COALESCE(?, max_capacity),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [name, token_prefix ? token_prefix.toUpperCase() : null, average_service_time, max_capacity, status, id]
    );

    res.json({ success: true, message: 'Service updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update service', error: error.message });
  }
};

// Admin: Delete service
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM services WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }
    res.json({ success: true, message: 'Service deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete service', error: error.message });
  }
};

module.exports = {
  getServicesByOrg,
  createService,
  updateService,
  deleteService
};
