/* ============================================================
   FlowGuard Portal v2 — Screens
   Each screen: async render(view). Fetches real data via apiRequest;
   when Demo.isOn() falls back to sample data; else honest empty/awaiting.
   ============================================================ */
const Screens = (function () {

  const icons = {
    check: '<path d="M20 6L9 17l-5-5"/>',
    warn: '<path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/>',
    bell: '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>',
    sensor: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    doc: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/>',
    drop: '<path d="M12 2.7s6 6.3 6 10.3a6 6 0 01-12 0c0-4 6-10.3 6-10.3z"/>',
    truck: '<path d="M1 3h15v13H1zM16 8h4l3 3v5h-7M5.5 18.5a2 2 0 100-4 2 2 0 000 4zM18.5 18.5a2 2 0 100-4 2 2 0 000 4z"/>'
  };

  function demoBanner() {
    if (!Demo.isOn()) return '';
    return `<div class="demo-banner">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
      <span><b>Demo mode</b> — showing sample data to explore the portal.</span>
      <button onclick="App.toggleDemo(false)">Turn off</button>
    </div>`;
  }

  // ---------------- OVERVIEW (adaptive home) ----------------
  function greeting() {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }

  async function overview(view) {
    const user = Auth.getUser() || {};
    const name = (user.fullName || user.full_name || '').split(' ')[0] || 'there';
    view.innerHTML = `
      <div class="top">
        <div class="greeting"><h1>${greeting()}, ${UI.esc(name)}</h1><div class="sub" id="ov-sub">Here's the latest on your drainage network.</div></div>
        <div class="top-actions">
          <button class="icon-btn" onclick="App.go('notifications')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icons.bell}</svg></button>
          <button class="btn" onclick="App.openRegister()">+ Add area</button>
        </div>
      </div>
      ${demoBanner()}
      <div id="ov-journey"></div>
      <div id="ov-kpis"></div>
      <div class="section-t">Live monitoring <a onclick="App.go('monitoring')" style="cursor:pointer">View all →</a></div>
      <div id="ov-mon">${UI.loading(2)}</div>
      <div class="section-t">Your FlowGuard services</div>
      <div id="ov-services" class="grid-3"></div>
      <div class="cols" id="ov-bottom"></div>`;

    // Gather data (real or demo)
    let props, risk, sensors, alerts, reports;
    if (Demo.isOn()) {
      props = Demo.data.properties; risk = Demo.data.floodRisk; sensors = Demo.data.sensors;
      alerts = Demo.data.alerts; reports = Demo.data.reports;
    } else {
      try { const r = await apiRequest('/properties'); props = (r && r.data) || []; } catch (_) { props = []; }
      try { const r = await apiRequest('/monitoring/flood-risk'); risk = r && r.data; } catch (_) { risk = null; }
      try { const r = await apiRequest('/monitoring/sensors'); sensors = (r && r.data) || []; } catch (_) { sensors = []; }
      try { const r = await apiRequest('/alerts'); alerts = (r && r.data) || []; } catch (_) { alerts = []; }
      try { const r = await apiRequest('/field-reports?limit=5'); reports = (r && r.data) || []; } catch (_) { reports = []; }
    }

    // ---- Journey hero (adapts to where the customer is) ----
    renderJourney(props);

    // ---- KPI row (denser, like the old board) ----
    const activeCount = (props || []).filter(p => ['active', 'monitoring_active'].includes(p.status)).length;
    const pendingCount = (props || []).filter(p => ['submitted', 'inspection_scheduled', 'inspection_ongoing'].includes(p.status)).length;
    const alertCount = (alerts || []).length;
    document.getElementById('ov-kpis').innerHTML = `<div class="kpi-row">
      ${kpiCard('Areas monitored', activeCount, activeCount ? 'Live' : 'None yet', icons.check)}
      ${kpiCard('In progress', pendingCount, pendingCount ? 'Being set up' : 'None', icons.warn)}
      ${kpiCard('Sensors online', risk && risk.has_data ? `${risk.sensors_online}/${risk.sensors_total}` : (risk && risk.sensors_total ? `0/${risk.sensors_total}` : '—'), 'Reporting', icons.sensor)}
      ${kpiCard('Active alerts', alertCount, alertCount ? 'Need attention' : 'All clear', icons.bell)}
    </div>`;

    // ---- Monitoring section (gauge + sensors together) ----
    const mon = document.getElementById('ov-mon');
    if (risk && risk.has_data) {
      document.getElementById('ov-sub').textContent = `${risk.sensors_online}/${risk.sensors_total} sensors online · updated just now`;
      const msg = risk.level === 'low' ? "Everything's flowing normally"
        : risk.level === 'moderate' ? 'Levels slightly elevated — watching closely' : 'Elevated flood risk — team responding';
      mon.innerHTML = `
        <div class="mon-wrap">
          ${UI.gauge(risk.risk_index, risk.level)}
          <div>
            <h3 style="font-family:var(--ff-d);font-size:18px;font-weight:600;margin-bottom:6px">${msg}</h3>
            <p style="color:var(--ink-2);font-size:14px;margin-bottom:16px;max-width:440px">Peak level today ${risk.peak_level}% · ${risk.reading_count} sensors reporting. We'll alert you the moment anything changes.</p>
            <div class="sensors" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">
              ${(sensors || []).slice(0, 4).map(UI.sensorCard).join('')}
            </div>
          </div>
        </div>`;
    } else {
      const total = (risk && risk.sensors_total) || 0;
      mon.innerHTML = `<div class="mon-wrap" style="grid-template-columns:1fr">
        ${UI.state('awaiting',
          total ? 'Awaiting sensor data' : 'Monitoring starts after setup',
          total ? 'Your sensors are registered but haven\'t reported readings yet. Live flood-risk data appears here once they come online.'
                : 'Once your area is inspected and sensors are installed, your live flood-risk index and water levels appear here.',
          Demo.isOn() ? null : 'Explore with demo data', 'onclick="App.toggleDemo(true)"').replace('card', '')}
      </div>`;
    }

    // ---- Services: the 3 FlowGuard layers ----
    let services;
    if (Demo.isOn()) services = Demo.data.services;
    else services = deriveServices(props, risk);
    document.getElementById('ov-services').innerHTML = services.map(serviceCard).join('');

    // ---- Bottom: recent activity + reports ----
    document.getElementById('ov-bottom').innerHTML = `
      <div class="panel panel-pad">
        <h3>Recent activity</h3>
        ${alerts && alerts.length ? alerts.slice(0, 4).map(activityRow).join('')
          : `<p style="color:var(--ink-3);font-size:13px">No recent activity. We'll post updates here.</p>`}
      </div>
      <div class="panel panel-pad">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <h3 style="margin:0">Reports &amp; documents</h3>
          <a onclick="App.go('reports')" style="cursor:pointer;color:var(--brand);font-size:13px;font-weight:500">All →</a>
        </div>
        ${reports && reports.length ? reports.slice(0, 3).map(docRow).join('')
          : `<p style="color:var(--ink-3);font-size:13px">No reports yet. Inspection reports and documents FlowGuard sends you will appear here.</p>`}
      </div>`;
  }

  function serviceCard(s) {
    const st = s.status === 'active' ? UI.chip('ok', 'Active')
      : s.status === 'scheduled' ? UI.chip('warn', 'Scheduled')
      : UI.chip('warn', 'Pending');
    return `<div class="card statcard">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
        <div style="width:40px;height:40px;border-radius:11px;background:var(--brand-soft);color:var(--brand);display:grid;place-items:center">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">${icons[s.icon] || icons.check}</svg>
        </div>${st}
      </div>
      <div style="font-family:var(--ff-d);font-size:16px;font-weight:600;margin-bottom:3px">${UI.esc(s.name)}</div>
      <div class="sub">${UI.esc(s.desc)}</div>
      <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--line);color:var(--ink-2);font-size:12.5px">${UI.esc(s.detail || '')}</div>
    </div>`;
  }

  // Derive service status from real data (honest — reflects what's actually happening)
  function deriveServices(props, risk) {
    const hasActive = (props || []).some(p => ['active', 'monitoring_active'].includes(p.status));
    const sensorsReporting = risk && risk.has_data;
    return [
      { key: 'sentinel', name: 'Sentinel Network', desc: 'IoT drainage monitoring', icon: 'sensor',
        status: sensorsReporting ? 'active' : 'pending',
        detail: sensorsReporting ? `${risk.sensors_online} sensors online` : (risk && risk.sensors_total ? `${risk.sensors_total} sensors registered` : 'Not yet installed') },
      { key: 'biotreatment', name: 'Bio-Treatment', desc: 'Biological drainage prevention', icon: 'drop',
        status: hasActive ? 'active' : 'pending',
        detail: hasActive ? 'Included in your plan' : 'Begins after activation' },
      { key: 'dispatch', name: 'Heavy-Plant Dispatch', desc: 'Clearing & maintenance crews', icon: 'truck',
        status: hasActive ? 'active' : 'pending',
        detail: hasActive ? 'On-call for your area' : 'Available after activation' }
    ];
  }

  function kpiCard(label, value, sub, icon) {
    return `<div class="kpi-c">
      <div class="kl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon}</svg>${UI.esc(label)}</div>
      <div class="kn">${value}</div><div class="ks">${UI.esc(sub)}</div>
    </div>`;
  }

  // Journey hero: reads the furthest-along property and shows a stage-appropriate message
  function renderJourney(props) {
    const el = document.getElementById('ov-journey');
    if (!props || !props.length) {
      el.innerHTML = `<div class="journey stage-pending">
        <div class="jic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg></div>
        <div class="jtext"><b>Welcome to FlowGuard</b><small>Register your first drainage area to begin monitoring.</small></div>
        <div class="jcta"><button onclick="App.openRegister()">Get started</button></div>
      </div>`;
      return;
    }
    // pick the property furthest along
    const order = ['submitted', 'inspection_scheduled', 'inspection_ongoing', 'report_ready', 'payment_pending', 'active', 'monitoring_active'];
    const p = [...props].sort((a, b) => order.indexOf(b.status) - order.indexOf(a.status))[0];
    const map = {
      submitted: { s: 'progress', b: 'Area submitted', t: `We've received ${p.property_name || 'your area'} and will schedule an inspection soon.`, cta: 'View details', act: `App.openProperty('${p.property_id}')` },
      inspection_scheduled: { s: 'progress', b: 'Inspection scheduled', t: `Our team will assess ${p.property_name || 'your area'} shortly.`, cta: 'View details', act: `App.openProperty('${p.property_id}')` },
      inspection_ongoing: { s: 'progress', b: 'Inspection underway', t: `Our team is assessing ${p.property_name || 'your area'} right now.`, cta: 'View details', act: `App.openProperty('${p.property_id}')` },
      report_ready: { s: 'active', b: 'Your report is ready', t: 'Your inspection report is available to review.', cta: 'View report', act: `App.go('reports')` },
      payment_pending: { s: 'progress', b: 'Payment pending', t: 'Complete payment to activate monitoring for your area.', cta: 'View billing', act: `App.go('billing')` },
      active: { s: 'active', b: 'Monitoring active', t: `${p.property_name || 'Your area'} is being monitored 24/7. Everything's handled.`, cta: 'View monitoring', act: `App.go('monitoring')` },
      monitoring_active: { s: 'active', b: 'Monitoring active', t: `${p.property_name || 'Your area'} is being monitored 24/7. Everything's handled.`, cta: 'View monitoring', act: `App.go('monitoring')` }
    };
    const m = map[p.status] || map.submitted;
    const ic = m.s === 'active'
      ? '<path d="M20 6L9 17l-5-5"/>'
      : '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>';
    el.innerHTML = `<div class="journey stage-${m.s}">
      <div class="jic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${ic}</svg></div>
      <div class="jtext"><b>${UI.esc(m.b)}</b><small>${UI.esc(m.t)}</small></div>
      <div class="jcta"><button onclick="${m.act}">${m.cta}</button></div>
    </div>`;
  }

  function docRow(r) {
    return `<div class="doc">
      <div class="dic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg></div>
      <div class="dmain"><b>${UI.esc(r.title || r.report_type || 'Inspection report')}</b><small>${UI.esc(r.property_name || '')} · ${UI.fmtDate(r.created_at || r.sent_at)}</small></div>
      <div class="dl"><a onclick="App.go('reports')" style="cursor:pointer">View</a></div>
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

  // ---------------- MONITORING (sensors + history charts + logs) ----------------
  async function monitoring(view) {
    view.innerHTML = `
      <div class="top"><div><h1>Monitoring</h1><div class="sub">Live readings, trends, and history across your sensors</div></div>
      <button class="btn ghost" onclick="App.go('overview')">← Overview</button></div>
      ${demoBanner()}
      <div id="mon-sensors" class="sensors">${UI.loading(1)}</div>
      <div class="section-t" style="margin-top:26px">Water level trend <span style="font-weight:400;color:var(--ink-3);font-size:13px">last 24 hours</span></div>
      <div class="panel panel-pad" id="mon-chart">${UI.loading(2)}</div>
      <div class="section-t" style="margin-top:26px">Reading history</div>
      <div class="panel panel-pad" id="mon-log"></div>`;

    let sensors, hist;
    if (Demo.isOn()) { sensors = Demo.data.sensors; hist = Demo.data.history; }
    else {
      try { const r = await apiRequest('/monitoring/sensors'); sensors = (r && r.data) || []; } catch (_) { sensors = []; }
      try { const r = await apiRequest('/monitoring/history?hours=24'); hist = (r && r.data) || { series: [], log: [] }; } catch (_) { hist = { series: [], log: [] }; }
    }

    // Sensors
    const sc = document.getElementById('mon-sensors');
    if (sensors && sensors.length) sc.innerHTML = sensors.map(UI.sensorCard).join('');
    else { sc.className = ''; sc.innerHTML = UI.state('awaiting', 'No sensor data yet', 'Live readings appear here once your sensors are online.', Demo.isOn() ? null : 'Explore with demo data', 'onclick="App.toggleDemo(true)"'); }

    // Chart
    const ch = document.getElementById('mon-chart');
    if (hist.series && hist.series.length > 1) {
      ch.innerHTML = `${UI.lineChart(hist.series)}
        <div style="display:flex;gap:18px;margin-top:10px;font-size:12px;color:var(--ink-3)">
          <span><span style="display:inline-block;width:14px;height:3px;background:var(--brand);vertical-align:middle;margin-right:5px"></span>Average level</span>
          <span><span style="display:inline-block;width:14px;height:0;border-top:2px dashed var(--warn);vertical-align:middle;margin-right:5px"></span>Peak level</span>
        </div>`;
    } else {
      ch.innerHTML = `<div style="color:var(--ink-3);font-size:13px">Trend charts appear here once sensors have recorded a few hours of readings.</div>`;
    }

    // History log
    const lg = document.getElementById('mon-log');
    if (hist.log && hist.log.length) {
      lg.innerHTML = `<div style="max-height:320px;overflow:auto">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="text-align:left;color:var(--ink-3);font-size:11px;text-transform:uppercase;letter-spacing:.04em">
            <th style="padding:8px 4px;position:sticky;top:0;background:var(--surface)">Time</th>
            <th style="padding:8px 4px;position:sticky;top:0;background:var(--surface)">Sensor</th>
            <th style="padding:8px 4px;position:sticky;top:0;background:var(--surface)">Level</th>
            <th style="padding:8px 4px;position:sticky;top:0;background:var(--surface)">Flow</th>
            <th style="padding:8px 4px;position:sticky;top:0;background:var(--surface)">Debris</th>
          </tr></thead>
          <tbody>${hist.log.map(r => `<tr style="border-top:1px solid var(--line)">
            <td style="padding:9px 4px;color:var(--ink-2)">${UI.fmtTime(r.time)}</td>
            <td style="padding:9px 4px;font-weight:500">${UI.esc(r.sensor)}</td>
            <td style="padding:9px 4px;font-family:var(--ff-d)">${r.level != null ? r.level + '%' : '—'}</td>
            <td style="padding:9px 4px;font-family:var(--ff-d)">${r.flow != null ? r.flow + ' L/s' : '—'}</td>
            <td style="padding:9px 4px">${r.debris ? UI.chip('warn', 'Detected') : UI.chip('ok', 'Clear')}</td>
          </tr>`).join('')}</tbody>
        </table></div>`;
    } else {
      lg.innerHTML = `<div style="color:var(--ink-3);font-size:13px">No readings logged yet. Historical sensor data will appear here as your devices report.</div>`;
    }
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

  // ---------------- REPORTS & DOCUMENTS ----------------
  async function reports(view) {
    view.innerHTML = `
      <div class="top"><div><h1>Reports &amp; documents</h1><div class="sub">Inspection reports, incident records, and documents FlowGuard sends you</div></div></div>
      ${demoBanner()}
      <div class="card panel-pad" id="rep-list">${UI.loading(3)}</div>`;
    let items;
    if (Demo.isOn()) items = Demo.data.reports;
    else { try { const r = await apiRequest('/field-reports?limit=100'); items = (r && r.data) || []; } catch (_) { items = []; } }
    const el = document.getElementById('rep-list');
    if (items && items.length) {
      el.innerHTML = items.map(r => `
        <div class="doc">
          <div class="dic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icons.doc}</svg></div>
          <div class="dmain"><b>${UI.esc(r.title || r.report_type || 'Inspection report')}</b>
            <small>${UI.esc(r.property_name || r.property_id || '')} · ${UI.fmtDate(r.created_at || r.sent_at)}${r.status ? ' · ' + UI.esc(cap(r.status)) : ''}</small></div>
          <div class="dl"><a onclick="App.viewReport('${UI.esc(r.report_id || r.id || '')}')" style="cursor:pointer">Open</a></div>
        </div>`).join('');
    } else {
      el.className = '';
      el.innerHTML = UI.state('empty', 'No reports yet',
        'When FlowGuard completes an inspection or sends you a document, it will appear here for you to review and download.');
    }
  }

  // ---------------- SUPPORT / TICKETS ----------------
  const TICKET_CATS = {
    sensor: 'Sentinel Network', treatment: 'Bio-Treatment', dispatch: 'Heavy-Plant Dispatch',
    emergency: 'Emergency', billing: 'Billing & Contract', general: 'General enquiry'
  };
  let _ticketFilter = 'all';

  async function support(view) {
    view.innerHTML = `
      <div class="top"><div><h1>Support</h1><div class="sub">Raise a request or track your existing tickets</div></div>
        <button class="btn" onclick="App.openTicket()">+ New ticket</button></div>
      ${demoBanner()}
      <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
        <button class="chip ${_ticketFilter === 'all' ? 'ok' : ''}" style="cursor:pointer;border:1px solid var(--line-2)" onclick="App.setTicketFilter('all')">All</button>
        <button class="chip ${_ticketFilter === 'open' ? 'ok' : ''}" style="cursor:pointer;border:1px solid var(--line-2)" onclick="App.setTicketFilter('open')">Open</button>
        <button class="chip ${_ticketFilter === 'resolved' ? 'ok' : ''}" style="cursor:pointer;border:1px solid var(--line-2)" onclick="App.setTicketFilter('resolved')">Resolved</button>
      </div>
      <div class="card panel-pad" id="tk-list">${UI.loading(3)}</div>`;

    let items;
    if (Demo.isOn()) items = Demo.data.tickets;
    else { try { const r = await apiRequest('/tickets'); items = (r && r.data) || []; } catch (_) { items = []; } }

    if (_ticketFilter === 'open') items = items.filter(t => !['resolved', 'closed'].includes(t.status));
    if (_ticketFilter === 'resolved') items = items.filter(t => ['resolved', 'closed'].includes(t.status));

    const el = document.getElementById('tk-list');
    if (items && items.length) {
      el.innerHTML = `<div class="rows">${items.map(ticketRow).join('')}</div>`;
    } else {
      el.className = '';
      el.innerHTML = UI.state('ok', _ticketFilter === 'all' ? 'No tickets yet' : `No ${_ticketFilter} tickets`,
        'Need help or want to request a service visit? Raise a ticket and our team will respond.',
        'Raise a ticket', 'onclick="App.openTicket()"');
    }
  }

  function ticketRow(t) {
    const statusMap = { new: ['warn', 'New'], open: ['warn', 'Open'], in_progress: ['warn', 'In progress'], resolved: ['ok', 'Resolved'], closed: ['ok', 'Closed'] };
    const [sk, sl] = statusMap[t.status] || ['warn', cap(t.status || 'Open')];
    const prio = t.priority === 'high' || t.priority === 'urgent' ? UI.chip('alert', cap(t.priority)) : '';
    return `<div class="row">
      <div class="rmain">
        <b>${UI.esc(t.subject || t.title || 'Support request')}</b>
        <small>${UI.esc(TICKET_CATS[t.category] || t.category || 'General')} · ${UI.esc(t.ticket_id || '')} · ${UI.fmtDate(t.created_at)}</small>
      </div>
      <div class="rright" style="display:flex;gap:8px;align-items:center">${prio}${UI.chip(sk, sl)}</div>
    </div>`;
  }
  function setTicketFilter(f) { _ticketFilter = f; }

  // ---------------- SETTINGS (platform) ----------------
  async function settings(view) {
    const dark = (document.documentElement.getAttribute('data-theme') || 'light') === 'dark';
    let prefs = {};
    if (!Demo.isOn()) { try { const r = await apiRequest('/preferences'); prefs = (r && r.data) || {}; } catch (_) {} }
    const on = v => v ? 'checked' : '';
    view.innerHTML = `
      <div class="top"><div><h1>Settings</h1><div class="sub">Manage how the portal works for you</div></div></div>
      <div class="cols">
        <div class="panel panel-pad">
          <h3>Notifications</h3>
          <div class="set-row"><div><b>Email alerts</b><small>Flood-risk and incident emails</small></div>
            <label class="switch"><input type="checkbox" id="set-email" ${on(prefs.email_alerts !== false)}><span class="slider"></span></label></div>
          <div class="set-row"><div><b>SMS alerts</b><small>Urgent alerts by text message</small></div>
            <label class="switch"><input type="checkbox" id="set-sms" ${on(prefs.sms_alerts)}><span class="slider"></span></label></div>
          <div class="set-row"><div><b>Weekly summary</b><small>A digest of your network each week</small></div>
            <label class="switch"><input type="checkbox" id="set-digest" ${on(prefs.weekly_digest !== false)}><span class="slider"></span></label></div>
          <button class="btn" style="margin-top:16px" onclick="App.saveSettings()">Save preferences</button>
        </div>
        <div class="panel panel-pad">
          <h3>Appearance & data</h3>
          <div class="set-row"><div><b>Dark mode</b><small>Easier on the eyes at night</small></div>
            <label class="switch"><input type="checkbox" id="set-theme" ${on(dark)} onchange="App.toggleTheme()"><span class="slider"></span></label></div>
          <div class="set-row"><div><b>Demo mode</b><small>Show sample data to explore the portal</small></div>
            <label class="switch"><input type="checkbox" id="set-demo" ${on(Demo.isOn())} onchange="App.toggleDemo(this.checked)"><span class="slider"></span></label></div>
          <hr style="border:none;border-top:1px solid var(--line);margin:18px 0">
          <h3>Account</h3>
          <button class="btn ghost" style="width:100%;margin-bottom:8px;justify-content:flex-start" onclick="App.go('account')">Profile & password →</button>
          <button class="btn ghost" style="width:100%;justify-content:flex-start" onclick="Auth.logout()">Sign out</button>
        </div>
      </div>`;
  }

  return { overview, monitoring, properties, propertyDetail, billing, alerts, notifications, reports, support, settings, account, setNotifFilter, setTicketFilter, TICKET_CATS };
})();
window.Screens = Screens;
