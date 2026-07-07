/* ============================================================
   FlowGuard Portal v2 — App router & boot
   ============================================================ */
const App = (function () {
  let current = 'overview';

  function go(tab, arg) {
    current = tab;
    const railEl = document.getElementById('rail');
    if (railEl) railEl.classList.remove('open');
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

  function viewReport(id) {
    // Reports open in a modal (placeholder until a report-detail endpoint exists)
    UI.toast('Report viewing opens the full document — coming with the reports backend.', 'info');
  }

  // ---- Notifications actions ----
  function setNotifFilter(f) { Screens.setNotifFilter(f); go('notifications'); }

  // ---- Support tickets ----
  function setTicketFilter(f) { Screens.setTicketFilter(f); go('support'); }
  function openTicket() {
    const cats = Screens.TICKET_CATS;
    const opts = Object.keys(cats).map(k => `<option value="${k}">${cats[k]}</option>`).join('');
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `
      <div class="modal">
        <div class="modal-h"><h2>New support ticket</h2><button onclick="this.closest('.modal-bg').remove()">×</button></div>
        <div class="modal-b">
          <div class="field"><label>Subject</label><input id="tk-subj" placeholder="Brief summary of your request"></div>
          <div class="field"><label>Category</label><select id="tk-cat">${opts}</select></div>
          <div class="field"><label>Priority</label>
            <select id="tk-prio"><option value="low">Low</option><option value="normal" selected>Normal</option><option value="high">High</option><option value="urgent">Urgent — flooding now</option></select></div>
          <div class="field"><label>Details</label><textarea id="tk-desc" rows="4" placeholder="Describe the issue or request…"></textarea></div>
          <div id="tk-err" class="hint hidden" style="color:var(--alert)"></div>
        </div>
        <div class="modal-f">
          <button class="btn ghost" onclick="this.closest('.modal-bg').remove()">Cancel</button>
          <button class="btn" onclick="App.submitTicket(this)">Submit ticket</button>
        </div>
      </div>`;
    document.body.appendChild(bg);
    bg.addEventListener('click', e => { if (e.target === bg) bg.remove(); });
  }
  async function submitTicket(btn) {
    const g = id => document.getElementById(id);
    const subject = g('tk-subj').value.trim();
    const description = g('tk-desc').value.trim();
    const err = g('tk-err');
    if (!subject || !description) {
      err.textContent = 'Please add a subject and some details.'; err.classList.remove('hidden'); return;
    }
    btn.disabled = true; btn.textContent = 'Submitting…';
    try {
      await apiRequest('/tickets', { method: 'POST', body: {
        subject, description, category: g('tk-cat').value, priority: g('tk-prio').value
      }});
      document.querySelector('.modal-bg').remove();
      UI.toast('Ticket submitted — our team will respond soon', 'success');
      go('support');
    } catch (e) {
      err.textContent = e.message || 'Could not submit. Please try again.';
      err.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'Submit ticket';
    }
  }
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
  const MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"/></svg>';
  const SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('flowguard_theme', t);
    // In dark mode show a SUN (tap → light); in light mode show a MOON (tap → dark)
    const icon = document.getElementById('themeIcon');
    if (icon) icon.innerHTML = t === 'dark' ? SUN : MOON;
    const tip = document.getElementById('themeLabel');
    if (tip) tip.textContent = t === 'dark' ? 'Light mode' : 'Dark mode';
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

  // ---- Save platform settings ----
  async function saveSettings() {
    const g = id => document.getElementById(id);
    try {
      await apiRequest('/preferences', { method: 'PUT', body: {
        email_alerts: g('set-email').checked,
        sms_alerts: g('set-sms').checked,
        weekly_digest: g('set-digest').checked
      }});
      UI.toast('Preferences saved', 'success');
    } catch (e) {
      UI.toast(e.message || 'Could not save preferences', 'error');
    }
  }

  // ---- Save platform settings (end) ----
  function setMe() {
    const u = Auth.getUser() || {};
    const nm = (u.fullName || u.full_name || 'U').trim();
    const initials = nm.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'U';
    const av = document.getElementById('meAv');
    const name = document.getElementById('meName');
    if (av) av.textContent = initials;
    if (name) name.textContent = (u.fullName || u.full_name || 'Account').split(' ')[0];
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

    // nav wiring (labeled sidebar buttons + any [data-tab] elsewhere)
    document.querySelectorAll('[data-tab]').forEach(b => {
      b.addEventListener('click', () => go(b.dataset.tab));
    });
    document.getElementById('themeBtn').addEventListener('click', toggleTheme);

    // mobile drawer toggle
    const mob = document.getElementById('mobToggle');
    const rail = document.getElementById('rail');
    if (mob && rail) mob.addEventListener('click', () => rail.classList.toggle('open'));

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

  return { go, openProperty, viewReport, toggleTheme, toggleDemo, openRegister, submitRegister, saveProfile, saveSettings,
           setNotifFilter, markRead, markAllRead, deleteNotif, setTicketFilter, openTicket, submitTicket, init };
})();
window.App = App;
document.addEventListener('DOMContentLoaded', App.init);
