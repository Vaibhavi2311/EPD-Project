/**
 * routes/adminRoutes.js
 * Admin-only CRUD routes. All require admin role.
 *
 * GET    /api/admin/stats               – dashboard stats
 * GET    /api/admin/users               – list all users
 * PATCH  /api/admin/users/:id/toggle    – activate/deactivate user
 * POST   /api/questions (via admin)
 * PUT    /api/admin/questions/:id
 * DELETE /api/admin/questions/:id
 */

const router   = require('express').Router();
const Question = require('../models/Question');
const User     = require('../models/User');
const Notification = require('../models/Notification');
const { authenticate, authorize } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(authenticate, authorize('admin'));

// ── Dashboard Stats ───────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [totalQs, totalUsers, subjects, important, notifications] = await Promise.all([
      Question.countDocuments(),
      User.countDocuments({ role: 'student' }),
      Question.distinct('subject'),
      Question.countDocuments({ isImportant: true }),
      Notification.countDocuments(),
    ]);
    res.json({ success: true, data: {
      totalQuestions: totalQs,
      totalStudents:  totalUsers,
      totalSubjects:  subjects.length,
      importantQs:    important,
      notifications,
    }});
  } catch { res.status(500).json({ success: false, message: 'Stats fetch failed.' }); }
});

// ── List all users ────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ role: 'student' }).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch { res.status(500).json({ success: false, message: 'Failed to fetch users.' }); }
});

// ── Toggle user active status ─────────────────────────────────────
router.patch('/users/:id/toggle', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}.`, isActive: user.isActive });
  } catch { res.status(500).json({ success: false, message: 'Failed to update user.' }); }
});

// ── Add question ──────────────────────────────────────────────────
router.post('/questions', async (req, res) => {
  try {
    const { subject, topic, question, year, marks, isImportant, frequency } = req.body;
    if (!subject || !topic || !question || !year)
      return res.status(400).json({ success: false, message: 'Subject, topic, question and year are required.' });

    const q = await Question.create({ subject, topic, question, year, marks, isImportant, frequency, addedBy: req.user.id });
    res.status(201).json({ success: true, message: 'Question added!', data: q });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: msg });
    }
    res.status(500).json({ success: false, message: 'Failed to add question.' });
  }
});

// ── Update question ───────────────────────────────────────────────
router.put('/questions/:id', async (req, res) => {
  try {
    const { subject, topic, question, year, marks, isImportant, frequency } = req.body;
    const updated = await Question.findByIdAndUpdate(
      req.params.id,
      { subject, topic, question, year, marks, isImportant, frequency },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Question not found.' });
    res.json({ success: true, message: 'Question updated!', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update question.' });
  }
});

// ── Delete question ───────────────────────────────────────────────
router.delete('/questions/:id', async (req, res) => {
  try {
    const del = await Question.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ success: false, message: 'Question not found.' });
    res.json({ success: true, message: 'Question deleted.' });
  } catch { res.status(500).json({ success: false, message: 'Failed to delete question.' }); }
});

// ── Get ALL questions (admin view, with creator) ──────────────────
router.get('/questions', async (req, res) => {
  try {
    const qs = await Question.find().sort({ createdAt: -1 }).populate('addedBy', 'name email');
    res.json({ success: true, count: qs.length, data: qs });
  } catch { res.status(500).json({ success: false, message: 'Failed to fetch questions.' }); }
});

module.exports = router;
