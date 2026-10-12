/* ============================================================
   FlowGuard Portal v2 — App router & boot
   ============================================================ */
const App = (function () {
  let current = 'overview';
  let _suppressHashChange = false;
  let ticketPrefill={};
  let documentPreview=null,documentReturn='reports';
  function openDocumentPage(page,returnTo='reports'){documentPreview=page;documentReturn=returnTo;go('documentPreview');}

  // The greeting belongs to the portal shell, including direct detail links and errors.
  function refreshPlatformHeader() {
    const header=document.querySelector('.platform-bar');
    const heading=header?.querySelector('.platform-heading');
    if(!heading)return;
    const user=Auth.getUser()||{};
    const name=(user.fullName||user.full_name||'').trim().split(/\s+/)[0]||'there';
    const now=new Date();
    const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Lagos',hour:'numeric',hourCycle:'h23'}).format(now));
    const greeting=hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';
    const date=now.toLocaleDateString('en-GB',{timeZone:'Africa/Lagos',weekday:'long',day:'numeric',month:'long'});
    header.classList.add('home-header');
    heading.innerHTML='<div class="top"><div class="greeting"><p class="portal-greeting">'+greeting+', '+UI.esc(name)+'.</p><div class="sub"><span>'+date+'</span><span class="home-subtitle">Your property. Your next steps. All in one place.</span></div></div></div>';
  }

  // ---- global active-property scope (persists across sessions) ----
  function activeProperty() { return localStorage.getItem('fg_active_property') || 'all'; }
  function setActiveProperty(id) {
    localStorage.setItem('fg_active_property', id || '');
    refreshRailSelector();
    const parent={sensorDetail:'monitoring',propertyDetail:'properties',propertyEdit:'properties',propertyNew:'properties',supportNew:'support',invoiceDetail:'billing',documentPreview:documentReturn,reportDetail:'reports',ticketDetail:'support',alertDetail:'alerts'};
    go(parent[current]||current); // Do not retain a different property's record after changing scope.
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
    // Route guard for permission-gated screens (defence in depth — backend enforces too).
    const routePerm = {
      team: 'manage_team', billing: 'view_billing',
      monitoring: 'view_monitoring', forecast: 'view_monitoring',
      alerts: 'view_alerts', alertDetail:'view_alerts', reports: 'view_reports', reportDetail: 'view_reports',
      properties: 'manage_properties', propertyDetail:'manage_properties', sensorDetail:'view_monitoring',
      propertyNew:'manage_properties',propertyEdit:'manage_properties',supportNew:'submit_support',invoiceDetail:'view_billing',
    };
    if (routePerm[tab] && !can(routePerm[tab])) tab = 'overview';
    if(current==='documentPreview'&&tab!=='documentPreview')documentPreview=null;
    current = tab;
    refreshPlatformHeader();
    window.scrollTo(0, 0);
    // persist active screen in the URL hash so a refresh restores it
    // and so emails can deep-link (e.g. #property/PROP-123)
    const hashMap = { propertyEdit:'property-edit',invoiceDetail:'invoice',alertDetail:'alert', propertyDetail: 'property', sensorDetail: 'sensor', ticketDetail: 'ticket', reportDetail: 'report' };
    const newHash = tab==='services'&&arg ? '#service-request/'+encodeURIComponent(arg) : hashMap[tab] ? `#${hashMap[tab]}/${arg}` : `#${tab}`;
    if (location.hash !== newHash) {
      _suppressHashChange = true;
      location.hash = newHash;
    }
    const railEl = document.getElementById('rail');
    if (railEl) {railEl.classList.remove('open');railEl.scrollTop=0;}
    // nav active state. Detail views map to their parent nav item. Notifications
    // is a global, platform-wide view — NOT part of Alerts (alerts are threshold/
    // incident events), so it highlights no module rather than lighting up Alerts.
    const navTab = ['propertyNew','propertyEdit'].includes(tab)?'properties':tab==='supportNew'?'support':tab==='invoiceDetail'?'billing':tab === 'alertDetail' ? 'alerts' : tab === 'propertyDetail' ? 'properties' : tab === 'sensorDetail' ? 'monitoring' : tab === 'ticketDetail' ? 'support' : tab === 'reportDetail' ? 'reports' : tab;
    document.querySelectorAll('.rail .navbtn').forEach(b =>
      b.classList.toggle('on', b.dataset.tab === navTab));
    // The notification bell stays in the shell; refresh its unread count.
    setTimeout(updateNotifBadge, 0);
    if (tab === 'notifications') setTimeout(pollNotifs, 800);
    const previous=document.getElementById('view');
    const view=previous.cloneNode(false);
    view.dataset.screen=tab;
    previous.replaceWith(view);
    view.scrollTop=0;
    const render=(fn,...args)=>Promise.resolve().then(()=>fn(view,...args)).then(async()=>{
      if(!view.isConnected)return;
      const props=await Screens.getMyProperties().catch(()=>null);
      if(!view.isConnected)return;
      const top=view.querySelector('.top');
      if(top&&props&&!view.querySelector('.workspace-context')){
        const context=document.createElement('div');context.className='workspace-context';
        const accountWide=['settings','account','team','properties','notifications','support'].includes(tab);
        context.innerHTML=accountWide?'<span>Account-wide workspace · all properties</span>':'<span>Selected property</span>'+Screens.propertySelector(props);
        top.after(context);
      }
      if(window.ClientGuide){try{await ClientGuide.attach(view,tab);}catch(_){/* Optional guidance must not replace successfully loaded records. */}}
      if(tab==='team'){
        const roles=view.querySelector('.tm-roles-grid');
        if(roles){const details=document.createElement('details');details.className='role-help';const summary=document.createElement('summary');summary.textContent='Help me choose the right access';details.appendChild(summary);roles.before(details);details.appendChild(roles);}
      }
      // Home's temporary loading heading is not a second greeting/header.
      if(view.isConnected&&tab==='overview')top?.remove();
    }).catch(e=>{if(view.isConnected)view.innerHTML=UI.state('error','Data unavailable',e.message,'Retry','onclick="location.reload()"');});
    if(tab==='services'){render(ClientServices.render,arg);return;}
    if(tab==='propertyNew'){render(renderPropertyForm);return;}
    if(tab==='propertyEdit'){render(renderPropertyEditor,arg);return;}
    if(tab==='supportNew'){render(renderTicketForm,ticketPrefill);return;}
    if(tab==='invoiceDetail'){render(renderInvoice,arg);return;}
    if(tab==='documentPreview'){render(view=>{if(documentPreview)mountPage(view,documentPreview);else view.innerHTML='<div class="top"><h1>Document preview</h1></div><p>Open the document again from its record.</p><button class="btn neutral" onclick="App.go(\'reports\')">Back to reports</button>';});return;}
    if (tab === 'propertyDetail') { render(Screens.propertyDetail,arg); return; }
    if (tab === 'sensorDetail') { render(Screens.sensorDetail,arg); return; }
    if (tab === 'alertDetail') { render(Screens.alertDetail,arg); return; }
    if (tab === 'ticketDetail') { render(Screens.ticketDetail,arg); return; }
    if (tab === 'reportDetail') { render(Screens.reportDetail,arg); return; }
    const fn = Screens[tab];
    if (fn) render(fn);
  }

  function openProperty(id) { go('propertyDetail', id); }
  function openReport(id) { if (id) go('reportDetail', id); }
  function openSensor(id) { go('sensorDetail', id); }
  function setSensorRange(h, sensorId) { Screens.setSensorRange(h, sensorId); go('sensorDetail', sensorId); }
  function monSearch(v) { Screens.monSearch(v); }
  function monFilter(f) { Screens.monFilter(f); }
  // ---- Invoice detail + pay ----
  function openInvoice(id){go('invoiceDetail',id);}
  async function renderInvoice(view,id) {
    if(!can('view_billing')){UI.toast('Billing access is not available for your role.','error');return;}
    let inv;
    if (Demo.isOn()) {
      inv = Demo.data.invoices.find(x => x.invoice_id === id);
    } else {
      try { const r = await apiRequest(`/billing/invoices/${id}`); inv = r && r.data; }
      catch (e) { throw new Error(e.message || 'Could not load invoice'); }
    }
    if (!inv) throw new Error('Invoice not found');
    const paid = (inv.payment_status || inv.status) === 'paid';
    const bg = document.createElement('div');
    bg.className = 'form-page';
    bg.innerHTML = `
      <div class="modal">
        <div class="modal-h"><h1>Invoice ${UI.esc(inv.invoice_id || '')}</h1></div>
        <div class="modal-b">
          <div style="display:flex;justify-content:space-between;margin-bottom:20px">
            <div><div class="hint">Amount due</div><div style="font-family:var(--ff-d);font-size:30px;font-weight:700">${UI.fmtNaira(inv.total_amount)}</div></div>
            <div style="text-align:right">${paid ? UI.chip('ok', 'Paid') : UI.chip('warn', 'Due')}</div>
          </div>
          <div class="inv-line"><span>Type</span><b>${UI.esc((inv.invoice_type || 'Service'))}</b></div>
          <div class="inv-line"><span>Issued</span><b>${UI.fmtDate(inv.issue_date)}</b></div>
          <div class="inv-line"><span>Due date</span><b>${UI.fmtDate(inv.due_date)}</b></div>
          <div class="inv-line"><span>Subtotal</span><b>${UI.fmtNaira(inv.subtotal != null ? inv.subtotal : inv.total_amount)}</b></div>
          ${inv.vat_amount != null ? `<div class="inv-line"><span>VAT (${inv.vat_rate != null ? inv.vat_rate : 7.5}%)</span><b>${UI.fmtNaira(inv.vat_amount)}</b></div>` : ''}
          <div class="inv-line"><span>Total</span><b>${UI.fmtNaira(inv.total_amount)}</b></div>
          ${!paid && inv.balance_due != null ? `<div class="inv-line"><span>Balance due</span><b>${UI.fmtNaira(inv.balance_due)}</b></div>` : ''}
          ${paid ? `<div class="inv-line"><span>Paid on</span><b>${UI.fmtDate(inv.paid_date || inv.issue_date)}</b></div>` : ''}
          ${inv.description ? `<div class="inv-line"><span>Notes</span><b>${UI.esc(inv.description)}</b></div>` : ''}
        </div>
        <div class="modal-f">
          <button class="btn ghost" onclick="App.go('billing')">Back to payments</button>
          <button class="btn ghost" onclick="App.downloadInvoicePdf('${UI.jsq(inv.invoice_id)}', this)">Download PDF</button>
          ${(paid || !can('manage_billing')) ? '' : `<button class="btn" onclick="App.notifyPayment('${UI.jsq(inv.invoice_id)}', this)">I've paid — notify us</button>`}
        </div>
      </div>`;
    mountPage(view,bg);
  }

  // No payment gateway is wired yet, so a client can't self-mark an invoice paid
  // (that's a finance action). Instead we notify finance to confirm receipt —
  // this raises a ticket that lands in the ops Support inbox.
  async function notifyPayment(id, btn) {
    if(window.PortalPreview || Demo.isOn()){UI.toast('Sample mode — no payment notification was sent.','info');return;}
    btn.disabled = true; btn.textContent = 'Sending…';
    try {
      if (!Demo.isOn()) await apiRequest(`/billing/invoices/${id}/notify-payment`, { method: 'POST', body: {} });
      const m = document.querySelector('.modal-bg'); if (m) m.remove();
      UI.toast("Thanks — we'll confirm your payment and update the invoice shortly", 'success');
      go('billing');
    } catch (e) {
      UI.toast(e.message || 'Could not send notification', 'error');
      btn.disabled = false; btn.textContent = "I've paid — notify us";
    }
  }

  // Download the invoice PDF (authenticated blob — same as ops).
  async function downloadInvoicePdf(id, btn) {
    if(window.PortalPreview){PortalPreview.document('invoice',id,true);return;}
    const label = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Preparing…'; }
    try {
      const base = window.API_BASE;
      const token = localStorage.getItem('token') || '';
      const r = await fetch(`${base}/billing/invoices/${id}/pdf`, { headers: { Authorization: 'Bearer ' + token } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const ct = r.headers.get('content-type') || '';
      if (!ct.includes('pdf')) throw new Error('unexpected response');
      const blob = await r.blob();
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = id + '.pdf';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    } catch (e) {
      UI.toast('Could not download PDF' + (e.message ? ': ' + e.message : ''), 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = label; }
    }
  }

  // ---- Service tier selection ----
  async function selectServices(propertyId) {
    if(propertyId) setActiveProperty(propertyId);
    go('services');
  }

  async function confirmServices(propertyId, btn) {
    const sel = document.querySelector('input[name="tier"]:checked');
    const err = document.getElementById('tier-err');
    if (!sel) { err.textContent = 'Please choose a tier.'; err.classList.remove('hidden'); return; }
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      if(Demo.isOn()){UI.toast('Sample mode — no service selection was submitted.','info');btn.disabled=false;btn.textContent='Confirm selection';return;}
      await apiRequest(`/properties/${propertyId}/select-services`, { method: 'POST', body: { tier: sel.value } });
      document.querySelector('.modal-bg')?.remove();
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
    if(window.PortalPreview||Demo.isOn()){UI.toast('Sample mode — your message was not sent.','info');return;}
    btn.disabled = true; btn.textContent = 'Sending…';
    try {
      await apiRequest(`/tickets/${ticketId}/reply`, { method: 'POST', body: { message: msg } });
      // Clear the matching local draft only after the server accepts the reply.
      ta.value = '';
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      UI.toast('Reply sent', 'success');
      if(ta.isConnected)go('ticketDetail', ticketId);
    } catch (e) {
      UI.toast(e.message || 'Could not send reply', 'error');
      btn.disabled = false; btn.textContent = 'Send reply';
    }
  }

  async function viewReport(id) {
    if(window.PortalPreview){PortalPreview.document('report',id,false);return;}
    // Open the approved report PDF inline in a new tab (same source as download).
    if (!id) return;
    try {
      UI.toast('Opening your report…', 'info');
      const token = localStorage.getItem('token');
      const res = await fetch(`${window.API_BASE}/field-reports/${id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('open failed');
      const url = URL.createObjectURL(await res.blob());
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      UI.toast("Couldn't open the report. Try downloading it instead.", 'error');
    }
  }
  async function downloadReport(id) {
    if(window.PortalPreview){PortalPreview.document('report',id,true);return;}
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
  // Demo mode that WE switched on for a brand-new client must step aside as soon
  // as they have a real property — otherwise the sample sensors mask the real
  // state of a property that's still 'submitted' (and has no devices yet).
  // A client's own choice in Settings is never overridden.
  async function reconcileDemo() {
    try {
      // Fresh device (no local demo choice yet): adopt the server's onboarding
      // state so demo + tour follow the client across devices.
      if (localStorage.getItem('flowguard_demo_mode') === null) {
        const pr = await apiRequest('/preferences').then(r => r && r.data).catch(() => null);
        if (pr && pr.show_demo_data && !pr.onboarding_completed) {
          localStorage.setItem('flowguard_tour_pending', 'true');
          await Demo.setAuto(true);
        }
      }
      if (!Demo.isOn()) return;
      const legacy = Demo.isLegacyAuto();            // pre-dates the auto flag
      if (!Demo.isAuto() && !legacy) return;         // explicit client choice → respect it
      const r = await apiRequest('/properties');
      const hasReal = (((r && r.data) || []).length) > 0;
      if (hasReal) await Demo.setAuto(false);        // real data exists → leave demo
      else if (legacy) await Demo.setAuto(true);     // adopt the legacy session as auto-demo
    } catch (_) { /* can't tell → leave demo as-is */ }
  }

  function openTicket(presetCat, subj, prio, desc) {
    if(!can('submit_support')){UI.toast('Your account has read-only access. Ask your account administrator for help.','info');return;}
    if(['dispatch','emergency','inspection'].includes(presetCat)||/inspection|field visit|battery|schedule clearing/i.test((subj||'')+' '+(desc||''))){
      if(!can('manage_properties')){UI.toast('Ask your account administrator or facility manager to request this service.','info');return;}
      ClientServices.prefill({title:subj||'Service review',description:desc||'Please review the condition and advise on the appropriate service.',job_type:/battery|offline sensor/i.test((subj||'')+' '+(desc||''))?'sensor_maintenance':presetCat==='dispatch'?'drain_cleaning':presetCat==='sensor'?'sensor_maintenance':'inspection'});
      go('services');return;
    }
    ticketPrefill={presetCat,subj,prio,desc};go('supportNew');
  }
  function renderTicketForm(view,{presetCat,subj,prio,desc}={}){
    const cats = Screens.TICKET_CATS;
    const opts = Object.keys(cats).map(k => `<option value="${k}" ${k === presetCat ? 'selected' : ''}>${cats[k]}</option>`).join('');
    const presetSubj = subj || (presetCat === 'dispatch' ? 'Drain inspection request' : '');
    const presetDesc = desc || '';
    const bg = document.createElement('div');
    bg.className = 'form-page';
    bg.innerHTML = `
      <div class="modal">
        <div class="modal-h"><h1>Message FlowGuard</h1></div>
        <div class="modal-b">
          <div class="field"><label>Subject</label><input id="tk-subj" value="${UI.esc(presetSubj)}" placeholder="Brief summary of your request"></div>
          <div class="field"><label>Category</label><select id="tk-cat">${opts}</select></div>
          <div class="field"><label>Priority</label>
            <select id="tk-prio"><option value="low" ${prio==='low'?'selected':''}>Low</option><option value="normal" ${!prio||prio==='normal'?'selected':''}>Normal</option><option value="high" ${prio==='high'?'selected':''}>High</option><option value="urgent" ${prio==='urgent'?'selected':''}>Urgent — immediate review requested</option></select></div>
          <div class="field"><label>Details</label><textarea id="tk-desc" rows="4" placeholder="Describe the issue or request…">${UI.esc(presetDesc)}</textarea></div>
          <div id="tk-err" class="hint hidden c-alert"></div>
        </div>
        <div class="modal-f">
          <button class="btn ghost" onclick="App.go('support')">Cancel</button>
          <button class="btn" onclick="App.submitTicket(this)">Submit ticket</button>
        </div>
      </div>`;
    mountPage(view,bg);
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
      ticketPrefill={};
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
    if(window.PortalPreview){UI.toast('Local design review uses sample data; no live mode is available here.','info');go(current);return;}
    await Demo.set(on);
    UI.toast(on ? 'Demo mode on — showing sample data' : 'Demo mode off', 'info');
    go(current); // re-render current screen with new data source
  }

  // Forms are full workspace pages; only confirmations use overlays.
  function mountPage(view,page){
    page.querySelector('.modal').className='form-page-panel';
    page.querySelector('.modal-h').className='top form-page-heading';
    page.querySelector('.modal-b').className='form-page-body';
    page.querySelector('.modal-f').className='form-page-actions';
    if(!view.isConnected)return;
    view.replaceChildren(page);
  }
  function openRegister(edit) {
    go(edit?'propertyEdit':'propertyNew',edit?.property_id);
  }
  async function renderPropertyEditor(view,propertyId){
    const property=Demo.isOn()?Demo.data.properties.find(p=>p.property_id===propertyId):(await apiRequest('/properties/'+encodeURIComponent(propertyId))).data;
    if(!property)throw new Error('Property not found');
    renderPropertyForm(view,property);
  }
  function renderPropertyForm(view,edit) {
    const bg = document.createElement('div');
    bg.className = 'form-page';
    bg.innerHTML = `
      <div class="modal modal-wide">
        <div class="modal-h"><h1>${edit ? 'Edit property details' : 'Register a property'}</h1></div>
        <div class="modal-b">

          <div class="form-section-t">Property details</div>
          <div class="field"><label>Property name <span class="req">*</span></label><input id="rg-name" placeholder="e.g. Sunrise Court Estate"></div>
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
          <button class="btn ghost" onclick="App.go('${edit?'propertyDetail':'properties'}'${edit?",'"+UI.jsq(edit.property_id)+"'":''})">Cancel</button>
          <button class="btn" id="rg-submit" ${edit ? `data-edit="${edit.property_id}"` : ''} onclick="App.submitRegister(this)">${edit ? 'Save changes' : 'Submit property'}</button>
        </div>
      </div>`;
    mountPage(view,bg);
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
  function openEditProperty(propertyId) { go('propertyEdit',propertyId); }

  async function submitRegister(btn) {
    const g = id => document.getElementById(id);
    const val = id => { const el = g(id); return el ? el.value.trim() : ''; };
    const num = id => { const v = val(id); return v === '' ? undefined : Number(v); };
    const name = val('rg-name');
    const city = val('rg-city');
    const desc = val('rg-desc');
    const err = g('rg-err');
    if (!name || !city || !desc) {
      err.textContent = 'Please add a property name, city, and the drainage concern.';
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
        UI.toast('Property updated (demo)', 'success');
        openProperty(editId);
        return;
      }
      if (editId) {
        await apiRequest(`/properties/${editId}`, { method: 'PUT', body });
        UI.toast('Property updated', 'success');
        openProperty(editId);
        return;
      }
      await apiRequest('/properties', { method: 'POST', body });
      // They now have a real property — step out of the sample data we turned on
      // at signup so the dashboard reflects their actual state.
      if (Demo.isOn() && Demo.isAuto()) await Demo.setAuto(false);
      UI.toast('Property registered', 'success');
      go('properties');
    } catch (e) {
      err.textContent = e.message || 'Could not submit. Please try again.';
      err.classList.remove('hidden');
      btn.disabled = false; btn.textContent = 'Submit property';
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
  // ---- Client-portal RBAC (mirrors backend utils/clientPermissions.js) ----
  // Permissions come from /profile (merged into the cached user by refreshUser).
  // Missing permission lists grant access only to explicitly identified account owners.
  function can(perm) {
    const u = Auth.getUser() || {};
    if (!Array.isArray(u.permissions)) return u.is_account_owner === true;   // explicit owner fallback
    return u.permissions.includes(perm);
  }
  function myRoleLabel() { const u = Auth.getUser() || {}; return u.client_role_label || (u.is_account_owner ? 'Account owner' : null); }

  // Show/hide nav + elements by permission. Elements can declare data-perm="key".
  function applyPermissions() {
    // Nav items that map to a permission (others are visible to every member).
    const navPerm = {
      billing: 'view_billing', team: 'manage_team',
      monitoring: 'view_monitoring', forecast: 'view_monitoring',
      alerts: 'view_alerts', reports: 'view_reports',
      properties: 'manage_properties', propertyDetail:'manage_properties', sensorDetail:'view_monitoring',
    };
    document.querySelectorAll('.rail .navbtn[data-tab]').forEach(b => {
      const need = navPerm[b.dataset.tab];
      if (need) b.style.display = can(need) ? '' : 'none';
    });
    document.querySelectorAll('[data-perm]').forEach(el => {
      el.style.display = can(el.dataset.perm) ? '' : 'none';
    });
  }

  function setMe() {
    const u = Auth.getUser() || {};
    const nm = (u.fullName || u.full_name || 'U').trim();
    const initials = nm.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'U';
    const av = document.getElementById('meAv');
    const name = document.getElementById('meName');
    if (av) av.textContent = initials;
    if (name) name.textContent = (u.fullName || u.full_name || 'Account').split(' ')[0];
    refreshPlatformHeader();
    applyPermissions();
  }

  // ---- Boot ----
  function init() {
    // auth gate
    if (!Auth.isAuthenticated || !Auth.isAuthenticated()) {
      window.location.href = 'login.html'; return;
    }
    // theme: remember last
    applyTheme(localStorage.getItem('flowguard_theme') || 'dark');
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
    reconcileDemo().finally(() => refreshUser().finally(() => routeFromHash()));
    refreshRailSelector();

    // Notification bell: poll so new notifications appear without a page refresh.
    pollNotifs();
    setInterval(pollNotifs, 45000);

    // respond to browser back/forward and in-app hash changes
    window.addEventListener('hashchange', () => {
      if (_suppressHashChange) { _suppressHashChange = false; return; }
      routeFromHash();
    });
  }

  // ── Notification bell (unread badge + background poll) ──────────────
  let _unreadNotif = 0;
  async function pollNotifs() {
    try {
      const r = await apiRequest('/notifications');
      const items = (r && r.data) || [];
      _unreadNotif = items.filter(n => !(n.read || n.is_read)).length;
    } catch (_) {}
    updateNotifBadge();
  }
  function updateNotifBadge() {
    const b = document.getElementById('nav-notif-badge');
    if (!b) return;
    if (_unreadNotif > 0) { b.textContent = _unreadNotif > 99 ? '99+' : _unreadNotif; b.style.display = ''; }
    else b.style.display = 'none';
  }

  // Parse location.hash -> screen. Supports #overview, #properties,
  // and detail deep-links like #property/PROP-123, #sensor/ID, #ticket/ID
  function routeFromHash() {
    const raw = (location.hash || '').replace(/^#/, '');
    if (!raw) { go('overview'); return; }
    const [seg, id] = raw.split('/');
    if(seg==='service-request'&&id){go('services',decodeURIComponent(id));return;}
    if(seg==='services'){go('services');return;}
    if(seg==='invoice'&&id){go('invoiceDetail',decodeURIComponent(id));return;}
    if(seg==='property-edit'&&id){go('propertyEdit',decodeURIComponent(id));return;}
    if(['propertyNew','supportNew','documentPreview'].includes(seg)){go(seg);return;}
    const detailMap = { alert:'alertDetail', property: 'propertyDetail', sensor: 'sensorDetail', ticket: 'ticketDetail', report: 'reportDetail' };
    if (detailMap[seg] && id) { go(detailMap[seg], decodeURIComponent(id)); return; }
    // plain screens — only if the screen actually exists, else overview
    if (Screens[seg]) { go(seg); return; }
    go('overview');
  }

  // ---- Team & roles actions (client org RBAC) ----
  async function inviteTeammate() {
    const name = (document.getElementById('tm-name') || {}).value || '';
    const email = (document.getElementById('tm-email') || {}).value || '';
    const role = (document.getElementById('tm-role') || {}).value || 'member';
    if (!name.trim() || !email.trim()) { UI.toast('Add a name and email first', 'error'); return; }
    try {
      const r = await apiRequest('/client-team/invite', { method: 'POST', body: { full_name: name.trim(), email: email.trim(), client_role: role } });
      UI.toast(r && r.data && r.data.emailed ? 'Invite sent' : 'Teammate added — email pending', 'success');
      go('team');
    } catch (e) { UI.toast(e.message || 'Could not send invite', 'error'); }
  }
  async function setMemberRole(id, role) {
    try { await apiRequest('/client-team/' + id + '/role', { method: 'PUT', body: { client_role: role } }); UI.toast('Role updated', 'success'); go('team'); }
    catch (e) { UI.toast(e.message || 'Could not update role', 'error'); go('team'); }
  }
  async function toggleMember(id, active) {
    try { await apiRequest('/client-team/' + id + '/status', { method: 'PUT', body: { is_active: active } }); UI.toast(active ? 'Member reactivated' : 'Member deactivated', 'success'); go('team'); }
    catch (e) { UI.toast(e.message || 'Could not update member', 'error'); go('team'); }
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

  return { go, openDocumentPage,openProperty, openReport, openEditProperty, activeProperty, setActiveProperty, setFcRange, openSensor, setSensorRange, monSearch, monFilter, monMetric, viewReport, downloadReport, toggleTheme, toggleDemo, openRegister, submitRegister, saveProfile, saveSettings, changePassword,
           openTicketDetail, sendReply, openInvoice, notifyPayment, downloadInvoicePdf, selectServices, confirmServices, deactivateAccount, confirmDeactivate,
           setNotifFilter, markRead, markAllRead, deleteNotif, setTicketFilter, openTicket, submitTicket,
           can, inviteTeammate, setMemberRole, toggleMember, init };
})();
window.App = App;
document.addEventListener('DOMContentLoaded', App.init);
