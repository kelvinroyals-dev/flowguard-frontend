/* ============================================================
   FlowGuard Portal v2 — Screens
   Each screen: async render(view). Fetches real data via apiRequest;
   when Demo.isOn() falls back to sample data; else honest empty/awaiting.
   ============================================================ */
const Screens = (function () {

  const icons = {
    check: '<path d="M20 6L9 17l-5-5"/>',
    warn: '<path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/>',
    bell: '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>'
  };

  function demoBanner() {
    if (!Demo.isOn()) return '';
    return `<div class="demo-banner">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
      <span><b>Demo mode</b> — showing sample data to explore the portal.</span>
      <button onclick="App.toggleDemo(false)">Turn off</button>
    </div>`;
  }

  // ---------------- OVERVIEW (dashboard, the signature screen) ----------------
  async function overview(view) {
    const user = Auth.getUser() || {};
    const name = (user.fullName || user.full_name || 'there').split(' ')[0];
    view.innerHTML = `
      <div class="top">
        <div><h1>Live monitoring</h1><div class="sub" id="ov-sub">Loading…</div></div>
        <div class="top-actions">
          <button class="icon-btn" onclick="App.go('notifications')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icons.bell}</svg></button>
          <button class="btn" onclick="App.openRegister()">+ Add area</button>
        </div>
      </div>
      ${demoBanner()}
      <div id="ov-hero">${UI.loading(2)}</div>
      <div class="section-t">Your sensors</div>
      <div id="ov-sensors" class="sensors"></div>
      <div class="cols" id="ov-bottom"></div>`;

    // ---- Flood risk hero ----
    let risk;
    if (Demo.isOn()) { risk = Demo.data.floodRisk; }
    else { try { const r = await apiRequest('/monitoring/flood-risk'); risk = r && r.data; } catch (_) { risk = null; } }

    const hero = document.getElementById('ov-hero');
    if (risk && risk.has_data) {
      document.getElementById('ov-sub').textContent = `${risk.sensors_online}/${risk.sensors_total} sensors online · updated just now`;
      const msg = risk.level === 'low'
        ? { h: "Everything's flowing normally", p: 'Water levels are well within safe range across all monitored channels. No action needed from you right now.' }
        : risk.level === 'moderate'
          ? { h: 'Slightly elevated levels', p: 'Some channels are running higher than usual. We\'re watching closely and will alert you if anything changes.' }
          : { h: 'Elevated flood risk', p: 'One or more channels are near capacity. Our team has been notified and is responding.' };
      hero.className = 'hero card';
      hero.innerHTML = `
        ${UI.gauge(risk.risk_index, risk.level)}
        <div class="hero-info">
          <h2>${msg.h}</h2><p>${msg.p}</p>
          <div class="hero-stats">
            <div class="s"><small>SENSORS</small><b><span class="dot"></span>${risk.sensors_online} online</b></div>
            <div class="s"><small>PEAK LEVEL TODAY</small><b>${risk.peak_level}%</b></div>
            <div class="s"><small>STATUS</small><b>${risk.level === 'low' ? 'Normal' : risk.level === 'moderate' ? 'Watch' : 'Alert'}</b></div>
          </div>
        </div>`;
    } else {
      const total = (risk && risk.sensors_total) || 0;
      document.getElementById('ov-sub').textContent = total ? `${total} sensors registered` : 'No sensors yet';
      hero.className = '';
      hero.innerHTML = UI.state('awaiting',
        total ? 'Awaiting sensor data' : 'Monitoring not active yet',
        total ? 'Your sensors are registered but haven\'t reported readings yet. Live flood-risk data will appear here once they come online.'
              : 'Once your drainage sensors are installed and reporting, your live flood-risk index will appear here.',
        Demo.isOn() ? null : 'Explore with demo data', 'onclick="App.toggleDemo(true)"');
    }

    // ---- Sensors ----
    let sensors;
    if (Demo.isOn()) { sensors = Demo.data.sensors; }
    else { try { const r = await apiRequest('/monitoring/sensors'); sensors = (r && r.data) || []; } catch (_) { sensors = []; } }
    const sc = document.getElementById('ov-sensors');
    if (sensors && sensors.length) {
      sc.innerHTML = sensors.slice(0, 4).map(UI.sensorCard).join('');
    } else {
      sc.className = '';
      sc.innerHTML = UI.state('empty', 'No sensors to show', 'Sensors linked to your properties will appear here with live water levels.');
    }

    // ---- Bottom: activity + service journey ----
    let alerts, timeline;
    if (Demo.isOn()) { alerts = Demo.data.alerts; timeline = Demo.data.timeline; }
    else {
      try { const r = await apiRequest('/alerts'); alerts = (r && r.data) || []; } catch (_) { alerts = []; }
      timeline = await buildTimeline();
    }
    document.getElementById('ov-bottom').innerHTML = `
      <div class="panel panel-pad">
        <h3>Recent activity</h3>
        ${alerts && alerts.length ? alerts.slice(0, 4).map(activityRow).join('')
          : UI.state('empty', 'No recent activity', 'Alerts and system events will show up here.').replace('card','')}
      </div>
      <div class="panel panel-pad">
        <h3>Service journey</h3>
        ${timeline && timeline.length ? timeline.map(timelineRow).join('')
          : UI.state('empty', 'No service history yet', 'Your service milestones will appear here after you register an area.').replace('card','')}
      </div>`;
  }

  function activityRow(a) {
    const kind = a.type === 'warning' || a.severity === 'high' ? 'warn' : a.type === 'critical' || a.severity === 'critical' ? 'alert' : 'ok';
    const ic = kind === 'ok' ? icons.check : icons.warn;
    return `<div class="evt ${kind}">
      <div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${ic}</svg></div>
      <div><b>${UI.esc(a.title || 'Alert')}</b><small>${UI.esc(a.description || a.message || '')}</small></div>
      <span class="t">${UI.esc(a.created_at || '')}</span>
    </div>`;
  }

  function timelineRow(t) {
    const kind = t.status === 'done' || t.status === 'now' ? 'ok' : 'warn';
    return `<div class="evt ${kind}">
      <div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${t.status === 'pending' ? icons.warn : icons.check}</svg></div>
      <div><b>${UI.esc(t.title)}</b><small>${UI.esc(t.sub || '')}</small></div>
      <span class="t">${UI.esc(t.when || '')}</span>
    </div>`;
  }

  // Build a real service timeline from the user's first property status
  async function buildTimeline() {
    try {
      const r = await apiRequest('/properties');
      const props = (r && r.data) || [];
      if (!props.length) return [];
      const p = props[0];
      const order = ['submitted', 'inspection_scheduled', 'inspection_completed', 'monitoring_active'];
      const labels = {
        submitted: { title: 'Area submitted', sub: `${p.property_name || p.city || 'Property'}` },
        inspection_scheduled: { title: 'Inspection scheduled', sub: 'Awaiting site visit' },
        inspection_completed: { title: 'Inspection completed', sub: 'Monitoring plan approved' },
        monitoring_active: { title: 'Monitoring active', sub: 'Sensors reporting' }
      };
      const curIdx = Math.max(0, order.indexOf(p.status));
      return order.map((st, i) => ({
        status: i < curIdx ? 'done' : i === curIdx ? 'now' : 'pending',
        title: labels[st].title, sub: labels[st].sub,
        when: i <= curIdx ? UI.fmtDate(p.created_at) : 'Upcoming'
      }));
    } catch (_) { return []; }
  }

  // ---------------- MONITORING ----------------
  async function monitoring(view) {
    view.innerHTML = `
      <div class="top"><div><h1>Monitoring</h1><div class="sub">All sensors across your properties</div></div>
      <button class="btn ghost" onclick="App.go('overview')">← Overview</button></div>
      ${demoBanner()}
      <div id="mon-sensors" class="sensors">${UI.loading(1)}</div>`;
    let sensors;
    if (Demo.isOn()) sensors = Demo.data.sensors;
    else { try { const r = await apiRequest('/monitoring/sensors'); sensors = (r && r.data) || []; } catch (_) { sensors = []; } }
    const el = document.getElementById('mon-sensors');
    if (sensors && sensors.length) el.innerHTML = sensors.map(UI.sensorCard).join('');
    else { el.className = ''; el.innerHTML = UI.state('awaiting', 'No sensor data yet', 'Live water-level readings will appear here once your sensors are online.', Demo.isOn() ? null : 'Explore with demo data', 'onclick="App.toggleDemo(true)"'); }
  }

  // ---------------- PROPERTIES (richer cards, clickable → detail) ----------------
  async function properties(view) {
    view.innerHTML = `
      <div class="top"><div><h1>My properties</h1><div class="sub">Areas you've registered for monitoring</div></div>
      <button class="btn" onclick="App.openRegister()">+ Add area</button></div>
      ${demoBanner()}
      <div id="prop-list">${UI.loading(3)}</div>`;
    let props;
    if (Demo.isOn()) props = Demo.data.properties;
    else { try { const r = await apiRequest('/properties'); props = (r && r.data) || []; } catch (_) { props = []; } }
    const el = document.getElementById('prop-list');

    if (props && props.length) {
      el.innerHTML = `<div class="grid-3">${props.map(propertyCard).join('')}</div>`;
    } else {
      // Onboarding for brand-new users (no areas yet)
      el.innerHTML = onboardingBlock();
    }
  }

  function propertyCard(p) {
    const st = statusChip(p.status);
    const online = p.sensors_online != null ? `${p.sensors_online} sensors` : null;
    const fee = p.monthly_fee ? UI.fmtNaira(p.monthly_fee) + '/mo' : null;
    return `<div class="card statcard" style="cursor:pointer" onclick="App.openProperty('${UI.esc(p.property_id)}')">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
        <div class="lbl" style="margin:0">${UI.esc(p.property_type || 'property')}</div>${st}
      </div>
      <div style="font-family:var(--ff-d);font-size:18px;font-weight:600;letter-spacing:-.01em;margin-bottom:4px">${UI.esc(p.property_name || 'Unnamed area')}</div>
      <div class="sub">${UI.esc([p.city, p.state].filter(Boolean).join(', '))}</div>
      <div style="display:flex;gap:16px;margin-top:14px;padding-top:14px;border-top:1px solid var(--line)">
        ${online ? `<div><div class="lbl" style="margin:0 0 2px">Sensors</div><b style="font-family:var(--ff-d);font-size:14px">${online}</b></div>` : ''}
        ${fee ? `<div><div class="lbl" style="margin:0 0 2px">Fee</div><b style="font-family:var(--ff-d);font-size:14px">${fee}</b></div>` : ''}
        <div style="margin-left:auto;align-self:center;color:var(--brand);font-size:13px;font-weight:600">View →</div>
      </div>
    </div>`;
  }

  // ---------------- ONBOARDING (guided first-run) ----------------
  function onboardingBlock() {
    const stepsHtml = [
      { n: 1, t: 'Register your area', d: 'Tell us about the drainage you want monitored', done: false, now: true },
      { n: 2, t: 'Site inspection', d: 'Our team assesses and plans your coverage', done: false },
      { n: 3, t: 'Sensors installed', d: 'We deploy monitoring across your channels', done: false },
      { n: 4, t: 'Live monitoring', d: '24/7 flood-risk tracking begins', done: false }
    ].map(s => `
      <div class="evt ${s.now ? 'ok' : ''}" style="${s.now ? '' : 'opacity:.6'}">
        <div class="ic" style="background:${s.now ? 'var(--brand-soft)' : 'var(--bg)'};color:${s.now ? 'var(--brand)' : 'var(--ink-3)'};font-family:var(--ff-d);font-weight:700">${s.n}</div>
        <div><b>${s.t}</b><small>${s.d}</small></div>
      </div>`).join('');

    return `<div class="card panel-pad" style="text-align:center;padding:40px 30px">
        <div style="width:64px;height:64px;border-radius:20px;background:var(--brand-soft);display:grid;place-items:center;margin:0 auto 20px">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="var(--brand)" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
        </div>
        <h2 style="font-family:var(--ff-d);font-size:22px;font-weight:600;margin-bottom:8px">Welcome to FlowGuard</h2>
        <p style="color:var(--ink-2);font-size:14.5px;max-width:420px;margin:0 auto 24px">Let's get your first area set up for drainage monitoring. Here's how it works:</p>
        <div style="max-width:420px;margin:0 auto 26px;text-align:left">${stepsHtml}</div>
        <button class="btn" onclick="App.openRegister()">Register your first area</button>
        ${Demo.isOn() ? '' : '<div style="margin-top:14px"><button class="btn ghost" onclick="App.toggleDemo(true)">Or explore with demo data</button></div>'}
      </div>`;
  }

  function statusChip(status) {
    const map = {
      submitted: ['warn', 'Submitted'],
      inspection_scheduled: ['warn', 'Inspection scheduled'],
      inspection_ongoing: ['warn', 'Inspecting'],
      inspection_completed: ['ok', 'Inspected'],
      report_ready: ['ok', 'Report ready'],
      payment_pending: ['warn', 'Payment due'],
      monitoring_active: ['ok', 'Monitoring'],
      active: ['ok', 'Active']
    };
    const [k, t] = map[status] || ['warn', status || 'Pending'];
    return UI.chip(k, t);
  }

  // ---------------- BILLING ----------------
  async function billing(view) {
    view.innerHTML = `
      <div class="top"><div><h1>Billing</h1><div class="sub">Invoices and payment history</div></div></div>
      ${demoBanner()}
      <div class="card panel-pad" id="bill-list">${UI.loading(3)}</div>`;
    let invoices;
    if (Demo.isOn()) invoices = Demo.data.invoices;
    else {
      try { const r = await apiRequest('/billing/invoices'); invoices = (r && r.data) || []; }
      catch (_) { invoices = []; }
    }
    const el = document.getElementById('bill-list');
    if (invoices && invoices.length) {
      el.innerHTML = `<div class="rows">${invoices.map(inv => {
        const paid = (inv.payment_status || inv.status) === 'paid';
        return `<div class="row">
          <div class="rmain"><b>${UI.esc(cap(inv.invoice_type || 'Service'))} — ${UI.fmtDate(inv.issue_date)}</b>
            <small>${paid ? 'Paid' : 'Due ' + UI.fmtDate(inv.due_date)}</small></div>
          <div class="rright"><div class="amt">${UI.fmtNaira(inv.total_amount)}</div>${UI.chip(paid ? 'ok' : 'warn', paid ? 'Paid' : 'Due')}</div>
        </div>`;
      }).join('')}</div>`;
    } else {
      el.className = '';
      el.innerHTML = UI.state('empty', 'No invoices yet', 'Your billing history will appear here once your service is active.');
    }
  }

  // ---------------- ALERTS ----------------
  async function alerts(view) {
    view.innerHTML = `
      <div class="top"><div><h1>Alerts</h1><div class="sub">Notifications about your drainage network</div></div></div>
      ${demoBanner()}
      <div class="card panel-pad" id="alert-list">${UI.loading(3)}</div>`;
    let items;
    if (Demo.isOn()) items = Demo.data.alerts;
    else { try { const r = await apiRequest('/alerts'); items = (r && r.data) || []; } catch (_) { items = []; } }
    const el = document.getElementById('alert-list');
    if (items && items.length) el.innerHTML = items.map(activityRow).join('');
    else { el.className = ''; el.innerHTML = UI.state('ok', "You're all caught up", 'No active alerts. We\'ll let you know the moment anything needs attention.'); }
  }

  // ---------------- ACCOUNT ----------------
  async function account(view) {
    const u = Auth.getUser() || {};
    view.innerHTML = `
      <div class="top"><div><h1>Account</h1><div class="sub">Your profile and preferences</div></div></div>
      <div class="cols">
        <div class="panel panel-pad">
          <h3>Profile</h3>
          <div class="field"><label>Full name</label><input id="ac-name" value="${UI.esc(u.fullName || u.full_name || '')}"></div>
          <div class="field"><label>Email</label><input value="${UI.esc(u.email || '')}" disabled></div>
          <div class="field"><label>Phone</label><input id="ac-phone" value="${UI.esc(u.phone || '')}"></div>
          <button class="btn" onclick="App.saveProfile()">Save changes</button>
        </div>
        <div class="panel panel-pad">
          <h3>Preferences</h3>
          <div class="field" style="display:flex;justify-content:space-between;align-items:center">
            <div><label style="margin:0">Demo mode</label><div class="hint">Show sample data to explore the portal</div></div>
            <button class="btn ghost" id="demo-toggle" onclick="App.toggleDemo(!Demo.isOn())">${Demo.isOn() ? 'On' : 'Off'}</button>
          </div>
          <div class="field" style="display:flex;justify-content:space-between;align-items:center">
            <div><label style="margin:0">Theme</label><div class="hint">Light or dark appearance</div></div>
            <button class="btn ghost" onclick="App.toggleTheme()">Switch</button>
          </div>
          <hr style="border:none;border-top:1px solid var(--line);margin:18px 0">
          <button class="btn ghost" onclick="Auth.logout()">Sign out</button>
        </div>
      </div>`;
  }

  function cap(s) { return String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1); }

  // ---------------- PROPERTY DETAIL (drill-down) ----------------
  const STATUS_FLOW = ['submitted', 'inspection_scheduled', 'inspection_ongoing', 'report_ready', 'payment_pending', 'active'];
  const STATUS_LABEL = {
    submitted: 'Submitted', inspection_scheduled: 'Inspection scheduled',
    inspection_ongoing: 'Inspection underway', report_ready: 'Report ready',
    payment_pending: 'Payment pending', active: 'Monitoring active',
    monitoring_active: 'Monitoring active'
  };

  async function propertyDetail(view, propertyId) {
    view.innerHTML = `
      <div class="top"><div>
        <div class="crumb" style="color:var(--ink-3);font-size:12.5px;margin-bottom:6px;cursor:pointer" onclick="App.go('properties')">← My properties</div>
        <h1 id="pd-name">Loading…</h1><div class="sub" id="pd-loc"></div>
      </div>
      <button class="btn ghost" onclick="App.go('properties')">Back</button></div>
      ${demoBanner()}
      <div id="pd-body">${UI.loading(3)}</div>`;

    let p;
    if (Demo.isOn()) {
      p = Demo.data.properties.find(x => x.property_id === propertyId) || Demo.data.properties[0];
    } else {
      try { const r = await apiRequest(`/properties/${propertyId}`); p = r && r.data; }
      catch (e) { document.getElementById('pd-body').innerHTML = UI.state('error', 'Could not load property', e.message || 'Please try again.', 'Back to properties', "onclick=\"App.go('properties')\""); return; }
    }
    if (!p) { document.getElementById('pd-body').innerHTML = UI.state('error', 'Property not found', 'This area may have been removed.'); return; }

    document.getElementById('pd-name').textContent = p.property_name || 'Property';
    document.getElementById('pd-loc').textContent = [p.city, p.state].filter(Boolean).join(', ') + ' · ' + (p.property_type || 'property');

    const curIdx = Math.max(0, STATUS_FLOW.indexOf(p.status === 'monitoring_active' ? 'active' : p.status));
    const steps = STATUS_FLOW.map((st, i) => ({
      status: i < curIdx ? 'done' : i === curIdx ? 'now' : 'pending',
      title: STATUS_LABEL[st], when: i <= curIdx ? UI.fmtDate(p.created_at) : 'Upcoming'
    }));

    // pull per-property extras in parallel (honest fallback)
    let invoices = [], inspection = null;
    if (Demo.isOn()) {
      invoices = Demo.data.invoices.slice(0, 2);
      inspection = { status: 'scheduled', scheduled_date: '2026-07-18' };
    } else {
      try { const ri = await apiRequest(`/properties/${propertyId}/invoices`); invoices = (ri && ri.data) || []; } catch (_) {}
      try { const rn = await apiRequest(`/properties/${propertyId}/inspection`); inspection = rn && rn.data; } catch (_) {}
    }

    document.getElementById('pd-body').innerHTML = `
      <div class="grid-3" style="margin-bottom:20px">
        ${UI.stat('Status', `<span style="font-size:18px">${STATUS_LABEL[p.status] || cap(p.status || 'Pending')}</span>`, 'Current stage')}
        ${UI.stat('Contact', `<span style="font-size:16px">${UI.esc(p.contact_person_name || p.client_name || '—')}</span>`, p.client_phone || p.contact_phone || '')}
        ${UI.stat('Registered', `<span style="font-size:18px">${UI.fmtDate(p.created_at)}</span>`, 'Submission date')}
      </div>
      <div class="cols wide">
        <div class="panel panel-pad">
          <h3>Service progress</h3>
          ${steps.map(timelineRow).join('')}
        </div>
        <div class="panel panel-pad">
          <h3>Inspection</h3>
          ${inspection
            ? `<div class="evt ok"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icons.check}</svg></div>
                 <div><b>${UI.esc(cap(inspection.status || 'Scheduled'))}</b><small>${inspection.scheduled_date ? UI.fmtDate(inspection.scheduled_date) : 'Date to be confirmed'}</small></div></div>`
            : UI.state('awaiting', 'No inspection yet', 'An inspection will be scheduled after your area is reviewed.').replace('card', '')}
          <h3 style="margin-top:22px">Recent invoices</h3>
          ${invoices.length
            ? `<div class="rows">${invoices.map(inv => {
                const paid = (inv.payment_status || inv.status) === 'paid';
                return `<div class="row"><div class="rmain"><b>${UI.fmtNaira(inv.total_amount)}</b><small>${UI.fmtDate(inv.issue_date)}</small></div>
                  <div class="rright">${UI.chip(paid ? 'ok' : 'warn', paid ? 'Paid' : 'Due')}</div></div>`;
              }).join('')}</div>`
            : `<p style="color:var(--ink-3);font-size:13px">No invoices yet.</p>`}
        </div>
      </div>
      <div style="margin-top:18px;display:flex;gap:10px">
        <button class="btn ghost" onclick="App.go('billing')">View billing</button>
        <button class="btn ghost" onclick="App.openRegister()">Register another area</button>
      </div>`;
  }

  // ---------------- NOTIFICATIONS CENTER (filter / mark-read / delete) ----------------
  let _notifFilter = 'all';
  async function notifications(view) {
    view.innerHTML = `
      <div class="top"><div><h1>Notifications</h1><div class="sub">Updates about your account and network</div></div>
        <button class="btn ghost" onclick="App.markAllRead()">Mark all read</button></div>
      ${demoBanner()}
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <button class="chip ${_notifFilter === 'all' ? 'ok' : ''}" style="cursor:pointer;border:1px solid var(--line-2)" onclick="App.setNotifFilter('all')">All</button>
        <button class="chip ${_notifFilter === 'unread' ? 'ok' : ''}" style="cursor:pointer;border:1px solid var(--line-2)" onclick="App.setNotifFilter('unread')">Unread</button>
      </div>
      <div class="card panel-pad" id="notif-list">${UI.loading(3)}</div>`;

    let items;
    if (Demo.isOn()) {
      items = Demo.data.alerts.map((a, i) => ({ id: 'D' + i, title: a.title, message: a.description, type: a.type, read: i > 0, created_at: a.created_at }));
    } else {
      try { const r = await apiRequest('/notifications'); items = (r && r.data) || []; } catch (_) { items = []; }
    }
    if (_notifFilter === 'unread') items = items.filter(n => !n.read && !n.is_read);

    const el = document.getElementById('notif-list');
    if (items && items.length) {
      el.innerHTML = items.map(notifRow).join('');
    } else {
      el.className = '';
      el.innerHTML = UI.state('ok', _notifFilter === 'unread' ? 'No unread notifications' : "You're all caught up",
        'New updates about your drainage network will show up here.');
    }
  }

  function notifRow(n) {
    const read = n.read || n.is_read;
    const kind = n.type === 'warning' ? 'warn' : n.type === 'critical' || n.type === 'alert' ? 'alert' : 'ok';
    const ic = kind === 'ok' ? icons.check : icons.warn;
    return `<div class="evt ${kind}" style="${read ? 'opacity:.6' : ''}">
      <div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${ic}</svg></div>
      <div style="flex:1"><b>${UI.esc(n.title || 'Notification')}</b><small>${UI.esc(n.message || n.description || '')}</small></div>
      <span class="t">${UI.esc(n.created_at || '')}</span>
      <div style="display:flex;gap:8px;margin-left:10px">
        ${!read ? `<button class="chip" style="cursor:pointer;border:1px solid var(--line-2)" onclick="App.markRead('${UI.esc(n.id)}')">Mark read</button>` : ''}
        <button class="chip" style="cursor:pointer;border:1px solid var(--line-2)" onclick="App.deleteNotif('${UI.esc(n.id)}')">Delete</button>
      </div>
    </div>`;
  }
  function setNotifFilter(f) { _notifFilter = f; }

  return { overview, monitoring, properties, propertyDetail, billing, alerts, notifications, account, setNotifFilter };
})();
window.Screens = Screens;
