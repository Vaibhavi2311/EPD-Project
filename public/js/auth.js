/**
 * js/auth.js
 * Shared helpers used by all pages:
 * - toast, setErr, clearErrors, setBusy
 * - getToken, getUser, requireAuth, requireAdmin
 * - logout
 */

// ── Token / User helpers ──────────────────────────────────
function getToken()  { return localStorage.getItem('token'); }
function getUser()   {
  try { return JSON.parse(localStorage.getItem('user')); }
  catch { return null; }
}

function requireAuth() {
  if (!getToken()) { window.location.href = '/login'; return false; }
  return true;
}

function requireAdmin() {
  const u = getUser();
  if (!getToken() || !u || u.role !== 'admin') {
    window.location.href = '/login'; return false;
  }
  return true;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

// ── Fetch wrapper (adds Bearer token) ─────────────────────
async function authFetch(url, opts = {}) {
  const token = getToken();
  opts.headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, opts);
  // Auto-logout on 401
  if (res.status === 401) { logout(); return; }
  return res;
}

// ── Toast ─────────────────────────────────────────────────
let _toastTimer = null;
function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  if (!el) return;
  clearTimeout(_toastTimer);
  el.textContent = msg;
  el.className = `toast ${type} show`;
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
}

// ── Validation helpers ────────────────────────────────────
function setErr(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
  // Mark input invalid
  const fieldId = id.replace('err-', '');
  const inp = document.getElementById(fieldId);
  if (inp) inp.classList.add('invalid');
}

function clearErrors() {
  document.querySelectorAll('.field-err').forEach(e => e.textContent = '');
  document.querySelectorAll('.invalid').forEach(e => e.classList.remove('invalid'));
}

// ── Loading state for buttons ─────────────────────────────
function setBusy(busy, btnId = 'login-btn') {
  const btn  = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = busy;
  const label = btn.querySelector('.btn-label');
  const spin  = btn.querySelector('.btn-spin');
  if (label) label.textContent = busy ? 'Please wait…' : label.dataset.orig || label.textContent;
  if (spin)  spin.hidden = !busy;
}

// ── Escape HTML (XSS prevention) ─────────────────────────
function esc(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Format date ───────────────────────────────────────────
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

// ── Tab switching (used on app pages) ────────────────────
function initTabs(panels, onSwitch) {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      panels.forEach(id => {
        document.getElementById(`tab-${id}`).hidden = (id !== target);
      });
      if (onSwitch) onSwitch(target);
    });
  });
}

// ── Logout button ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const lb = document.getElementById('logout-btn');
  if (lb) lb.addEventListener('click', logout);
});
