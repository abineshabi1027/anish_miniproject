const pool = require('../config/db');

// Get all notifications for logged-in user
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const [notifications] = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 40`,
      [userId]
    );

    const [unreadCount] = await pool.query(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE`,
      [userId]
    );

    res.json({
      success: true,
      unreadCount: unreadCount[0].count,
      notifications
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Mark single notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [id, userId]);

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Mark all as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [userId]);

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
