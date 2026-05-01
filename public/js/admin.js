/**
 * js/admin.js
 * Logic for the Admin Panel:
 * - Guard: require admin role
 * - Stats tab
 * - Questions tab: list, add, edit, delete, search
 * - Users tab: list, toggle active
 * - Notifications tab: send, list, delete
 */

// ── All question data (cached for search) ─────────────────
let allQuestions = [];
let editingId    = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAdmin()) return;

  // Init tabs
  const TABS = ['stats', 'questions', 'users', 'notifs'];
  initTabs(TABS, handleTabSwitch);

  // Load initial data
  loadStats();

  // ── Question modal events ────────────────────────────────
  document.getElementById('open-add-modal').addEventListener('click', openAddModal);
  document.getElementById('close-modal').addEventListener('click', closeModal);
  document.getElementById('cancel-modal').addEventListener('click', closeModal);
  document.getElementById('q-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.getElementById('q-form').addEventListener('submit', handleSaveQuestion);

  // ── Live search filter ───────────────────────────────────
  document.getElementById('admin-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = q
      ? allQuestions.filter(x =>
          x.subject.toLowerCase().includes(q) ||
          x.topic.toLowerCase().includes(q) ||
          x.question.toLowerCase().includes(q) ||
          x.year.toLowerCase().includes(q)
        )
      : allQuestions;
    renderAdminQuestions(filtered);
  });

  // ── Notification send ────────────────────────────────────
  document.getElementById('send-notif-btn').addEventListener('click', sendNotification);
});

// ── Tab switch handler ────────────────────────────────────
function handleTabSwitch(tab) {
  if (tab === 'stats')     loadStats();
  if (tab === 'questions') loadAdminQuestions();
  if (tab === 'users')     loadUsers();
  if (tab === 'notifs')    loadAdminNotifs();
}

// ════════════════════════════════════════════════════════════
// STATS
// ════════════════════════════════════════════════════════════
async function loadStats() {
  try {
    const res  = await authFetch('/api/admin/stats');
    const data = await res.json();
    if (!data.success) return;
    const s = data.data;
    document.getElementById('s-questions').textContent = s.totalQuestions;
    document.getElementById('s-students').textContent  = s.totalStudents;
    document.getElementById('s-subjects').textContent  = s.totalSubjects;
    document.getElementById('s-important').textContent = s.importantQs;
  } catch {
    showToast('Could not load stats.', 'error');
  }
}

// ════════════════════════════════════════════════════════════
// QUESTIONS
// ════════════════════════════════════════════════════════════
async function loadAdminQuestions() {
  showLoading('admin-q-loading', true);
  try {
    const res  = await authFetch('/api/admin/questions');
    const data = await res.json();
    showLoading('admin-q-loading', false);
    allQuestions = data.data || [];
    renderAdminQuestions(allQuestions);
  } catch {
    showLoading('admin-q-loading', false);
    showToast('Failed to load questions.', 'error');
  }
}

function renderAdminQuestions(list) {
  const tbody = document.getElementById('admin-q-body');
  const empty = document.getElementById('admin-q-empty');
  tbody.innerHTML = '';

  if (!list.length) {
    empty.hidden = false;
    document.getElementById('admin-q-table-wrap').style.display = 'none';
    return;
  }

  empty.hidden = true;
  document.getElementById('admin-q-table-wrap').style.display = '';

  list.forEach(q => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="badge b-subject">${esc(q.subject)}</span></td>
      <td><span class="badge b-topic">${esc(q.topic)}</span></td>
      <td class="q-cell" title="${esc(q.question)}">${esc(q.question)}</td>
      <td><span class="badge b-year">${esc(q.year)}</span></td>
      <td>${q.marks != null ? q.marks : '—'}</td>
      <td>${q.isImportant ? '⭐' : '—'}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn-icon" title="Edit" data-id="${q._id}" data-action="edit">✏️</button>
          <button class="btn-icon del" title="Delete" data-id="${q._id}" data-action="delete">🗑</button>
        </div>
      </td>
    `;

    tr.querySelector('[data-action="edit"]').addEventListener('click', () => openEditModal(q));
    tr.querySelector('[data-action="delete"]').addEventListener('click', () => deleteQuestion(q._id, tr));

    tbody.appendChild(tr);
  });
}

// ── Add modal ─────────────────────────────────────────────
function openAddModal() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'Add Question';
  document.getElementById('q-form').reset();
  document.getElementById('q-id').value = '';
  document.getElementById('q-freq').value = 1;
  clearModalErrors();
  document.getElementById('q-modal').hidden = false;
}

// ── Edit modal ────────────────────────────────────────────
function openEditModal(q) {
  editingId = q._id;
  document.getElementById('modal-title').textContent = 'Edit Question';
  document.getElementById('q-id').value        = q._id;
  document.getElementById('q-subject').value   = q.subject;
  document.getElementById('q-topic').value     = q.topic;
  document.getElementById('q-year').value      = q.year;
  document.getElementById('q-marks').value     = q.marks || '';
  document.getElementById('q-freq').value      = q.frequency || 1;
  document.getElementById('q-important').checked = q.isImportant || false;
  document.getElementById('q-text').value      = q.question;
  clearModalErrors();
  document.getElementById('q-modal').hidden = false;
}

function closeModal() {
  document.getElementById('q-modal').hidden = true;
  editingId = null;
}

function clearModalErrors() {
  ['q-subject','q-topic','q-year','q-text'].forEach(id => {
    document.getElementById(id).classList.remove('invalid');
  });
  ['err-q-subject','err-q-topic','err-q-year','err-q-text'].forEach(id => {
    document.getElementById(id).textContent = '';
  });
}

// ── Save (add or update) ──────────────────────────────────
async function handleSaveQuestion(e) {
  e.preventDefault();
  clearModalErrors();

  const subject     = document.getElementById('q-subject').value.trim();
  const topic       = document.getElementById('q-topic').value.trim();
  const year        = document.getElementById('q-year').value.trim();
  const marks       = document.getElementById('q-marks').value;
  const frequency   = document.getElementById('q-freq').value;
  const isImportant = document.getElementById('q-important').checked;
  const question    = document.getElementById('q-text').value.trim();

  let valid = true;
  if (!subject)  { setModalErr('q-subject', 'err-q-subject', 'Subject is required.'); valid = false; }
  if (!topic)    { setModalErr('q-topic',   'err-q-topic',   'Topic is required.'); valid = false; }
  if (!year)     { setModalErr('q-year',    'err-q-year',    'Year is required.'); valid = false; }
  if (!question) { setModalErr('q-text',    'err-q-text',    'Question text is required.'); valid = false; }
  if (!valid) return;

  const payload = {
    subject, topic, year, question,
    marks:       marks ? Number(marks) : null,
    frequency:   Number(frequency) || 1,
    isImportant,
  };

  setBusy(true, 'q-submit-btn');

  try {
    let res;
    if (editingId) {
      res = await authFetch(`/api/admin/questions/${editingId}`, {
        method: 'PUT', body: JSON.stringify(payload),
      });
    } else {
      res = await authFetch('/api/admin/questions', {
        method: 'POST', body: JSON.stringify(payload),
      });
    }

    const data = await res.json();
    if (!data.success) { showToast(data.message, 'error'); return; }

    showToast(data.message, 'success');
    closeModal();
    await loadAdminQuestions();
    await loadStats();

  } catch {
    showToast('Network error. Could not save question.', 'error');
  } finally {
    setBusy(false, 'q-submit-btn');
    const btn = document.getElementById('q-submit-btn');
    if (btn) {
      const lbl = btn.querySelector('.btn-label');
      if (lbl) lbl.textContent = 'Save Question';
    }
  }
}

function setModalErr(inputId, errId, msg) {
  document.getElementById(inputId).classList.add('invalid');
  document.getElementById(errId).textContent = msg;
}

// ── Delete question ───────────────────────────────────────
async function deleteQuestion(id, rowEl) {
  if (!confirm('Delete this question permanently? This cannot be undone.')) return;

  try {
    const res  = await authFetch(`/api/admin/questions/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.success) { showToast(data.message, 'error'); return; }

    // Animate row out
    rowEl.style.transition = 'opacity 0.3s';
    rowEl.style.opacity = '0';
    setTimeout(() => { rowEl.remove(); }, 300);

    // Remove from cache
    allQuestions = allQuestions.filter(q => q._id !== id);

    showToast('Question deleted.', 'success');
    loadStats();
  } catch {
    showToast('Could not delete question.', 'error');
  }
}

// ════════════════════════════════════════════════════════════
// USERS
// ════════════════════════════════════════════════════════════
async function loadUsers() {
  showLoading('users-loading', true);
  try {
    const res  = await authFetch('/api/admin/users');
    const data = await res.json();
    showLoading('users-loading', false);

    const tbody = document.getElementById('users-body');
    const empty = document.getElementById('users-empty');
    tbody.innerHTML = '';

    if (!data.data.length) { empty.hidden = false; return; }
    empty.hidden = true;

    data.data.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${esc(u.name)}</td>
        <td>${esc(u.email)}</td>
        <td>${fmtDate(u.createdAt)}</td>
        <td>
          <span class="badge ${u.isActive ? 'b-marks' : 'b-year'}">
            ${u.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>
          <button class="btn-danger" data-id="${u._id}" data-active="${u.isActive}">
            ${u.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </td>
      `;

      tr.querySelector('.btn-danger').addEventListener('click', async (e) => {
        const btn      = e.currentTarget;
        const userId   = btn.dataset.id;
        try {
          const r  = await authFetch(`/api/admin/users/${userId}/toggle`, { method: 'PATCH' });
          const d  = await r.json();
          if (!d.success) { showToast(d.message, 'error'); return; }
          showToast(d.message, 'success');
          loadUsers(); // Refresh
        } catch { showToast('Could not update user.', 'error'); }
      });

      tbody.appendChild(tr);
    });
  } catch {
    showLoading('users-loading', false);
    showToast('Could not load users.', 'error');
  }
}

// ════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ════════════════════════════════════════════════════════════
async function loadAdminNotifs() {
  try {
    const res  = await authFetch('/api/notifications');
    const data = await res.json();
    const list  = document.getElementById('notif-list');
    const empty = document.getElementById('notif-empty');
    list.innerHTML = '';

    if (!data.data.length) { empty.hidden = false; return; }
    empty.hidden = true;

    data.data.forEach(n => {
      const item = document.createElement('div');
      item.className = `notif-item ${esc(n.type)}`;
      item.innerHTML = `
        <div>
          <div class="notif-title">${esc(n.title)}</div>
          <div class="notif-msg">${esc(n.message)}</div>
          <div class="notif-date" style="margin-top:4px">${fmtDate(n.createdAt)}</div>
        </div>
        <button class="btn-icon del" data-id="${n._id}" title="Delete notification">🗑</button>
      `;

      item.querySelector('.btn-icon.del').addEventListener('click', async () => {
        try {
          const r = await authFetch(`/api/notifications/${n._id}`, { method: 'DELETE' });
          const d = await r.json();
          if (d.success) { item.remove(); showToast('Notification deleted.', 'success'); }
        } catch {}
      });

      list.appendChild(item);
    });
  } catch {}
}

async function sendNotification() {
  const title   = document.getElementById('notif-title').value.trim();
  const message = document.getElementById('notif-msg').value.trim();
  const type    = document.getElementById('notif-type').value;

  if (!title || !message) {
    showToast('Title and message are required.', 'error'); return;
  }

  const btn = document.getElementById('send-notif-btn');
  btn.disabled = true; btn.textContent = 'Sending…';

  try {
    const res  = await authFetch('/api/notifications', {
      method: 'POST', body: JSON.stringify({ title, message, type }),
    });
    const data = await res.json();
    if (!data.success) { showToast(data.message, 'error'); return; }

    showToast('Notification sent to all students!', 'success');
    document.getElementById('notif-title').value = '';
    document.getElementById('notif-msg').value   = '';
    loadAdminNotifs();
  } catch {
    showToast('Failed to send notification.', 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Send Notification';
  }
}

// ── Generic loading helper ────────────────────────────────
function showLoading(id, v) {
  const el = document.getElementById(id);
  if (el) el.hidden = !v;
}
if (!user) {
  window.location = "index.html";
}