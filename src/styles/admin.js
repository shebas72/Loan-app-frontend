/* ========== Admin Template Core JavaScript ========== */

class AdminTemplate {
  constructor() {
    this.sidebarCollapsed = false;
    this.isDarkMode = false;
    this.init();
  }

  init() {
    this.cacheElements();
    this.bindEvents();
    this.setActivePage();
    this.initDarkMode();
    this.applyAppearanceSettings();
    this.initTabbedPages();
    this.initSettingsForm();
    this.loadChartsIfNeeded();
  }

  cacheElements() {
    this.sidebar = document.querySelector('.sidebar');
    this.mainContent = document.querySelector('.main-content');
    this.hamburger = document.querySelector('.hamburger');
    this.sidebarOverlay = document.querySelector('.sidebar-overlay');
    this.body = document.body;
    this.darkModeBtn = document.querySelector('.header-right .icon-btn:first-child');
    this.notifBtn = document.querySelector('.header-right .icon-btn:nth-child(2)');
    this.fullscreenBtn = document.getElementById('btnFullscreen');
  }

  bindEvents() {
    // Sidebar toggle
    if (this.hamburger) {
      this.hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.innerWidth <= 992) {
          this.sidebar.classList.toggle('show');
          this.sidebarOverlay.classList.toggle('show');
        } else {
          this.toggleSidebar();
        }
      });
    }

    // Sidebar overlay
    if (this.sidebarOverlay) {
      this.sidebarOverlay.addEventListener('click', () => {
        this.sidebar.classList.remove('show');
        this.sidebarOverlay.classList.remove('show');
      });
    }

    // Submenu toggles
    document.querySelectorAll('.nav-link.has-submenu').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const submenu = link.nextElementSibling;
        const arrow = link.querySelector('.arrow');
        if (submenu) {
          submenu.classList.toggle('open');
          if (arrow) arrow.classList.toggle('rotated');
        }
      });
    });

    // Dark mode toggle
    if (this.darkModeBtn) {
      this.darkModeBtn.addEventListener('click', () => {
        this.toggleDarkMode();
      });
    }

    // Fullscreen toggle
    if (this.fullscreenBtn) {
      this.fullscreenBtn.addEventListener('click', () => {
        this.toggleFullscreen();
      });
    }

    // Notification toggle
    if (this.notifBtn) {
      this.notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleNotifications();
      });
    }

    // Close notification on outside click
    document.addEventListener('click', (e) => {
      const notifDropdown = document.querySelector('.notification-dropdown');
      if (notifDropdown && notifDropdown.classList.contains('show')) {
        const notifBtnEl = this.notifBtn;
        if (notifBtnEl && !notifBtnEl.contains(e.target) && !notifDropdown.contains(e.target)) {
          notifDropdown.classList.remove('show');
        }
      }
    });

    // Window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 992) {
        this.sidebar.classList.remove('show');
        if (this.sidebarOverlay) this.sidebarOverlay.classList.remove('show');
      }
    });
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    this.body.classList.toggle('sidebar-collapsed', this.sidebarCollapsed);
  }

  setActivePage() {
    const normalize = (p) => {
      if (!p || p === '#') return '';
      return p.replace(/^(\.\.\/)+/, '').split('/').pop();
    };
    const currentPath = normalize(window.location.pathname.split('/').pop() || 'index.html');
    document.querySelectorAll('.sidebar-menu .nav-link').forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (normalize(href) === currentPath) {
        link.classList.add('active');
        const parentSubmenu = link.closest('.sub-menu');
        if (parentSubmenu) {
          parentSubmenu.classList.add('open');
          const parentArrow = parentSubmenu.previousElementSibling?.querySelector('.arrow');
          if (parentArrow) parentArrow.classList.add('rotated');
        }
      }
    });
  }

  // ========== Tabbed Pages (Settings, Helper) ==========
  initTabbedPages() {
    document.querySelectorAll('.settings-tabs, .helper-tabs').forEach(nav => {
      const tabLinks = nav.querySelectorAll('[data-bs-toggle="tab"]');
      tabLinks.forEach(link => {
        link.addEventListener('shown.bs.tab', () => {
          const hash = link.getAttribute('href');
          if (hash && hash.startsWith('#')) {
            history.replaceState(null, '', hash);
          }
        });
      });

      const hash = window.location.hash;
      if (hash) {
        const target = nav.querySelector(`[href="${hash}"]`);
        if (target) {
          bootstrap.Tab.getOrCreateInstance(target).show();
        }
      }
    });
  }

  // ========== Settings Form ==========
  initSettingsForm() {
    const generalForm = document.getElementById('settingsGeneralForm');
    if (!generalForm) return;

    this.loadSettings();
    this.applyAppearanceSettings();

    const siteUrlInput = document.getElementById('siteUrl');
    const siteUrlPreview = document.getElementById('siteUrlPreview');
    if (siteUrlInput && siteUrlPreview) {
      siteUrlInput.addEventListener('input', () => {
        const url = siteUrlInput.value.trim();
        siteUrlPreview.href = url || '#';
      });
    }

    const accentColor = document.getElementById('accentColor');
    if (accentColor) {
      accentColor.addEventListener('input', () => {
        document.documentElement.style.setProperty('--primary', accentColor.value);
      });
    }

    const darkModeDefault = document.getElementById('darkModeDefault');
    if (darkModeDefault) {
      darkModeDefault.addEventListener('change', () => {
        if (darkModeDefault.checked !== this.isDarkMode) {
          this.toggleDarkMode();
        }
      });
    }

    generalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveSettingsSection('general', this.getFormData(generalForm));
      AdminTemplate.showNotification('General settings saved successfully.');
    });

    const securityForm = document.getElementById('settingsSecurityForm');
    if (securityForm) {
      securityForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = this.getFormData(securityForm);
        if (data.newPassword && data.newPassword !== data.confirmPassword) {
          AdminTemplate.showNotification('Passwords do not match.', 'danger');
          return;
        }
        this.saveSettingsSection('security', {
          twoFactor: data.twoFactor,
          sessionTimeout: data.sessionTimeout
        });
        AdminTemplate.showNotification('Security settings updated.');
        securityForm.querySelector('#newPassword').value = '';
        securityForm.querySelector('#confirmPassword').value = '';
        securityForm.querySelector('#currentPassword').value = '';
      });
    }

    const notificationsForm = document.getElementById('settingsNotificationsForm');
    if (notificationsForm) {
      notificationsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveSettingsSection('notifications', this.getFormData(notificationsForm));
        AdminTemplate.showNotification('Notification preferences saved.');
      });
    }

    const appearanceForm = document.getElementById('settingsAppearanceForm');
    if (appearanceForm) {
      appearanceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = this.getFormData(appearanceForm);
        this.saveSettingsSection('appearance', data);
        this.applyAppearanceSettings(data);
        if (data.darkModeDefault !== this.isDarkMode) {
          this.toggleDarkMode();
        }
        AdminTemplate.showNotification('Appearance settings saved.');
      });
    }
  }

  getFormData(form) {
    const data = {};
    form.querySelectorAll('input, select, textarea').forEach(el => {
      if (!el.name) return;
      if (el.type === 'checkbox') {
        data[el.name] = el.checked;
      } else {
        data[el.name] = el.value;
      }
    });
    return data;
  }

  loadSettings() {
    const saved = JSON.parse(localStorage.getItem('virtualStockSettings') || '{}');
    const applyToForm = (formId, section) => {
      const form = document.getElementById(formId);
      const data = saved[section];
      if (!form || !data) return;
      Object.entries(data).forEach(([key, value]) => {
        const el = form.querySelector(`[name="${key}"]`);
        if (!el) return;
        if (el.type === 'checkbox') {
          el.checked = !!value;
        } else {
          el.value = value;
        }
      });
    };
    applyToForm('settingsGeneralForm', 'general');
    applyToForm('settingsSecurityForm', 'security');
    applyToForm('settingsNotificationsForm', 'notifications');
    applyToForm('settingsAppearanceForm', 'appearance');

    const siteUrlPreview = document.getElementById('siteUrlPreview');
    const siteUrl = document.getElementById('siteUrl');
    if (siteUrlPreview && siteUrl?.value) {
      siteUrlPreview.href = siteUrl.value;
    }
  }

  saveSettingsSection(section, data) {
    const saved = JSON.parse(localStorage.getItem('virtualStockSettings') || '{}');
    saved[section] = { ...saved[section], ...data };
    localStorage.setItem('virtualStockSettings', JSON.stringify(saved));
  }

  applyAppearanceSettings(data) {
    const saved = data || JSON.parse(localStorage.getItem('virtualStockSettings') || '{}').appearance || {};
    if (saved.accentColor) {
      document.documentElement.style.setProperty('--primary', saved.accentColor);
    }
    if (saved.fontSize) {
      document.documentElement.style.fontSize = saved.fontSize + 'px';
    }
    if (saved.sidebarCollapsedDefault && !this.sidebarCollapsed) {
      this.toggleSidebar();
    }
  }

  // ========== Dark Mode ==========
  initDarkMode() {
    const saved = localStorage.getItem('adminDarkMode');
    const settings = JSON.parse(localStorage.getItem('virtualStockSettings') || '{}');
    const appearanceDefault = settings.appearance?.darkModeDefault;
    if (saved === 'true' || (saved === null && appearanceDefault)) {
      this.isDarkMode = true;
      this.body.classList.add('dark-mode');
      this.updateDarkModeIcon();
    }
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    this.body.classList.toggle('dark-mode', this.isDarkMode);
    localStorage.setItem('adminDarkMode', this.isDarkMode);
    this.updateDarkModeIcon();
    const darkModeDefault = document.getElementById('darkModeDefault');
    if (darkModeDefault) {
      darkModeDefault.checked = this.isDarkMode;
    }
  }

  updateDarkModeIcon() {
    if (this.darkModeBtn) {
      this.darkModeBtn.innerHTML = this.isDarkMode
        ? '<i class="bi bi-sun"></i>'
        : '<i class="bi bi-moon"></i>';
    }
  }

  // ========== Fullscreen ==========
  toggleFullscreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }

  // ========== Notifications ==========
  toggleNotifications() {
    let dropdown = document.querySelector('.notification-dropdown');
    if (!dropdown) {
      dropdown = this.createNotificationDropdown();
      document.querySelector('.header').appendChild(dropdown);
    }
    dropdown.classList.toggle('show');
  }

  getBasePath() {
    const script = document.querySelector('script[src*="admin.js"]');
    if (!script) return '';
    const src = script.getAttribute('src') || '';
    const idx = src.indexOf('assets/');
    return idx >= 0 ? src.substring(0, idx) : '';
  }

  createNotificationDropdown() {
    const notifications = [
      { icon: 'bi bi-cart-check', color: '#34c38f', bg: 'rgba(52,195,143,.15)', title: 'New Order Received', text: 'Order #ORD-006 from Frank Wilson', time: '2 min ago' },
      { icon: 'bi bi-person-plus', color: '#556ee6', bg: 'rgba(85,110,230,.15)', title: 'New User Registered', text: 'Grace Lee has created an account', time: '15 min ago' },
      { icon: 'bi bi-chat-dots', color: '#f1b44c', bg: 'rgba(241,180,76,.15)', title: 'New Support Ticket', text: 'Henry Taylor opened a support request', time: '1 hour ago' },
      { icon: 'bi bi-exclamation-triangle', color: '#f46a6a', bg: 'rgba(244,106,106,.15)', title: 'System Alert', text: 'Server CPU usage exceeded 90%', time: '3 hours ago' },
      { icon: 'bi bi-graph-up', color: '#50a5f1', bg: 'rgba(80,165,241,.15)', title: 'Monthly Report Ready', text: 'June analytics report is available', time: '5 hours ago' }
    ];

    const div = document.createElement('div');
    div.className = 'notification-dropdown';
    div.innerHTML = `
      <div class="notif-header">
        <span>Notifications</span>
        <span class="notif-count">${notifications.length}</span>
      </div>
      ${notifications.map(n => `
        <div class="notif-item">
          <div class="notif-icon" style="background:${n.bg};color:${n.color}">
            <i class="${n.icon}"></i>
          </div>
          <div class="notif-content">
            <div class="notif-title">${n.title}</div>
            <div class="notif-text">${n.text}</div>
            <div class="notif-time">${n.time}</div>
          </div>
        </div>
      `).join('')}
      <div class="notif-footer">
        <a href="${this.getBasePath()}pages/analytics.html">View All Notifications</a>
      </div>
    `;
    return div;
  }

  loadChartsIfNeeded() {
    if (typeof Chart !== 'undefined') {
      this.initCharts();
    }
    if (typeof ApexCharts !== 'undefined') {
      this.initApexCharts();
    }
  }

  initCharts() {
    // Line Chart
    const lineCtx = document.getElementById('lineChart');
    if (lineCtx) {
      new Chart(lineCtx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [{
            label: 'Revenue',
            data: [12, 19, 15, 25, 22, 30, 28, 35, 32, 40, 38, 45],
            borderColor: '#556ee6',
            backgroundColor: 'rgba(85,110,230,.1)',
            fill: true,
            tension: .4
          }, {
            label: 'Expenses',
            data: [8, 14, 13, 18, 16, 22, 20, 26, 24, 30, 28, 33],
            borderColor: '#34c38f',
            backgroundColor: 'rgba(52,195,143,.1)',
            fill: true,
            tension: .4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'top' } },
          scales: { y: { beginAtZero: true } }
        }
      });
    }

    // Bar Chart
    const barCtx = document.getElementById('barChart');
    if (barCtx) {
      new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Sales',
            data: [30, 45, 35, 50, 40, 60],
            backgroundColor: 'rgba(85,110,230,.6)',
            borderColor: '#556ee6',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });
    }

    // Doughnut Chart
    const doughnutCtx = document.getElementById('doughnutChart');
    if (doughnutCtx) {
      new Chart(doughnutCtx, {
        type: 'doughnut',
        data: {
          labels: ['Direct', 'Social', 'Email', 'Referral'],
          datasets: [{
            data: [45, 25, 20, 10],
            backgroundColor: ['#556ee6', '#34c38f', '#f1b44c', '#f46a6a'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } }
        }
      });
    }
  }

  initApexCharts() {
    // Area Chart
    const areaEl = document.querySelector('#apexAreaChart');
    if (areaEl) {
      new ApexCharts(areaEl, {
        series: [{ name: 'Revenue', data: [31, 40, 28, 51, 42, 109, 100] }],
        chart: { type: 'area', height: 300, toolbar: { show: false } },
        colors: ['#556ee6'],
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth' },
        xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }
      }).render();
    }

    // Column Chart
    const colEl = document.querySelector('#apexColumnChart');
    if (colEl) {
      new ApexCharts(colEl, {
        series: [{ name: 'Sales', data: [44, 55, 41, 67, 22, 43, 36] }],
        chart: { type: 'bar', height: 300, toolbar: { show: false } },
        colors: ['#34c38f'],
        plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
        xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }
      }).render();
    }
  }

  // Notification helpers
  static showNotification(message, type = 'success') {
    const colors = {
      success: '#34c38f',
      danger: '#f46a6a',
      warning: '#f1b44c',
      info: '#50a5f1'
    };
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; top: 20px; right: 20px; padding: 12px 24px;
      background: ${colors[type] || colors.info}; color: #fff;
      border-radius: 8px; font-size: 14px; z-index: 9999;
      box-shadow: 0 5px 15px rgba(0,0,0,.15);
      animation: slideInRight .3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideOutRight .3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize on DOM ready (after shared layout partials load)
document.addEventListener('DOMContentLoaded', async () => {
  if (window.adminLayoutReady) {
    await window.adminLayoutReady;
  }
  new AdminTemplate();
});