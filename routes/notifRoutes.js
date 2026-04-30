/**
 * routes/notifRoutes.js
 * GET  /api/notifications      – fetch all (auth required)
 * POST /api/notifications      – create (admin only)
 * DELETE /api/notifications/:id – delete (admin only)
 */

const router  = require('express').Router();
const Notification = require('../models/Notification');
const { authenticate, authorize } = require('../middleware/auth');

// Read: any logged-in user
router.get('/', authenticate, async (req, res) => {
  try {
    const notifs = await Notification.find().sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, data: notifs });
  } catch { res.status(500).json({ success: false, message: 'Failed to fetch notifications.' }); }
});

// Create: admin only
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { title, message, type } = req.body;
    if (!title || !message)
      return res.status(400).json({ success: false, message: 'Title and message are required.' });
    const notif = await Notification.create({ title, message, type, createdBy: req.user.id });
    res.status(201).json({ success: true, message: 'Notification sent!', data: notif });
  } catch { res.status(500).json({ success: false, message: 'Failed to create notification.' }); }
});

// Delete: admin only
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Notification deleted.' });
  } catch { res.status(500).json({ success: false, message: 'Failed to delete notification.' }); }
});

module.exports = router;
