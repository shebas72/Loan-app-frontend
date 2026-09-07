/* ========== Shared Layout Loader ========== */

(function () {
  function getAdminBase() {
    const bodyBase = document.body?.dataset?.adminBase;
    if (bodyBase !== undefined) return bodyBase;
    const script = document.querySelector('script[src*="layout.js"]');
    if (script) {
      const src = script.getAttribute('src') || '';
      const idx = src.indexOf('assets/');
      if (idx >= 0) return src.substring(0, idx);
    }
    return '../';
  }

  function applyBase(html, base) {
    return html.replace(/\{\{BASE\}\}/g, base);
  }

  async function injectPartial(url, mountId, base) {
    const mount = document.getElementById(mountId);
    if (!mount) return;
    const response = await fetch(url);
    if (!response.ok) {
      console.warn('Layout partial failed to load:', url);
      return;
    }
    mount.outerHTML = applyBase(await response.text(), base);
  }

  window.adminLayoutReady = (async function loadAdminLayout() {
    if (!document.getElementById('admin-sidebar-mount')) return;
    const base = getAdminBase();
    await Promise.all([
      injectPartial(base + 'assets/partials/sidebar.html', 'admin-sidebar-mount', base),
      injectPartial(base + 'assets/partials/header.html', 'admin-header-mount', base)
    ]);
  })();
})();
