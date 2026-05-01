/**
 * js/dashboard.js
 * Logic for the student dashboard:
 * - Guard: require login
 * - Browse tab: subject/topic/year filter
 * - Important tab
 * - Saved tab
 * - Notifications tab
 */

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;

  const user = getUser();

  // Show user name in header
  const nameEl = document.getElementById('user-name');
  if (nameEl && user) nameEl.textContent = user.name;

  // Redirect admin to admin panel
  if (user?.role === 'admin') { window.location.href = '/index'; return; }

  // Init tabs
  const TABS = ['browse', 'important', 'saved', 'notifications'];
  initTabs(TABS, handleTabSwitch);

  // ── Init browse tab ──────────────────────────────────────
  loadSubjects();
  loadAllQuestions();

  // ── Filter events ────────────────────────────────────────
  document.getElementById('f-subject').addEventListener('change', onSubjectChange);
  document.getElementById('search-btn').addEventListener('click', doSearch);
  document.getElementById('reset-btn').addEventListener('click', doReset);
  document.getElementById('f-year').addEventListener('keydown', e => { if (e.key==='Enter') doSearch(); });
});

// ── Tab switch handler ────────────────────────────────────
function handleTabSwitch(tab) {
  if (tab === 'important')     loadImportant();
  if (tab === 'saved')         loadSaved();
  if (tab === 'notifications') loadNotifications();
}

// ── Load subjects into dropdown ───────────────────────────
async function loadSubjects() {
  try {
    const res  = await authFetch('/api/questions/subjects');
    const data = await res.json();
    const sel  = document.getElementById('f-subject');
    sel.innerHTML = '<option value="">All Subjects</option>';
    data.data.forEach(s => {
      sel.innerHTML += `<option value="${esc(s)}">${esc(s)}</option>`;
    });
  } catch {}
}

// ── Subject → topics ─────────────────────────────────────
async function onSubjectChange() {
  const subject = document.getElementById('f-subject').value;
  const topicSel = document.getElementById('f-topic');
  topicSel.innerHTML = '<option value="">All Topics</option>';

  if (!subject) { topicSel.disabled = true; return; }

  try {
    const res  = await authFetch(`/api/questions/topics?subject=${encodeURIComponent(subject)}`);
    const data = await res.json();
    data.data.forEach(t => {
      topicSel.innerHTML += `<option value="${esc(t)}">${esc(t)}</option>`;
    });
    topicSel.disabled = false;
  } catch {}
}

// ── Load all questions ────────────────────────────────────
async function loadAllQuestions() {
  showBrowseLoading(true);
  try {
    const res  = await authFetch('/api/questions');
    const data = await res.json();
    showBrowseLoading(false);

    // Update total badge
    const tot = document.getElementById('total-q');
    if (tot) tot.textContent = data.count;

    renderQuestions(data.data, 'questions-list', 'browse-results', 'browse-empty', 'result-count');
  } catch {
    showBrowseLoading(false);
    showToast('Could not load questions.', 'error');
  }
}

// ── Search / filter ───────────────────────────────────────
async function doSearch() {
  const subject = document.getElementById('f-subject').value;
  const topic   = document.getElementById('f-topic').value;
  const year    = document.getElementById('f-year').value.trim();

  const params = new URLSearchParams();
  if (subject) params.append('subject', subject);
  if (topic)   params.append('topic',   topic);
  if (year)    params.append('year',    year);

  showBrowseLoading(true);
  try {
    const res  = await authFetch(`/api/questions/filter?${params}`);
    const data = await res.json();
    showBrowseLoading(false);
    renderQuestions(data.data, 'questions-list', 'browse-results', 'browse-empty', 'result-count');
    if (!data.count) showToast('No questions found for these filters.', 'error');
  } catch {
    showBrowseLoading(false);
    showToast('Search failed.', 'error');
  }
}

function doReset() {
  document.getElementById('f-subject').value = '';
  document.getElementById('f-topic').innerHTML = '<option value="">All Topics</option>';
  document.getElementById('f-topic').disabled = true;
  document.getElementById('f-year').value = '';
  loadAllQuestions();
}

// ── Important questions ───────────────────────────────────
async function loadImportant() {
  showLoading('important-loading', true);
  try {
    const res  = await authFetch('/api/questions/important');
    const data = await res.json();
    showLoading('important-loading', false);
    renderQuestions(data.data, 'important-list', null, 'important-empty', null);
  } catch {
    showLoading('important-loading', false);
  }
}

// ── Saved questions ───────────────────────────────────────
async function loadSaved() {
  showLoading('saved-loading', true);
  try {
    const res  = await authFetch('/api/questions/saved/me');
    const data = await res.json();
    showLoading('saved-loading', false);
    renderQuestions(data.data, 'saved-list', null, 'saved-empty', null, true);
  } catch {
    showLoading('saved-loading', false);
  }
}

// ── Notifications ─────────────────────────────────────────
async function loadNotifications() {
  showLoading('notif-loading', true);
  try {
    const res  = await authFetch('/api/notifications');
    const data = await res.json();
    showLoading('notif-loading', false);

    const list  = document.getElementById('notif-list');
    const empty = document.getElementById('notif-empty');
    list.innerHTML = '';

    if (!data.data.length) { empty.hidden = false; return; }
    empty.hidden = true;
    // Hide notification dot once viewed
    const dot = document.getElementById('notif-badge');
    if (dot) dot.hidden = true;

    data.data.forEach(n => {
      list.innerHTML += `
        <div class="notif-item ${esc(n.type)}">
          <div>
            <div class="notif-title">${esc(n.title)}</div>
            <div class="notif-msg">${esc(n.message)}</div>
          </div>
          <div class="notif-date">${fmtDate(n.createdAt)}</div>
        </div>`;
    });
  } catch {
    showLoading('notif-loading', false);
  }
}

// ── Render question cards ─────────────────────────────────
function renderQuestions(list, gridId, headerId, emptyId, countId, isSavedTab = false) {
  const grid  = document.getElementById(gridId);
  const empty = document.getElementById(emptyId);
  if (headerId) {
    const header = document.getElementById(headerId);
    if (header) header.hidden = true;
  }

  grid.innerHTML = '';
  if (!list || !list.length) {
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;

  if (headerId) {
    const header = document.getElementById(headerId);
    if (header) header.hidden = false;
  }
  if (countId) {
    const countEl = document.getElementById(countId);
    if (countEl) countEl.innerHTML = `Showing <strong>${list.length}</strong> question${list.length !== 1 ? 's' : ''}`;
  }

  // Get saved IDs from local storage (cached) for instant UI
  let savedIds = [];
  try { savedIds = JSON.parse(localStorage.getItem('savedIds') || '[]'); } catch {}

  list.forEach((q, i) => {
    const isSaved = savedIds.includes(q._id);
    const card = document.createElement('div');
    card.className = 'q-card';
    card.style.setProperty('--delay', `${i * 35}ms`);
    card.innerHTML = `
      <div class="q-top">
        <div class="q-badges">
          <span class="badge b-subject">${esc(q.subject)}</span>
          <span class="badge b-topic">${esc(q.topic)}</span>
          <span class="badge b-year">${esc(q.year)}</span>
          ${q.marks  ? `<span class="badge b-marks">${q.marks} marks</span>` : ''}
          ${q.isImportant ? `<span class="badge b-star">⭐ Important</span>` : ''}
        </div>
        <div class="q-actions-row">
          <button class="btn-icon ${isSaved ? 'saved' : ''}" title="${isSaved ? 'Unsave' : 'Save'} question" data-id="${q._id}" data-action="save">
            ${isSaved ? '🔖' : '🏷️'}
          </button>
        </div>
      </div>
      <p class="q-text">${esc(q.question)}</p>
    `;

    // Save/unsave handler
    card.querySelector('[data-action="save"]').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const id  = btn.dataset.id;
      try {
        const res  = await authFetch(`/api/questions/${id}/save`, { method: 'POST' });
        const data = await res.json();
        if (!data.success) { showToast('Could not update.', 'error'); return; }

        // Update cached IDs
        let ids = [];
        try { ids = JSON.parse(localStorage.getItem('savedIds') || '[]'); } catch {}
        if (data.saved) { if (!ids.includes(id)) ids.push(id); }
        else            { ids = ids.filter(x => x !== id); }
        localStorage.setItem('savedIds', JSON.stringify(ids));

        btn.classList.toggle('saved', data.saved);
        btn.textContent = data.saved ? '🔖' : '🏷️';
        btn.title = data.saved ? 'Unsave question' : 'Save question';
        showToast(data.message, 'success');
      } catch { showToast('Network error.', 'error'); }
    });

    grid.appendChild(card);
  });
}

// ── Loading helpers ───────────────────────────────────────
function showBrowseLoading(v) {
  document.getElementById('browse-loading').hidden = !v;
  if (v) {
    document.getElementById('questions-list').innerHTML = '';
    document.getElementById('browse-empty').hidden = true;
    document.getElementById('browse-results').hidden = true;
  }
}

function showLoading(id, v) {
  const el = document.getElementById(id);
  if (el) el.hidden = !v;
}

// ── Check for notifications on load (show dot) ────────────
(async () => {
  try {
    const res  = await authFetch('/api/notifications');
    const data = await res.json();
    if (data.data && data.data.length) {
      const dot = document.getElementById('notif-badge');
      if (dot) dot.hidden = false;
    }
  } catch {}
})();
