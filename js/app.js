/* ============================================================
   FlowGuard Portal v2 — App router & boot
   ============================================================ */
const App = (function () {
  let current = 'overview';
  let _suppressHashChange = false;

  // ---- global active-property scope (persists across sessions) ----
  function activeProperty() { return localStorage.getItem('fg_active_property') || 'all'; }
  function setActiveProperty(id) {
    localStorage.setItem('fg_active_property', id || '');
    refreshRailSelector();
    go(current); // re-render the current screen under the new scope
  }
  // property dropdown at the top of the sidebar
  async function refreshRailSelector() {
    const slot = document.getElementById('rail-prop');
    if (!slot || !window.Screens || !Screens.getMyProperties) return;
    try {
      const props = await Screens.getMyProperties();
      slot.innerHTML = Screens.propertySelector(props);
    } catch (_) { /* leave empty */ }
  }

  function go(tab, arg) {
    current = tab;
    window.scrollTo(0, 0);
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
        <div class="modal-h"><h2>Invoice ${UI.esc(inv.invoice_id || '')}</h2><button onclick="this.closest('.modal-bg').remove()" aria-label="Close">×</button></div>
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
        <div class="modal-h"><h2>Choose a service tier</h2><button onclick="this.closest('.modal-bg').remove()" aria-label="Close">×</button></div>
        <div class="modal-b">
          <p style="color:var(--ink-2);font-size:13px;margin-bottom:16px">Select the level of drainage service for this property.</p>
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
        <div class="modal-h"><h2>Deactivate account</h2><button onclick="this.closest('.modal-bg').remove()" aria-label="Close">×</button></div>
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
  async function downloadReport(id) {
    if (!id) return;
    try {
      UI.toast('Preparing your report…', 'info');
      const token = localStorage.getItem('token');
      const res = await fetch(`${window.API_BASE}/field-reports/${id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FlowGuard-Report-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      UI.toast("Couldn't download the report. Please try again.", 'error');
    }
  }

  // ---- Notifications actions ----
  function setNotifFilter(f) { Screens.setNotifFilter(f); go('notifications'); }
  function setFcRange(d) { Screens.setFcRange(d); }

  // ---- Support tickets ----
  function setTicketFilter(f) { Screens.setTicketFilter(f); go('support'); }
  function openTicket(presetCat, subj, prio) {
    const cats = Screens.TICKET_CATS;
    const opts = Object.keys(cats).map(k => `<option value="${k}" ${k === presetCat ? 'selected' : ''}>${cats[k]}</option>`).join('');
    const presetSubj = subj || (presetCat === 'dispatch' ? 'Bio-enzyme cartridge refill request' : '');
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `
      <div class="modal">
        <div class="modal-h"><h2>New support ticket</h2><button onclick="this.closest('.modal-bg').remove()" aria-label="Close">×</button></div>
        <div class="modal-b">
          <div class="field"><label>Subject</label><input id="tk-subj" value="${presetSubj}" placeholder="Brief summary of your request"></div>
          <div class="field"><label>Category</label><select id="tk-cat">${opts}</select></div>
          <div class="field"><label>Priority</label>
            <select id="tk-prio"><option value="low" ${prio==='low'?'selected':''}>Low</option><option value="normal" ${!prio||prio==='normal'?'selected':''}>Normal</option><option value="high" ${prio==='high'?'selected':''}>High</option><option value="urgent" ${prio==='urgent'?'selected':''}>Urgent — flooding now</option></select></div>
          <div class="field"><label>Details</label><textarea id="tk-desc" rows="4" placeholder="Describe the issue or request…"></textarea></div>
          <div id="tk-err" class="hint hidden c-alert"></div>
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
  function openRegister(edit) {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `
      <div class="modal modal-wide">
        <div class="modal-h"><h2>${edit ? 'Edit property details' : 'Register an area'}</h2><button onclick="this.closest('.modal-bg').remove()" aria-label="Close">×</button></div>
        <div class="modal-b">

          <div class="form-section-t">Area details</div>
          <div class="field"><label>Area name <span class="req">*</span></label><input id="rg-name" placeholder="e.g. Sunrise Court Estate"></div>
          <div class="field-row">
            <div class="field"><label>Property type</label>
              <select id="rg-type">
                <option value="residential_estate">Residential estate</option>
                <option value="commercial_complex">Commercial complex</option>
                <option value="industrial_park">Industrial park</option>
                <option value="mixed_use">Mixed use</option>
                <option value="individual_building">Individual building</option>
              </select></div>
            <div class="field"><label>Urgency</label>
              <select id="rg-urgency"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div>
          </div>

          <div class="form-section-t">Location</div>
          <div class="field"><label>Street address</label><input id="rg-addr" placeholder="e.g. 12 Admiralty Way"></div>
          <div class="field-row">
            <div class="field"><label>City <span class="req">*</span></label><input id="rg-city" placeholder="Lekki"></div>
            <div class="field"><label>State</label><input id="rg-state" value="Lagos"></div>
          </div>

          <div class="form-section-t">Size &amp; scale <span class="opt">(optional — helps us plan coverage)</span></div>
          <div class="field-row">
            <div class="field"><label>Total area (sqm)</label><input id="rg-area" type="number" min="0" placeholder="e.g. 15000"></div>
            <div class="field"><label>Est. population</label><input id="rg-pop" type="number" min="0" placeholder="e.g. 450"></div>
          </div>
          <div class="field-row">
            <div class="field"><label>Number of units</label><input id="rg-units" type="number" min="0" placeholder="e.g. 60"></div>
            <div class="field"><label>Number of buildings</label><input id="rg-bldg" type="number" min="0" placeholder="e.g. 12"></div>
          </div>

          <div class="form-section-t">Drainage concern</div>
          <div class="field"><label>What's the drainage concern? <span class="req">*</span></label><textarea id="rg-desc" rows="3" placeholder="e.g. Recurring flooding at the main gate after heavy rain; standing water along the east perimeter road"></textarea></div>

          <div class="form-section-t">On-site contact <span class="opt">(who our team should reach)</span></div>
          <div class="field-row">
            <div class="field"><label>Contact name</label><input id="rg-cname" placeholder="e.g. Bayo Akinwale"></div>
            <div class="field"><label>Role</label><input id="rg-crole" placeholder="e.g. Facility Manager"></div>
          </div>
          <div class="field"><label>Contact phone</label><input id="rg-cphone" placeholder="e.g. +234 800 000 0000"></div>

          <div class="form-section-t">Preferred inspection <span class="opt">(optional)</span></div>
          <div class="field-row">
            <div class="field"><label>Preferred date</label><input id="rg-idate" type="date"></div>
            <div class="field"><label>Preferred time</label>
              <select id="rg-itime"><option value="">No preference</option><option value="morning">Morning</option><option value="afternoon">Afternoon</option></select></div>
          </div>

          <div id="rg-err" class="hint hidden c-alert"></div>
        </div>
        <div class="modal-f">
          <button class="btn ghost" onclick="this.closest('.modal-bg').remove()">Cancel</button>
          <button class="btn" id="rg-submit" ${edit ? `data-edit="${edit.property_id}"` : ''} onclick="App.submitRegister(this)">${edit ? 'Save changes' : 'Submit area'}</button>
        </div>
      </div>`;
    document.body.appendChild(bg);
    bg.addEventListener('click', e => { if (e.target === bg) bg.remove(); });
    if (edit) {
      const set = (id, v) => { const el = document.getElementById(id); if (el && v != null) el.value = v; };
      set('rg-name', edit.property_name);
      set('rg-type', edit.property_type);
      set('rg-urgency', edit.urgency_level);
      set('rg-addr', edit.address_line1);
      set('rg-city', edit.city);
      set('rg-state', edit.state);
      set('rg-area', edit.total_area_sqm);
      set('rg-pop', edit.estimated_population);
      set('rg-units', edit.number_of_units);
      set('rg-bldg', edit.number_of_buildings);
      set('rg-desc', edit.issue_description);
      set('rg-cname', edit.contact_person_name);
      set('rg-crole', edit.contact_person_role);
      set('rg-cphone', edit.contact_phone);
      set('rg-idate', edit.preferred_inspection_date ? String(edit.preferred_inspection_date).slice(0, 10) : null);
      set('rg-itime', edit.preferred_inspection_time);
    }
  }

  // Edit an existing property — loads current values then opens the form prefilled
  async function openEditProperty(propertyId) {
    if (Demo.isOn()) {
      const p = Demo.data.properties.find(x => x.property_id === propertyId);
      if (p) openRegister(p);
      return;
    }
    try {
      const r = await apiRequest(`/properties/${propertyId}`);
      if (r && r.data) openRegister(r.data);
      else UI.toast("Couldn't load property details", 'error');
    } catch (_) { UI.toast("Couldn't load property details", 'error'); }
  }

  async function submitRegister(btn) {
    const g = id => document.getElementById(id);
    const val = id => { const el = g(id); return el ? el.value.trim() : ''; };
    const num = id => { const v = val(id); return v === '' ? undefined : Number(v); };
    const name = val('rg-name');
    const city = val('rg-city');
    const desc = val('rg-desc');
    const err = g('rg-err');
    if (!name || !city || !desc) {
      err.textContent = 'Please add an area name, city, and the drainage concern.';
      err.classList.remove('hidden'); return;
    }
    btn.disabled = true; btn.textContent = 'Submitting…';
    const body = {
      propertyName: name,
      propertyType: g('rg-type').value,
      addressLine1: val('rg-addr') || undefined,
      city, state: val('rg-state'),
      totalAreaSqm: num('rg-area'),
      estimatedPopulation: num('rg-pop'),
      numberOfUnits: num('rg-units'),
      numberOfBuildings: num('rg-bldg'),
      issueDescription: desc,
      urgencyLevel: g('rg-urgency').value,
      contactPersonName: val('rg-cname') || undefined,
      contactPersonRole: val('rg-crole') || undefined,
      contactPhone: val('rg-cphone') || undefined,
      preferredInspectionDate: val('rg-idate') || undefined,
      preferredInspectionTime: g('rg-itime').value || undefined,
    };
    // strip undefined so we only send provided fields
    Object.keys(body).forEach(k => body[k] === undefined && delete body[k]);
    const editId = btn.dataset.edit;
    try {
      if (editId && Demo.isOn()) {
        // demo: apply in memory so the change is visible
        const p = Demo.data.properties.find(x => x.property_id === editId);
        if (p) Object.assign(p, {
          property_name: body.propertyName, property_type: body.propertyType,
          address_line1: body.addressLine1, city: body.city, state: body.state,
          total_area_sqm: body.totalAreaSqm, estimated_population: body.estimatedPopulation,
          number_of_units: body.numberOfUnits, number_of_buildings: body.numberOfBuildings,
          issue_description: body.issueDescription, urgency_level: body.urgencyLevel,
          contact_person_name: body.contactPersonName, contact_person_role: body.contactPersonRole,
          contact_phone: body.contactPhone,
          preferred_inspection_date: body.preferredInspectionDate, preferred_inspection_time: body.preferredInspectionTime,
        });
        document.querySelector('.modal-bg').remove();
        UI.toast('Property updated (demo)', 'success');
        openProperty(editId);
        return;
      }
      if (editId) {
        await apiRequest(`/properties/${editId}`, { method: 'PUT', body });
        document.querySelector('.modal-bg').remove();
        UI.toast('Property updated', 'success');
        openProperty(editId);
        return;
      }
      await apiRequest('/properties', { method: 'POST', body });
      document.querySelector('.modal-bg').remove();
      UI.toast('Area registered', 'success');
      go('properties');
    } catch (e) {
      err.textContent = e.message || 'Could not submit. Please try again.';
      err.classList.remove('hidden');
      btn.disabled = false; btn.textContent = 'Submit area';
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
    refreshRailSelector();

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

  return { go, openProperty, openEditProperty, activeProperty, setActiveProperty, setFcRange, openSensor, setSensorRange, monSearch, monFilter, monMetric, viewReport, downloadReport, toggleTheme, toggleDemo, openRegister, submitRegister, saveProfile, saveSettings, changePassword,
           openTicketDetail, sendReply, openInvoice, payInvoice, selectServices, confirmServices, deactivateAccount, confirmDeactivate,
           setNotifFilter, markRead, markAllRead, deleteNotif, setTicketFilter, openTicket, submitTicket, init };
})();
window.App = App;
document.addEventListener('DOMContentLoaded', App.init);
