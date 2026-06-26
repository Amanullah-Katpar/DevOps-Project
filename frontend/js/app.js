/* ─────────────────────────────────────────────────────────────
   DevFlow Frontend JavaScript
   Handles: Auth, API calls, Particles, Dashboard, Charts
───────────────────────────────────────────────────────────── */

// Detect runtime context:
// - file:// or localhost → direct backend on :5000
// - any other host      → nginx reverse proxy serves /api/
const IS_LOCAL = window.location.protocol === 'file:'
  || window.location.hostname === 'localhost'
  || window.location.hostname === '127.0.0.1'
  || window.location.hostname === '';

const API_BASE = IS_LOCAL ? 'http://localhost:5000/api' : '/api';

console.info(`[DevFlow] API_BASE = ${API_BASE} (protocol: ${window.location.protocol})`);

// ─── Token Management ──────────────────────────────────────────────────
const getToken  = ()         => localStorage.getItem('devflow_token');
const setToken  = (token)    => localStorage.setItem('devflow_token', token);
const setUser   = (user)     => localStorage.setItem('devflow_user', JSON.stringify(user));
const getUser   = ()         => { try { return JSON.parse(localStorage.getItem('devflow_user')); } catch { return null; } };
const clearAuth = ()         => { localStorage.removeItem('devflow_token'); localStorage.removeItem('devflow_user'); };

// ─── API Helper ────────────────────────────────────────────────────────
async function api(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch (networkErr) {
    // Network error — backend is not reachable
    throw {
      status: 0,
      message: `Cannot connect to backend (${API_BASE}). Make sure the server is running:\n  cd backend && npm run dev`,
      data: {}
    };
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, message: data.message || 'Request failed', data };
  return data;
}

// ─── Connection Banner ──────────────────────────────────────────────────
async function checkAPIConnection() {
  try {
    await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(4000) });
    // Connected — remove banner if present
    const banner = document.getElementById('connectionBanner');
    if (banner) banner.remove();
  } catch {
    // Show a prominent banner
    const existing = document.getElementById('connectionBanner');
    if (existing) return;
    const banner = document.createElement('div');
    banner.id = 'connectionBanner';
    banner.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:9999',
      'background:linear-gradient(135deg,#ef4444,#b91c1c)',
      'color:#fff', 'padding:12px 20px', 'text-align:center',
      'font-size:0.875rem', 'font-weight:600', 'letter-spacing:0.02em',
      'box-shadow:0 4px 20px rgba(239,68,68,0.5)'
    ].join(';');
    banner.innerHTML = [
      '⚠️ Backend not reachable at <code style="background:rgba(0,0,0,0.3);padding:2px 8px;border-radius:4px">' + API_BASE + '</code>&nbsp;',
      '&nbsp;Start the backend: <code style="background:rgba(0,0,0,0.3);padding:2px 8px;border-radius:4px">cd backend &amp;&amp; npm run dev</code>',
      '&nbsp;&nbsp;OR&nbsp;&nbsp;',
      '<code style="background:rgba(0,0,0,0.3);padding:2px 8px;border-radius:4px">docker-compose up -d</code>'
    ].join(' ');
    document.body.prepend(banner);
  }
}

// ─── Toast Notification ────────────────────────────────────────────────
function toast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(el);

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(100%)';
    el.style.transition = 'all 0.3s ease';
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

// ─── Particle Canvas ───────────────────────────────────────────────────
function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x      = Math.random() * canvas.width;
      this.y      = Math.random() * canvas.height;
      this.vx     = (Math.random() - 0.5) * 0.4;
      this.vy     = (Math.random() - 0.5) * 0.4;
      this.size   = Math.random() * 2 + 0.5;
      this.alpha  = Math.random() * 0.5 + 0.1;
      this.colors = ['108,99,255', '168,85,247', '34,211,238', '16,185,129'];
      this.color  = this.colors[Math.floor(Math.random() * this.colors.length)];
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color},${this.alpha})`;
      ctx.fill();
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
    }
  }

  for (let i = 0; i < 80; i++) particles.push(new Particle());

  function drawLines() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(108,99,255,${0.08 * (1 - dist / 100)})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    drawLines();
    requestAnimationFrame(animate);
  }
  animate();
}

// ─── Counter Animation ─────────────────────────────────────────────────
function animateCounters() {
  document.querySelectorAll('[data-target]').forEach(el => {
    const target = parseInt(el.getAttribute('data-target'));
    let current = 0;
    const step = target / 40;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current);
      if (current >= target) clearInterval(timer);
    }, 30);
  });
}

// ─── Nav Scroll Effect ─────────────────────────────────────────────────
function initNavScroll() {
  const nav = document.getElementById('mainNav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });
}

// ─── Mobile Nav Toggle ─────────────────────────────────────────────────
function initNavToggle() {
  const toggle   = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    navLinks && navLinks.classList.toggle('open');
  });
}

// ─── Auth Modal (Landing Page) ─────────────────────────────────────────
function initAuthModal() {
  const modal       = document.getElementById('authModal');
  const loginBtn    = document.getElementById('loginBtn');
  const signupBtn   = document.getElementById('signupBtn');
  const heroSignup  = document.getElementById('heroSignupBtn');
  const ctaSignup   = document.getElementById('ctaSignupBtn');
  const modalClose  = document.getElementById('modalClose');
  const loginTab    = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');
  const loginForm   = document.getElementById('loginForm');
  const regForm     = document.getElementById('registerForm');
  if (!modal) return;

  const openModal = (tab = 'login') => {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    switchTab(tab);
  };
  const closeModal = () => {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  };
  const switchTab = (tab) => {
    loginTab.classList.toggle('active', tab === 'login');
    registerTab.classList.toggle('active', tab === 'register');
    loginForm.classList.toggle('hidden', tab !== 'login');
    regForm.classList.toggle('hidden', tab !== 'register');
  };

  loginBtn   && loginBtn.addEventListener('click',   () => openModal('login'));
  signupBtn  && signupBtn.addEventListener('click',  () => openModal('register'));
  heroSignup && heroSignup.addEventListener('click', () => openModal('register'));
  ctaSignup  && ctaSignup.addEventListener('click',  () => openModal('register'));
  modalClose && modalClose.addEventListener('click', closeModal);
  loginTab   && loginTab.addEventListener('click',   () => switchTab('login'));
  registerTab && registerTab.addEventListener('click', () => switchTab('register'));

  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  // ── Login Submit ──
  loginForm && loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('loginError');
    errEl.textContent = '';
    const btn = document.getElementById('loginSubmit');
    btn.disabled = true;
    btn.querySelector('.btn-text').textContent = 'Signing in...';
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email:    document.getElementById('loginEmail').value,
          password: document.getElementById('loginPassword').value
        })
      });
      setToken(data.token);
      setUser(data.user);
      closeModal();
      window.location.href = 'dashboard.html';
    } catch (err) {
      errEl.textContent = err.message || 'Login failed';
    } finally {
      btn.disabled = false;
      btn.querySelector('.btn-text').textContent = 'Sign In';
    }
  });

  // ── Register Submit ──
  regForm && regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('registerError');
    errEl.textContent = '';
    const btn = document.getElementById('registerSubmit');
    btn.disabled = true;
    btn.querySelector('.btn-text').textContent = 'Creating account...';
    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: document.getElementById('regUsername').value,
          email:    document.getElementById('regEmail').value,
          password: document.getElementById('regPassword').value
        })
      });
      setToken(data.token);
      setUser(data.user);
      closeModal();
      window.location.href = 'dashboard.html';
    } catch (err) {
      errEl.textContent = err.message || 'Registration failed';
    } finally {
      btn.disabled = false;
      btn.querySelector('.btn-text').textContent = 'Create Account';
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════
// DASHBOARD LOGIC
// ═══════════════════════════════════════════════════════════════════════

let allTasks    = [];
let allProjects = [];
let statusChart = null;
let priorityChart = null;

// ─── Auth Guard ────────────────────────────────────────────────────────
function authGuard() {
  if (!getToken()) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

// ─── Populate User Info ────────────────────────────────────────────────
function populateUserInfo() {
  const user = getUser();
  if (!user) return;
  const nameEl   = document.getElementById('userName');
  const roleEl   = document.getElementById('userRole');
  const avatarEl = document.getElementById('userAvatar');
  if (nameEl)   nameEl.textContent   = user.username || 'User';
  if (roleEl)   roleEl.textContent   = user.role || 'user';
  if (avatarEl) avatarEl.textContent = (user.username || 'U')[0].toUpperCase();
}

// ─── Section Navigation ────────────────────────────────────────────────
function initNavigation() {
  const links = document.querySelectorAll('[data-section]');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.getAttribute('data-section');
      showSection(section);
      // Close sidebar on mobile
      if (window.innerWidth < 768) {
        document.getElementById('sidebar').classList.remove('open');
      }
    });
  });

  document.getElementById('sidebarToggle') && document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });
}

function showSection(name) {
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));

  const section = document.getElementById(`section-${name}`);
  const navLink = document.getElementById(`nav-${name}`);
  if (section) section.classList.add('active');
  if (navLink) navLink.classList.add('active');

  const titles = { overview: 'Overview', tasks: 'Tasks', projects: 'Projects', analytics: 'Analytics' };
  const subtitles = { overview: 'Your dashboard at a glance', tasks: 'Manage your tasks', projects: 'All your projects', analytics: 'Insights & metrics' };
  document.getElementById('pageTitle').textContent    = titles[name] || name;
  document.getElementById('pageSubtitle').textContent = subtitles[name] || '';

  if (name === 'analytics') {
    loadHealthData();
    renderAnalyticsCharts();
  }
}

// ─── Fetch & Render Tasks ──────────────────────────────────────────────
async function loadTasks() {
  try {
    const data = await api('/tasks?limit=100');
    allTasks = data.tasks || [];
    renderRecentTasks();
    renderKanban();
    updateStats();
    updateTaskBadge();
  } catch (err) {
    if (err.status === 401) { clearAuth(); window.location.href = 'index.html'; }
  }
}

function updateStats() {
  const total   = allTasks.length;
  const inProg  = allTasks.filter(t => t.status === 'in-progress').length;
  const done    = allTasks.filter(t => t.status === 'done').length;
  const overdue = allTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length;

  animateCount('totalTasks',    total);
  animateCount('inProgressTasks', inProg);
  animateCount('doneTasks',     done);
  animateCount('overdueTasks',  overdue);

  renderStatusChart();
  renderPriorityChart();
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let current = 0;
  const step = Math.max(1, Math.ceil(target / 30));
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 30);
}

function updateTaskBadge() {
  const badge = document.getElementById('taskBadge');
  if (badge) badge.textContent = allTasks.filter(t => t.status !== 'done').length;
}

// ─── Status Chart ──────────────────────────────────────────────────────
function renderStatusChart() {
  const canvas = document.getElementById('statusChart');
  if (!canvas) return;
  const counts = { todo: 0, 'in-progress': 0, review: 0, done: 0 };
  allTasks.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });

  if (statusChart) statusChart.destroy();
  statusChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['To Do', 'In Progress', 'Review', 'Done'],
      datasets: [{
        data: Object.values(counts),
        backgroundColor: ['rgba(148,163,184,0.4)', 'rgba(245,158,11,0.4)', 'rgba(34,211,238,0.4)', 'rgba(16,185,129,0.4)'],
        borderColor:     ['#94a3b8', '#f59e0b', '#22d3ee', '#10b981'],
        borderWidth: 2,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', stepSize: 1 }, beginAtZero: true }
      }
    }
  });
}

// ─── Priority Chart ────────────────────────────────────────────────────
function renderPriorityChart() {
  const canvas = document.getElementById('priorityChart');
  if (!canvas) return;
  const counts = { low: 0, medium: 0, high: 0, critical: 0 };
  allTasks.forEach(t => { if (counts[t.priority] !== undefined) counts[t.priority]++; });

  if (priorityChart) priorityChart.destroy();
  priorityChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['Low', 'Medium', 'High', 'Critical'],
      datasets: [{
        data: Object.values(counts),
        backgroundColor: ['rgba(16,185,129,0.6)', 'rgba(245,158,11,0.6)', 'rgba(239,68,68,0.6)', 'rgba(239,68,68,0.9)'],
        borderColor: ['#10b981', '#f59e0b', '#ef4444', '#ef4444'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '65%',
      plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 12, font: { size: 11 } } } }
    }
  });
}

// ─── Render Recent Tasks ───────────────────────────────────────────────
function renderRecentTasks(tasks) {
  const tbody = document.getElementById('recentTaskBody');
  if (!tbody) return;
  const list = (tasks || allTasks).slice(0, 8);

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No tasks yet. Create your first task!</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(t => `
    <tr>
      <td><strong>${escHtml(t.title)}</strong></td>
      <td><span class="badge badge-${t.status.replace('-','')}">${formatStatus(t.status)}</span></td>
      <td><span class="badge badge-${t.priority}">${t.priority}</span></td>
      <td>${formatDate(t.createdAt)}</td>
      <td>
        <button class="icon-btn" onclick="openEditTask('${t._id}')" title="Edit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="icon-btn delete" onclick="deleteTask('${t._id}')" title="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
        </button>
      </td>
    </tr>
  `).join('');
}

// ─── Kanban Board ──────────────────────────────────────────────────────
function renderKanban() {
  const statuses = ['todo', 'in-progress', 'review', 'done'];
  statuses.forEach(status => {
    const container = document.getElementById(`tasks-${status}`);
    const countEl   = document.getElementById(`count-${status}`);
    if (!container) return;

    const filtered = allTasks.filter(t => t.status === status);
    if (countEl) countEl.textContent = filtered.length;

    container.innerHTML = filtered.length === 0
      ? `<div style="text-align:center;color:var(--clr-text-3);font-size:0.8rem;padding:20px;">No tasks</div>`
      : filtered.map(t => `
        <div class="kanban-task-card" onclick="openEditTask('${t._id}')">
          <div class="kanban-task-title">${escHtml(t.title)}</div>
          <div class="kanban-task-meta">
            <span class="badge badge-${t.priority}">${t.priority}</span>
            ${t.dueDate ? `<span style="font-size:0.72rem;color:var(--clr-text-3);">${formatDate(t.dueDate)}</span>` : ''}
          </div>
          <div class="kanban-task-actions" onclick="event.stopPropagation()">
            <button class="icon-btn delete" onclick="deleteTask('${t._id}')" title="Delete">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            </button>
          </div>
        </div>
      `).join('');
  });
}

// ─── Task Modal ────────────────────────────────────────────────────────
function initTaskModal() {
  const modal    = document.getElementById('taskModal');
  const closeBtn = document.getElementById('taskModalClose');
  const cancelBtn= document.getElementById('taskCancelBtn');
  const form     = document.getElementById('taskForm');
  const addBtn   = document.getElementById('addTaskBtn');
  const addBtn2  = document.getElementById('addTaskBtn2');
  if (!modal) return;

  const openModal = () => {
    document.getElementById('taskId').value       = '';
    document.getElementById('taskTitle').value    = '';
    document.getElementById('taskDesc').value     = '';
    document.getElementById('taskStatus').value   = 'todo';
    document.getElementById('taskPriority').value = 'medium';
    document.getElementById('taskDueDate').value  = '';
    document.getElementById('taskModalTitle').textContent = 'New Task';
    document.getElementById('taskFormError').textContent  = '';
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };
  const closeModal = () => {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  };

  addBtn  && addBtn.addEventListener('click',  openModal);
  addBtn2 && addBtn2.addEventListener('click', openModal);
  closeBtn  && closeBtn.addEventListener('click',  closeModal);
  cancelBtn && cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  form && form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('taskFormError');
    errEl.textContent = '';
    const btn = document.getElementById('taskSubmitBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const id = document.getElementById('taskId').value;
    const body = {
      title:       document.getElementById('taskTitle').value,
      description: document.getElementById('taskDesc').value,
      status:      document.getElementById('taskStatus').value,
      priority:    document.getElementById('taskPriority').value,
      dueDate:     document.getElementById('taskDueDate').value || undefined
    };

    try {
      if (id) {
        await api(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) });
        toast('Task updated!', 'success');
      } else {
        await api('/tasks', { method: 'POST', body: JSON.stringify(body) });
        toast('Task created!', 'success');
      }
      closeModal();
      await loadTasks();
    } catch (err) {
      errEl.textContent = err.message || 'Failed to save task';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save Task';
    }
  });
}

window.openEditTask = function(taskId) {
  const task = allTasks.find(t => t._id === taskId);
  if (!task) return;
  const modal = document.getElementById('taskModal');
  document.getElementById('taskId').value       = task._id;
  document.getElementById('taskTitle').value    = task.title;
  document.getElementById('taskDesc').value     = task.description || '';
  document.getElementById('taskStatus').value   = task.status;
  document.getElementById('taskPriority').value = task.priority;
  document.getElementById('taskDueDate').value  = task.dueDate ? task.dueDate.split('T')[0] : '';
  document.getElementById('taskModalTitle').textContent = 'Edit Task';
  document.getElementById('taskFormError').textContent  = '';
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
};

window.deleteTask = async function(taskId) {
  if (!confirm('Delete this task?')) return;
  try {
    await api(`/tasks/${taskId}`, { method: 'DELETE' });
    toast('Task deleted', 'success');
    await loadTasks();
  } catch (err) {
    toast(err.message || 'Failed to delete', 'error');
  }
};

// ─── Projects ──────────────────────────────────────────────────────────
async function loadProjects() {
  try {
    const data = await api('/projects');
    allProjects = data.projects || [];
    renderProjects();
  } catch (err) {
    console.error('Projects load error:', err);
  }
}

function renderProjects() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  if (allProjects.length === 0) {
    grid.innerHTML = `
      <div class="empty-card glass-card">
        <div style="font-size:2rem;margin-bottom:12px;">📁</div>
        <h3 style="margin-bottom:8px;">No Projects Yet</h3>
        <p style="color:var(--clr-text-2);font-size:0.85rem;">Create your first project to organize your tasks.</p>
      </div>`;
    return;
  }

  grid.innerHTML = allProjects.map(p => `
    <div class="project-card glass-card" style="--proj-color:${p.color || '#6c63ff'}">
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${p.color || '#6c63ff'};border-radius:16px 16px 0 0;"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <div class="project-name">${escHtml(p.name)}</div>
        <span class="badge badge-${p.status}">${p.status}</span>
      </div>
      <div class="project-desc">${escHtml(p.description || 'No description')}</div>
      <div class="project-progress">
        <div class="progress-label">
          <span>Progress</span>
          <span>${p.progress || 0}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${p.progress || 0}%;background:${p.color || '#6c63ff'};"></div>
        </div>
      </div>
      <div class="project-meta">
        <span style="font-size:0.75rem;color:var(--clr-text-3);">${p.taskCount || 0} tasks · ${p.completedCount || 0} done</span>
        <button class="icon-btn delete" onclick="deleteProject('${p._id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>
    </div>
  `).join('');
}

function initProjectModal() {
  const modal     = document.getElementById('projectModal');
  const closeBtn  = document.getElementById('projectModalClose');
  const cancelBtn = document.getElementById('projectCancelBtn');
  const form      = document.getElementById('projectForm');
  const addBtn    = document.getElementById('addProjectBtn');
  if (!modal) return;

  const openModal  = () => { modal.classList.remove('hidden'); document.body.style.overflow = 'hidden'; };
  const closeModal = () => { modal.classList.add('hidden');    document.body.style.overflow = ''; };

  addBtn   && addBtn.addEventListener('click', openModal);
  closeBtn  && closeBtn.addEventListener('click', closeModal);
  cancelBtn && cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  form && form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('projectFormError');
    errEl.textContent = '';
    try {
      await api('/projects', {
        method: 'POST',
        body: JSON.stringify({
          name:        document.getElementById('projectName').value,
          description: document.getElementById('projectDesc').value,
          status:      document.getElementById('projectStatus').value,
          color:       document.getElementById('projectColor').value
        })
      });
      toast('Project created!', 'success');
      closeModal();
      form.reset();
      await loadProjects();
    } catch (err) {
      errEl.textContent = err.message || 'Failed to create project';
    }
  });
}

window.deleteProject = async function(id) {
  if (!confirm('Delete this project? Tasks will be unlinked.')) return;
  try {
    await api(`/projects/${id}`, { method: 'DELETE' });
    toast('Project deleted', 'success');
    await loadProjects();
  } catch (err) {
    toast(err.message || 'Failed to delete project', 'error');
  }
};

// ─── Analytics Charts ──────────────────────────────────────────────────
function renderAnalyticsCharts() {
  const trendCanvas = document.getElementById('trendChart');
  const doughnutCanvas = document.getElementById('priorityDoughnut');

  // Trend Chart (mock weekly data based on actual tasks)
  if (trendCanvas) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const doneCounts = days.map((_, i) => {
      const day = new Date(); day.setDate(day.getDate() - (6 - i));
      return allTasks.filter(t => t.completedAt && new Date(t.completedAt).toDateString() === day.toDateString()).length;
    });

    if (window._trendChart) window._trendChart.destroy();
    window._trendChart = new Chart(trendCanvas, {
      type: 'line',
      data: {
        labels: days,
        datasets: [{
          label: 'Tasks Completed',
          data: doneCounts,
          borderColor: '#6c63ff',
          backgroundColor: 'rgba(108,99,255,0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#6c63ff',
          pointRadius: 5
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', stepSize: 1 }, beginAtZero: true }
        }
      }
    });
  }

  // Priority Doughnut
  if (doughnutCanvas) {
    const counts = { low: 0, medium: 0, high: 0, critical: 0 };
    allTasks.forEach(t => { if (counts[t.priority] !== undefined) counts[t.priority]++; });

    if (window._priorityDoughnut) window._priorityDoughnut.destroy();
    window._priorityDoughnut = new Chart(doughnutCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Low', 'Medium', 'High', 'Critical'],
        datasets: [{
          data: Object.values(counts),
          backgroundColor: ['rgba(16,185,129,0.7)', 'rgba(245,158,11,0.7)', 'rgba(239,68,68,0.7)', 'rgba(239,68,68,0.95)'],
          borderColor: '#0a0a14',
          borderWidth: 3
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '60%',
        plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 16 } } }
      }
    });
  }
}

// ─── Health Data ───────────────────────────────────────────────────────
async function loadHealthData() {
  try {
    const data = await api('/health');
    const setVal = (id, val, cls) => {
      const el = document.getElementById(id);
      if (el) { el.textContent = val; el.className = `health-value ${cls || ''}`; }
    };
    setVal('apiStatus',   data.status || 'unknown', data.status === 'ok' ? 'ok' : 'error');
    setVal('dbStatus',    data.database || 'unknown', data.database === 'connected' ? 'ok' : 'error');
    setVal('envStatus',   data.environment || '-');
    setVal('uptimeStatus', data.uptime || '-');
  } catch {
    ['apiStatus', 'dbStatus'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.textContent = 'Offline'; el.className = 'health-value error'; }
    });
  }
}

// ─── Search ────────────────────────────────────────────────────────────
function initSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    const filtered = allTasks.filter(t => t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q));
    renderRecentTasks(filtered);
  });
}

// ─── Logout ────────────────────────────────────────────────────────────
function initLogout() {
  const btn = document.getElementById('logoutBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    clearAuth();
    window.location.href = 'index.html';
  });
}

// ─── Helpers ───────────────────────────────────────────────────────────
function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function formatStatus(s) {
  const map = { 'todo': 'To Do', 'in-progress': 'In Progress', 'review': 'Review', 'done': 'Done' };
  return map[s] || s;
}
function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Init ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const isDashboard = document.body.classList.contains('dashboard-body');
  const isLanding   = document.body.classList.contains('landing-body');

  if (isLanding) {
    initParticles();
    animateCounters();
    initNavScroll();
    initNavToggle();
    initAuthModal();
    checkAPIConnection(); // show red banner if backend is down
    // Redirect if already logged in
    if (getToken()) {
      // Show dashboard link instead of auth buttons
      const loginBtn  = document.getElementById('loginBtn');
      const signupBtn = document.getElementById('signupBtn');
      if (loginBtn)  { loginBtn.textContent = 'Dashboard'; loginBtn.onclick = () => window.location.href = 'dashboard.html'; }
      if (signupBtn) { signupBtn.textContent = 'Go to Dashboard'; signupBtn.onclick = () => window.location.href = 'dashboard.html'; }
    }
  }

  if (isDashboard) {
    if (!authGuard()) return;
    populateUserInfo();
    initNavigation();
    initTaskModal();
    initProjectModal();
    initSearch();
    initLogout();

    // Load data
    Promise.all([loadTasks(), loadProjects()]);

    // Reload on filter change
    document.getElementById('filterStatus') && document.getElementById('filterStatus').addEventListener('change', () => {
      const status   = document.getElementById('filterStatus').value;
      const priority = document.getElementById('filterPriority').value;
      const filtered = allTasks.filter(t =>
        (!status   || t.status   === status) &&
        (!priority || t.priority === priority)
      );
      renderRecentTasks(filtered);
    });
    document.getElementById('filterPriority') && document.getElementById('filterPriority').addEventListener('change', () => {
      document.getElementById('filterStatus').dispatchEvent(new Event('change'));
    });
  }
});
