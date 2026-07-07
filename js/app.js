/* ============================================================
   FlowGuard Portal v2 — App router & boot
   ============================================================ */
const App = (function () {
  let current = 'overview';

  function go(tab, arg) {
    current = tab;
    // nav active state (property/notifications map to their parent nav where relevant)
    const navTab = tab === 'propertyDetail' ? 'properties' : tab === 'notifications' ? 'alerts' : tab;
    document.querySelectorAll('.rail .navbtn').forEach(b =>
      b.classList.toggle('on', b.dataset.tab === navTab));
    const view = document.getElementById('view');
    view.scrollTop = 0;
    if (tab === 'propertyDetail') { Screens.propertyDetail(view, arg); return; }
    const fn = Screens[tab];
    if (fn) fn(view);
  }

  function openProperty(id) { go('propertyDetail', id); }

  // ---- Notifications actions ----
  function setNotifFilter(f) { Screens.setNotifFilter(f); go('notifications'); }
  async function markRead(id) {
    try { await apiRequest(`/notifications/${id}/read`, { method: 'PUT' }); } catch (_) {}
    go('notifications');
  }
  async function markAllRead() {
    try { await apiRequest('/notifications/read-all', { method: 'PUT' }); UI.toast('All marked read', 'success'); } catch (_) {}
    go('notifications');
  }
  async function deleteNotif(id) {
    try { await apiRequest(`/notifications/${id}`, { method: 'DELETE' }); } catch (_) {}
    go('notifications');
  }

  // ---- Theme (persisted, remembers last choice) ----
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('flowguard_theme', t);
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(cur === 'light' ? 'dark' : 'light');
  }

  // ---- Demo toggle (reuses existing mechanism) ----
  async function toggleDemo(on) {
    await Demo.set(on);
    UI.toast(on ? 'Demo mode on — showing sample data' : 'Demo mode off', 'info');
    go(current); // re-render current screen with new data source
  }

  // ---- Register area modal ----
  function openRegister() {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `
      <div class="modal">
        <div class="modal-h"><h2>Register an area</h2><button onclick="this.closest('.modal-bg').remove()">×</button></div>
        <div class="modal-b">
          <div class="field"><label>Area name</label><input id="rg-name" placeholder="e.g. Sunrise Court Estate"></div>
          <div class="field"><label>Property type</label>
            <select id="rg-type"><option>residential estate</option><option>commercial</option><option>mixed use</option><option>public</option></select></div>
          <div class="field"><label>City</label><input id="rg-city" placeholder="Lekki"></div>
          <div class="field"><label>State</label><input id="rg-state" value="Lagos"></div>
          <div class="field"><label>What's the drainage concern?</label><textarea id="rg-desc" rows="3" placeholder="e.g. Recurring flooding at the main gate after heavy rain"></textarea></div>
          <div class="field"><label>Urgency</label>
            <select id="rg-urgency"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option></select></div>
          <div id="rg-err" class="hint hidden" style="color:var(--alert)"></div>
        </div>
        <div class="modal-f">
          <button class="btn ghost" onclick="this.closest('.modal-bg').remove()">Cancel</button>
          <button class="btn" id="rg-submit" onclick="App.submitRegister(this)">Submit</button>
        </div>
      </div>`;
    document.body.appendChild(bg);
    bg.addEventListener('click', e => { if (e.target === bg) bg.remove(); });
  }

  async function submitRegister(btn) {
    const g = id => document.getElementById(id);
    const name = g('rg-name').value.trim();
    const city = g('rg-city').value.trim();
    const err = g('rg-err');
    if (!name || !city) {
      err.textContent = 'Please add at least an area name and city.';
      err.classList.remove('hidden'); return;
    }
    btn.disabled = true; btn.textContent = 'Submitting…';
    try {
      await apiRequest('/properties', { method: 'POST', body: {
        propertyName: name, propertyType: g('rg-type').value,
        city, state: g('rg-state').value.trim(),
        issueDescription: g('rg-desc').value.trim(), urgencyLevel: g('rg-urgency').value
      }});
      document.querySelector('.modal-bg').remove();
      UI.toast('Area registered', 'success');
      go('properties');
    } catch (e) {
      err.textContent = e.message || 'Could not submit. Please try again.';
      err.classList.remove('hidden');
      btn.disabled = false; btn.textContent = 'Submit';
    }
  }

  // ---- Save profile (real endpoint + refresh cached user) ----
  async function saveProfile() {
    const name = document.getElementById('ac-name').value.trim();
    const phone = document.getElementById('ac-phone').value.trim();
    try {
      const r = await apiRequest('/profile', { method: 'PUT', body: { full_name: name, phone } });
      const updated = r && r.data && r.data.user;
      if (updated) {
        const existing = JSON.parse(localStorage.getItem('user') || '{}');
        const merged = { ...existing, ...updated };
        if (updated.full_name) merged.fullName = updated.full_name;
        localStorage.setItem('user', JSON.stringify(merged));
        if (Auth.updateUserInfo) Auth.updateUserInfo();
        setMe();
      }
      UI.toast('Profile updated', 'success');
    } catch (e) {
      UI.toast(e.message || 'Could not update profile', 'error');
    }
  }

  function setMe() {
    const u = Auth.getUser() || {};
    const nm = (u.fullName || u.full_name || 'U').trim();
    const initials = nm.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'U';
    const me = document.getElementById('meBtn');
    if (me) me.textContent = initials;
  }

  // ---- Boot ----
  function init() {
    // auth gate
    if (!Auth.isAuthenticated || !Auth.isAuthenticated()) {
      window.location.href = 'login.html'; return;
    }
    // theme: remember last
    applyTheme(localStorage.getItem('flowguard_theme') || 'light');
    setMe();

    // nav wiring
    document.querySelectorAll('.rail .navbtn, .icon-btn[data-tab], .me[data-tab]').forEach(b => {
      if (b.dataset.tab) b.addEventListener('click', () => go(b.dataset.tab));
    });
    document.getElementById('themeBtn').addEventListener('click', toggleTheme);
    document.getElementById('meBtn').addEventListener('click', () => go('account'));

    // refresh cached user from server (non-blocking), then render
    refreshUser().finally(() => go('overview'));
  }

  async function refreshUser() {
    try {
      const r = await apiRequest('/profile');
      const fresh = r && r.data && r.data.user;
      if (fresh) {
        const existing = JSON.parse(localStorage.getItem('user') || '{}');
        const merged = { ...existing, ...fresh };
        if (fresh.full_name) merged.fullName = fresh.full_name;
        localStorage.setItem('user', JSON.stringify(merged));
        setMe();
      }
    } catch (_) { /* keep cached */ }
  }

  return { go, openProperty, toggleTheme, toggleDemo, openRegister, submitRegister, saveProfile,
           setNotifFilter, markRead, markAllRead, deleteNotif, init };
})();
window.App = App;
document.addEventListener('DOMContentLoaded', App.init);
