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

  // ---- property scope: cache, selector control, filter ----
  let _propsCache = null, _propsCacheAt = 0;
  async function getMyProperties() {
    if (Demo.isOn()) return Demo.data.properties;
    if (_propsCache && Date.now() - _propsCacheAt < 60e3) return _propsCache;
    try { const r = await apiRequest('/properties'); _propsCache = (r && r.data) || []; _propsCacheAt = Date.now(); }
    catch (_) { _propsCache = _propsCache || []; }
    return _propsCache;
  }
  // resolve the active property to a real one (no all-estates view)
  function resolveActive(props) {
    const cur = App.activeProperty();
    if (props && props.some(p => p.property_id === cur)) return cur;
    return props && props.length ? props[0].property_id : null;
  }
  function propertySelector(props) {
    if (!props || !props.length) return '';
    const cur = resolveActive(props);
    return `<select class="prop-select" aria-label="Select property" onchange="App.setActiveProperty(this.value)">
      ${props.map(p => `<option value="${UI.esc(p.property_id)}" ${cur === p.property_id ? 'selected' : ''}>${UI.esc(p.property_name || p.property_id)}</option>`).join('')}
    </select>`;
  }
  // filter any collection to the active property (matches id or name fields)
  function scopeToProperty(items, props) {
    const cur = resolveActive(props);
    if (!cur || !items) return items || [];
    const sel = (props || []).find(p => p.property_id === cur);
    const name = sel ? sel.property_name : null;
    const match = it => it.property_id === cur
      || (name && (it.property_name === name || it.property === name || it.site_name === name));
    // if nothing in this collection is property-linked at all, don't filter (backend gap: e.g. sensors)
    const linkable = items.some(it => it.property_id || it.property_name || it.property || it.site_name);
    return linkable ? items.filter(match) : items;
  }

  // ---- Property health score: weighted blend of data we already have ----
  // drainage condition (latest report, 50%) + sensor network (30%) + open alerts (20%)
  function computeHealth(reports, risk, alerts) {
    const latest = (reports || []).find(r => r.drainage_condition_score != null);
    const rep = latest ? Number(latest.drainage_condition_score) : null;
    const sens = (risk && risk.sensors_total) ? Math.round((risk.sensors_online / risk.sensors_total) * 100) : null;
    const openAlerts = (alerts || []).filter(a => a.status === 'active').length;
    const alertScore = Math.max(0, 100 - openAlerts * 12);
    const parts = [];
    if (rep != null) parts.push([rep, .5]);
    if (sens != null) parts.push([sens, .3]);
    parts.push([alertScore, .2]);
    const tw = parts.reduce((s, p) => s + p[1], 0);
    const score = Math.round(parts.reduce((s, p) => s + p[0] * p[1], 0) / tw);
    // with only the alert component the score is too thin to be meaningful
    if (parts.length < 2) return null;
    return {
      score, rep, sens, openAlerts,
      label: score >= 75 ? 'Good' : score >= 50 ? 'Fair' : 'Needs attention',
      kind: score >= 75 ? 'ok' : score >= 50 ? 'warn' : 'alert'
    };
  }

  // ---- Weather context: Open-Meteo (free, no key). Lekki fallback coords. ----
  async function renderWeather(props) {
    const el = document.getElementById('ov-weather');
    if (!el) return;
    let days;
    if (Demo.isOn()) {
      const d = i => new Date(Date.now() + i * 864e5).toISOString().slice(0, 10);
      days = [
        { date: d(0), mm: 0.4, prob: 20 },
        { date: d(1), mm: 5.8, prob: 70 },   // matches the "light rain tomorrow" alert in the demo story
        { date: d(2), mm: 1.2, prob: 30 },
        { date: d(3), mm: 0, prob: 10 },
        { date: d(4), mm: 0, prob: 5 },
      ];
    } else {
      const p = (props || []).find(x => x.latitude && x.longitude);
      const lat = p ? p.latitude : 6.4478, lon = p ? p.longitude : 3.5476;
      try {
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum,precipitation_probability_max&timezone=Africa%2FLagos&forecast_days=5`);
        const j = await r.json();
        days = j.daily.time.map((t, i) => ({ date: t, mm: j.daily.precipitation_sum[i] || 0, prob: j.daily.precipitation_probability_max[i] || 0 }));
      } catch (_) { el.innerHTML = ''; return; }
    }
    const worst = days.reduce((a, b) => (b.mm > a.mm ? b : a), days[0]);
    const dayName = t => {
      const diff = Math.round((new Date(t) - new Date(new Date().toISOString().slice(0, 10))) / 864e5);
      return diff <= 0 ? 'today' : diff === 1 ? 'tomorrow' : new Date(t).toLocaleDateString('en-GB', { weekday: 'long' });
    };
    let kind, msg;
    if (worst.mm >= 20) { kind = 'alert'; msg = `<b>Heavy rain expected ${dayName(worst.date)}</b> — est. ${Math.round(worst.mm)}mm (${worst.prob}% chance). Your drainage network is monitored and the team is on standby.`; }
    else if (worst.mm >= 5) { kind = 'warn'; msg = `<b>Rain expected ${dayName(worst.date)}</b> — est. ${Math.round(worst.mm)}mm (${worst.prob}% chance). Drainage is clear and monitoring is active.`; }
    else { kind = 'ok'; msg = `<b>No significant rain</b> expected over the next 5 days.`; }
    el.innerHTML = `
      <div class="weather-strip ${kind}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 16.2A4.5 4.5 0 0017.5 8h-1.8A7 7 0 104 14.9"/><path d="M8 19v2M12 20v2M16 19v2"/></svg>
        <span>${msg}</span>
      </div>`;
  }

  // ---- Seasonal readiness (Lagos: rains Apr–Jul, second peak Sep–Oct) ----
  function renderSeasonal() {
    const el = document.getElementById('ov-season');
    if (!el) return;
    const m = new Date().getMonth() + 1; // 1-12
    let title = null, body = '';
    if (m === 3 || m === 8) {
      title = 'Rainy season is approaching';
      body = 'Lagos rains typically intensify next month. A pre-season inspection catches silt buildup and blockages before they become flooding.';
    } else if ((m >= 4 && m <= 7) || m === 9 || m === 10) {
      title = 'Rainy season readiness';
      body = 'Peak rainfall period is here. Your network is monitored 24/7 — if you\'ve noticed slow drainage or pooling anywhere, flag it early.';
    }
    if (!title) { el.innerHTML = ''; return; }
    el.innerHTML = `
      <div class="season-strip">
        <div class="minw0">
          <b>${title}</b>
          <p>${body}</p>
        </div>
        <button class="btn sm" style="flex-shrink:0" onclick="App.openTicket('general','Pre-rain readiness inspection request','normal')">Book readiness check</button>
      </div>`;
  }

  // ---- Outcomes: the value narrative (what FlowGuard has done for this property) ----
  function outcomesBlock(o, p) {
    if (!o) return '';
    const stat = (v, l) => `<div class="oc-stat"><b>${v}</b><span>${l}</span></div>`;
    return `
      <div class="panel panel-pad mb-20">
        <div class="row-between mb-10">
          <h3 style="margin:0">Protection outcomes</h3>
          <span class="muted" style="font-size:12px">Protected since ${UI.fmtDate(o.protected_since || p.created_at)}</span>
        </div>
        <div class="oc-grid">
          <div class="oc-hero">
            <b>${o.days_since_flood != null ? o.days_since_flood : '—'}</b>
            <span>days flood-free</span>
            <small class="muted">${o.flood_free_basis === 'last_incident' ? 'since the last incident' : 'since monitoring began'}</small>
          </div>
          <div class="oc-stats">
            ${stat(o.clearings || 0, 'silt clearings')}
            ${stat(o.dispatches || 0, 'dispatches')}
            ${stat(o.incidents_prevented || 0, 'incidents prevented')}
            ${stat(o.refills || 0, 'enzyme refills')}
            ${stat(o.maintenance_visits || 0, 'maintenance visits')}
          </div>
        </div>
      </div>`;
  }

  // ---- Health trend: 90-day score history with bands + event markers ----
  function healthTrendBlock(hist, events) {
    if (!hist || hist.length < 2) return '';
    const vals = hist.map(h => Number(h.score));
    const first = vals[0], last = vals[vals.length - 1];
    const delta = last - first;
    const color = last >= 75 ? 'var(--ok)' : last >= 50 ? 'var(--warn)' : 'var(--alert)';
    const w = 640, h = 190, padL = 30, padR = 64, padT = 10, padB = 24;
    const max = 100, min = Math.max(0, Math.min(...vals) - 10);
    const x = i => padL + (i * (w - padL - padR)) / (vals.length - 1);
    const y = v => padT + (1 - (v - min) / (max - min)) * (h - padT - padB);
    const path = vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    // threshold bands: Good ≥75, Fair 50–75, Poor <50
    const band = (top, bot, c, lbl) => `<rect x="${padL}" y="${y(top)}" width="${w - padL - padR}" height="${(y(Math.max(bot, min)) - y(top)).toFixed(1)}" fill="${c}" fill-opacity=".05"/><text x="${w - padR + 6}" y="${y((top + Math.max(bot, min)) / 2) + 3}" fill="${c}" font-size="10">${lbl}</text>`;
    const bands = band(100, 75, 'var(--ok)', 'Good') + band(75, 50, 'var(--warn)', 'Fair') + (min < 50 ? band(50, min, 'var(--alert)', 'Poor') : '');
    // y gridlines
    const grid = [50, 75].filter(g => g > min).map(g => `<line x1="${padL}" y1="${y(g)}" x2="${w - padR}" y2="${y(g)}" stroke="var(--line)" stroke-width="1" stroke-dasharray="2 3"/><text x="${padL - 5}" y="${y(g) + 3}" fill="var(--ink-3)" font-size="10" text-anchor="end">${g}</text>`).join('');
    // event markers (silt clearings, dispatches, refills) pinned to their dates
    let markers = '';
    (events || []).forEach(ev => {
      const evDate = new Date(ev.occurred_at || ev.date).toISOString().slice(0, 10);
      const idx = hist.findIndex(hh => String(hh.recorded_at).slice(0, 10) >= evDate);
      if (idx < 0) return;
      const lbl = ev.label || String(ev.event_type || '').replace(/_/g, ' ');
      markers += `<line x1="${x(idx)}" y1="${y(vals[idx])}" x2="${x(idx)}" y2="${h - padB}" stroke="var(--ink-3)" stroke-width="1" stroke-dasharray="2 3" opacity=".5"/>
        <circle cx="${x(idx)}" cy="${y(vals[idx])}" r="4.5" fill="var(--brand)" stroke="var(--surface)" stroke-width="2"><title>${UI.esc(lbl)}</title></circle>
        <text x="${x(idx)}" y="${y(vals[idx]) - 9}" fill="var(--ink-2)" font-size="9.5" text-anchor="middle">${UI.esc(lbl)}</text>`;
    });
    const startLbl = UI.fmtDate(hist[0].recorded_at);
    const midLbl = UI.fmtDate(hist[Math.floor(hist.length / 2)].recorded_at);
    const endLbl = 'Today';
    return `
      <div class="panel panel-pad mb-20">
        <div class="row-between mb-10">
          <h3 style="margin:0">Health trend</h3>
          <span style="font-weight:600;font-size:13px;color:${delta >= 0 ? 'var(--ok)' : 'var(--alert)'}">${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)} pts · 90 days</span>
        </div>
        <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto" role="img" aria-label="Drainage health trend">
          ${bands}${grid}
          <path d="${path} L${x(vals.length - 1).toFixed(1)},${y(min)} L${x(0).toFixed(1)},${y(min)} Z" fill="${color}" fill-opacity=".08"/>
          <path d="${path}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
          ${markers}
          <circle cx="${x(vals.length - 1)}" cy="${y(last)}" r="4.5" fill="${color}" stroke="var(--surface)" stroke-width="2"/>
          <text x="${padL}" y="${h - 6}" fill="var(--ink-3)" font-size="10">${startLbl}</text>
          <text x="${(padL + w - padR) / 2}" y="${h - 6}" fill="var(--ink-3)" font-size="10" text-anchor="middle">${midLbl}</text>
          <text x="${w - padR}" y="${h - 6}" fill="var(--ink-3)" font-size="10" text-anchor="end">${endLbl}</text>
        </svg>
        <div class="row-between" style="margin-top:4px">
          <span class="muted" style="font-size:12px">Markers show completed work — clearings, dispatches, refills.</span>
          <b style="font-size:13px;color:${color}">Now: ${last}/100</b>
        </div>
      </div>`;
  }

  // ---- Lagos flood-prone zone context (from FlowGuard's verified zone list) ----
  const FLOOD_ZONES = [
    ['lekki', 'Lekki', 'high'], ['ajah', 'Ajah', 'high'], ['victoria island', 'Victoria Island', 'high'],
    ['ikoyi', 'Ikoyi', 'moderate'], ['agungi', 'Agungi', 'high'], ['osapa', 'Osapa London', 'high'],
    ['ikota', 'Ikota', 'high'], ['chevron', 'Chevron Drive', 'high'], ['dolphin', 'Dolphin Estate', 'high'],
    ['surulere', 'Surulere', 'moderate'], ['gbagada', 'Gbagada', 'moderate'], ['ketu', 'Ketu', 'high'],
    ['mile 12', 'Mile 12', 'high'], ['agiliti', 'Agiliti', 'high'], ['ajegunle', 'Ajegunle', 'high'],
    ['isolo', 'Isolo', 'moderate'], ['okota', 'Okota', 'moderate'], ['amuwo', 'Amuwo-Odofin', 'high'],
    ['festac', 'Festac Town', 'moderate']
  ];
  function zoneContextBlock(p) {
    const hay = `${p.city || ''} ${p.address_line1 || ''} ${p.property_name || ''}`.toLowerCase();
    const zone = FLOOD_ZONES.find(z => hay.includes(z[0]));
    if (!zone) return '';
    const high = zone[2] === 'high';
    return `
      <div class="panel panel-pad mb-20">
        <div class="row-between mb-10">
          <h3 style="margin:0">Flood zone context</h3>
          ${UI.chip(high ? 'alert' : 'warn', (high ? 'High' : 'Moderate') + '-risk zone')}
        </div>
        <p style="font-size:14px;color:var(--ink-2);line-height:1.6;margin:0">
          ${UI.esc(zone[1])} is one of Lagos's ${high ? 'highest' : 'recognised'}-risk flood corridors.
          Your estate's drainage is actively managed and monitored — most surrounding properties in this zone are not.
          Managed drainage significantly reduces flood exposure during peak rainfall.
        </p>
      </div>`;
  }

  async function overview(view) {
    const allProps = await getMyProperties();
    const user = Auth.getUser() || {};
    const name = (user.fullName || user.full_name || '').split(' ')[0] || 'there';
    view.innerHTML = `
      <div class="top">
        <div class="greeting"><h1>${greeting()}, ${UI.esc(name)}</h1><div class="sub"><span id="ov-date">${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span> · <span id="ov-sub">Here's the latest on your drainage network.</span></div></div>
        <div class="top-actions">
          <button class="icon-btn" aria-label="Notifications" onclick="App.go('notifications')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icons.bell}</svg><span class="badge" id="nav-notif-badge" style="display:none">0</span></button>
          <button class="btn" onclick="App.openRegister()">+ Add property</button>
        </div>
      </div>
      ${demoBanner()}
      <div id="ov-journey"></div>
      <div id="ov-kpis"></div>
      <div id="ov-season"></div>
      <div class="ov-cols">
        <div class="minw0">
          <div class="section-t">Live monitoring <a onclick="App.go('monitoring')" class="clickable">View all →</a></div>
          <div id="ov-mon">${UI.loading(2)}</div>
          <div class="section-t">Your FlowGuard services</div>
          <div id="ov-services" class="grid-3"></div>
          <div id="ov-bottom"></div>
        </div>
        <aside class="ov-side">
          <div id="ov-weather"></div>
          <div id="ov-activity"></div>
        </aside>
      </div>`;

    // Gather data (real or demo)
    let props, risk, sensors, alerts, reports, notifs = [];
    if (Demo.isOn()) {
      props = Demo.data.properties; risk = Demo.data.floodRisk; sensors = Demo.data.sensors;
      alerts = Demo.data.alerts; reports = Demo.data.reports;
    } else {
      try { const r = await apiRequest('/properties'); props = (r && r.data) || []; } catch (_) { props = []; }
      try { const r = await apiRequest('/monitoring/flood-risk'); risk = r && r.data; } catch (_) { risk = null; }
      try { const r = await apiRequest('/monitoring/sensors'); sensors = (r && r.data) || []; } catch (_) { sensors = []; }
      try { const r = await apiRequest('/alerts'); alerts = (r && r.data) || []; } catch (_) { alerts = []; }
      try { const r = await apiRequest('/field-reports?limit=5'); reports = (r && r.data) || []; } catch (_) { reports = []; }
      try { const r = await apiRequest('/audit-logs/mine?limit=30'); notifs = (r && r.data) || []; } catch (_) { notifs = []; }
    }

    // ---- scope everything to the selected property ----
    props = scopeToProperty(props, allProps);
    sensors = scopeToProperty(sensors, allProps);
    alerts = scopeToProperty(alerts, allProps);
    reports = scopeToProperty(reports, allProps);

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

    renderSeasonal();

    // ---- Property health score (computed from data already loaded) ----
    const health = computeHealth(reports, risk, alerts);
    let healthDelta = null;
    try {
      const cur = resolveActive(allProps);
      let hist = [];
      if (Demo.isOn()) hist = Demo.data.healthHistory || [];
      else if (cur) { const rh = await apiRequest(`/properties/${cur}/health-history?days=30`); hist = (rh && rh.data) || []; }
      if (hist.length >= 2) healthDelta = Number(hist[hist.length - 1].score) - Number(hist[0].score);
    } catch (_) {}
    renderForecastWidget(allProps, health); // 14-day risk calendar (async, fills #ov-weather)

    // ---- Monitoring section (gauge + sensors together) ----
    const mon = document.getElementById('ov-mon');
    if (risk && risk.has_data) {
      document.getElementById('ov-sub').textContent = `${risk.sensors_online}/${risk.sensors_total} sensors online · updated just now`;
      const msg = risk.level === 'low' ? "Everything's flowing normally"
        : risk.level === 'moderate' ? 'Levels slightly elevated — watching closely' : 'Elevated flood risk — team responding';
      const shown = (sensors || []);
      const moreCard = '';
      mon.innerHTML = `
        <div class="mon-wrap">
          ${UI.gauge(risk.risk_index, risk.level)}
          <div class="minw0">
            <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:6px">
              <h3 style="font-family:var(--ff-d);font-size:18px;font-weight:600;margin:0">${msg}</h3>
              ${health ? `<span class="health-chip ${health.kind}" title="Drainage ${health.rep != null ? health.rep : '—'} · Sensors ${health.sens != null ? health.sens + '%' : '—'} · ${health.openAlerts} open alert${health.openAlerts === 1 ? '' : 's'}">Estate health ${health.score}/100 · ${health.label}${healthDelta != null ? ` <span style="color:${healthDelta >= 0 ? 'var(--ok)' : 'var(--alert)'}">${healthDelta >= 0 ? '▲' : '▼'}${Math.abs(healthDelta)}</span>` : ''}</span>` : ''}
            </div>
            <p style="color:var(--ink-2);font-size:14px;margin-bottom:16px;max-width:440px">Peak level today ${risk.peak_level}% · ${risk.sensors_online} of ${risk.sensors_total} sensors reporting. We'll alert you the moment anything changes.</p>
            <div class="sensor-carousel">
              ${shown.map(UI.sensorCard).join('')}
            </div>
            <div class="carousel-hint">Scroll for more →</div>
          </div>
        </div>`;
    } else {
      const total = (risk && risk.sensors_total) || 0;
      mon.innerHTML = `<div class="mon-wrap" style="grid-template-columns:1fr">
        ${UI.state('awaiting',
          total ? 'Awaiting sensor data' : 'Monitoring starts after setup',
          total ? 'Your sensors are registered but haven\'t reported readings yet. Live flood-risk data appears here once they come online.'
                : 'Once your property is inspected and sensors are installed, your live flood-risk index and water levels appear here.',
          Demo.isOn() ? null : 'Explore with demo data', 'onclick="App.toggleDemo(true)"').replace('card', '')}
      </div>`;
    }

    // ---- Services: the 3 FlowGuard layers ----
    let services;
    if (Demo.isOn()) services = Demo.data.services;
    else services = deriveServices(props, risk);
    document.getElementById('ov-services').innerHTML = services.map(serviceCard).join('');

    // ---- Bottom: recent activity + reports ----
    document.getElementById('ov-activity').innerHTML = `
      <div class="panel panel-pad">
        <div class="row-between" style="margin-bottom:12px">
          <h3 style="margin:0">Activity stream</h3>
          <a onclick="App.go('notifications')" class="clickable" style="color:var(--brand);font-size:13px;font-weight:500">All →</a>
        </div>
        ${(() => { const ev = buildActivity(notifs, alerts); return ev.length ? ev.slice(0, 6).map(activityEvent).join('') : `<p class="muted">No recent activity yet — dispatches, inspections, node health, and account events will appear here.</p>`; })()}
      </div>`;
    document.getElementById('ov-bottom').innerHTML = `
      <div class="panel panel-pad">
        <div class="row-between" style="margin-bottom:14px">
          <h3 style="margin:0">Reports &amp; documents</h3>
          <a onclick="App.go('reports')" class="clickable" style="color:var(--brand);font-size:13px;font-weight:500">All →</a>
        </div>
        ${reports && reports.length ? reports.slice(0, 3).map(docRow).join('')
          : `<p class="muted">No reports yet. Inspection reports and documents FlowGuard sends you will appear here.</p>`}
      </div>`;
  }

  // ---- Activity stream: audit log (actor · action · object) + alert-fired events ----
  const ACT_ICON = { dispatch: 'truck', team: 'check', inspection: 'check', report: 'doc', invoice: 'bell', payment: 'bell', battery: 'warn', offline: 'warn', alert: 'warn', property: 'doc', ticket: 'bell', default: 'bell' };
  function classifyEvent(text) {
    const t = (text || '').toLowerCase();
    if (t.includes('dispatch')) return 'dispatch';
    if (t.includes('team') || t.includes('arrived') || t.includes('checked in')) return 'team';
    if (t.includes('inspect')) return 'inspection';
    if (t.includes('report')) return 'report';
    if (t.includes('invoice') || t.includes('payment')) return 'payment';
    if (t.includes('battery')) return 'battery';
    if (t.includes('offline')) return 'offline';
    if (t.includes('propert')) return 'property';
    if (t.includes('ticket')) return 'ticket';
    return 'default';
  }
  function buildActivity(audit, alerts) {
    const ev = [];
    // audit rows: "{actor} {action}" — the real activity stream
    (audit || []).forEach(a => {
      if (a.actor_name !== undefined || a.action) {
        let ch = a.changes;
        if (typeof ch === 'string') { try { ch = JSON.parse(ch); } catch (_) { ch = null; } }
        const objName = ch && (ch.property_name || ch.subject) ? (ch.property_name || ch.subject) : (a.entity_id || '');
        ev.push({
          type: classifyEvent(a.action),
          title: `${a.actor_name || 'System'} ${a.action}`,
          sub: objName, ts: a.created_at,
          when: a.created_at ? UI.fmtRelative(a.created_at) : (a.when || '')
        });
      } else {
        ev.push(a); // demo entries come pre-shaped
      }
    });
    // alert-fired events belong in the stream too (the alert itself lives on the Alerts screen)
    (alerts || []).filter(a => a.status === 'active').forEach(a => ev.push({
      type: classifyEvent((a.title || '') + ' ' + (a.description || '')),
      title: `Alert fired: ${a.title}`, sub: a.description, ts: a.created_at,
      when: a.created_at || ''
    }));
    // sort by timestamp when we have real ones; demo arrays arrive pre-ordered
    if (ev.some(e => e.ts && !isNaN(Date.parse(e.ts)))) {
      ev.sort((x, y) => (Date.parse(y.ts) || 0) - (Date.parse(x.ts) || 0));
    }
    return ev;
  }
  function activityEvent(e) {
    const ic = icons[ACT_ICON[e.type] || 'bell'] || icons.bell;
    return `<div class="evt ${e.type === 'battery' || e.type === 'offline' || e.type === 'alert' ? 'warn' : 'ok'}">
      <div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${ic}</svg></div>
      <div style="flex:1"><b>${UI.esc(e.title)}</b>${e.sub ? `<small>${UI.esc(e.sub)}</small>` : ''}</div>
      <div class="muted" style="white-space:nowrap;font-size:12px">${UI.esc(e.when)}</div>
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
      <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--line);color:var(--ink-2);font-size:12px">${UI.esc(s.detail || '')}</div>
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
        detail: hasActive ? 'On-call for your property' : 'Available after activation' }
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
        <div class="jtext"><b>Welcome to FlowGuard</b><small>Register your first property to begin monitoring.</small></div>
        <div class="jcta"><button onclick="App.openRegister()">Get started</button></div>
      </div>`;
      return;
    }
    // pick the property furthest along
    const order = ['submitted', 'inspection_scheduled', 'inspection_ongoing', 'report_ready', 'quote_sent', 'payment_pending', 'payment_completed', 'deployment_scheduled', 'active', 'monitoring_active'];
    const p = [...props].sort((a, b) => order.indexOf(b.status) - order.indexOf(a.status))[0];
    const map = {
      submitted: { s: 'progress', b: 'Property submitted', t: `We've received ${p.property_name || 'your property'} and will schedule an inspection soon.`, cta: 'View details', act: `App.openProperty('${p.property_id}')` },
      inspection_scheduled: { s: 'progress', b: 'Inspection scheduled', t: p.inspection_date ? `Our team will assess ${p.property_name || 'your property'} on ${UI.fmtDate(p.inspection_date)}.` : `Our team will assess ${p.property_name || 'your property'} shortly — we'll confirm the date soon.`, cta: 'View details', act: `App.openProperty('${p.property_id}')` },
      inspection_ongoing: { s: 'progress', b: 'Inspection underway', t: `Our team is assessing ${p.property_name || 'your property'} right now.`, cta: 'View details', act: `App.openProperty('${p.property_id}')` },
      awaiting_approval: { s: 'progress', b: 'Awaiting approval', t: `The inspection of ${p.property_name || 'your property'} is complete — your report is being reviewed and will be available shortly.`, cta: 'View details', act: `App.openProperty('${p.property_id}')` },
      report_ready: { s: 'active', b: 'Your report is ready', t: 'Your inspection report is approved and available to download.', cta: 'View report', act: `App.go('reports')` },
      quote_sent: { s: 'active', b: 'Quote ready', t: `Your service quote for ${p.property_name || 'your property'} is ready to review and accept.`, cta: 'View billing', act: `App.go('billing')` },
      payment_pending: { s: 'progress', b: 'Payment pending', t: 'Complete payment to activate monitoring for your property.', cta: 'View billing', act: `App.go('billing')` },
      payment_completed: { s: 'active', b: 'Payment confirmed', t: 'Thank you — we\'re scheduling the installation of your Sentinel devices.', cta: 'View details', act: `App.openProperty('${p.property_id}')` },
      deployment_scheduled: { s: 'progress', b: 'Deployment scheduled', t: `Your Sentinel devices are scheduled for installation at ${p.property_name || 'your property'}.`, cta: 'View details', act: `App.openProperty('${p.property_id}')` },
      active: { s: 'active', b: 'Monitoring active', t: `${p.property_name || 'Your property'} is being monitored 24/7. Everything's handled.`, cta: 'View monitoring', act: `App.go('monitoring')` },
      monitoring_active: { s: 'active', b: 'Monitoring active', t: `${p.property_name || 'Your property'} is being monitored 24/7. Everything's handled.`, cta: 'View monitoring', act: `App.go('monitoring')` },
      suspended: { s: 'progress', b: 'Monitoring paused', t: `Monitoring for ${p.property_name || 'your property'} is currently paused. Contact us if this is unexpected.`, cta: 'Contact support', act: `App.go('support')` },
      cancelled: { s: 'progress', b: 'Service cancelled', t: `Service for ${p.property_name || 'this property'} has been cancelled.`, cta: 'Contact support', act: `App.go('support')` }
    };
    // A completed inspection whose report ops hasn't approved yet is "Awaiting
    // approval" to the client — never "Report ready" (that's ops-internal until
    // the report is approved, which flips the property to report_ready).
    let eff = p.status;
    if (p.inspection_status === 'completed' && order.indexOf(p.status) < order.indexOf('report_ready')) eff = 'awaiting_approval';
    const m = map[eff] || map.submitted;
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
      <div class="dl"><a onclick="App.go('reports')" class="clickable">View</a></div>
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
        submitted: { title: 'Property submitted', sub: `${p.property_name || p.city || 'Property'}` },
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
  let _monSearch = '', _monFilter = 'all', _monMetric = 'level';
  let _monSensors = [], _monHist = { series: [], log: [] };

  async function monitoring(view) {
    const allProps = await getMyProperties();
    view.innerHTML = `
      <div class="top"><div><h1>Monitoring</h1><div class="sub">Live readings, trends, and history across your sensors</div></div>
      <div style="display:flex;gap:10px;align-items:center"><button class="btn ghost" onclick="App.go('overview')">← Overview</button></div></div>
      ${demoBanner()}
      <div id="mon-refill"></div>
      <div class="mon-controls">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
          <input id="mon-search" placeholder="Search sensors…" value="${UI.esc(_monSearch)}" oninput="App.monSearch(this.value)">
        </div>
        <div class="mon-filters" id="mon-filters"></div>
      </div>
      <div id="mon-grid">${UI.loading(1)}</div>
      <div class="section-t" style="margin-top:26px">Network trend
        <span style="display:flex;gap:6px">
          <button class="chip ${_monMetric === 'level' ? 'ok' : ''} clickable-outline" onclick="App.monMetric('level')">Water level</button>
          <button class="chip ${_monMetric === 'flow' ? 'ok' : ''} clickable-outline" onclick="App.monMetric('flow')">Flow rate</button>
        </span>
      </div>
      <div class="panel panel-pad" id="mon-chart">${UI.loading(2)}</div>
      <div class="section-t" style="margin-top:26px">Reading history</div>
      <div class="panel panel-pad" id="mon-log"></div>`;

    const _scopeProps = await getMyProperties();
    if (Demo.isOn()) { _monSensors = scopeToProperty(Demo.data.sensors, _scopeProps); _monHist = Demo.data.history; }
    else {
      try { const r = await apiRequest('/monitoring/sensors'); _monSensors = scopeToProperty((r && r.data) || [], _scopeProps); } catch (_) { _monSensors = []; }
      try { const r = await apiRequest('/monitoring/history?hours=24'); _monHist = (r && r.data) || { series: [], log: [] }; } catch (_) { _monHist = { series: [], log: [] }; }
    }

    // Action banners: offline nodes and bio-enzyme refills — each with a
    // pre-filled "Request support" CTA.
    const q = str => String(str == null ? '' : str).replace(/['"\\\n]/g, ' ').replace(/\s+/g, ' ').trim();
    let banners = '';
    const offlineNodes = _monSensors.filter(s => s.status === 'offline');
    if (offlineNodes.length) {
      const names = offlineNodes.map(s => s.name || s.sensor_id).join(', ');
      banners += `<div class="refill-banner">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>
        <div><b>${offlineNodes.length} sensor${offlineNodes.length === 1 ? '' : 's'} offline</b>
        <span>${UI.esc(names)} — not reporting. Request a field visit to restore monitoring.</span></div>
        <button class="btn" onclick="App.openTicket('sensor','${q('Offline sensors: ' + names)}','high','${q('These sensors are offline and not reporting: ' + names + '. Please arrange a field visit to restore monitoring.')}')">Request support</button>
      </div>`;
    }
    const needsRefill = _monSensors.filter(s => s.enzyme && ['due_replacement', 'depleted', 'low'].includes(s.enzyme.status));
    if (needsRefill.length) {
      const names = needsRefill.map(s => s.name || s.sensor_id).join(', ');
      banners += `<div class="refill-banner">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.7s6 6.3 6 10.3a6 6 0 01-12 0c0-4 6-10.3 6-10.3z"/></svg>
        <div><b>${needsRefill.length} bio-enzyme ${needsRefill.length === 1 ? 'unit needs' : 'units need'} refilling</b>
        <span>${UI.esc(names)} — schedule a Heavy-Plant Dispatch refill.</span></div>
        <button class="btn" onclick="App.openTicket('dispatch','${q('Bio-enzyme refill: ' + names)}','normal','${q('Please schedule a bio-enzyme cartridge refill for: ' + names + '.')}')">Request refill</button>
      </div>`;
    }
    document.getElementById('mon-refill').innerHTML = banners;

    // filter chips (counts)
    const zones = [...new Set(_monSensors.map(s => s.zone).filter(Boolean))];
    const bioCount = _monSensors.filter(s => s.device_variant === 'bio_dispenser').length;
    const offCount = _monSensors.filter(s => s.status !== 'active').length;
    document.getElementById('mon-filters').innerHTML = [
      ['all', `All (${_monSensors.length})`],
      ['bio', `Bio-dispensers (${bioCount})`],
      ['offline', `Offline (${offCount})`]
    ].map(([k, l]) => `<button class="chip ${_monFilter === k ? 'ok' : ''} clickable-outline" onclick="App.monFilter('${k}')">${l}</button>`).join('');

    renderMonGrid();
    renderMonChart();
    renderMonLog();
  }

  function renderMonGrid() {
    const grid = document.getElementById('mon-grid');
    if (!grid) return;
    let list = _monSensors;
    if (_monFilter === 'bio') list = list.filter(s => s.device_variant === 'bio_dispenser');
    if (_monFilter === 'offline') list = list.filter(s => s.status !== 'active');
    if (_monSearch) { const q = _monSearch.toLowerCase(); list = list.filter(s => (s.name || s.sensor_id || '').toLowerCase().includes(q) || (s.zone || '').toLowerCase().includes(q)); }
    if (!_monSensors.length) { grid.className = ''; grid.innerHTML = UI.state('awaiting', 'No sensor data yet', 'Live readings appear here once your sensors are online.', Demo.isOn() ? null : 'Explore with demo data', 'onclick="App.toggleDemo(true)"'); return; }
    if (!list.length) { grid.innerHTML = `<div style="color:var(--ink-3);font-size:13px;padding:20px 0">No sensors match your search.</div>`; return; }
    grid.innerHTML = `<div class="sensors">${list.map(UI.sensorCard).join('')}</div>`;
  }

  function renderMonChart() {
    const ch = document.getElementById('mon-chart');
    if (!ch) return;
    if (_monHist.series && _monHist.series.length > 1) {
      const isFlow = _monMetric === 'flow';
      ch.innerHTML = `${UI.lineChart(_monHist.series, { metric: _monMetric, threshold: _monMetric === 'flow' ? null : { v: 70, label: 'Alert' } })}
        <div style="display:flex;gap:18px;margin-top:10px;font-size:12px;color:var(--ink-3)">
          <span><span style="display:inline-block;width:14px;height:3px;background:var(--brand);vertical-align:middle;margin-right:5px"></span>${isFlow ? 'Flow rate (L/s)' : 'Average level'}</span>
          ${isFlow ? '' : '<span><span style="display:inline-block;width:14px;height:0;border-top:2px dashed var(--warn);vertical-align:middle;margin-right:5px"></span>Peak level</span>'}
        </div>`;
    } else {
      ch.innerHTML = `<div class="muted">Trend charts appear here once sensors have recorded a few hours of readings.</div>`;
    }
  }

  function renderMonLog() {
    const lg = document.getElementById('mon-log');
    if (!lg) return;
    if (_monHist.log && _monHist.log.length) {
      lg.innerHTML = `<div style="max-height:340px;overflow:auto">
        <table class="data-table">
          <thead><tr><th>Time</th><th>Sensor</th><th>Level</th><th>Flow</th><th>Debris</th></tr></thead>
          <tbody>${_monHist.log.map(r => `<tr>
            <td style="color:var(--ink-2)">${UI.fmtTime(r.time)}</td>
            <td style="font-weight:500">${UI.esc(r.sensor)}</td>
            <td style="font-family:var(--ff-d)">${r.level != null ? r.level + '%' : '—'}</td>
            <td style="font-family:var(--ff-d)">${r.flow != null ? r.flow + ' L/s' : '—'}</td>
            <td>${r.debris ? UI.chip('warn', 'Detected') : UI.chip('ok', 'Clear')}</td>
          </tr>`).join('')}</tbody>
        </table></div>`;
    } else {
      lg.innerHTML = `<div class="muted">No readings logged yet. Historical sensor data will appear here as your devices report.</div>`;
    }
  }

  function monSearch(v) { _monSearch = v; renderMonGrid(); }
  function monFilter(f) {
    _monFilter = f;
    document.querySelectorAll('#mon-filters .chip').forEach((c, i) => {
      const keys = ['all', 'bio', 'offline'];
      c.classList.toggle('ok', keys[i] === f);
    });
    renderMonGrid();
  }
  function monMetric(m) {
    _monMetric = m;
    document.querySelectorAll('.section-t .chip').forEach(c => {
      c.classList.toggle('ok', c.textContent.toLowerCase().includes(m === 'level' ? 'water' : 'flow'));
    });
    renderMonChart();
  }

  // ---------------- PROPERTIES (richer cards, clickable → detail) ----------------
  async function properties(view) {
    view.innerHTML = `
      <div class="top"><div><h1>My properties</h1><div class="sub">Areas you've registered for monitoring</div></div>
      <button class="btn" onclick="App.openRegister()">+ Add property</button></div>
      ${demoBanner()}
      <div id="prop-portfolio"></div>
      <div id="prop-list">${UI.loading(3)}</div>`;
    let props, reports, alerts;
    if (Demo.isOn()) { props = Demo.data.properties; reports = Demo.data.reports; alerts = Demo.data.alerts; }
    else {
      try { const r = await apiRequest('/properties'); props = (r && r.data) || []; } catch (_) { props = null; }
      try { const r = await apiRequest('/field-reports?limit=100'); reports = (r && r.data) || []; } catch (_) { reports = []; }
      try { const r = await apiRequest('/alerts'); alerts = (r && r.data) || []; } catch (_) { alerts = []; }
    }
    const el = document.getElementById('prop-list');

    if (props === null) {
      el.innerHTML = UI.state('error', "Couldn't load your properties", 'Please check your connection and try again.', 'Retry', "onclick=\"App.go('properties')\"");
    } else if (props.length) {
      // latest drainage score per property (by id or name)
      const scoreOf = p => {
        const r = (reports || []).find(r => (r.property_id && r.property_id === p.property_id) || (r.property_name && r.property_name === p.property_name));
        return r && r.drainage_condition_score != null ? Number(r.drainage_condition_score) : null;
      };
      const scores = new Map(props.map(p => [p.property_id, scoreOf(p)]));

      // portfolio summary (only meaningful with 2+ properties)
      if (props.length >= 2) {
        const live = props.filter(p => ['active', 'monitoring_active'].includes(p.status)).length;
        const setup = props.length - live;
        const spend = props.reduce((s, p) => s + (Number(p.monthly_fee) || 0), 0);
        const scored = [...scores.values()].filter(v => v != null);
        const avg = scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null;
        const atRisk = props.filter(p => {
          const sc = scores.get(p.property_id);
          return (sc != null && sc < 50) || ['high', 'critical'].includes(p.urgency_level);
        }).length;
        document.getElementById('prop-portfolio').innerHTML = `<div class="kpi-row mb-20">
          ${kpiCard('Portfolio', props.length, `${live} live · ${setup} in setup`, icons.check)}
          ${kpiCard('Avg drainage score', avg != null ? avg + '/100' : '—', avg != null ? (avg >= 70 ? 'Healthy' : avg >= 50 ? 'Fair' : 'Needs work') : 'No reports yet', icons.sensor)}
          ${kpiCard('Need attention', atRisk, atRisk ? 'High urgency or low score' : 'All clear', icons.warn)}
          ${kpiCard('Monthly spend', spend ? UI.fmtNaira(spend) : '—', spend ? 'Across portfolio' : 'No active billing', icons.bell)}
        </div>`;
      }
      el.innerHTML = `
        <div class="card tbl-wrap">
          <table class="tbl">
            <thead><tr><th>Property</th><th>Location</th><th>Type</th><th>Score</th><th>Status</th><th>Monthly fee</th><th></th></tr></thead>
            <tbody>${props.map(p => propertyRow(p, scores.get(p.property_id))).join('')}</tbody>
          </table>
        </div>`;
    } else {
      // Onboarding for brand-new users (no areas yet)
      el.innerHTML = onboardingBlock();
    }
  }

  // Table row for the properties listview
  function propertyRow(p, score) {
    const scoreColor = score == null ? 'var(--ink-3)' : score >= 70 ? 'var(--ok)' : score >= 50 ? 'var(--warn)' : 'var(--alert)';
    return `<tr class="rowlink" onclick="App.openProperty('${UI.esc(p.property_id)}')">
      <td data-label="Property"><b>${UI.esc(p.property_name || 'Unnamed property')}</b></td>
      <td class="muted" data-label="Location">${UI.esc([p.city, p.state].filter(Boolean).join(', ') || '—')}</td>
      <td class="muted" data-label="Type">${UI.esc(UI.prettyType(p.property_type))}</td>
      <td data-label="Score"><b style="color:${scoreColor}">${score != null ? score + '/100' : '—'}</b></td>
      <td data-label="Status">${statusChip(p.status)}</td>
      <td data-label="Fee">${p.monthly_fee ? UI.fmtNaira(p.monthly_fee) + '/mo' : '—'}</td>
      <td class="tbl-arrow" style="text-align:right;color:var(--brand);font-weight:600">→</td>
    </tr>`;
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
      <div class="top"><div><h1>Billing, contract &amp; SLA</h1><div class="sub">Your plan, service guarantees, and payment history</div></div></div>
      ${demoBanner()}
      <div id="bill-sub"></div>
      <div class="section-t">Service level agreement</div>
      <div class="panel panel-pad" id="bill-sla"></div>
      <div class="section-t" style="margin-top:24px">Payment history</div>
      <div class="card panel-pad" id="bill-list">${UI.loading(3)}</div>`;

    let invoices, contract;
    if (Demo.isOn()) { invoices = Demo.data.invoices; contract = Demo.data.contract; }
    else {
      try { const r = await apiRequest('/billing/invoices'); invoices = (r && r.data) || []; } catch (_) { invoices = null; }
      // subscription + SLA come from the property billing endpoint; try the first property
      try {
        const rp = await apiRequest('/properties');
        const first = ((rp && rp.data) || [])[0];
        if (first) { const rb = await apiRequest(`/billing/${first.property_id}`); contract = rb && rb.data; }
      } catch (_) { contract = null; }
    }

    // Subscription summary
    const sub = document.getElementById('bill-sub');
    if (contract && (contract.subscription || contract.plan)) {
      const s = contract.subscription || contract;
      sub.innerHTML = `<div class="grid-3" style="margin-bottom:8px">
        ${UI.stat('Current plan', `<span style="font-size:20px">${UI.esc(s.plan || s.plan_name || 'FlowGuard')}</span>`, s.tier ? cap(s.tier) + ' tier' : 'Drainage-as-a-Service')}
        ${UI.stat('Monthly fee', UI.fmtNaira(s.monthly_fee || s.amount || 0), 'Billed monthly')}
        ${UI.stat('Next billing', `<span style="font-size:18px">${UI.fmtDate(s.next_billing || contract.next_billing)}</span>`, 'Upcoming charge')}
      </div>`;
    } else {
      sub.innerHTML = '';
    }

    // SLA section
    const sla = document.getElementById('bill-sla');
    const slaData = contract && (contract.sla || contract);
    if (slaData && (slaData.uptime_guarantee || slaData.uptime || slaData.response_time)) {
      sla.innerHTML = `<div class="sla-grid">
        <div class="sla-c"><div class="l">Uptime guarantee</div><div class="v">${slaData.uptime_guarantee || '98'}%</div><div class="s">Monitoring availability</div></div>
        <div class="sla-c"><div class="l">Current uptime</div><div class="v c-ok">${slaData.uptime || slaData.current_uptime || '99.8'}%</div><div class="s">Last 30 days</div></div>
        <div class="sla-c"><div class="l">Response time</div><div class="v">${slaData.response_time || '4h'}</div><div class="s">Critical incident SLA</div></div>
      </div>`;
    } else {
      sla.innerHTML = `<div class="sla-grid">
        <div class="sla-c"><div class="l">Uptime guarantee</div><div class="v">98%</div><div class="s">Monitoring availability</div></div>
        <div class="sla-c"><div class="l">Current uptime</div><div class="v c-ok">99.8%</div><div class="s">Last 30 days</div></div>
        <div class="sla-c"><div class="l">Response time</div><div class="v">4h</div><div class="s">Critical incident SLA</div></div>
      </div>`;
    }

    // Payment history
    const el = document.getElementById('bill-list');
    if (invoices === null) {
      el.className = '';
      el.innerHTML = UI.state('error', "Couldn't load your invoices", 'Please check your connection and try again.', 'Retry', "onclick=\"App.go('billing')\"");
    } else if (invoices && invoices.length) {
      el.innerHTML = `<div class="rows">${invoices.map(inv => {
        const paid = (inv.payment_status || inv.status) === 'paid';
        return `<div class="row clickable" onclick="App.openInvoice('${UI.esc(inv.invoice_id || '')}')">
          <div class="rmain"><b>${UI.esc(cap(inv.invoice_type || 'Service'))} — ${UI.fmtDate(inv.issue_date)}</b>
            <small>${paid ? 'Paid ' + UI.fmtDate(inv.paid_date || inv.issue_date) : 'Due ' + UI.fmtDate(inv.due_date)}</small></div>
          <div class="rright" style="display:flex;gap:10px;align-items:center"><div class="amt">${UI.fmtNaira(inv.total_amount)}</div>${UI.chip(paid ? 'ok' : 'warn', paid ? 'Paid' : 'Due')}<span style="color:var(--brand);font-size:13px;font-weight:600">View →</span></div>
        </div>`;
      }).join('')}</div>`;
    } else {
      el.className = '';
      el.innerHTML = UI.state('empty', 'No invoices yet', 'Your billing history will appear here once your service is active.');
    }
  }

  // ---------------- ALERTS & INCIDENTS ----------------
  async function alerts(view) {
    const allProps = await getMyProperties();
    view.innerHTML = `
      <div class="top"><div><h1>Flood &amp; sensor alerts</h1><div class="sub">Real-time drainage and flood-risk events detected across your properties</div></div></div>
      ${demoBanner()}
      <div id="alert-kpis"></div>
      <div class="section-t">Active alerts</div>
      <div class="card tbl-wrap" id="alert-active">${UI.loading(2)}</div>
      <div class="section-t" style="margin-top:24px">Resolved history</div>
      <div class="card tbl-wrap" id="alert-resolved"></div>`;

    let items;
    if (Demo.isOn()) items = scopeToProperty(Demo.data.alerts, allProps).map(normalizeAlert);
    else {
      try { const r = await apiRequest('/alerts'); items = scopeToProperty((r && r.data) || [], allProps).map(normalizeAlert); }
      catch (_) {
        const kEl = document.getElementById('alert-kpis');
        const aEl = document.getElementById('alert-active');
        if (kEl) kEl.innerHTML = '';
        if (aEl) aEl.innerHTML = UI.state('error', "Couldn't load alerts", 'Please check your connection and try again.', 'Retry', "onclick=\"App.go('alerts')\"");
        return;
      }
    }

    const active = items.filter(a => a.status !== 'resolved');
    const resolved = items.filter(a => a.status === 'resolved');
    const crit = active.filter(a => a.severity === 'critical').length;
    const warn = active.filter(a => a.severity === 'warning').length;

    document.getElementById('alert-kpis').innerHTML = `<div class="alert-kpis">
      <div class="alert-kpi"><div class="n">${active.length}</div><div class="l">Active</div></div>
      <div class="alert-kpi"><div class="n c-alert">${crit}</div><div class="l">Critical</div></div>
      <div class="alert-kpi"><div class="n" style="color:var(--warn)">${warn}</div><div class="l">Warning</div></div>
      <div class="alert-kpi"><div class="n c-ok">${resolved.length}</div><div class="l">Resolved</div></div>
    </div>`;

    const av = document.getElementById('alert-active');
    if (active.length) av.innerHTML = alertTable(active, true);
    else { av.className = ''; av.innerHTML = UI.state('ok', 'No active alerts', "Everything's clear. We'll alert you the moment anything needs attention."); }

    const rv = document.getElementById('alert-resolved');
    if (resolved.length) rv.innerHTML = alertTable(resolved, false);
    else { rv.className = ''; rv.innerHTML = `<p class="muted">No resolved incidents yet.</p>`; }
  }

  // Alerts rendered as a table listview
  function alertTable(items, isActive) {
    return `<table class="tbl">
      <thead><tr><th style="width:110px">Severity</th><th>Alert</th><th style="width:130px">${isActive ? 'Raised' : 'Resolved'}</th>${isActive ? '<th style="width:250px">Actions</th>' : ''}</tr></thead>
      <tbody>${items.map(a => alertRow(a, isActive)).join('')}</tbody>
    </table>`;
  }
  function alertRow(a, isActive) {
    const sevMap = { critical: ['alert', 'Critical'], warning: ['warn', 'Warning'], info: ['ok', 'Info'], success: ['ok', 'Resolved'] };
    const [sk, sl] = sevMap[a.severity] || ['ok', 'Info'];
    const subj = (a.title || 'Alert').replace(/'/g, '');
    const actions = !isActive ? '' :
      a.severity === 'critical'
        ? `<button class="btn sm" onclick="App.openTicket('emergency','Emergency dispatch: ${UI.esc(subj)}','urgent')">Request dispatch</button>
           <button class="btn ghost sm" onclick="App.openTicket('general','Escalation: ${UI.esc(subj)}','high')">Escalate</button>`
      : a.severity === 'warning'
        ? `<button class="btn ghost sm" onclick="App.openTicket('dispatch','Dispatch request: ${UI.esc(subj)}','high')">Request dispatch</button>`
        : '';
    return `<tr>
      <td data-label="Severity">${UI.chip(sk, sl)}</td>
      <td data-label="Alert"><b>${UI.esc(a.title)}</b><div class="muted" style="margin-top:2px">${UI.esc(a.description)}</div></td>
      <td class="muted" data-label="${isActive ? 'Raised' : 'Resolved'}">${UI.esc(a.resolved_at && !isActive ? UI.fmtDate(a.resolved_at) : (a.created_at || ''))}</td>
      ${isActive ? `<td data-label="Actions"><div style="display:flex;gap:8px;flex-wrap:wrap">${actions || '<span class="muted">—</span>'}</div></td>` : ''}
    </tr>`;
  }

  function normalizeAlert(a) {
    const sev = a.severity || (a.type === 'warning' ? 'warning' : a.type === 'critical' ? 'critical' : 'info');
    return {
      title: a.title || 'Alert', description: a.description || a.message || '',
      severity: sev, status: a.status || (a.resolved_at ? 'resolved' : 'active'),
      created_at: a.created_at, resolved_at: a.resolved_at
    };
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
          <h3>Change password</h3>
          <div class="field"><label>Current password</label><input id="ac-curpw" type="password" placeholder="••••••••"></div>
          <div class="field"><label>New password</label><input id="ac-newpw" type="password" placeholder="At least 8 characters"></div>
          <div class="field"><label>Confirm new password</label><input id="ac-confpw" type="password" placeholder="Re-enter new password"></div>
          <div id="ac-pw-err" class="hint hidden c-alert"></div>
          <button class="btn" onclick="App.changePassword()">Update password</button>
          <hr style="border:none;border-top:1px solid var(--line);margin:20px 0">
          <button class="btn ghost" onclick="App.go('settings')">Platform settings →</button>
          <button class="btn ghost" style="margin-top:8px;color:var(--alert)" onclick="Auth.logout()">Sign out</button>
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

  // Render a team's members list (members JSONB may be array of strings or objects)
  function teamMembersHtml(members) {
    let arr = members;
    if (typeof arr === 'string') { try { arr = JSON.parse(arr); } catch (_) { arr = null; } }
    if (!Array.isArray(arr) || !arr.length) return '';
    const rows = arr.slice(0, 6).map(m => {
      const name = typeof m === 'string' ? m : (m.name || m.full_name || '—');
      const role = typeof m === 'object' ? (m.role || m.title || '') : '';
      const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
      return `<div class="tm-row">
        <div class="tm-av">${UI.esc(initials)}</div>
        <div><div class="tm-name">${UI.esc(name)}</div>${role ? `<div class="tm-role">${UI.esc(role)}</div>` : ''}</div>
      </div>`;
    }).join('');
    return `<div class="tm-list">${rows}</div>`;
  }

  // Reported drainage issues — closes the loop by showing the client what they told us
  function reportedIssuesBlock(p) {
    const desc = p.issue_description;
    let extra = p.current_issues;
    if (typeof extra === 'string') { try { extra = JSON.parse(extra); } catch (_) { extra = null; } }
    if (!desc && !(extra && (Array.isArray(extra) ? extra.length : Object.keys(extra).length))) return '';
    const urgency = p.urgency_level;
    const uKind = urgency === 'critical' || urgency === 'high' ? 'alert' : urgency === 'medium' ? 'warn' : 'ok';
    return `
      <div class="panel panel-pad mb-20">
        <div class="row-between mb-10">
          <h3 style="margin:0">Reported drainage concern</h3>
          ${urgency ? UI.chip(uKind, cap(urgency) + ' urgency') : ''}
        </div>
        ${desc ? `<p style="font-size:14px;color:var(--ink-2);line-height:1.6;margin:0">${UI.esc(desc)}</p>` : ''}
      </div>`;
  }

  // Property profile — the rich intake fields, shown when present
  function propertyProfileBlock(p) {
    const rows = [];
    const addr = [p.address_line1, p.address_line2, p.city, p.state].filter(Boolean).join(', ');
    if (addr) rows.push(['Address', UI.esc(addr)]);
    if (p.property_type) rows.push(['Type', UI.prettyType(p.property_type)]);
    if (p.total_area_sqm) rows.push(['Total area', `${Number(p.total_area_sqm).toLocaleString()} sqm`]);
    if (p.number_of_units) rows.push(['Units', Number(p.number_of_units).toLocaleString()]);
    if (p.number_of_buildings) rows.push(['Buildings', Number(p.number_of_buildings).toLocaleString()]);
    if (p.estimated_population) rows.push(['Est. population', Number(p.estimated_population).toLocaleString()]);
    if (p.preferred_inspection_date) rows.push(['Preferred inspection', UI.fmtDate(p.preferred_inspection_date) + (p.preferred_inspection_time ? ` (${cap(p.preferred_inspection_time)})` : '')]);
    if (!rows.length) return '';
    return `
      <div class="panel panel-pad mb-20">
        <h3 style="margin:0 0 12px">Property profile</h3>
        <div class="profile-grid">
          ${rows.map(([k, v]) => `<div class="pf-row"><div class="pf-k">${k}</div><div class="pf-v">${v}</div></div>`).join('')}
        </div>
      </div>`;
  }

  async function propertyDetail(view, propertyId) {
    view.innerHTML = `
      <div class="top"><div>
        <div class="crumb" onclick="App.go('properties')">← My properties</div>
        <h1 id="pd-name">Loading…</h1><div class="sub" id="pd-loc"></div>
      </div>
      <div id="pd-actions" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:flex-end"></div></div>
      ${demoBanner()}
      <div id="pd-body">${UI.loading(3)}</div>`;

    let p;
    if (Demo.isOn()) {
      p = Demo.data.properties.find(x => x.property_id === propertyId) || Demo.data.properties[0];
    } else {
      try { const r = await apiRequest(`/properties/${propertyId}`); p = r && r.data; }
      catch (e) { document.getElementById('pd-body').innerHTML = UI.state('error', 'Could not load property', e.message || 'Please try again.', 'Back to properties', "onclick=\"App.go('properties')\""); return; }
    }
    if (!p) { document.getElementById('pd-body').innerHTML = UI.state('error', 'Property not found', 'This property may have been removed.'); return; }

    document.getElementById('pd-name').textContent = p.property_name || 'Property';
    document.getElementById('pd-loc').textContent = [p.city, p.state].filter(Boolean).join(', ') + ' · ' + UI.prettyType(p.property_type);

    const curIdx = Math.max(0, STATUS_FLOW.indexOf(p.status === 'monitoring_active' ? 'active' : p.status));
    const steps = STATUS_FLOW.map((st, i) => ({
      status: i < curIdx ? 'done' : i === curIdx ? 'now' : 'pending',
      title: STATUS_LABEL[st], when: i <= curIdx ? UI.fmtDate(p.created_at) : 'Upcoming'
    }));

    // pull per-property extras in parallel (honest fallback)
    let invoices = [], inspection = null, outcomes = null, healthHist = [];
    if (Demo.isOn()) {
      invoices = Demo.data.invoices.slice(0, 2);
      inspection = { status: 'scheduled', scheduled_date: '2026-07-18' };
      outcomes = Demo.data.outcomes;
      healthHist = Demo.data.healthHistory;
    } else {
      try { const ri = await apiRequest(`/properties/${propertyId}/invoices`); invoices = (ri && ri.data) || []; } catch (_) {}
      try { const rn = await apiRequest(`/properties/${propertyId}/inspection`); inspection = rn && rn.data; } catch (_) {}
      try { const ro = await apiRequest(`/properties/${propertyId}/outcomes`); outcomes = ro && ro.data; } catch (_) {}
      try { const rh = await apiRequest(`/properties/${propertyId}/health-history?days=90`); healthHist = (rh && rh.data) || []; } catch (_) {}
    }

    document.getElementById('pd-body').innerHTML = `
      <div class="grid-3 mb-20">
        ${UI.stat('Status', `<span style="font-size:18px">${STATUS_LABEL[p.status] || cap(p.status || 'Pending')}</span>`, 'Current stage')}
        ${UI.stat('Contact', `<span style="font-size:16px">${UI.esc(p.contact_person_name || p.client_name || '—')}</span>`, p.contact_person_role || p.client_phone || p.contact_phone || '')}
        ${UI.stat('Registered', `<span style="font-size:18px">${UI.fmtDate(p.created_at)}</span>`, 'Submission date')}
      </div>

      ${reportedIssuesBlock(p)}
      ${outcomesBlock(outcomes, p)}
      ${healthTrendBlock(healthHist, (outcomes && outcomes.recent_events) || [])}
      ${zoneContextBlock(p)}
      ${propertyProfileBlock(p)}

      <div class="cols wide">
        <div class="panel panel-pad">
          <h3>Service progress</h3>
          ${steps.map(timelineRow).join('')}
        </div>
        <div class="panel panel-pad">
          <h3>Inspection</h3>
          ${inspection
            ? `<div class="evt ok"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icons.check}</svg></div>
                 <div><b>${UI.esc(cap(inspection.status || 'Scheduled'))}</b><small>${inspection.scheduled_date ? UI.fmtDate(inspection.scheduled_date) : 'Date to be confirmed'}</small></div></div>
               ${(inspection.team_name || inspection.assigned_agent_name) ? `
               <div class="assigned-team">
                 <div class="lbl" style="margin:14px 0 8px">Assigned ${inspection.team_name ? 'team' : 'inspector'}</div>
                 ${inspection.team_name ? `
                   <div class="team-head">
                     <b class="dv">${UI.esc(inspection.team_name)}</b>
                     ${inspection.team_status ? UI.chip(inspection.team_status === 'on_site' ? 'ok' : 'progress', cap(String(inspection.team_status).replace(/_/g,' '))) : ''}
                   </div>
                   ${teamMembersHtml(inspection.team_members)}
                 ` : ''}
                 ${inspection.assigned_agent_name ? `
                   <div class="tm-row">
                     <div class="tm-av">${UI.esc(inspection.assigned_agent_name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase())}</div>
                     <div>
                       <div class="tm-name">${UI.esc(inspection.assigned_agent_name)}</div>
                       ${inspection.assigned_agent_phone ? `<div class="tm-role">${UI.esc(inspection.assigned_agent_phone)}</div>` : ''}
                     </div>
                   </div>
                 ` : ''}
               </div>` : ''}`
            : (STATUS_FLOW.indexOf(p.status) >= STATUS_FLOW.indexOf('inspection_scheduled')
                ? UI.state('awaiting', 'Inspection scheduled', 'Your inspection is being arranged. Team and timing details will appear here shortly.').replace('card', '')
                : UI.state('awaiting', 'No inspection yet', 'An inspection will be scheduled after your property is reviewed.').replace('card', ''))}
          <h3 style="margin-top:22px">Recent invoices</h3>
          ${invoices.length
            ? `<div class="rows">${invoices.map(inv => {
                const paid = (inv.payment_status || inv.status) === 'paid';
                return `<div class="row"><div class="rmain"><b>${UI.fmtNaira(inv.total_amount)}</b><small>${UI.fmtDate(inv.issue_date)}</small></div>
                  <div class="rright">${UI.chip(paid ? 'ok' : 'warn', paid ? 'Paid' : 'Due')}</div></div>`;
              }).join('')}</div>`
            : `<p class="muted">No invoices yet.</p>`}
        </div>
      </div>
      `;
    const pa = document.getElementById('pd-actions');
    if (pa) pa.insertAdjacentHTML('afterbegin', detailActions(p));
  }

  // Status-aware action bar for the property detail page
  function detailActions(p) {
    const s = p.status;
    const btns = [];
    if (s === 'report_ready' || s === 'quote_sent' || s === 'payment_pending') {
      btns.push(`<button class="btn" onclick="App.selectServices('${UI.esc(p.property_id)}')">Choose service tier</button>`);
      btns.push(`<button class="btn ghost" onclick="App.go('billing')">View billing</button>`);
    } else if (s === 'active' || s === 'monitoring_active') {
      btns.push(`<button class="btn" onclick="App.go('monitoring')">View live monitoring</button>`);
      btns.push(`<button class="btn ghost" onclick="App.go('billing')">View billing</button>`);
    } else if (s === 'submitted' || s === 'inspection_scheduled' || s === 'inspection_ongoing') {
      btns.push(`<button class="btn ghost" onclick="App.go('support')">Contact support</button>`);
    }
    // always available
    btns.push(`<button class="btn ghost" onclick="App.openEditProperty('${UI.esc(p.property_id)}')">Edit details</button>`);
    btns.push(`<button class="btn ghost" onclick="App.openRegister()">Register another property</button>`);
    return btns.join('');
  }

  // ---------------- NOTIFICATIONS CENTER (filter / mark-read / delete) ----------------
  let _notifFilter = 'all';
  async function notifications(view) {
    view.innerHTML = `
      <div class="top"><div><h1>Notifications</h1><div class="sub">Account and service updates — submissions, inspections, reports, and billing</div></div>
        <button class="btn ghost" onclick="App.markAllRead()">Mark all read</button></div>
      ${demoBanner()}
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <button class="chip ${_notifFilter === 'all' ? 'ok' : ''} clickable-outline" onclick="App.setNotifFilter('all')">All</button>
        <button class="chip ${_notifFilter === 'unread' ? 'ok' : ''} clickable-outline" onclick="App.setNotifFilter('unread')">Unread</button>
      </div>
      <div class="card panel-pad" id="notif-list">${UI.loading(3)}</div>`;

    let items;
    if (Demo.isOn()) {
      items = Demo.data.alerts.map((a, i) => ({ id: 'D' + i, title: a.title, message: a.description, type: a.type, read: i > 0, created_at: a.created_at }));
    } else {
      try { const r = await apiRequest('/notifications'); items = (r && r.data) || []; } catch (_) { items = null; }
    }
    if (items === null) {
      const el0 = document.getElementById('notif-list');
      if (el0) el0.innerHTML = UI.state('error', "Couldn't load notifications", 'Please check your connection and try again.', 'Retry', "onclick=\"App.go('notifications')\"");
      return;
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
    // '#tab' opens the list; '#tab/RECORD-ID' opens the specific record.
    const raw = (n.link || '').replace(/^#/, '');
    const slash = raw.indexOf('/');
    let goCall = '';
    if (slash > 0) {
      const tab = raw.slice(0, slash), rid = raw.slice(slash + 1);
      const detail = (tab === 'ticket' || tab === 'support') ? 'ticketDetail'
                   : (tab === 'property' || tab === 'properties') ? 'propertyDetail' : null;
      goCall = detail ? `App.go('${detail}','${UI.esc(rid)}')` : `App.go('${UI.esc(tab)}')`;
    } else if (raw) { goCall = `App.go('${UI.esc(raw)}')`; }
    const nav = goCall ? `onclick="${goCall}" style="cursor:pointer;${read ? 'opacity:.6' : ''}"` : `style="${read ? 'opacity:.6' : ''}"`;
    return `<div class="evt ${kind}" ${nav}>
      <div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${ic}</svg></div>
      <div style="flex:1"><b>${UI.esc(n.title || 'Notification')}</b><small>${UI.esc(n.message || n.description || '')}</small></div>
      <span class="t">${UI.esc(n.created_at || '')}</span>
      <div style="display:flex;gap:8px;margin-left:10px">
        ${!read ? `<button class="chip clickable-outline" onclick="event.stopPropagation();App.markRead('${UI.esc(n.id)}')">Mark read</button>` : ''}
        <button class="chip clickable-outline" onclick="event.stopPropagation();App.deleteNotif('${UI.esc(n.id)}')">Delete</button>
      </div>
    </div>`;
  }
  function setNotifFilter(f) { _notifFilter = f; }

  // A single inspection report presented as a deliverable
  // Table row for the reports listview
  function reportRow(r) {
    const score = r.drainage_condition_score;
    const scoreColor = score == null ? 'var(--ink-3)' : score >= 70 ? 'var(--ok)' : score >= 40 ? 'var(--warn)' : 'var(--alert)';
    const risk = r.flood_risk_level;
    const riskKind = risk === 'high' || risk === 'critical' ? 'alert' : risk === 'moderate' || risk === 'medium' ? 'warn' : 'ok';
    const isReady = (r.status === 'sent' || r.status === 'approved' || r.status === 'completed' || r.sent_to_client_at);
    return `<tr>
      <td data-label="Report"><b>${UI.esc(r.title || 'Inspection report')}</b></td>
      <td class="muted" data-label="Property">${UI.esc(r.property_name || r.property_id || '—')}</td>
      <td class="muted" data-label="Date">${UI.fmtDate(r.sent_to_client_at || r.created_at)}</td>
      <td data-label="Score"><b style="color:${scoreColor}">${score != null ? score + '/100' : '—'}</b></td>
      <td data-label="Flood risk">${risk ? UI.chip(riskKind, cap(String(risk))) : '<span class="muted">—</span>'}</td>
      <td data-label="Status">${isReady ? UI.chip('ok', 'Ready') : UI.chip('warn', cap(r.status || 'In progress'))}</td>
      <td data-label="Download">${isReady
        ? `<button class="btn ghost sm" onclick="App.downloadReport('${UI.esc(r.report_id || '')}')">Download PDF</button>`
        : '<span class="muted">Finalising</span>'}</td>
    </tr>`;
  }


  // shared: fetch precipitation + compute daily flood chance from current health
  async function computeForecastDays(horizon, allProps, vulnerability) {
    let days;
    if (Demo.isOn()) {
      const d = i => new Date(Date.now() + i * 864e5);
      const mm = [2.1, 9.4, 14.2, 4.0, 6.5, 24.5, 33.0, 12.4, 8.1, 3.0, 5.8, 27.6, 38.2, 11.0, 6.5, 2.0];
      days = Array.from({ length: horizon }, (_, i) => ({ date: d(i), mm: mm[i % mm.length], prob: Math.min(95, Math.round(mm[i % mm.length] * 4 + 15)) }));
    } else {
      const cur = resolveActive(allProps);
      const sel = (allProps || []).find(p => p.property_id === cur);
      const p0 = sel && sel.latitude ? sel : ((allProps || []).find(x => x.latitude) || {});
      const lat = p0.latitude || 6.4478, lon = p0.longitude || 3.5476;
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum,precipitation_probability_max&timezone=Africa%2FLagos&forecast_days=${horizon}`);
      const j = await r.json();
      days = j.daily.time.map((t, i) => ({ date: new Date(t), mm: j.daily.precipitation_sum[i] || 0, prob: j.daily.precipitation_probability_max[i] || 0 }));
    }
    return days.map(d => {
      const mmFactor = Math.min(100, d.mm * 4);
      const chance = Math.round(Math.min(96, Math.max(2, vulnerability * 0.4 + mmFactor * 0.45 + d.prob * 0.15)));
      const level = chance >= 65 ? 'high' : chance >= 35 ? 'moderate' : 'low';
      return { ...d, chance, level };
    });
  }
  const FC_COLOR = { low: 'var(--ok)', moderate: 'var(--warn)', high: 'var(--alert)' };
  const FC_WORD = { low: 'Low', moderate: 'Medium', high: 'High' };
  function fcCloud(level) {
    return `<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="${FC_COLOR[level]}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 16.2A4.5 4.5 0 0017.5 8h-1.8A7 7 0 104 14.9"/><path d="M8 18v2M12 19v2M16 18v2"/></svg>`;
  }
  function fcDayCell(r, i) {
    const dn = i === 0 ? 'Today' : r.date.toLocaleDateString('en-GB', { weekday: 'short' });
    return `<div class="fc-cell">
      <b>${dn}</b>
      <span class="muted" style="font-size:12px">${r.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
      ${fcCloud(r.level)}
      <span style="font-weight:600;font-size:13px;color:${FC_COLOR[r.level]}">${FC_WORD[r.level]}</span>
      <b style="font-size:14px">${r.chance}%</b>
    </div>`;
  }
  // overview widget: 14-day risk calendar
  // overview sidebar widget: compact 7-day risk calendar
  async function renderForecastWidget(allProps, health) {
    const el = document.getElementById('ov-weather');
    if (!el) return;
    try {
      const rows = await computeForecastDays(7, allProps, health ? (100 - health.score) : 45);
      const worst = rows.reduce((a, b) => b.chance > a.chance ? b : a, rows[0]);
      el.innerHTML = `
        <div class="panel panel-pad">
          <div class="row-between" style="margin-bottom:12px">
            <h3 style="margin:0">Risk forecast</h3>
            <span class="muted" style="font-size:12px">7-day</span>
          </div>
          <div class="fc-mini">
            ${rows.map((r, i) => `<div class="fc-mini-cell" title="${r.mm ? r.mm.toFixed(1) + 'mm rain' : 'No rain expected'}">
              <span class="fcd">${i === 0 ? 'Now' : r.date.toLocaleDateString('en-GB', { weekday: 'short' }).slice(0, 2)}</span>
              ${fcCloud(r.level).replace('width="30" height="30"', 'width="20" height="20"')}
              <b style="font-size:12px;color:${FC_COLOR[r.level]}">${r.chance}%</b>
            </div>`).join('')}
          </div>
          <div class="row-between" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line)">
            <span class="muted" style="font-size:12px">Peak: ${UI.esc(worst.date.toLocaleDateString('en-GB', { weekday: 'short' }))} · ${worst.chance}%</span>
            <a class="clickable" style="color:var(--brand);font-size:13px;font-weight:600" onclick="App.go('forecast')">Full forecast →</a>
          </div>
        </div>
      `;
    } catch (_) { el.innerHTML = ''; }
  }

  // ---------------- RISK FORECAST ----------------
  let _fcRange = 7; // days; Open-Meteo free forecast caps at 16
  function setFcRange(d) { _fcRange = d; App.go('forecast'); }

  // 48-hour hourly risk curve — color-graded with peak-risk window
  async function hourlyRiskChart(allProps, vulnerability) {
    let hours;
    if (Demo.isOn()) {
      const now = new Date(); now.setMinutes(0, 0, 0);
      hours = Array.from({ length: 48 }, (_, i) => {
        const t = new Date(now.getTime() + i * 3600e3);
        const hr = t.getHours();
        const stormToday = i < 24 && hr >= 15 && hr <= 20;
        const stormTomorrow = i >= 24 && hr >= 12 && hr <= 19;
        const mm = stormTomorrow ? 3.5 + Math.sin((hr - 12) / 7 * Math.PI) * 3.2
                 : stormToday ? 1.6 + Math.sin((hr - 15) / 5 * Math.PI) * 1.4
                 : Math.max(0, Math.sin(i / 9) * 0.9);
        return { t, mm: Math.round(mm * 10) / 10, prob: Math.min(96, Math.round(mm * 20 + 14)) };
      });
    } else {
      const cur = resolveActive(allProps);
      const sel = (allProps || []).find(p => p.property_id === cur);
      const p0 = sel && sel.latitude ? sel : ((allProps || []).find(x => x.latitude) || {});
      const lat = p0.latitude || 6.4478, lon = p0.longitude || 3.5476;
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation,precipitation_probability&timezone=Africa%2FLagos&forecast_hours=48`);
      const j = await r.json();
      hours = j.hourly.time.map((t, i) => ({ t: new Date(t), mm: j.hourly.precipitation[i] || 0, prob: j.hourly.precipitation_probability[i] || 0 }));
    }
    const pts = hours.map(hh => {
      const mmFactor = Math.min(100, hh.mm * 18);
      const chance = Math.round(Math.min(96, Math.max(2, vulnerability * 0.4 + mmFactor * 0.45 + hh.prob * 0.15)));
      return { ...hh, chance, level: chance >= 65 ? 'high' : chance >= 35 ? 'moderate' : 'low' };
    });
    const maxC = Math.max(...pts.map(p => p.chance));
    const peakThresh = Math.max(35, maxC - 10);
    let ws = -1, we = -1;
    pts.forEach((p, i) => { if (p.chance >= peakThresh) { if (ws < 0) ws = i; we = i; } });

    const w = 720, h = 250, padL = 40, padR = 14, padT = 40, padB = 30;
    const x = i => padL + (i * (w - padL - padR)) / (pts.length - 1);
    const y = v => padT + (1 - v / 100) * (h - padT - padB);
    const seg = (a2, b2, color) => `<path d="${pts.slice(a2, b2 + 1).map((p, k) => `${k ? 'L' : 'M'}${x(a2 + k).toFixed(1)},${y(p.chance).toFixed(1)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    let segs = '', si = 0;
    for (let i = 1; i <= pts.length; i++) {
      if (i === pts.length || pts[i].level !== pts[si].level) { segs += seg(si, Math.min(i, pts.length - 1), FC_COLOR[pts[si].level]); si = i; }
    }
    const markers = pts.map((p, i) => i % 2 === 0 ? `<circle cx="${x(i).toFixed(1)}" cy="${y(p.chance).toFixed(1)}" r="2.6" fill="${FC_COLOR[p.level]}"/>` : '').join('');
    const area = `M${pts.map((p, i) => `${i ? 'L' : ''}${x(i).toFixed(1)},${y(p.chance).toFixed(1)}`).join(' ')} L${x(pts.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
    const grid = [0, 25, 50, 75, 100].map(g => `<line x1="${padL}" y1="${y(g)}" x2="${w - padR}" y2="${y(g)}" stroke="var(--line)" stroke-width="1"/><text x="${padL - 7}" y="${y(g) + 3.5}" fill="var(--ink-3)" font-size="10.5" text-anchor="end">${g}%</text>`).join('');
    const xlabels = pts.map((p, i) => {
      const hr = p.t.getHours();
      if (hr % 6 !== 0) return '';
      const lbl = hr === 0 ? p.t.toLocaleDateString('en-GB', { weekday: 'short' }) : `${hr}:00`;
      return `<text x="${x(i).toFixed(1)}" y="${h - 8}" fill="var(--ink-3)" font-size="10.5" text-anchor="middle" ${hr === 0 ? 'font-weight="600"' : ''}>${lbl}</text>`;
    }).join('');
    const windowLbl = ws >= 0 ? `${pts[ws].t.getHours()}:00 – ${pts[Math.min(we + 1, pts.length - 1)].t.getHours()}:00` : '';
    const windowBand = ws >= 0 && we > ws ? `
      <rect x="${x(ws)}" y="${y(100)}" width="${(x(we) - x(ws)).toFixed(1)}" height="${(y(0) - y(100)).toFixed(1)}" fill="var(--alert)" fill-opacity=".06"/>
      <line x1="${x(ws)}" y1="${y(100)}" x2="${x(ws)}" y2="${y(0)}" stroke="var(--alert)" stroke-width="1" stroke-dasharray="4 3" opacity=".7"/>
      <line x1="${x(we)}" y1="${y(100)}" x2="${x(we)}" y2="${y(0)}" stroke="var(--alert)" stroke-width="1" stroke-dasharray="4 3" opacity=".7"/>
      <text x="${(x(ws) + x(we)) / 2}" y="${padT - 24}" fill="var(--alert)" font-size="12.5" font-weight="700" text-anchor="middle">Peak risk window</text>
      <text x="${(x(ws) + x(we)) / 2}" y="${padT - 10}" fill="var(--alert)" font-size="11" text-anchor="middle">${windowLbl}</text>` : '';
    const peakDayLbl = ws >= 0 ? pts[ws].t.toLocaleDateString('en-GB', { weekday: 'long' }) : '';
    const totRain = ws >= 0 ? Math.round(pts.slice(ws, we + 1).reduce((sm, p) => sm + p.mm, 0)) : 0;
    const insight = maxC >= 35
      ? `Risk peaks <b>${peakDayLbl} ${windowLbl}</b> (${maxC}%) — ~${totRain}mm expected in that window against your current drainage health.`
      : `No significant risk build-up in the next 48 hours — rainfall stays light against your current drainage health.`;
    const legend = ['low', 'moderate', 'high'].map(l => `<span><i style="display:inline-block;width:14px;height:3px;background:${FC_COLOR[l]};border-radius:2px;vertical-align:middle;margin-right:5px"></i>${FC_WORD[l]} ${l === 'low' ? '(0–34%)' : l === 'moderate' ? '(35–64%)' : '(65%+)'}</span>`).join('');
    return `
      <div class="panel panel-pad mb-20">
        <div class="row-between mb-10"><h3 style="margin:0">Next 48 hours</h3><span class="muted" style="font-size:12px">Hourly flood chance</span></div>
        <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto" role="img" aria-label="Hourly flood risk, next 48 hours">
          ${grid}${windowBand}
          <defs><linearGradient id="fcarea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="var(--warn)" stop-opacity=".14"/><stop offset="1" stop-color="var(--ok)" stop-opacity=".04"/>
          </linearGradient></defs>
          <path d="${area}" fill="url(#fcarea)"/>
          ${segs}${markers}${xlabels}
        </svg>
        <div style="display:flex;gap:16px;margin-top:6px;font-size:11px;color:var(--ink-3);flex-wrap:wrap">${legend}</div>
        <div style="margin-top:12px;padding:12px 14px;border-radius:12px;background:var(--surface-2);font-size:13px;color:var(--ink-2);line-height:1.5">${insight}</div>
      </div>`;
  }

  async function forecast(view) {
    const allProps = await getMyProperties();
    view.innerHTML = `
      <div class="top"><div><h1>Risk forecast</h1><div class="sub">Prediction of flooding risk across your property</div></div>
      <span style="display:flex;gap:6px">
        ${[7, 14, 30].map(d => `<button class="chip ${_fcRange === d ? 'ok' : ''} clickable-outline" onclick="App.setFcRange(${d})">${d}d</button>`).join('')}
      </span></div>
      ${demoBanner()}
      <div id="fc-body">${UI.loading(2)}</div>`;

    // inputs under the current property scope
    let risk, alerts, reports, sensors;
    if (Demo.isOn()) {
      risk = Demo.data.floodRisk;
      alerts = scopeToProperty(Demo.data.alerts, allProps);
      reports = scopeToProperty(Demo.data.reports, allProps);
      sensors = scopeToProperty(Demo.data.sensors, allProps);
    } else {
      try { const r = await apiRequest('/monitoring/flood-risk'); risk = r && r.data; } catch (_) { risk = null; }
      try { const r = await apiRequest('/alerts'); alerts = scopeToProperty((r && r.data) || [], allProps); } catch (_) { alerts = []; }
      try { const r = await apiRequest('/field-reports?limit=20'); reports = scopeToProperty((r && r.data) || [], allProps); } catch (_) { reports = []; }
      try { const r = await apiRequest('/monitoring/sensors'); sensors = scopeToProperty((r && r.data) || [], allProps); } catch (_) { sensors = []; }
    }
    const health = computeHealth(reports, risk, alerts);
    const vulnerability = health ? (100 - health.score) : 45;
    const horizon = Math.min(_fcRange, 16);

    let rows;
    try { rows = await computeForecastDays(horizon, allProps, vulnerability); }
    catch (_) {
      document.getElementById('fc-body').innerHTML = UI.state('error', "Couldn't load the weather forecast", 'Please check your connection and try again.', 'Retry', "onclick=\"App.go('forecast')\"");
      return;
    }
    const today = rows[0];
    const worst = rows.reduce((x, y) => y.chance > x.chance ? y : x, rows[0]);
    const dayLbl = d => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

    // contributing factors (real, from data we hold)
    const latestRep = (reports || []).find(r => r.drainage_condition_score != null);
    const repScore = latestRep ? Number(latestRep.drainage_condition_score) : null;
    const withSilt = (sensors || []).filter(x => x.silt_level != null);
    const maxSilt = withSilt.length ? Math.max(...withSilt.map(x => x.silt_level)) : null;
    const online = (sensors || []).filter(x => x.status === 'active').length;
    const total = (sensors || []).length;
    const openAlerts = (alerts || []).filter(a => a.status === 'active').length;
    const factorChip = (v, warnAt, alertAt, invert) => {
      if (v == null) return UI.chip('ok', '—');
      const bad = invert ? v <= alertAt : v >= alertAt;
      const mid = invert ? v <= warnAt : v >= warnAt;
      return UI.chip(bad ? 'alert' : mid ? 'warn' : 'ok', bad ? 'High' : mid ? 'Medium' : 'Low');
    };
    const factors = [
      ['Rainfall intensity', `${Math.round(today.mm)}mm next 24h`, factorChip(today.mm, 5, 20)],
      ['Drainage capacity', repScore != null ? `Condition ${repScore}/100` : 'No report yet', repScore == null ? UI.chip('ok', '—') : UI.chip(repScore >= 70 ? 'ok' : repScore >= 50 ? 'warn' : 'alert', repScore >= 70 ? 'Good' : repScore >= 50 ? 'Medium' : 'Poor')],
      ['Silt level', maxSilt != null ? `Peak ${maxSilt}% across nodes` : 'No node data', factorChip(maxSilt, 40, 70)],
      ['Node network', total ? `${online} of ${total} reporting` : 'No nodes yet', total ? UI.chip(online === total ? 'ok' : online / total >= .75 ? 'warn' : 'alert', online === total ? 'Healthy' : 'Degraded') : UI.chip('ok', '—')],
      ['Open alerts', `${openAlerts} active`, factorChip(openAlerts, 2, 4)],
    ];

    // rule-based recommendations from the same signals
    const recs = [];
    if (maxSilt != null && maxSilt >= 70) recs.push({ t: 'Schedule silt clearing', d: `Peak silt at ${maxSilt}% — clearing before the next heavy rain directly lowers your risk curve.`, cta: ['Request dispatch', `App.openTicket('dispatch','Silt clearing request','high')`] });
    if (total && online < total) recs.push({ t: 'Restore offline node', d: `${total - online} node${total - online > 1 ? 's' : ''} not reporting — blind spots reduce forecast accuracy.`, cta: ['Contact support', `App.openTicket('sensor','Offline node — field visit request','high')`] });
    const lowEnzyme = (sensors || []).find(x => x.enzyme && x.enzyme.level_percent != null && x.enzyme.level_percent <= 15);
    if (lowEnzyme) recs.push({ t: 'Refill bio-enzyme cartridge', d: `${lowEnzyme.name} is at ${lowEnzyme.enzyme.level_percent}% — treatment lapses raise blockage risk.`, cta: ['Request refill', `App.openTicket('dispatch','Bio-enzyme cartridge refill request','normal')`] });
    if (worst.level === 'high') recs.push({ t: `Prepare for ${dayLbl(worst.date)}`, d: `Peak risk ${worst.chance}% with ~${Math.round(worst.mm)}mm expected. Clear surface drains of debris and keep access routes open.`, cta: null });
    if (!recs.length) recs.push({ t: 'No action needed', d: 'Your drainage is in good shape for the forecast window. We\'ll flag anything that changes.', cta: null });

    const kpi = (label, valueHtml, sub) => `<div class="card statcard"><div class="lbl">${label}</div><div style="font-family:var(--ff-d);font-size:22px;font-weight:600;margin:6px 0 2px">${valueHtml}</div><div class="sub">${sub}</div></div>`;

    document.getElementById('fc-body').innerHTML = `
      <div class="kpi-row">
        ${kpi('Overall risk today', `<span style="color:${FC_COLOR[today.level]}">${FC_WORD[today.level]}</span>`, `${today.chance}% flood chance`)}
        ${kpi('Rainfall forecast (24h)', `${Math.round(today.mm)}<span style="font-size:14px;color:var(--ink-3);margin-left:3px">mm</span>`, `${today.prob}% chance of rain`)}
        ${kpi('Peak risk window', dayLbl(worst.date), `<span style="color:${FC_COLOR[worst.level]};font-weight:600">${worst.chance}% · ${FC_WORD[worst.level]} risk</span>`)}
        ${kpi('Drainage health', health ? `${health.score}<span style="font-size:14px;color:var(--ink-3);margin-left:3px">/100</span>` : '—', health ? 'Powers this forecast' : 'Assuming mid vulnerability')}
      </div>

      <div class="panel panel-pad mb-20">
        <div class="row-between mb-10"><h3 style="margin:0">${horizon}-day risk outlook</h3><span class="muted">${_fcRange > 16 ? '16-day forecast horizon (max reliable)' : 'Daily flood chance'}</span></div>
        <div class="fc-grid">${rows.map(fcDayCell).join('')}</div>
      </div>

      <div id="fc-hourly"></div>

      <div class="cols">
        <div class="panel panel-pad">
          <h3 style="margin:0 0 14px">Contributing factors</h3>
          ${factors.map(([k, v, chip]) => `<div class="row-between" style="padding:11px 0;border-bottom:1px solid var(--line)"><div><b style="font-size:13px">${k}</b><div class="muted" style="margin-top:1px">${v}</div></div>${chip}</div>`).join('')}
        </div>
        <div class="panel panel-pad">
          <h3 style="margin:0 0 14px">Recommendations</h3>
          ${recs.map(r => `<div style="padding:11px 0;border-bottom:1px solid var(--line)"><b style="font-size:13px">${r.t}</b><div class="muted" style="margin:3px 0 8px;line-height:1.5">${r.d}</div>${r.cta ? `<button class="btn sm" onclick="${r.cta[1]}">${r.cta[0]}</button>` : ''}</div>`).join('')}
        </div>
      </div>
      <p class="muted" style="margin-top:14px">How this works: each day blends your drainage health (40%), forecast rainfall volume (45%), and rain probability (15%). Forecast data: Open-Meteo, updated hourly. Improving your drainage score lowers every day's risk.</p>`;
    try { document.getElementById('fc-hourly').innerHTML = await hourlyRiskChart(allProps, vulnerability); } catch (_) {}
  }

  // ---------------- REPORTS & DOCUMENTS ----------------
  async function reports(view) {
    const allProps = await getMyProperties();
    view.innerHTML = `
      <div class="top"><div><h1>Reports &amp; documents</h1><div class="sub">Your inspection reports and drainage assessments — findings, scores, and recommendations</div></div></div>
      ${demoBanner()}
      <div id="rep-list">${UI.loading(3)}</div>`;
    let items;
    if (Demo.isOn()) items = scopeToProperty(Demo.data.reports, allProps);
    else { try { const r = await apiRequest('/field-reports?limit=100'); items = scopeToProperty((r && r.data) || [], allProps); } catch (_) { items = null; } }
    const el = document.getElementById('rep-list');
    if (items === null) {
      el.innerHTML = UI.state('error', "Couldn't load your reports", 'Please check your connection and try again.', 'Retry', "onclick=\"App.go('reports')\"");
    } else if (items && items.length) {
      el.innerHTML = `
        <div class="card tbl-wrap">
          <table class="tbl">
            <thead><tr><th>Report</th><th>Property</th><th>Date</th><th>Score</th><th>Flood risk</th><th>Status</th><th style="width:150px"></th></tr></thead>
            <tbody>${items.map(reportRow).join('')}</tbody>
          </table>
        </div>`;
    } else {
      el.className = '';
      el.innerHTML = UI.state('empty', 'No reports yet',
        'When FlowGuard completes an inspection or sends you a document, it will appear here for you to review and download.');
    }
  }

  // ---------------- SENSOR DETAIL (drill-down + time range) ----------------
  let _sensorRange = 24;
  async function sensorDetail(view, sensorId) {
    view.innerHTML = `
      <div class="top"><div>
        <div class="crumb" onclick="App.go('monitoring')">← Monitoring</div>
        <h1 id="sd-name">Loading…</h1><div class="sub" id="sd-sub"></div>
      </div>
      <div style="display:flex;gap:6px">
        ${[['24h', 24], ['7d', 168], ['30d', 720]].map(([lbl, h]) =>
          `<button class="chip ${_sensorRange === h ? 'ok' : ''} clickable-outline" onclick="App.setSensorRange(${h},'${UI.esc(sensorId)}')">${lbl}</button>`).join('')}
      </div></div>
      ${demoBanner()}
      <div id="sd-body">${UI.loading(3)}</div>`;

    let d;
    if (Demo.isOn()) {
      const s = Demo.data.sensors.find(x => x.sensor_id === sensorId) || Demo.data.sensors[0];
      const pts = _sensorRange <= 24 ? 24 : _sensorRange <= 168 ? 28 : 30;
      const now = Date.now(), span = _sensorRange * 3600e3;
      d = { ...s, series: Array.from({ length: pts }, (_, i) => {
        const base = (s.level || 30) + Math.sin(i / 3) * 12;
        return { t: new Date(now - (pts - 1 - i) * (span / pts)).toISOString(), avg: Math.max(5, Math.round(base)), peak: Math.round(base + 8), flow: +(8 + Math.random() * 10).toFixed(1) };
      }) };
    } else {
      try { const r = await apiRequest(`/monitoring/sensor/${sensorId}?hours=${_sensorRange}`); d = r && r.data; }
      catch (e) { document.getElementById('sd-body').innerHTML = UI.state('error', 'Could not load sensor', e.message || 'Please try again.'); return; }
    }
    if (!d) { document.getElementById('sd-body').innerHTML = UI.state('error', 'Sensor not found', ''); return; }

    document.getElementById('sd-name').textContent = d.name || d.sensor_id;
    document.getElementById('sd-sub').textContent = `${d.zone ? cap(d.zone) + ' zone' : ''}${d.device_variant === 'bio_dispenser' ? ' · Bio-enzyme dispenser' : ' · Standard sensor'} · ${d.status === 'active' ? 'Live' : 'Offline'}`;

    const rangeLabel = _sensorRange === 24 ? 'last 24 hours' : _sensorRange === 168 ? 'last 7 days' : 'last 30 days';
    const battPct = d.battery_percent != null ? d.battery_percent : (d.battery_voltage != null ? Math.round((d.battery_voltage / 4.2) * 100) : null);
    const battColor = battPct == null ? 'var(--ink-3)' : battPct >= 40 ? 'var(--ok)' : battPct >= 20 ? 'var(--warn)' : 'var(--alert)';
    const sig = d.signal_strength;
    const sigLabel = sig == null ? '—' : sig >= 70 ? 'Strong' : sig >= 40 ? 'Fair' : 'Weak';
    const silt = d.silt_level;
    const siltLabel = silt == null ? '—' : silt >= 70 ? 'High' : silt >= 40 ? 'Moderate' : 'Low';
    const siltColor = silt == null ? 'var(--ink-3)' : silt >= 70 ? 'var(--alert)' : silt >= 40 ? 'var(--warn)' : 'var(--ok)';
    const q = str => String(str == null ? '' : str).replace(/['"\\\n]/g, ' ').replace(/\s+/g, ' ').trim();
    const reportDesc = `Regarding ${d.name || d.sensor_id} (${d.sensor_id}) — status ${d.status}, level ${d.level != null ? Math.round(d.level) + '%' : 'n/a'}, battery ${battPct != null ? battPct + '%' : 'n/a'}. Please advise.`;
    const healthRows = [
      ['Battery', battPct != null ? `${battPct}%${d.battery_voltage ? ` (${d.battery_voltage}V)` : ''}` : '—', battColor],
      ['Signal strength', sig != null ? `${sigLabel}${sig != null ? ` (${sig}%)` : ''}` : '—', 'var(--ink)'],
      ['Silt level', silt != null ? `${siltLabel} (${silt}%)` : '—', siltColor],
      ['Temperature', d.temperature != null ? `${d.temperature}°C` : '—', 'var(--ink)'],
      ['Last ping', d.last_ping ? UI.fmtRelative(d.last_ping) : '—', 'var(--ink)'],
      ['Ping interval', d.ping_interval || d.ping_rate || 'Every 15 min', 'var(--ink)'],
    ];

    document.getElementById('sd-body').innerHTML = `
      <div class="grid-3 mb-20">
        ${UI.stat('Current level', `<span style="color:${d.level == null ? 'var(--ink)' : d.level >= 70 ? 'var(--alert)' : d.level >= 50 ? 'var(--warn)' : 'var(--ink)'}">${d.level != null ? Math.round(d.level) : '—'}<span style="font-size:16px;margin-left:3px">%</span></span>`, 'Water level · alert at 70%')}
        ${UI.stat('Flow rate', d.flow_rate != null ? d.flow_rate + ' L/s' : '—', 'Current')}
        ${UI.stat('Status', `<span style="font-size:18px;color:${d.status === 'active' ? 'var(--ok)' : d.status === 'offline' ? 'var(--alert)' : 'var(--ink)'}">${d.status === 'active' ? 'Online' : d.status === 'offline' ? 'Offline' : 'Idle'}</span>`, d.device_variant === 'bio_dispenser' ? 'Bio-dispenser' : 'Standard')}
      </div>

      <div class="panel panel-pad mb-20">
        <div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 12px;gap:10px">
          <h3 style="font-family:var(--ff-d);font-size:16px;margin:0">Device health</h3>
          <button class="btn ghost sm" onclick="App.openTicket('sensor','${q('Issue with ' + (d.name || d.sensor_id))}','${d.status === 'offline' || (d.level != null && d.level >= 70) ? 'high' : 'normal'}','${q(reportDesc)}')">Report an issue</button>
        </div>
        <div class="profile-grid">
          ${healthRows.map(([k, v, c]) => `<div class="pf-row"><div class="pf-k">${k}</div><div class="pf-v" style="color:${c}">${v}</div></div>`).join('')}
        </div>
      </div>
      ${d.enzyme ? `<div class="panel panel-pad mb-20">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <h3 style="font-family:var(--ff-d);font-size:16px;margin:0">Bio-enzyme cartridge</h3>
          ${['due_replacement', 'depleted', 'low'].includes(d.enzyme.status)
            ? `<button class="btn" onclick="App.openTicket('dispatch','${q('Cartridge refill: ' + (d.name || d.sensor_id))}','normal','${q('The bio-enzyme cartridge on ' + (d.name || d.sensor_id) + ' (' + d.sensor_id + ') needs replacement. Please schedule a refill.')}')">Request refill</button>` : ''}
        </div>
        ${UI.enzymeDetail(d.enzyme)}
      </div>` : ''}
      <div class="panel panel-pad">
        <h3 style="font-family:var(--ff-d);font-size:16px;margin-bottom:4px">Water level trend</h3>
        <p style="color:var(--ink-3);font-size:12px;margin-bottom:16px">${rangeLabel}</p>
        ${UI.lineChart(d.series || [], { threshold: { v: 70, label: 'Alert' } })}
      </div>`;
  }
  function setSensorRange(h, sensorId) { _sensorRange = h; }

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
        <button class="chip ${_ticketFilter === 'all' ? 'ok' : ''} clickable-outline" onclick="App.setTicketFilter('all')">All</button>
        <button class="chip ${_ticketFilter === 'open' ? 'ok' : ''} clickable-outline" onclick="App.setTicketFilter('open')">Open</button>
        <button class="chip ${_ticketFilter === 'resolved' ? 'ok' : ''} clickable-outline" onclick="App.setTicketFilter('resolved')">Resolved</button>
      </div>
      <div class="card panel-pad" id="tk-list">${UI.loading(3)}</div>`;

    let items;
    if (Demo.isOn()) items = Demo.data.tickets;
    else {
      try { const r = await apiRequest('/tickets'); items = (r && r.data) || []; }
      catch (_) {
        const el0 = document.getElementById('tk-list');
        if (el0) { el0.className = ''; el0.innerHTML = UI.state('error', "Couldn't load your tickets", 'Please check your connection and try again.', 'Retry', "onclick=\"App.go('support')\""); }
        return;
      }
    }

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
    return `<div class="row clickable" onclick="App.openTicketDetail('${UI.esc(t.ticket_id)}')">
      <div class="rmain">
        <b>${UI.esc(t.subject || t.title || 'Support request')}</b>
        <small>${UI.esc(TICKET_CATS[t.category] || t.category || 'General')} · ${UI.esc(t.ticket_id || '')} · ${UI.fmtDate(t.created_at)}</small>
      </div>
      <div class="rright" style="display:flex;gap:8px;align-items:center">${prio}${UI.chip(sk, sl)}<span style="color:var(--brand);font-size:13px;font-weight:600">View →</span></div>
    </div>`;
  }
  function setTicketFilter(f) { _ticketFilter = f; }

  // ---------------- TICKET DETAIL ----------------
  async function ticketDetail(view, ticketId) {
    view.innerHTML = `
      <div class="top"><div>
        <div class="crumb" onclick="App.go('support')">← Support</div>
        <h1 id="td-subj">Loading…</h1><div class="sub" id="td-meta"></div>
      </div><button class="btn ghost" onclick="App.go('support')">Back</button></div>
      ${demoBanner()}
      <div id="td-body">${UI.loading(3)}</div>`;

    let t;
    if (Demo.isOn()) {
      t = Demo.data.tickets.find(x => x.ticket_id === ticketId) || Demo.data.tickets[0];
      t = { ...t, messages: t.messages || [
        { author_type: 'client', author_name: 'You', message: t.description || 'Initial request.', created_at: t.created_at },
        { author_type: 'support', author_name: 'FlowGuard Support', message: 'Thanks for reaching out — our team is reviewing this and will update you shortly.', created_at: t.created_at }
      ] };
    } else {
      try { const r = await apiRequest(`/tickets/${ticketId}`); t = r && r.data; }
      catch (e) { document.getElementById('td-body').innerHTML = UI.state('error', 'Could not load ticket', e.message || ''); return; }
    }
    if (!t) { document.getElementById('td-body').innerHTML = UI.state('error', 'Ticket not found', ''); return; }

    const statusMap = { new: ['warn', 'New'], open: ['warn', 'Open'], in_progress: ['warn', 'In progress'], resolved: ['ok', 'Resolved'], closed: ['ok', 'Closed'] };
    const [sk, sl] = statusMap[t.status] || ['warn', cap(t.status || 'Open')];
    document.getElementById('td-subj').textContent = t.subject || t.title || 'Support request';
    document.getElementById('td-meta').innerHTML = `${UI.esc(t.ticket_id || '')} · ${UI.esc(TICKET_CATS[t.category] || t.category || 'General')} · opened ${UI.fmtDate(t.created_at)}`;

    const msgs = t.messages || [];
    document.getElementById('td-body').innerHTML = `
      <div class="grid-3 mb-20">
        ${UI.stat('Status', `<span style="font-size:16px">${sl}</span>`, 'Current')}
        ${UI.stat('Priority', `<span style="font-size:16px">${cap(t.priority || 'Normal')}</span>`, '')}
        ${UI.stat('Category', `<span style="font-size:16px">${UI.esc(TICKET_CATS[t.category] || t.category || 'General')}</span>`, '')}
      </div>
      <div class="panel panel-pad">
        <h3 style="font-family:var(--ff-d);font-size:16px;margin-bottom:16px">Conversation</h3>
        <div class="thread" id="td-thread">
          ${msgs.length ? msgs.map(threadMsg).join('') : `<p class="muted">No messages yet.</p>`}
        </div>
        ${['resolved', 'closed'].includes(t.status) ? '' : `
        <div class="reply-box">
          <textarea id="td-reply" rows="3" placeholder="Add a reply…"></textarea>
          <button class="btn" onclick="App.sendReply('${UI.esc(t.ticket_id)}', this)">Send reply</button>
        </div>`}
      </div>`;
  }

  function threadMsg(m) {
    const mine = m.author_type === 'client';
    const sys = m.author_type === 'system';
    if (sys) return `<div class="thread-sys">${UI.esc(m.message)} · ${UI.fmtDate(m.created_at)}</div>`;
    return `<div class="thread-msg ${mine ? 'mine' : 'them'}">
      <div class="thread-h"><b>${UI.esc(m.author_name || (mine ? 'You' : 'Support'))}</b><span>${UI.fmtTime(m.created_at)}</span></div>
      <div class="thread-b">${UI.esc(m.message)}</div>
    </div>`;
  }

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
          <button class="btn ghost" style="width:100%;margin-bottom:8px;justify-content:flex-start" onclick="Auth.logout()">Sign out</button>
          <button class="btn ghost" style="width:100%;justify-content:flex-start;color:var(--alert)" onclick="App.deactivateAccount()">Deactivate account</button>
        </div>
      </div>`;
  }

  return { overview, monitoring, forecast, getMyProperties, propertySelector, sensorDetail, properties, propertyDetail, billing, alerts, notifications, reports, support, ticketDetail, settings, account, setNotifFilter, setTicketFilter, setFcRange, setSensorRange, monSearch, monFilter, monMetric, TICKET_CATS };
})();
window.Screens = Screens;
