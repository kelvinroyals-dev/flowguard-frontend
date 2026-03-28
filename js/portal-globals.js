
/* ══════════════════════════════════════
   PORTAL GLOBALS — all functions here are
   called directly by JS modules or by HTML.
   Do not rename or remove any of them.
══════════════════════════════════════ */

var PORTAL_API = 'https://api.flowguard.ng/api/v1';
var _subView = false; // true when AccountSettings/Notifications overlays dashboard

var TAB_TITLES = {
  dashboard:          'Dashboard',
  assets:             'Submitted Areas',
  monitoring:         'Live Monitoring',
  'alerts-incidents': 'Alerts',
  documents:          'Reports & Documents',
  invoices:           'Invoices',
  billing:            'Contract & SLA',
  account:            'My Account',
  support:            'Support'
};

/* ── Sidebar (mobile) ── */
function openSidebar() {
  document.getElementById('sidebar').classList.add('mob-open');
  document.getElementById('mob-veil').classList.add('show');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('mob-open');
  document.getElementById('mob-veil').classList.remove('show');
}

/* ── Theme ── */
function toggleTheme() {
  var html = document.documentElement;
  var isDark = html.classList.contains('dark');
  isDark ? html.classList.remove('dark') : html.classList.add('dark');
  localStorage.setItem('fg_theme', isDark ? 'light' : 'dark');
  _syncThemeIcons();
  if (typeof initMap === 'function') initMap();
}
function _syncThemeIcons() {
  var d = document.documentElement.classList.contains('dark');
  document.getElementById('ti-sun')?.classList.toggle('hidden', d);
  document.getElementById('ti-moon')?.classList.toggle('hidden', !d);
}

/* ── Dropdowns ── */
function toggleUserMenu() {
  document.getElementById('user-menu')?.classList.toggle('hidden');
  document.getElementById('estate-switcher-menu')?.classList.add('hidden');
}
function toggleEstateSwitcher() {
  document.getElementById('estate-switcher-menu')?.classList.toggle('hidden');
  document.getElementById('user-menu')?.classList.add('hidden');
}
document.addEventListener('click', function(e) {
  var um = document.getElementById('user-menu');
  var ua = document.getElementById('user-avatar');
  var em = document.getElementById('estate-switcher-menu');
  var eb = document.getElementById('estate-switcher-btn');
  if (um && !ua?.contains(e.target) && !um.contains(e.target)) um.classList.add('hidden');
  if (em && !eb?.contains(e.target) && !em.contains(e.target)) em.classList.add('hidden');
});

/* ── Modal ── */
function openModal(id)  { var m = document.getElementById(id); if (m) m.classList.add('show'); }
function closeModal(id) { var m = document.getElementById(id); if (m) m.classList.remove('show'); }

/* ── Submit Area ── */
async function submitArea() {
  var name    = (document.getElementById('sub-name')    ||{}).value || '';
  var type    = (document.getElementById('sub-type')    ||{}).value || '';
  var city    = (document.getElementById('sub-city')    ||{}).value || '';
  var state   = (document.getElementById('sub-state')   ||{}).value || '';
  var address = (document.getElementById('sub-address') ||{}).value || '';
  var area    = (document.getElementById('sub-area')    ||{}).value || '';
  var urgency = (document.getElementById('sub-urgency') ||{}).value || 'medium';
  var desc    = (document.getElementById('sub-desc')    ||{}).value || '';
  var errEl   = document.getElementById('sub-error');
  var btn     = document.getElementById('sub-btn');

  if (!name.trim() || !type || !city.trim() || !state.trim()) {
    if (errEl) { errEl.textContent = 'Please fill in Area Name, Property Type, City and State.'; errEl.classList.remove('hidden'); }
    return;
  }
  if (errEl) errEl.classList.add('hidden');
  if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }

  try {
    var token = localStorage.getItem('token');
    var res = await fetch(PORTAL_API + '/properties', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyName:     name.trim(),
        propertyType:     type,
        city:             city.trim(),
        state:            state.trim(),
        addressLine1:     address.trim(),
        coverageArea:     area.trim(),
        urgencyLevel:     urgency,
        issueDescription: desc.trim()
      })
    });
    var data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Submission failed');

    ['sub-name','sub-type','sub-city','sub-state','sub-address','sub-area','sub-desc'].forEach(function(id) {
      var el = document.getElementById(id); if (el) el.value = '';
    });
    var urgEl = document.getElementById('sub-urgency');
    if (urgEl) urgEl.value = 'medium';

    closeModal('modal-submit');
    showToast('Area submitted! Our team will be in touch within 3–5 business days.', 'success');
    setTimeout(function() {
      if (typeof App !== 'undefined' && App.loadAndRender) App.loadAndRender();
    }, 600);

  } catch(e) {
    if (errEl) { errEl.textContent = e.message || 'Submission failed. Please try again.'; errEl.classList.remove('hidden'); }
    if (btn) { btn.disabled = false; btn.textContent = 'Submit Area'; }
  }
}
document.querySelectorAll('.modal-over').forEach(function(ov) {
  ov.addEventListener('click', function(e) { if (e.target === ov) ov.classList.remove('show'); });
});

/* ── Toggle prefs ── */
function togglePref(el) { el.classList.toggle('on'); el.classList.toggle('off'); }

/* ── _activateDashboardView ──
   Activates dashboard tab UI WITHOUT triggering any render or fetch.
   Used by openAccountSettings/openNotifications to prevent
   App.loadAndRender() race conditions. */
function _activateDashboardView() {
  var ALL = ['dashboard','assets','monitoring','alerts-incidents','documents','invoices','billing','account','support'];
  ALL.forEach(function(t) {
    document.getElementById('tab-'+t)?.classList.toggle('active', t === 'dashboard');
    var c = document.getElementById('content-'+t);
    if (c) c.classList.add('hidden');
  });
  document.getElementById('content-dashboard')?.classList.remove('hidden');
  document.getElementById('user-menu')?.classList.add('hidden');
  var tEl = document.getElementById('tb-title');
  if (tEl) tEl.textContent = 'Dashboard';
}

/* ── Tab switching ──
   Called by: nav-item onclick, account-settings.js close(), notifications-page.js close() */
function switchTab(tab) {
  var ALL = ['dashboard','assets','monitoring','alerts-incidents','documents','invoices','billing','account','support'];

  ALL.forEach(function(t) {
    // sidebar nav buttons
    document.getElementById('tab-'+t)?.classList.toggle('active', t === tab);
    // content panels
    var c = document.getElementById('content-'+t);
    if (c) c.classList.add('hidden');
  });


  // Show selected panel
  var container = document.getElementById('content-' + tab);
  if (container) {
    container.classList.remove('hidden');

    if (tab === 'dashboard') {
      if (_subView) {
        _subView = false;
        if (typeof App !== 'undefined' && App.loadAndRender) App.loadAndRender();
      }
    } else {
      _subView = false;
      if (tab === 'support') {
        if (typeof SupportTab !== 'undefined') SupportTab.render(container);
      } else if (tab === 'documents') {
        if (typeof DocumentsTab !== 'undefined') DocumentsTab.render(container);
        else container.innerHTML = '<div class="empty-state"><h3>Loading…</h3><p>Please refresh the page.</p></div>';
      } else if (tab === 'account') {
        openAccountSettings();
        return;
      } else if (typeof App !== 'undefined' && App.renderTab) {
        App.renderTab(tab, container);
      }
    }
  }

  // Update topbar breadcrumb
  var tEl = document.getElementById('tb-title');
  if (tEl) tEl.textContent = TAB_TITLES[tab] || tab;

  document.getElementById('user-menu')?.classList.add('hidden');
  document.getElementById('estate-switcher-menu')?.classList.add('hidden');
  closeSidebar();
}

/* ── Sub-view openers ── */
function openAccountSettings() {
  document.getElementById('user-menu')?.classList.add('hidden');
  _activateDashboardView();
  _subView = true;
  var c = document.getElementById('content-dashboard');
  if (c && typeof AccountSettings !== 'undefined') AccountSettings.render(c);
}
function openNotifications() {
  document.getElementById('user-menu')?.classList.add('hidden');
  _activateDashboardView();
  _subView = true;
  var c = document.getElementById('content-dashboard');
  if (c && typeof NotificationsPage !== 'undefined') NotificationsPage.render(c);
}

/* ── Globals needed by modules ── */
function toggleDemoMode() {
  var t = document.getElementById('demo-toggle');
  if (t) { t.checked = !t.checked; t.dispatchEvent(new Event('change')); }
}
function disableDemoMode() {
  var t = document.getElementById('demo-toggle');
  if (t && t.checked) { t.checked = false; t.dispatchEvent(new Event('change')); }
}
function viewAllSensors()             { showToast('Full sensor map coming in next release', 'success'); }
function addAnotherProperty()         { if (typeof Onboarding !== 'undefined') Onboarding.showRegistrationModal(); }
function viewFullPropertyDetails(id)  { showToast('Full property details — coming soon', 'success'); }
function editProperty(id)             { openAccountSettings(); }
function nextStep(step)     { document.querySelectorAll('.form-step').forEach(function(el,i){ el.classList.toggle('hidden', i !== step-1); }); }
function previousStep(step) { nextStep(step); }

/* ── Notification count ── */
async function _fetchNotifCount() {
  try {
    var res = await fetch(PORTAL_API + '/notifications', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } });
    if (!res.ok) return;
    var d = await res.json();
    var count = (d.data || []).filter(function(n) { return !n.read; }).length;
    if (count > 0) {
      var b = document.getElementById('notif-count');
      if (b) { b.textContent = count > 99 ? '99+' : count; b.classList.remove('hidden'); }
    }
  } catch(e) {}
}

/* ── SLA time ── */
async function _fetchSLATime() {
  try {
    var prop = typeof StateManager !== 'undefined' ? StateManager.getCurrentProperty() : null;
    if (!prop) return;
    var res = await fetch(PORTAL_API + '/billing/' + prop.property_id, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } });
    if (!res.ok) return;
    var d = await res.json(), hrs = d.data?.sla?.response_time_hours;
    if (hrs) {
      var el = document.getElementById('support-response-time');
      if (el) el.textContent = hrs + ' hr';
    }
  } catch(e) {}
}

/* ── Toast ── */
function showToast(msg, type) {
  var t = document.createElement('div');
  t.className = 'fg-toast ' + (type || 'success');
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function() { t.remove(); }, 3400);
}

/* ── Map ── */
function initMap() {
  var el = document.getElementById('map'); if (!el) return;
  var d = document.documentElement.classList.contains('dark');
  var ns = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(ns,'svg');
  svg.setAttribute('viewBox','0 0 800 460'); svg.setAttribute('width','100%'); svg.setAttribute('height','460');
  svg.style.background = d ? '#0b1724' : '#edf2f7';
  var defs = document.createElementNS(ns,'defs'), pat = document.createElementNS(ns,'pattern');
  pat.setAttribute('id','mpg3'); pat.setAttribute('width','48'); pat.setAttribute('height','48'); pat.setAttribute('patternUnits','userSpaceOnUse');
  var path = document.createElementNS(ns,'path');
  path.setAttribute('d','M 48 0 L 0 0 0 48'); path.setAttribute('fill','none');
  path.setAttribute('stroke', d ? 'rgba(22,168,211,0.08)' : 'rgba(22,168,211,0.12)'); path.setAttribute('stroke-width','1');
  pat.appendChild(path); defs.appendChild(pat); svg.appendChild(defs);
  var rect = document.createElementNS(ns,'rect'); rect.setAttribute('width','800'); rect.setAttribute('height','460'); rect.setAttribute('fill','url(#mpg3)'); svg.appendChild(rect);
  el.innerHTML = ''; el.appendChild(svg);
}


/* ══════════════════════════════════════
   SUPPORT TAB MODULE
══════════════════════════════════════ */
var SupportTab = (function() {
  var tickets = [], cf = 'all';
  var CAT = { sensor:'Sentinel Network', treatment:'Bio-Treatment', dispatch:'Heavy-Plant Dispatch', technical:'Technical', billing:'Billing', maintenance:'Maintenance', emergency:'Emergency', general:'General' };

  async function render(container) { await _load(); _fetchSLATime(); }

  async function _load() {
    var tb = document.getElementById('support-tickets-body'); if (!tb) return;
    tb.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px 0;"><div style="display:inline-flex;align-items:center;gap:8px;color:var(--ink-3);font-size:.8rem;"><div class="fg-spin" style="width:16px;height:16px;"></div>Loading…</div></td></tr>';
    try {
      var prop = typeof StateManager !== 'undefined' ? StateManager.getCurrentProperty() : null;
      var url  = prop ? PORTAL_API + '/properties/' + prop.property_id + '/tickets' : PORTAL_API + '/tickets';
      var res  = await fetch(url, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } });
      tickets  = res.ok ? ((await res.json()).data || []) : [];
    } catch(e) { tickets = []; }
    _renderTable();
  }

  function _renderTable() {
    var tb = document.getElementById('support-tickets-body');
    var em = document.getElementById('support-empty-state');
    if (!tb) return;
    var rows = cf === 'all' ? tickets
      : cf === 'open' ? tickets.filter(function(t) { return t.status !== 'resolved' && t.status !== 'closed'; })
      : tickets.filter(function(t) { return t.status === 'resolved' || t.status === 'closed'; });
    if (rows.length === 0) { tb.innerHTML = ''; if (em) em.classList.remove('hidden'); return; }
    if (em) em.classList.add('hidden');
    tb.innerHTML = rows.map(function(t) {
      var sc = (t.status === 'resolved' || t.status === 'closed') ? 'nominal' : t.status === 'in_progress' ? 'watch' : 'info';
      var pc = (t.priority === 'urgent' || t.priority === 'critical') ? 'critical' : t.priority === 'high' ? 'warning' : 'offline';
      var dt = t.created_at ? new Date(t.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
      var tid = t.ticket_id || t.id || '—';
      return '<tr>'
        + '<td style="font-family:var(--ff-m);font-size:.7rem;color:var(--ink-3);">' + tid + '</td>'
        + '<td class="bright">' + (t.subject || t.title || '—') + '</td>'
        + '<td style="font-size:.78rem;">' + (CAT[t.type] || t.type || '—') + '</td>'
        + '<td><span class="badge ' + pc + '">' + (t.priority || 'Normal') + '</span></td>'
        + '<td><span class="badge ' + sc + '">' + (t.status || '').replace(/_/g,' ') + '</span></td>'
        + '<td style="font-size:.75rem;color:var(--ink-3);">' + dt + '</td>'
        + '<td><button onclick="SupportTab.viewTicket(\'' + tid + '\')" class="btn btn-ghost btn-sm">View</button></td>'
        + '</tr>';
    }).join('');
  }

  function filterTickets(f) {
    cf = f;
    ['all','open','resolved'].forEach(function(x) {
      document.getElementById('filter-'+x)?.classList.toggle('active', x === f);
    });
    _renderTable();
  }

  function openNewTicket(preset)  { _modal(preset || null, false); }
  function openDispatchRequest()  { _modal('dispatch', true); }

  function _modal(preset, isDispatch) {
    document.getElementById('stk-modal')?.remove();
    var opts = [['sensor','Sentinel Network'],['treatment','Bio-Treatment'],['dispatch','Heavy-Plant Dispatch'],['technical','Technical'],['billing','Contract/Billing'],['maintenance','Maintenance'],['general','General Enquiry']]
      .map(function(o) { return '<option value="' + o[0] + '"' + (o[0] === preset ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('');
    var dispBanner = isDispatch
      ? '<div class="notice crit" style="margin-bottom:14px;"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg><div>For life-threatening emergencies call <strong>020 1700 3062</strong> directly.</div></div>'
      : '';
    var m = document.createElement('div');
    m.id = 'stk-modal'; m.className = 'modal-over show';
    m.innerHTML = '<div class="modal"><div class="modal-head"><div class="modal-title">' + (isDispatch ? 'Emergency Dispatch Request' : 'New Support Ticket') + '</div><button class="modal-close" onclick="document.getElementById(\'stk-modal\').remove()">✕</button></div>'
      + '<div class="modal-body">' + dispBanner
      + '<form id="stk-form"><div class="f-field"><label class="f-label">Subject *</label><input class="f-input" name="subject" required placeholder="Brief description of the issue"></div>'
      + '<div class="f-row"><div class="f-field"><label class="f-label">Category</label><select class="f-input" name="type">' + opts + '</select></div>'
      + '<div class="f-field"><label class="f-label">Priority</label><select class="f-input" name="priority"><option value="normal">Normal</option><option value="high">High</option><option value="urgent"' + (isDispatch ? ' selected' : '') + '>Urgent</option></select></div></div>'
      + '<div class="f-field" style="margin-bottom:0;"><label class="f-label">Details *</label><textarea class="f-input" name="description" rows="4" required placeholder="Describe the issue in full…" style="resize:vertical;"></textarea></div>'
      + '</form><div id="stk-err" class="hidden" style="margin-top:10px;padding:9px 12px;border-radius:var(--rs);font-size:.78rem;background:var(--err-bg);border:1px solid rgba(220,38,38,.3);color:var(--err);"></div></div>'
      + '<div class="modal-foot"><button class="btn btn-ghost" onclick="document.getElementById(\'stk-modal\').remove()">Cancel</button>'
      + '<button class="btn ' + (isDispatch ? 'btn-danger' : 'btn-primary') + '" id="stk-sub">Submit ' + (isDispatch ? 'Dispatch Request' : 'Ticket') + '</button></div></div>';
    document.body.appendChild(m);
    m.addEventListener('click', function(e) { if (e.target === m) m.remove(); });
    document.getElementById('stk-sub').addEventListener('click', async function() {
      var form = document.getElementById('stk-form');
      var payload = Object.fromEntries(new FormData(form));
      if (!payload.subject || !payload.description) { var errEl = document.getElementById('stk-err'); errEl.textContent = 'Please fill in all required fields.'; errEl.classList.remove('hidden'); return; }
      var btn = this; var orig = btn.textContent;
      btn.textContent = 'Submitting…'; btn.disabled = true;
      var prop = typeof StateManager !== 'undefined' ? StateManager.getCurrentProperty() : null;
      if (prop) payload.property_id = prop.property_id;
      try {
        var res = await fetch(PORTAL_API + '/tickets', { method: 'POST', headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        var data = await res.json();
        if (data.success) { m.remove(); showToast(isDispatch ? 'Dispatch request submitted.' : 'Ticket submitted.', 'success'); await _load(); }
        else { var errEl = document.getElementById('stk-err'); errEl.textContent = data.error || 'Submission failed.'; errEl.classList.remove('hidden'); btn.textContent = orig; btn.disabled = false; }
      } catch(e) { var errEl = document.getElementById('stk-err'); errEl.textContent = 'Connection failed.'; errEl.classList.remove('hidden'); btn.textContent = orig; btn.disabled = false; }
    });
  }

  function viewTicket(tid) {
    var t = tickets.find(function(x) { return (x.ticket_id || x.id) === tid; });
    if (!t || typeof Modal === 'undefined') return;
    Modal.showAlert({ type: 'info', title: t.subject || t.title || 'Ticket ' + tid,
      message: 'Category: ' + (CAT[t.type] || t.type || '—') + ' · Status: ' + (t.status || '—') + ' · Priority: ' + (t.priority || 'Normal') });
  }

  return { render, filterTickets, openNewTicket, openDispatchRequest, viewTicket };
})();




/* ══════════════════════════════════════
   DOCUMENTS & REPORTS TAB
   Fetches field_reports sent to this client
   and renders them. "View" opens a full
   report modal. Calls the new API endpoints
   built in ops-routes.js.
══════════════════════════════════════ */
var DocumentsTab = (function() {

  var _reports  = [];
  var _filter   = 'all'; // all | inspection | incident

  /* ─── Entry point ─── */
  async function render(container) {
    container.innerHTML = _skeleton();
    _bindFilters();
    await _load();
  }

  /* ─── Skeleton HTML ─── */
  function _skeleton() {
    return [
      '<div class="sec-head">',
        '<div>',
          '<div class="sec-title">Reports &amp; Documents</div>',
          '<div class="sec-sub">Inspection reports, incident records, and documents sent to you by FlowGuard</div>',
        '</div>',
        '<div style="display:flex;gap:4px;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--rs);padding:2px;">',
          '<button class="filter-btn active" id="doc-f-all"        onclick="DocumentsTab.setFilter(\'all\')">All</button>',
          '<button class="filter-btn"        id="doc-f-inspection" onclick="DocumentsTab.setFilter(\'inspection\')">Inspections</button>',
          '<button class="filter-btn"        id="doc-f-incident"   onclick="DocumentsTab.setFilter(\'incident\')">Incidents</button>',
        '</div>',
      '</div>',
      '<div id="doc-list"></div>',
    ].join('');
  }

  function _bindFilters() {}

  /* ─── Load reports ─── */
  async function _load() {
    var list = document.getElementById('doc-list');
    if (!list) return;
    list.innerHTML = '<div style="display:flex;align-items:center;gap:9px;padding:32px 0;color:var(--ink-3);font-size:.82rem;"><div class="fg-spin" style="width:17px;height:17px;flex-shrink:0;"></div>Loading reports…</div>';

    try {
      var token = localStorage.getItem('token');
      var prop  = typeof StateManager !== 'undefined' ? StateManager.getCurrentProperty() : null;

      // Primary: fetch field_reports for this client's properties
      var url = PORTAL_API + '/field-reports?limit=100';
      var res = await fetch(url, { headers: { 'Authorization': 'Bearer ' + token } });
      var data = res.ok ? await res.json() : { data: [] };
      _reports = (data.data || []).filter(function(r) {
        return r.status === 'sent_to_client';
      });

      // If property context, also check /properties/:id/inspection
      if (prop && _reports.length === 0) {
        try {
          var r2 = await fetch(PORTAL_API + '/properties/' + prop.property_id + '/inspection', {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          if (r2.ok) {
            var d2 = await r2.json();
            if (d2.data) _reports = [_normaliseInspection(d2.data, prop)];
          }
        } catch(e) {}
      }
    } catch(e) {
      _reports = [];
    }

    _renderList();
  }

  function _normaliseInspection(d, prop) {
    // findings can be a JSON object or a plain string depending on how it was stored
    var f = d.findings || {};
    if (typeof f === 'string') {
      try { f = JSON.parse(f); } catch(e) { f = { summary: f }; }
    }
    // Build a human-readable findings string from whatever keys exist
    var findingsText = [
      f.details || f.findings || f.description || '',
      f.blockageDetails ? 'Blockage: ' + f.blockageDetails : '',
      f.drainageCondition ? 'Drainage condition: ' + f.drainageCondition : '',
      f.sensorReadings ? 'Sensor readings: ' + f.sensorReadings : '',
    ].filter(Boolean).join('\n');

    var recsText = Array.isArray(f.recommendations)
      ? f.recommendations.join('\n')
      : (typeof f.recommendations === 'string' ? f.recommendations : '');

    return {
      report_id:               d.report_id || ('LEG-' + d.inspection_id || 'legacy'),
      report_type:             'inspection',
      title:                   'Drainage Inspection Report — ' + (prop ? prop.property_name : ''),
      summary:                 f.summary || d.status || '',
      findings:                findingsText,
      recommendations:         recsText,
      overall_condition:       f.overallCondition || '',
      flood_risk_level:        f.floodRiskLevel   || d.flood_risk_level || '',
      drainage_condition_score:f.drainageScore    || d.drainage_condition_score || '',
      property_name:           prop ? prop.property_name : '',
      sent_to_client_at:       d.sent_to_client_at || d.completed_at || null,
      submitted_by_name:       d.submitted_by_name || d.assigned_agent_name || '',
      team_name:               d.team_name || d.assigned_team || '',
      status:                  'sent_to_client',
      _raw:                    d
    };
  }

  /* ─── Render list ─── */
  function _renderList() {
    var list = document.getElementById('doc-list');
    if (!list) return;

    var filtered = _filter === 'all' ? _reports
      : _reports.filter(function(r) { return r.report_type === _filter; });

    if (filtered.length === 0) {
      list.innerHTML = [
        '<div class="card">',
          '<div class="empty-state">',
            '<svg width="38" height="38" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>',
            '<h3>No reports available</h3>',
            '<p>Reports will appear here once FlowGuard has completed an inspection or resolved an incident for your property.</p>',
          '</div>',
        '</div>'
      ].join('');
      return;
    }

    var cards = filtered.map(function(r) { return _reportCard(r); });
    list.innerHTML = [
      '<div class="card">',
        '<div class="card-head">',
          '<div class="card-title">Sent to You</div>',
          '<span class="badge nominal">' + filtered.length + ' document' + (filtered.length !== 1 ? 's' : '') + '</span>',
        '</div>',
        '<div class="card-body-sm">',
          cards.join(''),
        '</div>',
      '</div>'
    ].join('');
  }

  function _reportCard(r) {
    var typeLabel = r.report_type === 'inspection' ? 'Inspection Report'
      : r.report_type === 'incident' ? 'Incident Report'
      : 'Report';
    var iconColor = r.report_type === 'inspection' ? 'var(--blue)' : 'var(--caut)';
    var iconBg    = r.report_type === 'inspection' ? 'rgba(22,168,211,.08)' : 'rgba(194,65,12,.08)';
    var iconBord  = r.report_type === 'inspection' ? 'rgba(22,168,211,.15)' : 'rgba(194,65,12,.18)';
    var dateStr   = r.sent_to_client_at
      ? new Date(r.sent_to_client_at).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' })
      : '—';
    var context   = [r.property_name || r.site_name || '', r.team_name || '', dateStr].filter(Boolean).join(' · ');
    var rid       = r.report_id || '';

    return [
      '<div class="doc-item">',
        '<div class="doc-ico" style="background:' + iconBg + ';border-color:' + iconBord + ';">',
          '<svg width="16" height="16" fill="none" stroke="' + iconColor + '" stroke-width="1.8" viewBox="0 0 24 24">',
            '<path stroke-linecap="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>',
          '</svg>',
        '</div>',
        '<div style="flex:1;min-width:0;">',
          '<div class="doc-name">' + _esc(r.title || typeLabel) + '</div>',
          '<div class="doc-meta">' + _esc(typeLabel) + ' · ' + _esc(context) + '</div>',
        '</div>',
        '<div style="display:flex;gap:6px;flex-shrink:0;">',
          '<button class="btn btn-ghost btn-sm" onclick="DocumentsTab.viewReport(\'' + _esc(rid) + '\')">',
            'View',
          '</button>',
          '<button class="btn btn-primary btn-sm" onclick="DocumentsTab.downloadPDF(\'' + _esc(rid) + '\')">',
            '<svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>',
            'PDF',
          '</button>',
        '</div>',
      '</div>'
    ].join('');
  }

  /* ─── PDF download — DOM-based to avoid </tag> in string literals ─── */
  function downloadPDF(reportId) {
    var r = _reports.find(function(x) { return (x.report_id || '') === reportId; });
    if (!r) { showToast('Report not found', 'error'); return; }

    var typeLabel = r.report_type === 'inspection' ? 'Drainage Inspection Report'
      : r.report_type === 'incident' ? 'Incident Report' : 'Field Report';
    var dateStr = r.sent_to_client_at
      ? new Date(r.sent_to_client_at).toLocaleDateString('en-NG', {day:'numeric', month:'long', year:'numeric'})
      : new Date().toLocaleDateString('en-NG', {day:'numeric', month:'long', year:'numeric'});

    var win = window.open('', '_blank', 'width=900,height=1100');
    if (!win) { showToast('Allow pop-ups to download PDF', 'error'); return; }

    // Build using DOM — no closing HTML tags in string literals
    var doc = win.document;
    doc.open();

    var metaRows = [
      ['Report ID',       r.report_id || ''],
      ['Report Type',     typeLabel],
      ['Property',        r.property_name || r.site_name || ''],
      ['Overall Condition', r.overall_condition || ''],
      ['Flood Risk',      r.flood_risk_level || ''],
      ['Drainage Score',  r.drainage_condition_score ? r.drainage_condition_score + '/100' : ''],
      ['Prepared by',     r.submitted_by_name || ''],
      ['Field Team',      r.team_name || ''],
      ['Date Issued',     dateStr],
    ].filter(function(p){ return p[1]; });

    var contentSections = [
      ['Overview',              r.summary],
      ['On-site Findings',      r.findings],
      ['Recommendations',       r.recommendations],
      ['Materials & Equipment', r.materials_used],
    ].filter(function(p){ return p[1]; });

    // Build meta table HTML
    var metaHTML = metaRows.map(function(p) {
      return '<tr><td style="padding:9px 16px;font-size:11px;color:#6b8fa3;font-weight:700;letter-spacing:.5px;text-transform:uppercase;width:160px;vertical-align:top;border-bottom:1px solid #edf2f7;">'
        + p[0] + '<' + '/td><td style="padding:9px 16px;font-size:13px;color:#0a1f2e;border-bottom:1px solid #edf2f7;">' + p[1] + '<' + '/td><' + '/tr>';
    }).join('');

    var sectionsHTML = contentSections.length > 0
      ? contentSections.map(function(p) {
          return '<div style="margin-bottom:24px;"><div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6b8fa3;padding-bottom:7px;border-bottom:2px solid #dae6ef;margin-bottom:12px;">'
            + p[0] + '<' + '/div><div style="font-size:13px;color:#2d5068;line-height:1.8;white-space:pre-wrap;">' + String(p[1]) + '<' + '/div><' + '/div>';
        }).join('')
      : '<div style="background:#f7fafc;border:1px solid #dae6ef;border-radius:8px;padding:16px;font-size:13px;color:#6b8fa3;">Contact your FlowGuard account manager for the full narrative report.<' + '/div>';

    // SVG logo as data URI-safe string (no </> issues)
    var logoSVG = '<svg width="44" height="44" viewBox="160 60 360 260" xmlns="http://www.w3.org/2000/svg">'
      + '<defs><clipPath id="sc"><circle cx="340" cy="182" r="108"><' + '/clipPath><' + '/defs>'
      + '<circle cx="340" cy="182" r="108" fill="#0a2a3d"><' + '/circle>'
      + '<g clip-path="url(#sc)"><rect x="232" y="214" width="216" height="90" fill="#0d7fa0"><' + '/rect>'
      + '<path d="M232 214 Q254 200 276 214 Q298 228 320 214 Q342 200 364 214 Q386 228 408 214 Q430 200 448 210 L448 216 Q430 202 408 216 Q386 230 364 216 Q342 202 320 216 Q298 230 276 216 Q254 202 232 216 Z" fill="#16a8d3"><' + '/path><' + '/g>'
      + '<path d="M340 110 C358 132 374 148 374 166 C374 186 358 202 340 202 C322 202 306 186 306 166 C306 148 322 132 340 110 Z" fill="#16a8d3"><' + '/path>'
      + '<circle cx="340" cy="110" r="5" fill="#f5a623"><' + '/circle><' + '/svg>';

    var fullHTML = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">'
      + '<title>FlowGuard Report<' + '/title>'
      + '<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Figtree:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">'
      + '<style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:"Figtree","Segoe UI",sans-serif;background:#fff;color:#0a1f2e;}'
      + '@page{size:A4;margin:0;}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}.no-print{display:none!important;}}'
      + '<' + '/style><' + '/head><body>'
      + '<div style="background:#050f18;padding:40px 48px 36px;position:relative;">'
      + '<div style="display:flex;align-items:center;gap:14px;margin-bottom:28px;">'
      + logoSVG
      + '<div><div style="font-family:\'Playfair Display\',serif;font-size:22px;font-weight:800;color:#fff;">FlowGuard<' + '/div>'
      + '<div style="font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#16a8d3;margin-top:2px;">Solutions Report<' + '/div><' + '/div>'
      + '<div style="margin-left:auto;text-align:right;">'
      + '<div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.3);">Document Type<' + '/div>'
      + '<div style="font-size:13px;font-weight:600;color:#16a8d3;margin-top:3px;">' + typeLabel + '<' + '/div><' + '/div><' + '/div>'
      + '<div style="font-family:\'Playfair Display\',serif;font-size:30px;font-weight:900;color:#fff;line-height:1.15;margin-bottom:14px;">' + (r.title || typeLabel) + '<' + '/div>'
      + '<div style="font-size:12px;font-weight:600;color:rgba(255,255,255,.7);">' + dateStr + '<' + '/div>'
      + '<' + '/div>'
      + '<div style="height:4px;background:linear-gradient(90deg,#0a2a3d,#16a8d3,#1cb8e8,transparent);" ><' + '/div>'
      + '<div style="padding:36px 48px;">'
      + (metaHTML ? '<div style="margin-bottom:32px;"><div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6b8fa3;padding-bottom:7px;border-bottom:2px solid #dae6ef;margin-bottom:10px;">Report Details<' + '/div>'
        + '<table style="width:100%;border-collapse:collapse;border:1px solid #dae6ef;"><tbody>' + metaHTML + '<' + '/tbody><' + '/table><' + '/div>' : '')
      + sectionsHTML
      + '<div style="margin-top:48px;padding-top:14px;border-top:2px solid #dae6ef;display:flex;justify-content:space-between;">'
      + '<div style="font-size:11px;color:#9eb8c8;">FlowGuard Solutions Limited · Drainage-as-a-Service · Lagos, Nigeria<' + '/div>'
      + '<div style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:#9eb8c8;">' + (r.report_id || '') + '<' + '/div>'
      + '<' + '/div><' + '/div>'
      + '<div class="no-print" style="position:fixed;bottom:24px;right:24px;">'
      + '<button onclick="window.print()" style="background:#0a2a3d;color:white;border:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">Save as PDF<' + '/button><' + '/div>'
      + '<' + '/body><' + '/html>';

    doc.write(fullHTML);
    doc.close();
    win.focus();
    setTimeout(function() { win.print(); }, 800);
  }

  function setFilter(f) {
    _filter = f;
    ['all','inspection','incident'].forEach(function(x) {
      var btn = document.getElementById('doc-f-' + x);
      if (btn) btn.classList.toggle('active', x === f);
    });
    _renderList();
  }

  /* ─── Helpers ─── */
  function _esc(s) {
    var r = String(s || '');
    r = r.split('&').join('&amp;');
    r = r.split('<').join('&lt;');
    r = r.split('>').join('&gt;');
    r = r.split('"').join('&quot;');
    return r;
  }

  return { render, setFilter, viewReport, downloadPDF };

})();

/* ── Bootstrap ── */
window.addEventListener('load', function() {
  _syncThemeIcons();
  setTimeout(_fetchNotifCount, 2000);

  // Mirror Auth.updateUserInfo() sidebar values to topbar avatar
  // Auth sets #user-name and #user-initials (sidebar) — we mirror initials to topbar avatar
  var sbInit = document.getElementById('user-initials');
  if (sbInit) {
    new MutationObserver(function() {
      var tbInit = document.getElementById('tb-user-init');
      if (tbInit) tbInit.textContent = sbInit.textContent;
      // Also mirror name to menu-user-name dropdown
      var sbName = document.getElementById('user-name');
      var mn = document.getElementById('menu-user-name');
      if (sbName && mn) mn.textContent = sbName.textContent;
    }).observe(sbInit, { childList: true, subtree: true, characterData: true });
  }
});
