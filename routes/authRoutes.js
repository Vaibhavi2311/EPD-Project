/**
 * routes/authRoutes.js
 * POST /api/auth/register  – Create student account
 * POST /api/auth/login     – Login and receive JWT
 * GET  /api/auth/me        – Get current user profile
 */

const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const { authenticate } = require('../middleware/auth');

// ── Register ──────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });

    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists)
      return res.status(409).json({ success: false, message: 'Email already registered. Please log in.' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash, role: 'student' });

    res.status(201).json({
      success: true,
      message: 'Account created! You can now log in.',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: msg });
    }
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed.' });
  }
});

// ── Login ─────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    if (!user.isActive)
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact admin.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const secret = req.app.get('JWT_SECRET');
    const token  = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      secret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
});

// ── Me (current user) ─────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch user.' });
  }
});

module.exports = router;
