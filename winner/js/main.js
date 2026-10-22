// ============================================================
//  MAIN UTILITIES & COMMON SCRIPTS
//  EduSched AI - System Utilities, Theme Management & Responsive
// ============================================================

function showToast(type = 'info', title = '', message = '') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = {
    success: 'fas fa-circle-check',
    error: 'fas fa-circle-exclamation',
    info: 'fas fa-circle-info',
    warning: 'fas fa-triangle-exclamation'
  };
  const toast = document.createElement('div');
  const toneClass = (type === 'warning' || type === 'error') ? 'toast-error' : (type === 'success' ? 'toast-success' : 'toast-info');
  toast.style.cursor = 'pointer';
  toast.title = 'คลิกเพื่อปิดการแจ้งเตือน';
  toast.innerHTML = `
    <i class="toast-icon ${icons[type] || icons.info}"></i>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-msg">${message}</div>` : ''}
    </div>
    <i class="fas fa-xmark" style="font-size:12px;opacity:0.5;margin-left:6px;" title="ปิด"></i>
  `;
  const dismiss = () => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 260);
  };
  toast.onclick = dismiss;
  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentElement) dismiss();
  }, 3200);
}

// ── Theme Management (Light / Dark) ─────────────────────────
function getPreferredTheme() {
  const saved = localStorage.getItem('edusched-theme');
  if (saved === 'light' || saved === 'dark') return saved;
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

function updateThemeToggleUI(theme) {
  document.querySelectorAll('#btn-theme-toggle, .btn-theme-toggle').forEach(btn => {
    if (theme === 'light') {
      btn.innerHTML = '<i class="fas fa-moon"></i>';
      btn.title = 'เปลี่ยนเป็นโหมดมืด (Dark Mode)';
      btn.setAttribute('aria-label', 'เปลี่ยนเป็นโหมดมืด');
    } else {
      btn.innerHTML = '<i class="fas fa-sun"></i>';
      btn.title = 'เปลี่ยนเป็นโหมดสว่าง (Light Mode)';
      btn.setAttribute('aria-label', 'เปลี่ยนเป็นโหมดสว่าง');
    }
  });
}

function initTheme() {
  const theme = getPreferredTheme();
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeToggleUI(theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try {
    localStorage.setItem('edusched-theme', next);
  } catch (e) {
    console.warn('localStorage not accessible for theme persistence');
  }

  updateThemeToggleUI(next);
  showToast(
    'info',
    'เปลี่ยนธีมสำเร็จ',
    next === 'light' ? 'เปิดใช้งานโหมดสว่าง (Light Mode)' : 'เปิดใช้งานโหมดมืด (Dark Mode)'
  );
}

// ── Mobile Sidebar & Responsive Drawer ──────────────────────
function setupMobileSidebar() {
  const sidebar = document.getElementById('sidebar') || document.querySelector('.sidebar');
  if (!sidebar) return;

  // Create backdrop if not exists
  let backdrop = document.querySelector('.sidebar-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);
  }

  const toggleSidebar = (open) => {
    if (open === undefined) {
      const willOpen = !sidebar.classList.contains('open');
      sidebar.classList.toggle('open', willOpen);
      backdrop.classList.toggle('active', willOpen);
    } else if (open) {
      sidebar.classList.add('open');
      backdrop.classList.add('active');
    } else {
      sidebar.classList.remove('open');
      backdrop.classList.remove('active');
    }
  };

  backdrop.addEventListener('click', () => toggleSidebar(false));

  // Add mobile hamburger button to top-header if not present
  const header = document.querySelector('.top-header');
  if (header && !header.querySelector('.mobile-menu-btn')) {
    const menuBtn = document.createElement('button');
    menuBtn.className = 'mobile-menu-btn';
    menuBtn.setAttribute('aria-label', 'เปิดเมนูนำทาง');
    menuBtn.title = 'เปิดเมนูนำทาง';
    menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    menuBtn.onclick = (e) => {
      e.stopPropagation();
      toggleSidebar();
    };
    header.insertBefore(menuBtn, header.firstChild);
  }

  // Ensure theme toggle button is present in header actions
  const headerActions = document.querySelector('.header-actions');
  if (headerActions && !headerActions.querySelector('#btn-theme-toggle')) {
    const themeBtn = document.createElement('button');
    themeBtn.className = 'icon-btn';
    themeBtn.id = 'btn-theme-toggle';
    const curTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    themeBtn.innerHTML = curTheme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    themeBtn.title = curTheme === 'light' ? 'เปลี่ยนเป็นโหมดมืด (Dark Mode)' : 'เปลี่ยนเป็นโหมดสว่าง (Light Mode)';
    themeBtn.setAttribute('aria-label', themeBtn.title);
    themeBtn.onclick = toggleTheme;
    headerActions.insertBefore(themeBtn, headerActions.firstChild);
  }

  // Close sidebar on menu item click on mobile
  sidebar.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 1024) {
        toggleSidebar(false);
      }
    });
  });
}

// ── Keyboard Accessibility & Modal Backdrop Close ───────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Close any open modal
    document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(modal => {
      modal.classList.add('hidden');
    });
    // Close mobile sidebar
    const sidebar = document.getElementById('sidebar') || document.querySelector('.sidebar');
    const backdrop = document.querySelector('.sidebar-backdrop');
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
  }
});

// Close modal when clicking outside of modal card
document.addEventListener('click', (e) => {
  if (e.target.classList && e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
  }
});

// Highlight active navigation menu and initialize features
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupMobileSidebar();

  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    const href = item.getAttribute('href');
    if (href === currentPath) {
      item.classList.add('active');
    }
  });
});

// Date formatting helper
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}