/* ============================================================
   FlowGuard Portal v2 — App router & boot
   ============================================================ */
const App = (function () {
  let current = 'overview';
  let _suppressHashChange = false;

  function go(tab, arg) {
    current = tab;
    // persist active screen in the URL hash so a refresh restores it
    // and so emails can deep-link (e.g. #property/PROP-123)
    const hashMap = { propertyDetail: 'property', sensorDetail: 'sensor', ticketDetail: 'ticket' };
    const newHash = hashMap[tab] ? `#${hashMap[tab]}/${arg}` : `#${tab}`;
    if (location.hash !== newHash) {
      _suppressHashChange = true;
      location.hash = newHash;
    }
    const railEl = document.getElementById('rail');
    if (railEl) railEl.classList.remove('open');
    // nav active state (property/notifications map to their parent nav where relevant)
    const navTab = tab === 'propertyDetail' ? 'properties' : tab === 'sensorDetail' ? 'monitoring' : tab === 'ticketDetail' ? 'support' : tab === 'notifications' ? 'alerts' : tab;
    document.querySelectorAll('.rail .navbtn').forEach(b =>
      b.classList.toggle('on', b.dataset.tab === navTab));
    const view = document.getElementById('view');
    view.scrollTop = 0;
    if (tab === 'propertyDetail') { Screens.propertyDetail(view, arg); return; }
    if (tab === 'sensorDetail') { Screens.sensorDetail(view, arg); return; }
    if (tab === 'ticketDetail') { Screens.ticketDetail(view, arg); return; }
    const fn = Screens[tab];
    if (fn) fn(view);
  }

  function openProperty(id) { go('propertyDetail', id); }
  function openSensor(id) { go('sensorDetail', id); }
  function setSensorRange(h, sensorId) { Screens.setSensorRange(h, sensorId); go('sensorDetail', sensorId); }
  function monSearch(v) { Screens.monSearch(v); }
  function monFilter(f) { Screens.monFilter(f); }
  // ---- Invoice detail + pay ----
  async function openInvoice(id) {
    let inv;
    if (Demo.isOn()) {
      inv = Demo.data.invoices.find(x => x.invoice_id === id) || Demo.data.invoices[0];
    } else {
      try { const r = await apiRequest(`/billing/invoices/${id}`); inv = r && r.data; }
      catch (e) { UI.toast(e.message || 'Could not load invoice', 'error'); return; }
    }
    if (!inv) { UI.toast('Invoice not found', 'error'); return; }
    const paid = (inv.payment_status || inv.status) === 'paid';
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `
      <div class="modal">
        <div class="modal-h"><h2>Invoice ${UI.esc(inv.invoice_id || '')}</h2><button onclick="this.closest('.modal-bg').remove()">×</button></div>
        <div class="modal-b">
          <div style="display:flex;justify-content:space-between;margin-bottom:20px">
            <div><div class="hint">Amount due</div><div style="font-family:var(--ff-d);font-size:30px;font-weight:700">${UI.fmtNaira(inv.total_amount)}</div></div>
            <div style="text-align:right">${paid ? UI.chip('ok', 'Paid') : UI.chip('warn', 'Due')}</div>
          </div>
          <div class="inv-line"><span>Type</span><b>${UI.esc((inv.invoice_type || 'Service'))}</b></div>
          <div class="inv-line"><span>Issued</span><b>${UI.fmtDate(inv.issue_date)}</b></div>
          <div class="inv-line"><span>Due date</span><b>${UI.fmtDate(inv.due_date)}</b></div>
          ${paid ? `<div class="inv-line"><span>Paid on</span><b>${UI.fmtDate(inv.paid_date || inv.issue_date)}</b></div>` : ''}
          ${inv.description ? `<div class="inv-line"><span>Notes</span><b>${UI.esc(inv.description)}</b></div>` : ''}
        </div>
        <div class="modal-f">
          <button class="btn ghost" onclick="this.closest('.modal-bg').remove()">Close</button>
          ${paid ? '' : `<button class="btn" onclick="App.payInvoice('${UI.esc(inv.invoice_id)}', this)">Pay now</button>`}
        </div>
      </div>`;
    document.body.appendChild(bg);
    bg.addEventListener('click', e => { if (e.target === bg) bg.remove(); });
  }

  async function payInvoice(id, btn) {
    btn.disabled = true; btn.textContent = 'Processing…';
    try {
      if (!Demo.isOn()) await apiRequest(`/billing/invoices/${id}/mark-paid`, { method: 'POST' });
      document.querySelector('.modal-bg').remove();
      UI.toast('Payment recorded', 'success');
      go('billing');
    } catch (e) {
      UI.toast(e.message || 'Payment failed', 'error');
      btn.disabled = false; btn.textContent = 'Pay now';
    }
  }

  // ---- Service tier selection ----
  async function selectServices(propertyId) {
    const tiers = [
      { key: 'sentinel', name: 'Sentinel', desc: 'IoT monitoring only — sensors + alerts', price: '₦85,000/mo' },
      { key: 'flowguard', name: 'FlowGuard', desc: 'Monitoring + bio-treatment + scheduled clearing', price: '₦185,000/mo' },
      { key: 'flood_zero', name: 'Flood-Zero', desc: 'Full service + priority dispatch + SLA guarantee', price: '₦320,000/mo' }
    ];
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `
      <div class="modal">
        <div class="modal-h"><h2>Choose a service tier</h2><button onclick="this.closest('.modal-bg').remove()">×</button></div>
        <div class="modal-b">
          <p style="color:var(--ink-2);font-size:13.5px;margin-bottom:16px">Select the level of drainage service for this property.</p>
          <div class="tier-list">
            ${tiers.map(t => `<label class="tier-opt">
              <input type="radio" name="tier" value="${t.key}">
              <div class="tier-info"><b>${t.name}</b><small>${t.desc}</small></div>
              <div class="tier-price">${t.price}</div>
            </label>`).join('')}
          </div>
          <div id="tier-err" class="hint hidden" style="color:var(--alert);margin-top:10px"></div>
        </div>
        <div class="modal-f">
          <button class="btn ghost" onclick="this.closest('.modal-bg').remove()">Cancel</button>
          <button class="btn" onclick="App.confirmServices('${propertyId}', this)">Confirm selection</button>
        </div>
      </div>`;
    document.body.appendChild(bg);
    bg.addEventListener('click', e => { if (e.target === bg) bg.remove(); });
  }

  async function confirmServices(propertyId, btn) {
    const sel = document.querySelector('input[name="tier"]:checked');
    const err = document.getElementById('tier-err');
    if (!sel) { err.textContent = 'Please choose a tier.'; err.classList.remove('hidden'); return; }
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      if (!Demo.isOn()) await apiRequest(`/properties/${propertyId}/select-services`, { method: 'POST', body: { tier: sel.value } });
      document.querySelector('.modal-bg').remove();
      UI.toast('Service tier updated', 'success');
      go('propertyDetail', propertyId);
    } catch (e) {
      err.textContent = e.message || 'Could not save.'; err.classList.remove('hidden');
      btn.disabled = false; btn.textContent = 'Confirm selection';
    }
  }

  // ---- Account deactivation ----
  function deactivateAccount() {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `
      <div class="modal">
        <div class="modal-h"><h2>Deactivate account</h2><button onclick="this.closest('.modal-bg').remove()">×</button></div>
        <div class="modal-b">
          <p style="color:var(--ink-2);font-size:14px">This will deactivate your account and pause monitoring notifications. Your data is retained and our team can reactivate you on request. This won't cancel active service contracts — contact support for that.</p>
        </div>
        <div class="modal-f">
          <button class="btn ghost" onclick="this.closest('.modal-bg').remove()">Cancel</button>
          <button class="btn" style="background:var(--alert)" onclick="App.confirmDeactivate(this)">Deactivate</button>
        </div>
      </div>`;
    document.body.appendChild(bg);
    bg.addEventListener('click', e => { if (e.target === bg) bg.remove(); });
  }
  async function confirmDeactivate(btn) {
    btn.disabled = true; btn.textContent = 'Processing…';
    try {
      await apiRequest('/account/deactivate', { method: 'POST' });
      UI.toast('Account deactivated', 'info');
      setTimeout(() => Auth.logout(), 1200);
    } catch (e) {
      UI.toast(e.message || 'Could not deactivate', 'error');
      btn.disabled = false; btn.textContent = 'Deactivate';
    }
  }

  function monMetric(m) { Screens.monMetric(m); }

  // ---- Ticket detail ----
  function openTicketDetail(id) { go('ticketDetail', id); }
  async function sendReply(ticketId, btn) {
    const ta = document.getElementById('td-reply');
    const msg = ta.value.trim();
    if (!msg) { ta.focus(); return; }
    btn.disabled = true; btn.textContent = 'Sending…';
    try {
      await apiRequest(`/tickets/${ticketId}/reply`, { method: 'POST', body: { message: msg } });
      UI.toast('Reply sent', 'success');
      go('ticketDetail', ticketId);
    } catch (e) {
      UI.toast(e.message || 'Could not send reply', 'error');
      btn.disabled = false; btn.textContent = 'Send reply';
    }
  }

  function viewReport(id) {
    // Reports open in a modal (placeholder until a report-detail endpoint exists)
    UI.toast('Report viewing opens the full document — coming with the reports backend.', 'info');
  }
  function downloadReport(id) {
    // PDF generation endpoint not built yet — honest placeholder.
    // The report's findings, score and recommendations are already shown on the card.
    UI.toast('PDF download is coming soon — your full findings are shown above in the meantime.', 'info');
  }

  // ---- Notifications actions ----
  function setNotifFilter(f) { Screens.setNotifFilter(f); go('notifications'); }

  // ---- Support tickets ----
  function setTicketFilter(f) { Screens.setTicketFilter(f); go('support'); }
  function openTicket(presetCat) {
    const cats = Screens.TICKET_CATS;
    const opts = Object.keys(cats).map(k => `<option value="${k}" ${k === presetCat ? 'selected' : ''}>${cats[k]}</option>`).join('');
    const presetSubj = presetCat === 'dispatch' ? 'Bio-enzyme cartridge refill request' : '';
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `
      <div class="modal">
        <div class="modal-h"><h2>New support ticket</h2><button onclick="this.closest('.modal-bg').remove()">×</button></div>
        <div class="modal-b">
          <div class="field"><label>Subject</label><input id="tk-subj" value="${presetSubj}" placeholder="Brief summary of your request"></div>
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
  async function changePassword() {
    const g = id => document.getElementById(id);
    const cur = g('ac-curpw').value, nw = g('ac-newpw').value, conf = g('ac-confpw').value;
    const err = g('ac-pw-err');
    err.classList.add('hidden');
    if (!cur || !nw) { err.textContent = 'Please fill in all fields.'; err.classList.remove('hidden'); return; }
    if (nw.length < 8) { err.textContent = 'New password must be at least 8 characters.'; err.classList.remove('hidden'); return; }
    if (nw !== conf) { err.textContent = 'New passwords do not match.'; err.classList.remove('hidden'); return; }
    try {
      await apiRequest('/password', { method: 'PUT', body: { current_password: cur, new_password: nw } });
      UI.toast('Password updated', 'success');
      g('ac-curpw').value = ''; g('ac-newpw').value = ''; g('ac-confpw').value = '';
    } catch (e) {
      err.textContent = e.message || 'Could not update password.'; err.classList.remove('hidden');
    }
  }

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

    // restore the screen from the URL hash (refresh / email deep-link),
    // otherwise land on overview
    refreshUser().finally(() => routeFromHash());

    // respond to browser back/forward and in-app hash changes
    window.addEventListener('hashchange', () => {
      if (_suppressHashChange) { _suppressHashChange = false; return; }
      routeFromHash();
    });
  }

  // Parse location.hash -> screen. Supports #overview, #properties,
  // and detail deep-links like #property/PROP-123, #sensor/ID, #ticket/ID
  function routeFromHash() {
    const raw = (location.hash || '').replace(/^#/, '');
    if (!raw) { go('overview'); return; }
    const [seg, id] = raw.split('/');
    const detailMap = { property: 'propertyDetail', sensor: 'sensorDetail', ticket: 'ticketDetail' };
    if (detailMap[seg] && id) { go(detailMap[seg], decodeURIComponent(id)); return; }
    // plain screens — only if the screen actually exists, else overview
    if (Screens[seg]) { go(seg); return; }
    go('overview');
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

  return { go, openProperty, openSensor, setSensorRange, monSearch, monFilter, monMetric, viewReport, downloadReport, toggleTheme, toggleDemo, openRegister, submitRegister, saveProfile, saveSettings, changePassword,
           openTicketDetail, sendReply, openInvoice, payInvoice, selectServices, confirmServices, deactivateAccount, confirmDeactivate,
           setNotifFilter, markRead, markAllRead, deleteNotif, setTicketFilter, openTicket, submitTicket, init };
})();
window.App = App;
document.addEventListener('DOMContentLoaded', App.init);
