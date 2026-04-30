/**
 * routes/questionRoutes.js
 * Read-only question endpoints for authenticated users.
 *
 * GET /api/questions              – all questions
 * GET /api/questions/filter       – filter by subject/topic/year
 * GET /api/questions/subjects     – distinct subjects
 * GET /api/questions/topics       – topics for a subject
 * GET /api/questions/important    – important/repeated questions
 * POST /api/questions/:id/save    – save a question to user's list
 */

const router = require('express').Router();
const Question = require('../models/Question');
const User     = require('../models/User');
const { authenticate } = require('../middleware/auth');

// All question routes require login
router.use(authenticate);

// ── Get distinct subjects ─────────────────────────────────────────
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Question.distinct('subject');
    res.json({ success: true, data: subjects.sort() });
  } catch { res.status(500).json({ success: false, message: 'Failed to fetch subjects.' }); }
});

// ── Get topics for a subject ──────────────────────────────────────
router.get('/topics', async (req, res) => {
  try {
    const { subject } = req.query;
    if (!subject) return res.status(400).json({ success: false, message: 'subject param required.' });
    const topics = await Question.distinct('topic', { subject });
    res.json({ success: true, data: topics.sort() });
  } catch { res.status(500).json({ success: false, message: 'Failed to fetch topics.' }); }
});

// ── Important / repeated questions ───────────────────────────────
router.get('/important', async (req, res) => {
  try {
    const qs = await Question.find({ isImportant: true }).sort({ frequency: -1, subject: 1 });
    res.json({ success: true, count: qs.length, data: qs });
  } catch { res.status(500).json({ success: false, message: 'Failed to fetch important questions.' }); }
});

// ── Filter questions ──────────────────────────────────────────────
router.get('/filter', async (req, res) => {
  try {
    const { subject, topic, year } = req.query;
    const filter = {};
    if (subject) filter.subject = { $regex: new RegExp(`^${subject}$`, 'i') };
    if (topic)   filter.topic   = { $regex: new RegExp(`^${topic}$`,   'i') };
    if (year)    filter.year    = { $regex: new RegExp(year,            'i') };
    const qs = await Question.find(filter).sort({ year: -1, createdAt: -1 });
    res.json({ success: true, count: qs.length, data: qs });
  } catch { res.status(500).json({ success: false, message: 'Filter failed.' }); }
});

// ── Get all questions ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const qs = await Question.find().sort({ subject: 1, topic: 1, year: -1 });
    res.json({ success: true, count: qs.length, data: qs });
  } catch { res.status(500).json({ success: false, message: 'Failed to fetch questions.' }); }
});

// ── Save/unsave a question ────────────────────────────────────────
router.post('/:id/save', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const qId  = req.params.id;
    const idx  = user.savedQuestions.indexOf(qId);
    let saved;
    if (idx === -1) { user.savedQuestions.push(qId); saved = true; }
    else            { user.savedQuestions.splice(idx, 1); saved = false; }
    await user.save();
    res.json({ success: true, saved, message: saved ? 'Question saved.' : 'Question unsaved.' });
  } catch { res.status(500).json({ success: false, message: 'Could not update saved questions.' }); }
});

// ── Get saved questions for current user ──────────────────────────
router.get('/saved/me', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('savedQuestions');
    res.json({ success: true, count: user.savedQuestions.length, data: user.savedQuestions });
  } catch { res.status(500).json({ success: false, message: 'Failed to fetch saved questions.' }); }
});

module.exports = router;
