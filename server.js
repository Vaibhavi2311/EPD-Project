/**
 * server.js
 * ─────────────────────────────────────────────────────────────────
 * SPPU Question Bank – Main Server Entry Point
 * Sets up Express, MongoDB, JWT auth, and all API routes.
 * ─────────────────────────────────────────────────────────────────
 */

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const authRoutes     = require('./routes/authRoutes');
const questionRoutes = require('./routes/questionRoutes');
const adminRoutes    = require('./routes/adminRoutes');
const notifRoutes    = require('./routes/notifRoutes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Config (in production, load from .env) ────────────────────────
const MONGO_URI  = process.env.MONGO_URI  || 'mongodb://localhost:27017/sppu_qbank';
const JWT_SECRET = process.env.JWT_SECRET || 'sppu_super_secret_key_2024';

// Export for use in middleware/routes
app.set('JWT_SECRET', JWT_SECRET);

// ── Middleware ────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/questions',     questionRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/notifications', notifRoutes);

// ── SPA Catch-all: serve frontend pages ──────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/login',     (req, res) => res.sendFile(path.join(__dirname, 'public', 'pages', 'login.html')));
app.get('/register',  (req, res) => res.sendFile(path.join(__dirname, 'public', 'pages', 'register.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'pages', 'dashboard.html')));
app.get('/admin',     (req, res) => res.sendFile(path.join(__dirname, 'public', 'pages', 'admin.html')));

// ── Global Error Handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ── MongoDB Connection ────────────────────────────────────────────
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    await seedAdmin(); // Create default admin on first run
    app.listen(PORT, () => console.log(`🚀 Server running → http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

// ── Seed Default Admin Account ────────────────────────────────────
async function seedAdmin() {
  const User = require('./models/User');
  const bcrypt = require('bcryptjs');
  const existing = await User.findOne({ email: 'admin@sppu.edu' });
  if (!existing) {
    const hash = await bcrypt.hash('Admin@123', 10);
    await User.create({
      name:     'SPPU Admin',
      email:    'admin@sppu.edu',
      password: hash,
      role:     'admin',
      isActive: true,
    });
    console.log('👤 Default admin created → admin@sppu.edu / Admin@123');
  }
}
