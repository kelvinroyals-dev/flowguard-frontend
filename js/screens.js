/* ============================================================
   FlowGuard Portal v2 — Screens
   Each screen: async render(view). Fetches real data via apiRequest;
   when Demo.isOn() falls back to sample data; else honest empty/awaiting.
   ============================================================ */
const Screens = (function () {

  const icons = {
    check: '<path d="M20 6L9 17l-5-5"/>',
    warn: '<path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M10 20a2 2 0 0 0 4 0M12 2V1" stroke-linecap="round"/>',
    sensor: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    doc: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/>',
    drop: '<path d="M12 2.7s6 6.3 6 10.3a6 6 0 01-12 0c0-4 6-10.3 6-10.3z"/>',
    truck: '<path d="M1 3h15v13H1zM16 8h4l3 3v5h-7M5.5 18.5a2 2 0 100-4 2 2 0 000 4zM18.5 18.5a2 2 0 100-4 2 2 0 000 4z"/>'
  };

  function demoBanner() {
    if(window.PortalPreview)return '';
    if (!Demo.isOn()) return '';
    return `<div class="demo-banner">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
      <span><b>Demo mode</b> — showing sample data to explore the portal.</span>
      ${window.PortalPreview ? '<span>Local review</span>' : '<button onclick="App.toggleDemo(false)">Turn off</button>'}
    </div>`;
  }

  // ---------------- OVERVIEW (adaptive home) ----------------
  // ---- property scope: cache, selector control, filter ----
  let _propsCache = null, _propsCacheAt = 0;
  async function getMyProperties() {
    if (Demo.isOn()) return Demo.data.properties;
    if (_propsCache && Date.now() - _propsCacheAt < 60e3) return _propsCache;
    try { const r = await apiRequest('/properties'); _propsCache = (r && r.data) || []; _propsCacheAt = Date.now(); }
    catch (e) { throw new Error('Properties unavailable: '+e.message); }
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
    return PortalModel.scope(items,props,resolveActive(props));
  }

  // ---- Property health score: weighted blend of data we already have ----
  // drainage condition (latest report, 50%) + sensor network (30%) + open alerts (20%)
  function computeHealth(reports, risk, alerts) {
    if (!Array.isArray(alerts) || !risk?.has_data || !risk?.sensors_total || !risk.sensors_online) return null;
    const latest = (reports || []).slice().sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).find(r => r.drainage_condition_score != null);
    const rep = latest ? Number(latest.drainage_condition_score) : null;
    if(rep==null)return null;
    const sens = (risk && risk.sensors_total) ? Math.round((risk.sensors_online / risk.sensors_total) * 100) : null;
    const openAlerts = (alerts || []).filter(a=>PortalModel.active(a)&&!['info','informational'].includes(a.severity||a.type)).length;
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

  // ---- Seasonal readiness (Lagos: rains Apr–Jul, second peak Sep–Oct) ----
  function renderSeasonal(document=window.document) {
    const el = document.getElementById('ov-season');
    if (!el) return;
    const m = new Date().getMonth() + 1; // 1-12
    let title = null, body = '';
    if (m === 3 || m === 8) {
      title = 'Rainy season is approaching';
      body = 'Lagos rains typically intensify next month. A pre-season inspection catches silt buildup and blockages before they become flooding.';
    } else if ((m >= 4 && m <= 7) || m === 9 || m === 10) {
      title = 'Rainy season readiness';
      body = 'Peak rainfall period is here. Check monitoring coverage. If you\'ve noticed slow drainage or pooling, request an inspection.';
    }
    if (!title) { el.innerHTML = ''; return; }
    el.innerHTML = `
      <div class="season-strip">
        <div class="minw0">
          <b>${title}</b>
          <p>${body}</p>
        </div>
        <button class="btn sm" style="flex-shrink:0" onclick="App.openTicket('general','Pre-rain readiness inspection request','normal')">Request readiness check</button>
      </div>`;
  }

  // ---- Outcomes: the value narrative (what FlowGuard has done for this property) ----
  function outcomesBlock(o, p) {
    if(!o?.records?.length)return '';
    return '<section class="panel panel-pad"><h3>Recorded provider activity</h3><p>Provider-reported work; not evidence of incidents prevented.</p>'+o.records.map(r=>'<p><a href="#service-request/'+encodeURIComponent(r.service_request_id)+'">'+UI.esc(r.label)+'</a> · '+UI.fmtDate(r.occurred_at)+'</p>').join('')+'</section>';
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
    const band = (top, bot, c, lbl) => `<rect x="${padL}" y="${y(top)}" width="${w - padL - padR}" height="${(y(Math.max(bot, min)) - y(top)).toFixed(1)}" fill="${c}" fill-opacity="0"/><text x="${w - padR + 6}" y="${y((top + Math.max(bot, min)) / 2) + 3}" fill="${c}" font-size="10">${lbl}</text>`;
    const bands = band(100, 75, 'var(--ok)', 'Good') + band(75, 50, 'var(--warn)', 'Fair') + (min < 50 ? band(50, min, 'var(--alert)', 'Poor') : '');
    // y gridlines
    const grid = [50, 75].filter(g => g > min).map(g => `<line x1="${padL}" y1="${y(g)}" x2="${w - padR}" y2="${y(g)}" stroke="var(--line)" stroke-width="1" stroke-dasharray="2 3"/><text x="${padL - 5}" y="${y(g) + 3}" fill="var(--ink-3)" font-size="10" text-anchor="end">${g}</text>`).join('');
    // event markers (recorded provider work) pinned to their dates
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
          <h3 style="margin:0">Site status history</h3>
          <span style="font-weight:600;font-size:13px;color:${delta >= 0 ? 'var(--ok)' : 'var(--alert)'}">${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)} pts · 90 days</span>
        </div>
        <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto" role="img" aria-label="Combined site status history">
          ${bands}${grid}
          <path d="${path} L${x(vals.length - 1).toFixed(1)},${y(min)} L${x(0).toFixed(1)},${y(min)} Z" fill="${color}" fill-opacity="0"/>
          <path d="${path}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
          ${markers}
          <circle cx="${x(vals.length - 1)}" cy="${y(last)}" r="4.5" fill="${color}" stroke="var(--surface)" stroke-width="2"/>
          <text x="${padL}" y="${h - 6}" fill="var(--ink-3)" font-size="10">${startLbl}</text>
          <text x="${(padL + w - padR) / 2}" y="${h - 6}" fill="var(--ink-3)" font-size="10" text-anchor="middle">${midLbl}</text>
          <text x="${w - padR}" y="${h - 6}" fill="var(--ink-3)" font-size="10" text-anchor="end">${endLbl}</text>
        </svg>
        <div class="row-between" style="margin-top:4px">
          <span class="muted" style="font-size:12px">${events?.length?'Markers identify recorded events, not proven causes of score changes.':'No linked work events supplied.'}</span>
          <b style="font-size:13px;color:${color}">Now: ${last}/100</b>
        </div>
      </div>`;
  }

  function zoneContextBlock(p) {
    if(!p.zone_context?.source||!p.zone_context?.assessed_at)return '';
    return '<section class="panel panel-pad"><h3>Regional flood context</h3><p>'+UI.esc(p.zone_context.summary)+'</p><p class="muted">'+UI.esc(p.zone_context.source)+' · '+UI.fmtDate(p.zone_context.assessed_at)+'</p></section>';
  }

  async function overview(view) {
    const document=UI.scopedDocument(view);
    const allProps = await getMyProperties();
    view.innerHTML = `
      <div class="top" hidden></div>
      ${demoBanner()}
      <section class="property-heading"><div><span class="home-eyebrow">YOUR PROPERTY, AT A GLANCE</span><h2 id="ov-property-name">Your property</h2></div><a class="portal-text-link" href="#support">Talk to us →</a></section>
      <div class="home-focus"><div id="ov-kpis"></div></div>
      <div id="ov-attention"></div>
      <div id="ov-journey" hidden></div>
      <div id="ov-season" hidden></div>
      <div class="ov-cols">
        <details class="overview-conditions minw0">
          <summary class="home-details-title"><span>Want to see the readings?<small>Water levels, device updates and technical details</small></span><span class="details-action">Show readings +</span></summary>
          <div id="ov-mon">${UI.loading(2)}</div>
        </details>
        <div class="home-main-stack">
        <section class="overview-services">
          <div class="section-t"><span>Your requests<small>See what is happening, without chasing updates.</small></span><a class="portal-text-link" href="#services">All requests →</a></div>
          <div id="ov-services" class="grid-3"></div>
        </section>
        <div id="ov-bottom"></div>
        </div>
        <div class="home-side-stack">
          <div id="ov-weather"></div>
          <div id="ov-activity"></div>
        </div>
      </div>`;

    // Gather data (real or demo)
    let props, risk, sensors, alerts, reports, notifs = [];
    if (Demo.isOn()) {
      props = Demo.data.properties; risk = Demo.data.floodRisk; sensors = Demo.data.sensors;
      alerts = Demo.data.alerts; reports = Demo.data.reports;
    } else {
      try { const r = await apiRequest('/properties'); props = (r && r.data) || []; } catch(e) { throw new Error('Property data unavailable: '+e.message); }
      try { const r = await apiRequest('/monitoring/flood-risk?property_id='+encodeURIComponent(resolveActive(allProps))); risk = r && r.data; } catch (_) { risk = null; }
      try { const r = await apiRequest('/monitoring/sensors'); sensors = (r && r.data) || []; } catch(e) { throw new Error('Sensors unavailable: '+e.message); }
      try { const r = await apiRequest('/alerts'); alerts = (r && r.data) || []; } catch(e) { throw new Error('Alerts unavailable: '+e.message); }
      try { const r = await apiRequest('/field-reports?limit=5'); reports = (r && r.data) || []; } catch(e) { throw new Error('Reports unavailable: '+e.message); }
      try { const r = await apiRequest('/audit-logs/mine?limit=30'); notifs = (r && r.data) || []; } catch (_) { notifs = []; }
    }

    // ---- scope everything to the selected property ----
    props = scopeToProperty(props, allProps);
    sensors = scopeToProperty(sensors, allProps);
    alerts = scopeToProperty(alerts, allProps);
    reports = scopeToProperty(reports, allProps);
    risk = PortalModel.riskFor(risk,sensors,resolveActive(allProps));

    // ---- Journey hero (adapts to where the customer is) ----
    document.getElementById('ov-property-name').textContent=props[0]?.property_name||props[0]?.name||'Your property';
    if(!['active','monitoring_active'].includes(props[0]?.status)){document.getElementById('ov-journey').hidden=false;renderJourney(props,document);}

    // ---- KPI row (denser, like the old board) ----
    const alertCount = (alerts || []).filter(a=>PortalModel.active(a)&&!['info','informational'].includes(a.severity||a.type)).length;
    const hasRisk=risk?.has_data&&risk.risk_index!=null&&Number.isFinite(Number(risk.risk_index));
    const estateScore=hasRisk?Math.max(0,Math.min(100,Number(risk.risk_index))):null;
    const urgentSensor=PortalModel.prioritySensors(sensors).find(s=>PortalModel.waterState(s)==='high');
    document.getElementById('ov-kpis').innerHTML = `<div class="estate-summary">
      <section class="estate-risk" data-level="${UI.esc(risk?.level||'unknown')}" aria-label="Estate risk score"><div><h3>Estate risk score</h3><div class="estate-score" style="--risk-fill:${estateScore||0}%"><strong>${hasRisk?estateScore:'—'}</strong><span>/100</span><b>${hasRisk?risk.level==='high'?'High risk':risk.level==='moderate'?'Moderate risk':'Low risk':'Awaiting readings'}</b></div><div class="estate-meter" aria-hidden="true"><i style="width:${estateScore||0}%"></i></div></div>${urgentSensor?`<a class="btn risk-priority" href="#sensor/${encodeURIComponent(urgentSensor.sensor_id||urgentSensor.id)}">High water needs a check →</a>`:''}<details class="score-help"><summary>What does this mean?</summary><p>Combines the available readings for this estate. Higher means more concern. It is not a percentage chance of flooding. Always check individual high-water alerts.</p></details></section>
      <section class="summary-metric"><span class="summary-label">Devices reporting</span><strong>${risk?.sensors_total?`${risk.sensors_online}/${risk.sensors_total}`:'—'}</strong><span>${risk?.sensors_total?'Sending monitoring updates':'No devices connected yet'}</span><a class="btn" href="#monitoring">View devices →</a></section>
      <section class="summary-metric" data-tone="${alertCount?'attention':'normal'}"><span class="summary-label">Needs attention</span><strong>${alertCount}</strong><span>${alertCount?'Open alerts to review':'No open alerts recorded'}</span><a class="btn" href="#alerts">View alerts →</a></section>
    </div>`;
    const offline=sensors.filter(s=>s.status==='offline');
    const highWater=sensors.filter(s=>PortalModel.waterState(s)==='high');
    document.getElementById('ov-attention').innerHTML=(highWater.length?`<div class="attention-notice water-alert" role="status"><strong>High water · review now</strong><p>${highWater.map(s=>`<a href="#sensor/${encodeURIComponent(s.sensor_id||s.id)}">${UI.esc(s.name||s.sensor_id)} · ${PortalModel.levelText(s)} ↗</a>`).join(' · ')} — at or above the 70% alert level. View the device to see what needs attention and request help.</p></div>`:'')+(offline.length?`<div class="attention-notice"><strong>Coverage interrupted</strong><p>${offline.map(s=>`<a href="#sensor/${encodeURIComponent(s.sensor_id||s.id)}">${UI.esc(s.name||s.sensor_id)} ↗</a>`).join(' · ')} — no current reading. This is a device-coverage issue, not a water-level measurement.</p></div>`:'');

    renderSeasonal(document);

    // ---- Property health score (computed from data already loaded) ----
    const health = computeHealth(reports, risk, alerts);
    let healthDelta = null, healthPeriod = '', healthLatestScore = null;
    try {
      const cur = resolveActive(allProps);
      let hist = [];
      if (Demo.isOn()) hist = Demo.data.healthHistory.filter(x=>x.property_id===cur);
      else if (cur) { const rh = await apiRequest(`/properties/${cur}/health-history?days=30`); hist = (rh && rh.data) || []; }
      const dated=hist.filter(h=>h.score!=null&&Number.isFinite(Number(h.score))&&Number.isFinite(Date.parse(h.recorded_at))).sort((a,b)=>Date.parse(a.recorded_at)-Date.parse(b.recorded_at));
      if (dated.length >= 2) {
        healthLatestScore=Number(dated.at(-1).score);
        healthDelta = Number(dated.at(-1).score) - Number(dated[0].score);
        healthPeriod=UI.fmtDate(dated[0].recorded_at)+'–'+UI.fmtDate(dated.at(-1).recorded_at);
      }
    } catch (_) {}
    renderForecastWidget(allProps, health,document); // 14-day risk calendar (async, fills #ov-weather)

    // ---- Monitoring section (gauge + sensors together) ----
    const mon = document.getElementById('ov-mon');
    if (risk && risk.has_data) {
      const msg = risk.level === 'low' ? "Current readings below the alert threshold"
        : risk.level === 'moderate' ? 'Review current levels and alerts' : 'Elevated risk index — review recommended';
      const shown = PortalModel.prioritySensors(sensors).slice(0,4);
      mon.innerHTML = `
        <div class="mon-wrap">
          <div class="minw0">
            <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:6px">
              <h3 style="font-family:var(--ff-d);font-size:18px;font-weight:600;margin:0">Latest sensor readings</h3>
              ${health ? `<span class="health-chip ${health.kind}" title="Drainage ${health.rep != null ? health.rep : '—'} · Sensors ${health.sens != null ? health.sens + '%' : '—'} · ${health.openAlerts} open alerts">Site status index ${health.score}/100 · ${health.label}</span>${healthDelta!=null&&healthLatestScore===health.score?`<small class="health-comparison">${healthDelta>=0?'+':''}${healthDelta} points · ${UI.esc(healthPeriod)}</small>`:''}` : ''}
            </div>
            <p class="conditions-note">High water first, then interrupted coverage. Alert threshold: 70%.</p>
            <div class="overview-readings">${shown.map(s=>`<a class="reading-row" data-water-state="${PortalModel.waterState(s)}" href="#sensor/${encodeURIComponent(s.sensor_id||s.id)}"><span><strong>${UI.esc(s.name||s.sensor_id)}</strong><small class="reading-state">${s.status==='offline'?'Offline · no current reading':PortalModel.waterState(s)==='high'?'High water level':PortalModel.waterState(s)==='unavailable'?'Reading unavailable':PortalModel.waterState(s)==='elevated'?'Raised water · below alert threshold':'Low water · below alert threshold'}</small><small>${s.status==='offline'?'Last seen ':'Observed '}${s.last_ping?UI.esc(UI.fmtRelative(s.last_ping)):'time unavailable'}</small></span><b>${PortalModel.levelText(s)}</b><span class="row-open">View →</span></a>`).join('')}</div><a class="btn" href="#monitoring">View all ${sensors.length} devices →</a>
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


    let requestResult;try{requestResult=await apiRequest('/service-requests');}catch(_){requestResult=null;}
    const requests=scopeToProperty(requestResult?.data||[],allProps);
    const serviceSlot=document.getElementById('ov-services');
    serviceSlot.className='';
    const currentRequests=[...requests].sort((a,b)=>Number(['completed','verified','cancelled','declined'].includes(a.work_order_status||a.status))-Number(['completed','verified','cancelled','declined'].includes(b.work_order_status||b.status))||Date.parse(b.created_at)-Date.parse(a.created_at));
    serviceSlot.innerHTML=!requestResult?'<p>Service requests could not be loaded.</p><a class="btn" href="#services">Try again in Services →</a>':requests.length?currentRequests.slice(0,3).map(ClientServices.progressCard).join(''):'<div class="service-empty"><h3>No requests yet</h3><p>Need a drain inspection or device check?</p><a class="btn" href="#services">Explore services →</a></div>';
    // ---- Bottom: recent activity + reports ----
    document.getElementById('ov-activity').innerHTML = `
      <div class="panel panel-pad">
        <div class="row-between" style="margin-bottom:12px">
            <h3 style="margin:0">Updates for you</h3><a class="portal-text-link" href="#alerts">All alerts →</a>
        </div>
        ${(() => { const ev = buildActivity(notifs, alerts); return ev.length ? ev.slice(0, 3).map(activityEvent).join('') : `<p class="muted">No updates yet. We will show your property updates here.</p>`; })()}
      </div>`;
    document.getElementById('ov-bottom').innerHTML = `
      <div class="panel panel-pad">
        <div class="row-between" style="margin-bottom:14px">
          <h3 style="margin:0">Reports &amp; documents</h3>
          <a href="#reports" class="portal-text-link">All reports →</a>
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
          when: a.created_at ? UI.fmtRelative(a.created_at) : (a.when || ''), href:a.link&&a.link.startsWith('#')?a.link:null
        });
      } else {
        ev.push(a); // demo entries come pre-shaped
      }
    });
    // alert-fired events belong in the stream too (the alert itself lives on the Alerts screen)
    (alerts || []).filter(PortalModel.active).forEach(a => ev.push({
      type: 'alert', severity:a.severity||a.type,
      title: `Alert fired: ${a.title}`, sub: a.description, ts: a.created_at,
      when: a.created_at ? UI.fmtRelative(a.created_at) : 'Time unavailable', href:(a.id||a.alert_id)?'#alert/'+encodeURIComponent(a.id||a.alert_id):null
    }));
    // Both preview and server events use real timestamps, newest first.
    if (ev.some(e => e.ts && !isNaN(Date.parse(e.ts)))) {
      ev.sort((x, y) => (Date.parse(y.ts) || 0) - (Date.parse(x.ts) || 0));
    }
    return ev;
  }
  function activityEvent(e) {
    const critical=['critical','high','emergency'].includes(e.severity);
    const attention=['battery','offline'].includes(e.type) || critical;
    const ic = icons[e.type==='alert'&&!critical?'bell':ACT_ICON[e.type] || 'bell'] || icons.bell;
    return `<div class="evt ${attention ? 'attention' : 'neutral-event'}" data-severity="${UI.esc(e.severity||'info')}">
      <div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${ic}</svg></div>
      <div class="event-copy"><b>${UI.esc(e.title.replace(/^Alert fired: /,''))}</b>${e.sub ? `<small>${UI.esc(e.sub)}</small>` : ''}<span class="event-time muted">${UI.esc(e.when)}</span></div>
      ${e.href?`<a class="btn neutral compact-action activity-open" href="${UI.esc(e.href)}">View ${e.type==='alert'?'alert':'update'} →</a>`:''}
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
      { key: 'dispatch', name: 'Provider services', desc: 'Drain inspections, cleaning and repairs', icon: 'truck',
        status: hasActive ? 'active' : 'pending',
        detail: 'Request a provider; attendance needs confirmation' }
    ];
  }

  function kpiCard(label, value, sub, icon, tone='unknown') {
    return `<div class="kpi-c" data-tone="${UI.esc(tone)}">
      <div class="kpi-top"><span class="kl">${UI.esc(label)}</span><span class="kpi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon}</svg></span></div>
      <div class="kn">${value}</div><div class="ks">${UI.esc(sub)}</div>
    </div>`;
  }

  // Journey hero: reads the furthest-along property and shows a stage-appropriate message
  function renderJourney(props,document=window.document) {
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
      submitted: { s: 'progress', b: 'Property submitted', t: `We've received ${p.property_name || 'your property'} and will schedule an inspection soon.`, cta: 'View details', act: `App.openProperty('${UI.jsq(p.property_id)}')` },
      inspection_scheduled: { s: 'progress', b: 'Inspection scheduled', t: p.inspection_date ? `Recorded inspection date: ${UI.fmtDate(p.inspection_date)}. Review your property details for updates.` : `${p.property_name || 'Your property'} is marked for inspection. No confirmed appointment date is supplied.`, cta: 'View details', act: `App.openProperty('${UI.jsq(p.property_id)}')` },
      inspection_ongoing: { s: 'progress', b: 'Inspection underway', t: `Your provider is assessing ${p.property_name || 'your property'} right now.`, cta: 'View details', act: `App.openProperty('${UI.jsq(p.property_id)}')` },
      awaiting_approval: { s: 'progress', b: 'Awaiting approval', t: `The inspection of ${p.property_name || 'your property'} is complete — your report is being reviewed and will be available shortly.`, cta: 'View details', act: `App.openProperty('${UI.jsq(p.property_id)}')` },
      report_ready: { s: 'active', b: 'Your report is ready', t: 'Your inspection report is approved and available to download.', cta: 'View report', act: `App.go('reports')` },
      quote_sent: { s: 'active', b: 'Quote ready', t: `Your service quote for ${p.property_name || 'your property'} is ready to review and accept.`, cta: 'View billing', act: `App.go('billing')` },
      payment_pending: { s: 'progress', b: 'Payment pending', t: 'Complete payment to activate monitoring for your property.', cta: 'View billing', act: `App.go('billing')` },
      payment_completed: { s: 'active', b: 'Payment confirmed', t: 'Thank you — we\'re scheduling the installation of your Sentinel devices.', cta: 'View details', act: `App.openProperty('${UI.jsq(p.property_id)}')` },
      deployment_scheduled: { s: 'progress', b: 'Deployment scheduled', t: `Your Sentinel devices are scheduled for installation at ${p.property_name || 'your property'}.`, cta: 'View details', act: `App.openProperty('${UI.jsq(p.property_id)}')` },
      active: { s: 'active', b: 'Monitoring active', t: `${p.property_name || 'Your property'} is configured for monitoring. Check sensor availability and active alerts.`, cta: 'View monitoring', act: `App.go('monitoring')` },
      monitoring_active: { s: 'active', b: 'Monitoring active', t: `${p.property_name || 'Your property'} is configured for monitoring. Check sensor availability and active alerts.`, cta: 'View monitoring', act: `App.go('monitoring')` },
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
      <div class="dl"><a class="btn" href="#report/${encodeURIComponent(r.report_id||r.id)}" aria-label="View report: ${UI.esc(r.title||r.report_type||'Inspection report')}">View report →</a></div>
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
        when: i===0?UI.fmtDate(p.created_at):'Date not recorded'
      }));
    } catch (_) { return []; }
  }

  // ---------------- MONITORING (sensors + history charts + logs) ----------------
  let _monSearch = '', _monFilter = 'all', _monMetric = 'level';
  let _monSensors = [], _monHist = { series: [], log: [] };

  async function monitoring(view) {
    const document=UI.scopedDocument(view);
    const allProps = await getMyProperties();
    view.innerHTML = `
      <div class="top"><div><h1>Water &amp; devices</h1><div class="sub">See where water is building up and which devices need a check.</div></div>
      </div>
      ${demoBanner()}
      <div class="detail-tabs" role="tablist" aria-label="Monitoring views"><button id="mon-tab-devices" role="tab" aria-selected="true" aria-controls="mon-devices">Devices</button><button id="mon-tab-trends" role="tab" aria-selected="false" aria-controls="mon-trends" tabindex="-1">Monitoring trends</button><button id="mon-tab-history" role="tab" aria-selected="false" aria-controls="mon-history" tabindex="-1">Reading history</button></div><section id="mon-devices" role="tabpanel" aria-labelledby="mon-tab-devices"><div id="mon-notices"></div>
      <div class="mon-controls">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
          <input id="mon-search" placeholder="Search devices…" value="${UI.esc(_monSearch)}" oninput="App.monSearch(this.value)">
        </div>
        <div class="seg" id="mon-filters"></div>
      </div>
      <div id="mon-grid">${UI.loading(1)}</div></section><section id="mon-trends" role="tabpanel" aria-labelledby="mon-tab-trends" hidden>
      <div class="section-t" style="margin-top:26px">Monitoring trends</div>
      <div id="mon-chart">${UI.loading(2)}</div>
      </section><section id="mon-history" role="tabpanel" aria-labelledby="mon-tab-history" hidden><div class="section-t" style="margin-top:26px">Reading history</div>
      <div class="panel panel-pad" id="mon-log"></div></section>`;
    const monitorTabs=[...view.querySelectorAll('[role="tab"]')];
    const activateTab=tab=>{monitorTabs.forEach(t=>{const selected=t===tab;t.setAttribute("aria-selected",String(selected));t.tabIndex=selected?0:-1;view.querySelector("#"+t.getAttribute("aria-controls")).hidden=!selected;});};
    monitorTabs.forEach((tab,i)=>{tab.addEventListener("click",()=>activateTab(tab));tab.addEventListener("keydown",e=>{if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;e.preventDefault();const next=e.key==="Home"?0:e.key==="End"?monitorTabs.length-1:(i+(e.key==="ArrowRight"?1:-1)+monitorTabs.length)%monitorTabs.length;activateTab(monitorTabs[next]);monitorTabs[next].focus();});});

    const _scopeProps = await getMyProperties();
    if (Demo.isOn()) { _monSensors = scopeToProperty(Demo.data.sensors, _scopeProps); _monHist = PortalModel.history(_monSensors); }
    else {
      try { const r = await apiRequest('/monitoring/sensors'); _monSensors = scopeToProperty((r && r.data) || [], _scopeProps); } catch(e) { throw new Error('Sensors unavailable: '+e.message); }
      try { const r = await apiRequest('/monitoring/history?hours=24&property_id='+encodeURIComponent(resolveActive(_scopeProps))); _monHist = r?.data?.property_id===resolveActive(_scopeProps) ? r.data : {series:[],log:[],has_data:false}; } catch(e) { throw new Error('History unavailable: '+e.message); }
    }

    // Action banners: offline devices — each with a
    // pre-filled "Request support" CTA.
    const q = UI.jsq;
    let banners = '';
    const highNodes=_monSensors.filter(s=>PortalModel.waterState(s)==='high');
    if(highNodes.length)banners+=`<div class="attention-notice water-alert" role="status"><strong>High water · review now</strong><p>${highNodes.map(s=>`<a href="#sensor/${encodeURIComponent(s.sensor_id)}">${UI.esc(s.name||s.sensor_id)} · ${PortalModel.levelText(s)} ↗</a>`).join(' · ')} — at or above the 70% alert level. View the device to see what needs attention and request help.</p></div>`;
    const offlineNodes = _monSensors.filter(s => s.status === 'offline');
    if (offlineNodes.length) {
      const names = offlineNodes.map(s => s.name || s.sensor_id).join(', ');
      banners += `<div class="device-notice">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>
        <div><b>${offlineNodes.length} device${offlineNodes.length === 1 ? '' : 's'} offline</b>
        <span>${UI.esc(names)} · no current reading.</span></div>
        ${App.can('manage_properties')?`<button class="btn" data-service-property="${UI.esc(resolveActive(_scopeProps))}" data-service-title="${UI.esc('Check offline device'+(offlineNodes.length>1?'s':'')+': '+names)}" data-service-type="sensor_maintenance" ${offlineNodes.length===1?`data-source-id="${UI.esc(offlineNodes[0].sensor_id||offlineNodes[0].id)}"`:''}>Request a device check</button>`:'<span class="hint">Ask your account administrator to request a device check.</span>'}
      </div>`;
    }
    document.getElementById('mon-notices').innerHTML = banners;

    // filter chips (counts)
    const zones = [...new Set(_monSensors.map(s => s.zone).filter(Boolean))];
    const offCount = _monSensors.filter(s => s.status === 'offline').length;
    document.getElementById('mon-filters').innerHTML = [
      ['all', `All (${_monSensors.length})`],
      ['attention', `Needs a check (${_monSensors.filter(s => PortalModel.attentionRank(s)>=200).length})`],
      ['offline', `Offline (${offCount})`]
    ].map(([k, l]) => `<button class="${_monFilter === k ? 'on' : ''}" aria-pressed="${_monFilter===k}" onclick="App.monFilter('${k}')">${l}</button>`).join('');

    renderMonGrid();
    renderMonChart();
    renderMonLog();
  }

  function renderMonGrid() {
    const grid = document.getElementById('mon-grid');
    if (!grid) return;
    let list = _monSensors;
    if (_monFilter === 'attention') list = list.filter(s => PortalModel.attentionRank(s)>=200);
    if (_monFilter === 'offline') list = list.filter(s => s.status === 'offline');
    if (_monSearch) { const q = _monSearch.toLowerCase(); list = list.filter(s => (s.name || s.sensor_id || '').toLowerCase().includes(q) || (s.zone || '').toLowerCase().includes(q)); }
    if (!_monSensors.length) { grid.className = ''; grid.innerHTML = UI.state('awaiting', 'No sensor data yet', 'Live readings appear here once your sensors are online.', Demo.isOn() ? null : 'Explore with demo data', 'onclick="App.toggleDemo(true)"'); return; }
    if (!list.length) { grid.innerHTML = `<div style="color:var(--ink-3);font-size:13px;padding:20px 0">No sensors match your search.</div>`; return; }
    grid.innerHTML = `<div class="sensor-directory"><div class="sensor-directory-head" aria-hidden="true"><span>Device / location</span><span>Water level</span><span>Condition / last report</span><span></span></div>${PortalModel.prioritySensors(list).map(UI.sensorRow).join('')}</div>`;
  }

  function renderMonChart() {
    const ch = document.getElementById('mon-chart');
    if (!ch) return;
    if (_monHist.series && _monHist.series.length > 1) {
      ch.innerHTML = metricCharts(_monHist.series,true);
    } else {
      ch.innerHTML = `<div class="muted">Trend charts appear here once sensors have recorded a few hours of readings.</div>`;
    }
  }

  function metricCharts(series,aggregate=false){
    const metrics=[
      {key:'avg',label:'Water level',unit:'%',threshold:{v:70,label:'Alert'}},
      {key:'flow',metric:'flow',label:'Flow rate',unit:' L/s'},
      {key:'silt',label:'Silt level',unit:'%'},
      {key:'temperature',label:'Temperature',unit:'°C'},
      {key:'battery',label:'Battery',unit:'%'},
      {key:'signal',label:'Signal strength',unit:'%'}
    ];
    return '<div class="metric-chart-grid">'+metrics.map(m=>{
      const available=(series||[]).filter(p=>p[m.key]!=null&&Number.isFinite(Number(p[m.key]))).length>=2;
      return '<section class="panel metric-chart" data-chart-metric="'+m.key+'"><h3>'+m.label+'</h3><p class="chart-description">'+(aggregate?'Network average · ':'')+m.unit.trim()+' · selected time range</p>'+(available?UI.lineChart(series,{...m,compact:true,aggregate}):'<div class="metric-chart-empty"><strong>—</strong><span>Not enough recorded history</span><small>We won’t estimate a trend from a single reading.</small></div>')+'</section>';
    }).join('')+'</div>';
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
    document.querySelectorAll('#mon-filters button').forEach((c, i) => {
      const keys = ['all', 'attention', 'offline'];
      c.classList.toggle('on', keys[i] === f);c.setAttribute('aria-pressed',String(keys[i]===f));
    });
    renderMonGrid();
  }
  function monMetric(m) {
    _monMetric = m;
    document.querySelectorAll('#mon-trends .section-t button').forEach(c => {
      const selected=c.textContent.toLowerCase().includes(m === 'level' ? 'water' : 'flow');c.classList.toggle('on', selected);c.setAttribute('aria-pressed',String(selected));
    });
    renderMonChart();
  }

  // ---------------- PROPERTIES (richer cards, clickable → detail) ----------------
  async function properties(view) {
    const document=UI.scopedDocument(view);
    view.innerHTML = `
      <div class="top"><div><h1>My properties</h1><div class="sub">Account-wide portfolio · all your registered properties</div></div>
      ${App.can('manage_properties') ? '<button class="btn" onclick="App.openRegister()">+ Add property</button>' : ''}</div>
      ${demoBanner()}
      <div id="prop-portfolio"></div>
      <div id="prop-list">${UI.loading(3)}</div>`;
    let props, reports, alerts;
    if (Demo.isOn()) { props = Demo.data.properties; reports = Demo.data.reports; alerts = Demo.data.alerts; }
    else {
      try { const r = await apiRequest('/properties'); props = (r && r.data) || []; } catch (_) { props = null; }
      try { const r = await apiRequest('/field-reports?limit=100'); reports = (r && r.data) || []; } catch(e) { throw new Error('Reports unavailable: '+e.message); }
      try { const r = await apiRequest('/alerts'); alerts = (r && r.data) || []; } catch(e) { throw new Error('Alerts unavailable: '+e.message); }
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
          ${kpiCard('Avg drainage score', avg != null ? avg + '/100' : '—', `${scored.length} of ${props.length} properties have a reported score`, icons.sensor)}
          ${kpiCard('Flagged properties', atRisk, 'High urgency or score below 50 · not a setup count', icons.warn)}
          ${kpiCard('Monthly fees', spend ? UI.fmtNaira(spend) : '—', 'Recorded fees across the portfolio', '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/>')}
        </div>`;
      }
      el.innerHTML = `
        <div class="card tbl-wrap">
          <table class="tbl">
            <thead><tr><th>Property</th><th>Location</th><th>Type</th><th>Drainage score</th><th>Status</th><th>Monthly fee</th><th></th></tr></thead>
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
    return `<tr class="rowlink" onclick="App.openProperty('${UI.jsq(p.property_id)}')">
      <td data-label="Property"><b>${UI.esc(p.property_name || 'Unnamed property')}</b>${(score!=null&&score<50)||['high','critical'].includes(p.urgency_level)?'<small class="property-flag">● Review needed: '+(['high','critical'].includes(p.urgency_level)?'high urgency':'score below 50')+'</small>':''}</td>
      <td class="muted" data-label="Location">${UI.esc([p.city, p.state].filter(Boolean).join(', ') || '—')}</td>
      <td class="muted" data-label="Type">${UI.esc(UI.prettyType(p.property_type))}</td>
      <td data-label="Drainage score"><b style="color:${scoreColor}">${score != null ? score + '/100' : '—'}</b></td>
      <td data-label="Status">${statusChip(p.status)}</td>
      <td data-label="Fee">${p.monthly_fee ? UI.fmtNaira(p.monthly_fee) + '/mo' : '—'}</td>
      <td class="table-actions" data-label="Open"><a class="btn" href="#property/${encodeURIComponent(p.property_id)}" onclick="event.stopPropagation()" aria-label="View property: ${UI.esc(p.property_name||'Unnamed property')}">View property →</a></td>
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
    const document=UI.scopedDocument(view);
    view.innerHTML = `
      <div class="top"><div><h1>Payments &amp; your plan</h1><div class="sub">See what you owe, check past payments and understand your plan.</div></div></div>
      ${demoBanner()}
      <div class="detail-tabs" role="tablist" aria-label="Billing sections"><button id="billing-invoices-tab" role="tab" aria-selected="true" aria-controls="billing-invoices">Invoices</button><button id="billing-contract-tab" role="tab" aria-selected="false" aria-controls="billing-contract" tabindex="-1">Plan & agreement</button></div>
      <section id="billing-invoices" role="tabpanel" aria-labelledby="billing-invoices-tab"><h2 class="section-t">Account invoices</h2><p class="hint">Each invoice identifies the property it belongs to.</p><div class="billing-ledger" id="bill-list">${UI.loading(3)}</div></section>
      <section id="billing-contract" role="tabpanel" aria-labelledby="billing-contract-tab" hidden><div id="bill-sub"></div><h2 class="section-t">What your agreement says</h2><p class="record-context">These are the monitoring and response terms recorded for this property. A response time is not a promise that a provider will arrive within that time.</p><div class="panel panel-pad" id="bill-sla"></div></section>`;

    let invoices, contract;
    if (Demo.isOn()) { invoices = Demo.data.invoices; contract = App.activeProperty()==='PROP-DEMO-1'?Demo.data.contract:null; }
    else {
      try { const r = await apiRequest('/billing/invoices'); invoices = (r && r.data) || []; } catch (_) { invoices = null; }
      // subscription + SLA come from the property billing endpoint; try the first property
      try {
        const rp = await apiRequest('/properties');
        const first = ((rp && rp.data) || []).find(p=>p.property_id===App.activeProperty());
        if (first) { const rb = await apiRequest(`/billing/${first.property_id}`); contract = rb && rb.data; }
      } catch (_) { contract = null; }
    }

    // Subscription summary
    const unpaid=(invoices||[]).filter(i=>!['paid','cancelled','void'].includes(String(i.payment_status||i.status).toLowerCase()));
    const knownAmounts=unpaid.every(i=>(i.balance_due??i.total_amount)!=null&&Number.isFinite(Number(i.balance_due??i.total_amount)));
    const due=knownAmounts?unpaid.reduce((sum,i)=>sum+Number(i.balance_due??i.total_amount),0):null;
    const nextDue=unpaid.filter(i=>i.due_date).sort((a,b)=>new Date(a.due_date)-new Date(b.due_date))[0];
    const summary=document.createElement('section');summary.className='payment-summary';
    summary.innerHTML=`<div><span class="guide-eyebrow">YOUR ACCOUNT PAYMENTS</span><h2>${invoices===null?'Payment details unavailable':unpaid.length?'You have a payment to make':'No unpaid invoices shown'}</h2><p>${invoices===null?'Try again before making a payment.':nextDue?'Earliest unpaid invoice is due '+UI.fmtDate(nextDue.due_date)+'. Open the invoice to check payment details.':'Your invoices and recorded payments are listed below.'}</p></div>${invoices!==null?`<div class="payment-total"><span>Outstanding amount</span><b>${due==null?'Check invoice amounts':UI.fmtNaira(due)}</b>${nextDue?`<button class="btn" onclick="App.openInvoice('${UI.jsq(nextDue.invoice_id)}')">Check invoice & payment details →</button>`:''}</div>`:''}`;
    view.querySelector('.detail-tabs').before(summary);
    const sub = document.getElementById('bill-sub');
    if (contract && (contract.subscription || contract.plan)) {
      const s = contract.subscription || contract;
      sub.innerHTML = `<div class="grid-3" style="margin-bottom:8px">
        ${UI.stat('Current plan', `<span style="font-size:20px">${UI.esc(s.plan || s.plan_name || 'FlowGuard')}</span>`, s.tier ? cap(s.tier) + ' tier' : 'Drainage-as-a-Service')}
        ${UI.stat('Monthly fee', (s.monthly_fee??s.amount)!=null?UI.fmtNaira(s.monthly_fee??s.amount):'Not supplied', 'Billed monthly')}
        ${UI.stat('Next billing', `<span style="font-size:18px">${UI.fmtDate(s.next_billing || contract.next_billing)}</span>`, new Date(s.next_billing || contract.next_billing)<new Date()?'Past billing date — verify status':'Upcoming charge')}
      </div>`;
    } else {
      sub.innerHTML = '<p class="muted">No subscription agreement supplied for this property.</p>';
    }

    // SLA section
    const sla = document.getElementById('bill-sla');
    const slaData = contract && (contract.sla || contract);
    if (slaData && (slaData.uptime_guarantee || slaData.uptime || slaData.response_time)) {
      sla.innerHTML = `<div class="sla-grid">
        <div class="sla-c"><div class="l">Uptime guarantee</div><div class="v">${slaData.uptime_guarantee!=null?slaData.uptime_guarantee+'%':'Not supplied'}</div><div class="s">Monitoring availability</div></div>
        <div class="sla-c"><div class="l">Current uptime</div><div class="v c-ok">${(slaData.uptime??slaData.current_uptime)!=null?(slaData.uptime??slaData.current_uptime)+'%':'Not supplied'}</div><div class="s">Last 30 days</div></div>
        <div class="sla-c"><div class="l">Response time</div><div class="v">${slaData.response_time || 'Not supplied'}</div><div class="s">Critical incident SLA</div></div>
      </div>`;
    } else {
      sla.innerHTML='<p class="muted">No agreed SLA supplied for this property.</p>';
    }

    // Payment history
    const el = document.getElementById('bill-list');
    if (invoices === null) {
      el.className = '';
      el.innerHTML = UI.state('error', "Couldn't load your invoices", 'Please check your connection and try again.', 'Retry', "onclick=\"App.go('billing')\"");
    } else if (invoices && invoices.length) {
      el.innerHTML = `<div class="rows">${invoices.map(inv => {
        const ps = String(inv.payment_status || inv.status || '').toLowerCase();
        const paid = ps === 'paid';
        const partial = ps === 'partial';
        const bal = inv.balance_due != null ? Number(inv.balance_due) : null;
        const sub = paid ? 'Paid ' + UI.fmtDate(inv.paid_date || inv.issue_date)
          : partial ? 'Part-paid · ' + UI.fmtNaira(bal != null ? bal : inv.total_amount) + ' due'
          : 'Due ' + UI.fmtDate(inv.due_date);
        return `<div class="row">
          <div class="rmain"><b>${UI.esc(cap(inv.invoice_type || 'Service'))} — ${UI.fmtDate(inv.issue_date)}</b>
            <small>${UI.esc(inv.property_name||'Account-level invoice · property not specified')} · ${sub}</small></div>
          <div class="rright" style="display:flex;gap:10px;align-items:center"><div class="amt">${UI.fmtNaira(inv.total_amount)}</div>${UI.chip(paid ? 'ok' : 'warn', paid ? 'Paid' : partial ? 'Part-paid' : 'Due')}<button class="btn" onclick="event.stopPropagation();App.openInvoice('${UI.jsq(inv.invoice_id||'')}')">View invoice →</button></div>
        </div>`;
      }).join('')}</div>`;
    } else {
      el.className = '';
      el.innerHTML = UI.state('empty', 'No invoices yet', 'Your billing history will appear here once your service is active.');
    }
  }

  // ---------------- ALERTS & INCIDENTS ----------------
  async function alerts(view) {
    const document=UI.scopedDocument(view);
    const allProps = await getMyProperties();
    view.innerHTML = `
      <div class="top"><div><h1>What needs attention</h1><div class="sub">Check the issue, understand what it means and choose your next step.</div></div></div>
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

    const active = items.filter(a=>PortalModel.active(a)&&!['info','informational'].includes(a.severity)).sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at));
    const informational=items.filter(a=>PortalModel.active(a)&&['info','informational'].includes(a.severity));
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
    else { av.className = ''; av.innerHTML = UI.state('ok', 'No active alerts', "No active events recorded. This is not confirmation of monitoring coverage or absence of flood risk."); }

    const rv = document.getElementById('alert-resolved');
    if (resolved.length) rv.innerHTML = alertTable(resolved, false);
    else { rv.className = ''; rv.innerHTML = `<p class="muted">No resolved incidents yet.</p>`; }
    if(informational.length)rv.insertAdjacentHTML('afterend','<section class="informational-events"><h3>Weather &amp; informational notices</h3><p class="muted">Context only · not counted as an actionable alert.</p>'+alertTable(informational,false,true)+'</section>');
  }

  // Alerts rendered as a table listview
  async function alertDetail(view,id) {
    const props=await getMyProperties();
    view.innerHTML='<div class="top"><div><a href="#alerts">← Alerts</a><h1>Alert record</h1></div></div><div id="alert-record">'+UI.loading(1)+'</div>';
    const document=UI.scopedDocument(view);
    try {
      const result=Demo.isOn()?{data:Demo.data.alerts}:await apiRequest('/alerts');
      const a=scopeToProperty(result.data||[],props).map(normalizeAlert).find(a=>String(a.id)===String(id));
      if(!a){document.getElementById('alert-record').innerHTML=UI.state('awaiting','Alert unavailable','This record was not returned for the selected property.');return;}
      document.getElementById('alert-record').innerHTML=`<section class="alert-record" data-severity="${UI.esc(a.severity)}"><div class="record-badges"><span class="record-badge severity">${UI.esc(cap(a.severity))}</span><span class="record-badge">${UI.esc(cap(a.status))}</span></div><h2>${UI.esc(a.title)}</h2><p>${UI.esc(a.description)}</p><p class="muted">Raised ${a.created_at?UI.esc(new Date(a.created_at).toLocaleString('en-GB',{timeZone:'Africa/Lagos',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}))+' WAT':'time unavailable'} · ${UI.esc(a.id)}</p>${a.sensor_id?`<a class="text-link" href="#sensor/${encodeURIComponent(a.sensor_id)}">View device ${UI.esc(a.sensor_id)} ↗</a>`:''}${a.service_request_id?`<a class="text-link" href="#service-request/${encodeURIComponent(a.service_request_id)}">Open related service request ↗</a>`:''}${PortalModel.active(a)&&!['info','informational'].includes(a.severity)?`<div class="record-actions"><button class="btn" data-service-title="${UI.esc('Review: '+a.title)}" data-service-type="${/water|flood/i.test(a.title)?'inspection':/silt|clearing|blockage/i.test(a.title)?'drain_cleaning':'sensor_maintenance'}" data-source-id="${UI.esc(a.id)}">Request provider ${/water|flood/i.test(a.title)?'inspection':'service'}</button></div>`:''}</section>`;
    }catch(e){document.getElementById('alert-record').innerHTML=UI.state('error','Alert unavailable',e.message);}
  }
  function alertTable(items, isActive, informational=false) {
    return `<table class="tbl compact-records alert-table">
      <thead><tr><th style="width:110px">Severity</th><th>Alert</th><th style="width:130px">${isActive||informational ? 'Raised' : 'Resolved'}</th><th>Actions</th></tr></thead>
      <tbody>${items.map(a => alertRow(a, isActive,informational)).join('')}</tbody>
    </table>`;
  }
  function alertRow(a, isActive,informational=false) {
    const sevMap = { critical: ['alert', 'Critical'], warning: ['warn', 'Warning'], info: ['ok', 'Info'], success: ['ok', 'Resolved'] };
    const [sk, sl] = sevMap[a.severity] || ['progress', 'Unclassified'];
    const subj = (a.title || 'Alert').replace(/['"<>\\\n]/g, ' ');
    const sensorLink=a.sensor_id?'<a class="btn neutral" href="#sensor/'+encodeURIComponent(a.sensor_id)+'">View device</a>':'';
    const requestLink=a.service_request_id?'<a class="portal-text-link" href="#service-request/'+encodeURIComponent(a.service_request_id)+'">Track request →</a>':'';
    const serviceType=/water|flood/i.test(subj)?'inspection':/silt|clearing|blockage/i.test(subj)?'drain_cleaning':a.sensor_id?'sensor_maintenance':'inspection';
    const actions = isActive ? '<button class="btn sm" data-service-title="'+UI.esc('Review: '+subj)+'" data-service-type="'+serviceType+'" data-source-id="'+UI.esc(a.id||'')+'">Request service</button>' : '';
    return `<tr>
      <td data-label="Severity">${UI.chip(sk, sl)}</td>
      <td data-label="Alert"><b>${a.id?`<a class="portal-text-link ${isActive&&a.severity==='critical'?'critical-link':''}" href="#alert/${encodeURIComponent(a.id)}">${UI.esc(a.title)} ↗</a>`:UI.esc(a.title)}</b><div class="muted" style="margin-top:2px">${UI.esc(a.description)}</div></td>
      <td class="muted" data-label="${isActive||informational ? 'Raised' : 'Resolved'}">${UI.esc(a.resolved_at && !isActive ? UI.fmtDate(a.resolved_at) : a.created_at?UI.fmtRelative(a.created_at):'Time unavailable')}</td>
      <td data-label="Actions"><div class="table-actions">${sensorLink}${actions}${requestLink}${!sensorLink&&!actions&&!requestLink?'<span class="muted">—</span>':''}</div></td>
    </tr>`;
  }

  function normalizeAlert(a) {
    const sev = a.severity || (a.type === 'warning' ? 'warning' : a.type === 'critical' ? 'critical' : 'info');
    return {
      ...a, id:a.id||a.alert_id, title: a.title || 'Alert', description: a.description || a.message || '',
      severity: sev, status: a.status || (a.resolved_at ? 'resolved' : 'active'),
      created_at: a.created_at, resolved_at: a.resolved_at
    };
  }

  // ---------------- ACCOUNT ----------------
  async function account(view) {
    const document=UI.scopedDocument(view);
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
    const document=UI.scopedDocument(view);
    view.innerHTML = `
      <div class="top"><div>
        <a class="portal-text-link crumb" href="#properties">← My properties</a>
        <h1 id="pd-name">Loading…</h1><div class="sub" id="pd-loc"></div>
      </div>
      <div id="pd-actions" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:flex-end"></div></div>
      ${demoBanner()}
      <div id="pd-body">${UI.loading(3)}</div>`;

    let p;
    if (Demo.isOn()) {
      p = Demo.data.properties.find(x => x.property_id === propertyId);
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
      title: STATUS_LABEL[st], when: p.stage_events?.find(e=>e.status===st)?.occurred_at ? UI.fmtDate(p.stage_events.find(e=>e.status===st).occurred_at) : (i===0?UI.fmtDate(p.created_at):i<=curIdx?'Date not recorded':'Not yet recorded')
    }));

    // pull per-property extras in parallel (honest fallback)
    let invoices = [], inspection = null, outcomes = null, healthHist = [];
    if (Demo.isOn()) {
      invoices = Demo.data.invoices.filter(x=>x.property_id===propertyId).slice(0,2);
      inspection = null;
      outcomes = null;
      healthHist = Demo.data.healthHistory.filter(x=>x.property_id===propertyId);
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
            : UI.state('awaiting', 'Inspection details not supplied', 'No appointment or inspector record was supplied for this property. The registration status alone does not confirm a visit.').replace('card', '')}
          <h3 style="margin-top:22px">Recent invoices</h3>
          ${invoices.length
            ? `<div class="rows">${invoices.map(inv => {
                const ps = String(inv.payment_status || inv.status || '').toLowerCase();
                const paid = ps === 'paid', partial = ps === 'partial';
                return `<div class="row clickable" onclick="App.openInvoice('${UI.jsq(inv.invoice_id)}')"><div class="rmain"><b>${UI.fmtNaira(inv.total_amount)}</b><small>${UI.fmtDate(inv.issue_date)}</small></div>
                  <div class="rright">${UI.chip(paid ? 'ok' : 'warn', paid ? 'Paid' : partial ? 'Part-paid' : 'Due')}</div></div>`;
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
    const canProps = App.can('manage_properties');
    const canBilling = App.can('view_billing');
    if (s === 'report_ready' || s === 'quote_sent' || s === 'payment_pending') {
      if (canProps) btns.push(`<button class="btn" onclick="App.selectServices('${UI.jsq(p.property_id)}')">Request a service</button>`);
      if (canBilling) btns.push(`<button class="btn ghost" onclick="App.setActiveProperty('${UI.jsq(p.property_id)}');App.go('billing')">View billing</button>`);
    } else if (s === 'active' || s === 'monitoring_active') {
      btns.push(`<button class="btn" onclick="App.setActiveProperty('${UI.jsq(p.property_id)}');App.go('monitoring')">View live monitoring</button>`);
      if (canBilling) btns.push(`<button class="btn ghost" onclick="App.setActiveProperty('${UI.jsq(p.property_id)}');App.go('billing')">View billing</button>`);
    } else if (s === 'submitted' || s === 'inspection_scheduled' || s === 'inspection_ongoing') {
      btns.push(`<button class="btn ghost" onclick="App.go('support')">Contact support</button>`);
    }
    // always available
    if (canProps) btns.push(`<button class="btn ghost" onclick="App.openEditProperty('${UI.jsq(p.property_id)}')">Edit details</button>`);
    if (canProps) btns.push(`<button class="btn ghost" onclick="App.openRegister()">Register another property</button>`);
    return btns.join('');
  }

  // ---------------- NOTIFICATIONS CENTER (filter / mark-read / delete) ----------------
  let _notifFilter = 'all';
  async function notifications(view) {
    const document=UI.scopedDocument(view);
    view.innerHTML = `
      <div class="top"><div><h1>Notifications</h1><div class="sub">Account and service updates — submissions, inspections, reports, and billing</div></div>
        <button class="btn ghost" onclick="App.markAllRead()">Mark all read</button></div>
      ${demoBanner()}
      <div class="seg" style="margin-bottom:16px">
        <button class="${_notifFilter === 'all' ? 'on' : ''}" onclick="App.setNotifFilter('all')">All</button>
        <button class="${_notifFilter === 'unread' ? 'on' : ''}" onclick="App.setNotifFilter('unread')">Unread</button>
      </div>
      <div id="notif-list">${UI.loading(3)}</div>`;

    let items;
    if (Demo.isOn()) {
      items = Demo.data.notifications;
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

  function notifIcon(hint) {
    const t = String(hint || '').toLowerCase();
    if (/inv|bill|payment|invoice/.test(t)) return { c: '#06bcd4', s: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/>' };
    if (/support|ticket|message|reply|chat/.test(t)) return { c: '#06bcd4', s: '<path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>' };
    if (/inspect/.test(t)) return { c: '#00e676', s: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1"/><path d="M9 13l2 2 4-4"/>' };
    if (/report|document/.test(t)) return { c: '#06bcd4', s: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/>' };
    if (/alert|critical|warn|flood|risk|incident/.test(t)) return { c: '#fe5252', s: '<path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/><path d="M12 9v4M12 17h.01"/>' };
    return { c: '#06bcd4', s: '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/>' };
  }
  function notifTime(t) {
    if (!t) return '';
    const d = new Date(t);
    if (isNaN(d.getTime())) return UI.esc(t);   // already relative (e.g. "40 days ago")
    const m = Math.floor((Date.now() - d.getTime()) / 60000);
    if (m < 1) return 'just now'; if (m < 60) return m + 'm ago';
    const h = Math.floor(m / 60); if (h < 24) return h + 'h ago';
    const dd = Math.floor(h / 24); if (dd < 30) return dd + 'd ago';
    return UI.fmtDate(t);
  }
  function notifRow(n) {
    const read=n.read||n.is_read,ic=notifIcon(n.type||n.link||n.title);
    const route=n.link||(n.target_tab?'#'+({reportDetail:'report',ticketDetail:'ticket',propertyDetail:'property'}[n.target_tab]||n.target_tab)+(n.target_id?'/'+encodeURIComponent(n.target_id):''):'');
    const allowed=/^#(?:report|ticket|property|sensor|service-request|invoice)\/[^<>]+$|^#(?:billing|services|reports|support|properties|alerts|overview)$/;
    const linked=allowed.test(route);
    return `<div class="ntf-item ${read?'':'unread'}">
      ${read?'':'<span class="ntf-dot"></span>'}
      <div class="ntf-ic" style="background:${ic.c}22;color:${ic.c}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ic.s}</svg></div>
      ${linked?'<a class="ntf-body" href="'+UI.esc(route)+'">':'<div class="ntf-body">'}<div class="ntf-t">${UI.esc(n.title||'Notification')}</div><div class="ntf-s">${UI.esc(n.message||n.description||'')}</div>${linked?'</a>':'</div>'}
      <span class="ntf-time">${notifTime(n.created_at)}</span>
      <div class="ntf-acts">${!read?`<button class="btn neutral compact-action" onclick="App.markRead('${UI.jsq(n.id)}')">Mark read</button>`:''}<button class="btn neutral compact-action" aria-label="Remove notification" onclick="App.deleteNotif('${UI.jsq(n.id)}')">Remove</button></div>
    </div>`;
  }
  function setNotifFilter(f) { _notifFilter = f; }

  // A single inspection report presented as a deliverable
  // Table row for the reports listview
  function reportRow(r) {
    const score = r.drainage_condition_score;
    const scoreColor = score == null ? 'var(--ink-3)' : score >= 70 ? 'var(--ok)' : score >= 50 ? 'var(--warn)' : 'var(--alert)';
    const risk = r.flood_risk_level;
    const riskKind = risk === 'high' || risk === 'critical' ? 'alert' : risk === 'moderate' || risk === 'medium' ? 'warn' : 'ok';
    const isReady = (r.status === 'sent' || r.status === 'approved' || r.status === 'completed' || r.sent_to_client_at);
    const rid = r.report_id || r.id || '';
    return `<tr style="cursor:pointer" onclick="App.openReport('${UI.jsq(rid)}')">
      <td data-label="Report"><b>${UI.esc(r.title || 'Inspection report')}</b></td>
      <td class="muted" data-label="Property">${UI.esc(r.property_name || r.property_id || '—')}</td>
      <td class="muted" data-label="Date">${UI.fmtDate(r.sent_to_client_at || r.created_at)}</td>
      <td data-label="Drainage score"><b style="color:${scoreColor}">${score != null ? score + '/100' : '—'}</b></td>
      <td data-label="Assessed risk">${risk ? UI.chip(riskKind, cap(String(risk))) : '<span class="muted">—</span>'}</td>
      <td data-label="Status">${isReady ? UI.chip('ok', 'Ready') : UI.chip('warn', cap(r.status || 'In progress'))}</td>
      <td data-label="Actions"><div class="table-actions"><a class="btn neutral compact-action" href="#report/${encodeURIComponent(rid)}" onclick="event.stopPropagation()">View report →</a>${isReady
        ? `<button class="btn ghost sm" onclick="event.stopPropagation();App.downloadReport('${UI.jsq(rid)}')">Download PDF</button>`
        : '<span class="muted">Finalising</span>'}</div></td>
    </tr>`;
  }


  // shared: fetch precipitation + compute daily risk index from current health
  async function computeForecastDays(horizon, allProps, vulnerability) {
    let days;
    if (Demo.isOn()) {
      return PortalModel.sampleForecast(horizon,vulnerability).days;
    } else {
      const cur = resolveActive(allProps);
      days = await ClientEstateWeather.daily(cur,horizon);
    }
    return days.map(d => {
      const mmFactor = Math.min(100, d.mm * 4);
      const chance = Math.round(Math.min(96, Math.max(2, vulnerability * 0.4 + mmFactor * 0.45 + d.prob * 0.15)));
      const level = chance >= 65 ? 'high' : chance >= 35 ? 'moderate' : 'low';
      return { ...d, chance, level };
    });
  }
  const FC_COLOR = { low: '#00e676', moderate: '#06bcd4', high: '#fe5252' };
  const FC_WORD = { low: 'Low', moderate: 'Watch', high: 'High' };
  function fcCloud(level) {
    return `<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="${FC_COLOR[level]}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 16.2A4.5 4.5 0 0017.5 8h-1.8A7 7 0 104 14.9"/><path d="M8 18v2M12 19v2M16 18v2"/></svg>`;
  }
  // Weather-condition glyph from the brand icon set (WMO code). Falls back to the risk cloud.
  function weatherGlyph(code, size, isDay) {
    size = size || 34;
    if (window.WeatherIcons && code != null) {
      return `<span class="wx-ico" title="${UI.esc(WeatherIcons.label(code))}">${WeatherIcons.html(code, isDay === undefined ? true : isDay, size)}</span>`;
    }
    return fcCloud('low').replace('width="30" height="30"', `width="${size}" height="${size}"`);
  }
  function fcDayCell(r, i) {
    const dn = i === 0 ? 'Today' : r.date.toLocaleDateString('en-GB', { weekday: 'short' });
    return `<div class="fc-cell risk-${r.level}">
      <b>${dn}</b>
      <span class="muted" style="font-size:12px">${r.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
      ${weatherGlyph(r.code, 38)}
      <span class="forecast-severity" data-level="${r.level}" style="font-weight:600;font-size:13px;color:${FC_COLOR[r.level]}">${FC_WORD[r.level]}</span>
      <b style="font-size:14px">${r.chance}/100</b>
    </div>`;
  }
  // overview widget: 14-day risk calendar
  // overview sidebar widget: compact 7-day risk calendar
  async function renderForecastWidget(allProps, health,document=window.document) {
    const el = document.getElementById('ov-weather');
    if (!el) return;
    if(!health){el.innerHTML='<div class="panel panel-pad"><h3>Risk forecast</h3><p>Insufficient site data for a property risk index. Monitoring coverage and a current assessment are required.</p><a href="#forecast">Review forecast inputs →</a></div>';return;}
    try {
      const rows = await computeForecastDays(7, allProps, 100 - health.score);
      const worst = rows.reduce((a, b) => b.chance > a.chance ? b : a, rows[0]);
      const preparationDay = rows.find(r => r.level === 'high') || worst;
      el.innerHTML = `
        <div class="panel panel-pad">
          <div class="row-between" style="margin-bottom:12px">
            <h3 style="margin:0">${rows.length===7?'The week ahead':'The days ahead'}</h3>
            <span class="muted" style="font-size:12px">${rows.length}-day</span>
          </div>
          <p class="weather-takeaway">${worst.level==='high'?'Prepare before '+UI.esc(preparationDay.date.toLocaleDateString('en-GB',{weekday:'long'}))+'.':'Keep an eye on the weather.'}</p><p class="forecast-caption">${worst.level==='high'?'Higher risk starts then. Arrange a drain check ahead of time.':'Check back for changes before making plans.'}</p>
          <div class="fc-mini">
            ${rows.map((r, i) => `<div class="fc-mini-cell" title="${(window.WeatherIcons && r.code != null ? WeatherIcons.label(r.code) + ' · ' : '')}${r.mm ? r.mm.toFixed(1) + 'mm rain' : 'No rain expected'}">
              <span class="fcd">${i === 0 ? 'Now' : r.date.toLocaleDateString('en-GB', { weekday: 'short' }).slice(0, 2)}</span>
              ${weatherGlyph(r.code, 40)}
              <b style="font-size:12px;color:${FC_COLOR[r.level]}">${r.level==='high'?'High':r.level==='moderate'?'Watch':'Low'}</b>
            </div>`).join('')}
          </div>
          <div class="row-between" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line)">
            <span class="muted" style="font-size:12px">${Demo.isOn()?'Illustrative sample.':'Data: WeatherAPI.com. '}Risk outlook, not a guarantee of flooding.</span>
            <a class="portal-text-link" href="#forecast">Full forecast →</a>
          </div>
          ${Demo.isOn()?'':'<p class="forecast-caption">Weather is general guidance and may be inaccurate locally. Do not rely on it alone for personal safety or emergency decisions; consult official meteorological services and relevant authorities.</p>'}
        </div>
      `;
    } catch (e) { el.innerHTML = '<div class="panel panel-pad"><h3>Forecast unavailable</h3><p>'+UI.esc(e.message)+'</p></div>'; }
  }

  // ---------------- RISK FORECAST ----------------
  let _fcRange = 3; // Live WeatherAPI free plan: up to three calendar days.
  function setFcRange(d) { _fcRange = d; App.go('forecast'); }

  // 48-hour hourly risk curve — color-graded with peak-risk window
  async function hourlyRiskChart(allProps, vulnerability) {
    let hours;
    if (Demo.isOn()) {
      hours = PortalModel.sampleForecast(3,vulnerability).hours;
    } else {
      const cur = resolveActive(allProps);
      hours = await ClientEstateWeather.hourly(cur,48);
    }
    const pts = hours.map(hh => {
      if(Demo.isOn())return hh;
      const mmFactor = Math.min(100, hh.mm * 18);
      const chance = Math.round(Math.min(96, Math.max(2, vulnerability * 0.4 + mmFactor * 0.45 + hh.prob * 0.15)));
      return { ...hh, chance, level: chance >= 65 ? 'high' : chance >= 35 ? 'moderate' : 'low' };
    });
    const maxC = Math.max(...pts.map(p => p.chance));
    const peakThresh = Math.max(35, maxC - 10);
    const [ws,we]=PortalModel.peakWindow(pts,peakThresh);

    const w = 960, h = 250, padL = 40, padR = 24, padT = 16, padB = 30;
    const x = i => padL + (i * (w - padL - padR)) / (pts.length - 1);
    const y = v => padT + (1 - v / 100) * (h - padT - padB);
    const seg = (a2, b2, color) => `<path d="${pts.slice(a2, b2 + 1).map((p, k) => `${k ? 'L' : 'M'}${x(a2 + k).toFixed(1)},${y(p.chance).toFixed(1)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    let segs = '', si = 0;
    for (let i = 1; i <= pts.length; i++) {
      if (i === pts.length || pts[i].level !== pts[si].level) { segs += seg(si, Math.min(i, pts.length - 1), FC_COLOR[pts[si].level]); si = i; }
    }
    const markers = pts.map((p, i) => i % 2 === 0 ? `<circle cx="${x(i).toFixed(1)}" cy="${y(p.chance).toFixed(1)}" r="2.6" fill="${FC_COLOR[p.level]}"/>` : '').join('');
    const area = `M${pts.map((p, i) => `${i ? 'L' : ''}${x(i).toFixed(1)},${y(p.chance).toFixed(1)}`).join(' ')} L${x(pts.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
    const grid = [0, 25, 50, 75, 100].map(g => `<line x1="${padL}" y1="${y(g)}" x2="${w - padR}" y2="${y(g)}" stroke="var(--line)" stroke-width=".5" stroke-dasharray="2 6"/><text x="${padL - 7}" y="${y(g) + 3.5}" fill="var(--ink-3)" font-size="14" text-anchor="end">${g}</text>`).join('');
    const xlabels = pts.map((p, i) => {
      const hr = p.t.getHours();
      if (hr % 6 !== 0) return '';
      const lbl = hr === 0 ? p.t.toLocaleDateString('en-GB', { weekday: 'short' }) : `${hr}:00`;
      return `<text x="${x(i).toFixed(1)}" y="${h - 8}" fill="var(--ink-3)" font-size="14" text-anchor="${i<3?'start':i>pts.length-4?'end':'middle'}" ${hr === 0 ? 'font-weight="600"' : ''}>${lbl}</text>`;
    }).join('');
    const windowTime=t=>t.toLocaleString('en-GB',{timeZone:'Africa/Lagos',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
    const windowLbl = ws >= 0 ? windowTime(pts[ws].t)+' – '+windowTime(new Date(pts[we].t.getTime()+3600e3))+' WAT' : '';
    const windowBand = ws >= 0 && we > ws ? `
      <rect x="${x(ws)}" y="${y(100)}" width="${(x(we) - x(ws)).toFixed(1)}" height="${(y(0) - y(100)).toFixed(1)}" fill="var(--alert)" fill-opacity="0"/>
      <line x1="${x(ws)}" y1="${y(100)}" x2="${x(ws)}" y2="${y(0)}" stroke="${FC_COLOR[maxC>=65?'high':'moderate']}" stroke-width="1" stroke-dasharray="4 3"/>
      <line x1="${x(we)}" y1="${y(100)}" x2="${x(we)}" y2="${y(0)}" stroke="${FC_COLOR[maxC>=65?'high':'moderate']}" stroke-width="1" stroke-dasharray="4 3"/>` : '';
    const peakDayLbl = ws >= 0 ? pts[ws].t.toLocaleDateString('en-GB', { weekday: 'long' }) : '';
    const totRain = ws >= 0 ? Math.round(pts.slice(ws, we + 1).reduce((sm, p) => sm + p.mm, 0)) : 0;
    const insight = maxC >= 35
      ? `Highest hourly index: <b>${maxC}/100</b>, ${peakDayLbl} ${windowLbl}. Estimated rain in this window: ~${totRain}mm. This is a shorter horizon than the daily outlook above.`
      : `Hourly index remains below 35 in the next 48 hours. This does not cancel current sensor alerts.`;
    const legend = ['low', 'moderate', 'high'].map(l => `<span><i style="display:inline-block;width:14px;height:3px;background:${FC_COLOR[l]};border-radius:2px;vertical-align:middle;margin-right:5px"></i>${FC_WORD[l]} ${l === 'low' ? '(0–34)' : l === 'moderate' ? '(35–64)' : '(65+)'}</span>`).join('');
    return `
      <div class="panel panel-pad mb-20 hourly-panel">
        <div class="row-between mb-10"><h3 style="margin:0">Next 48 hours</h3><span class="muted" style="font-size:12px">Hourly risk index</span></div>
        ${ws>=0?`<div class="peak-window" data-level="${maxC>=65?'high':'moderate'}"><strong>Highest hourly window</strong><span>${UI.esc(windowLbl)}</span><b>${maxC}/100</b></div>`:''}
        <div class="chart-scroll" tabindex="0" role="region" aria-label="Hourly risk chart; scroll horizontally on small screens"><svg class="hourly-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Hourly flood risk, next 48 hours">
          ${grid}${windowBand}
          <path d="${area}" fill="none"/>
          ${segs}${markers}${xlabels}
        </svg></div><p class="chart-scroll-hint">Swipe the chart to see the full time range.</p>
        <div style="display:flex;gap:16px;margin-top:6px;font-size:11px;color:var(--ink-3);flex-wrap:wrap">${legend}</div>
        <div style="margin-top:12px;padding:12px 14px;border-radius:12px;background:var(--surface-2);font-size:13px;color:var(--ink-2);line-height:1.5">${insight}</div>
      </div>`;
  }

  async function forecast(view) {
    const document=UI.scopedDocument(view);
    if(!Demo.isOn())_fcRange=3;
    const allProps = await getMyProperties();
    view.innerHTML = `
      <div class="top"><div><h1>Your weather outlook</h1><div class="sub">Know when to prepare. This is a risk outlook, not a prediction that flooding will happen.</div></div>
      <span class="seg">
        ${(Demo.isOn()?[3,7,14,16]:[3]).map(d => `<button class="${_fcRange === d ? 'on' : ''}" onclick="App.setFcRange(${d})">${d}d</button>`).join('')}
      </span></div>
      ${demoBanner()}
      <section class="forecast-intro"><p class="eyebrow">WEATHER & SITE INTELLIGENCE</p><h2>Your outlook. Before the rain.</h2><p>${UI.esc(allProps.find(p=>p.property_id===resolveActive(allProps))?.property_name||"Selected property")} · ${_fcRange}-day outlook</p></section>
      <div id="fc-body">${UI.loading(2)}</div>`;

    // inputs under the current property scope
    let risk, alerts, reports, sensors;
    if (Demo.isOn()) {
      risk = Demo.data.floodRisk;
      alerts = scopeToProperty(Demo.data.alerts, allProps);
      reports = scopeToProperty(Demo.data.reports, allProps);
      sensors = scopeToProperty(Demo.data.sensors, allProps);
    } else {
      try { const r = await apiRequest('/monitoring/flood-risk?property_id='+encodeURIComponent(resolveActive(allProps))); risk = r && r.data; } catch (_) { risk = null; }
      try { const r = await apiRequest('/alerts'); alerts = scopeToProperty((r && r.data) || [], allProps); } catch(e) { throw new Error('Alerts unavailable: '+e.message); }
      try { const r = await apiRequest('/field-reports?limit=20'); reports = scopeToProperty((r && r.data) || [], allProps); } catch(e) { throw new Error('Reports unavailable: '+e.message); }
      try { const r = await apiRequest('/monitoring/sensors'); sensors = scopeToProperty((r && r.data) || [], allProps); } catch(e) { throw new Error('Sensors unavailable: '+e.message); }
    }
    risk = PortalModel.riskFor(risk,sensors,resolveActive(allProps));
    const health = computeHealth(reports, risk, alerts);
    if(!health){document.getElementById('fc-body').innerHTML=UI.state('awaiting','Insufficient site data','A condition assessment and reporting sensors are required before displaying a site risk estimate.');return;}
    const vulnerability = health ? (100 - health.score) : 45;
    let horizon = Math.min(_fcRange, Demo.isOn()?16:3);

    let rows;
    try { rows = await computeForecastDays(horizon, allProps, vulnerability); }
    catch (error) {
      document.getElementById('fc-body').innerHTML = UI.state('error', "Couldn't load the weather forecast", error.message||'Please try again.', 'Retry', "onclick=\"App.go('forecast')\"");
      return;
    }
    horizon=rows.length;
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
    const openAlerts = (alerts || []).filter(a=>PortalModel.active(a)&&!['info','informational'].includes(a.severity||a.type)).length;
    const factorChip = (v, warnAt, alertAt, invert) => {
      if (v == null) return UI.chip('ok', '—');
      const bad = invert ? v <= alertAt : v >= alertAt;
      const mid = invert ? v <= warnAt : v >= warnAt;
      return UI.chip(bad ? 'alert' : mid ? 'warn' : 'ok', bad ? 'High' : mid ? 'Medium' : 'Low');
    };
    const factors = [
      ['Rainfall intensity', `${Math.round(today.mm)}mm today`, factorChip(today.mm, 5, 20)],
      ['Drainage condition', repScore != null ? `Condition ${repScore}/100` : 'No report yet', repScore == null ? UI.chip('ok', '—') : UI.chip(repScore >= 70 ? 'ok' : repScore >= 50 ? 'warn' : 'alert', repScore >= 70 ? 'Good' : repScore >= 50 ? 'Medium' : 'Poor')],
      ['Silt level', maxSilt != null ? `Highest reported build-up: ${maxSilt}%` : 'No node data', factorChip(maxSilt, 40, 70)],
      ['Device connection', total ? `${online} of ${total} reporting` : 'No devices yet', total ? UI.chip(online === total ? 'ok' : online / total >= .75 ? 'warn' : 'alert', online === total ? 'Healthy' : 'Degraded') : UI.chip('ok', '—')],
      ['Open alerts', `${openAlerts} active`, factorChip(openAlerts, 2, 4)],
    ];

    // rule-based recommendations from the same signals
    const recs = [];
    if (maxSilt != null && maxSilt >= 70) recs.push({ t: 'Schedule silt clearing', d: `Peak silt at ${maxSilt}% — request an inspection to confirm the condition and appropriate work.`, cta: ['Request service', `App.openTicket('dispatch','Silt clearing request','high')`] });
    if (total && online < total) recs.push({ t: 'Check devices that stopped reporting', d: `${total - online} node${total - online > 1 ? 's' : ''} not reporting — current conditions at these locations are unknown.`, cta: ['Request device service', `App.openTicket('sensor','Offline node — field visit request','high')`] });
    if (worst.level === 'high') recs.push({ t: `Prepare for ${dayLbl(worst.date)}`, d: `Peak risk ${worst.chance}/100 with ~${Math.round(worst.mm)}mm expected. Ask your facility manager to have a provider check drains before rain. Stay away from moving water and open drains.`, cta: null });
    if (!recs.length) recs.push({ t: 'No additional recommendations from available data', d: 'This estimate does not rule out flooding. Review coverage and local conditions.', cta: null });

    const kpi = (label, valueHtml, sub) => `<div class="card statcard"><div class="lbl">${label}</div><div style="font-family:var(--ff-d);font-size:22px;font-weight:600;margin:6px 0 2px">${valueHtml}</div><div class="sub">${sub}</div></div>`;

    document.getElementById('fc-body').innerHTML = `
      ${sensors.some(s=>PortalModel.waterState(s)==='high')?`<div class="attention-notice water-alert" role="status"><strong>Current high water</strong><p>${sensors.filter(s=>PortalModel.waterState(s)==='high').map(s=>`<a href="#sensor/${encodeURIComponent(s.sensor_id)}">${UI.esc(s.name||s.sensor_id)} · ${PortalModel.levelText(s)} ↗</a>`).join(' · ')} — this reported condition needs review regardless of today's forecast score.</p></div>`:''}
      <div class="kpi-row">
        ${kpi('Forecast risk today', `<span class="forecast-severity" data-level="${today.level}" style="color:${FC_COLOR[today.level]}">${FC_WORD[today.level]}</span>`, `${today.chance}/100 · does not override current alerts`)}
        ${kpi('Rainfall today', `<span class="rainfall-reading">${weatherGlyph(today.code, 32)}<span>${Math.round(today.mm)}<span class="rainfall-unit">mm</span></span></span>`, `${(window.WeatherIcons && today.code != null ? WeatherIcons.label(today.code) + ' · ' : '')}${today.prob}% chance of rain · calendar day`)}
        ${kpi('Highest daily index · '+horizon+' days', dayLbl(worst.date), `<span style="color:${FC_COLOR[worst.level]};font-weight:600">${worst.chance}/100 · ${FC_WORD[worst.level]} risk</span>`)}
        ${kpi('Site status index', health ? `${health.score}<span style="font-size:14px;color:var(--ink-3);margin-left:3px">/100</span>` : '—', health ? 'Condition, coverage and alerts' : 'Assuming mid vulnerability')}
      </div>

      <div id="fc-nearterm"></div>

      <div class="panel panel-pad mb-20">
        <div class="row-between mb-10"><h3 style="margin:0">${horizon}-day risk outlook</h3><span class="muted">${_fcRange > 16 ? 'Weather outlook up to 16 days · estimates can change' : 'Daily risk index'}</span></div>
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
      <p class="muted" style="margin-top:14px">How this works: each day blends your drainage health (40%), forecast rainfall volume (45%), and rain probability (15%). ${Demo.isOn()?'Forecast data: illustrative local sample.':'Weather data: <a href="https://www.weatherapi.com/" target="_blank" rel="noopener noreferrer">WeatherAPI.com</a> · free plan, up to 3 days. Calendar-day rainfall is an estimate, not an estate rain-gauge reading.'} This is not a calibrated flood probability; weather and site data may be incomplete. Weather is general guidance and may be inaccurate locally. Do not rely on it alone for personal safety or emergency decisions; consult official meteorological services and relevant authorities.</p>`;
    try { document.getElementById('fc-hourly').innerHTML = await hourlyRiskChart(allProps, vulnerability); } catch (e) { document.getElementById('fc-hourly').innerHTML='<p class="record-context">Hourly forecast unavailable: '+UI.esc(e.message)+'</p>'; }
    if (!Demo.isOn()) renderNearTerm(document,resolveActive(allProps));
  }

  // ── Sensor-driven near-term risk (our engine, not the weather outlook) ──────
  // Calls the scoped backend /client-forecast/horizons: a now/+1h/+3h/+6h
  // projection built from THIS account's live nodes (water-level momentum +
  // silt + forecast rainfall), plus an on-demand AI briefing. Hidden silently
  // if the account has no live nodes or the role lacks view_monitoring.
  const NT_COLOR = v => v >= 60 ? 'var(--alert)' : v >= 35 ? 'var(--warn)' : 'var(--ok)';
  const NT_WORD = v => v >= 80 ? 'Critical' : v >= 60 ? 'High' : v >= 35 ? 'Moderate' : 'Low';
  const briefDomId = id => 'fc-brief-' + String(id).replace(/[^a-z0-9]/gi, '_');

  function ntHorizonStrip(e) {
    const h = e.horizons || {};
    const cell = (lbl, v) => `<div style="text-align:center;min-width:44px"><div class="muted" style="font-size:11px">${lbl}</div><div style="font-family:var(--ff-d);font-weight:700;font-size:17px;color:${NT_COLOR(v)}">${v == null ? '—' : v}</div></div>`;
    const arr = '<div class="muted" style="font-size:13px">→</div>';
    return `<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">${cell('Now', h.now)}${arr}${cell('+1h', h.h1)}${arr}${cell('+3h', h.h3)}${arr}${cell('+6h', h.h6)}</div>`;
  }

  function ntEstateCard(e) {
    const top = (e.drivers || [])[0];
    const cw = e.critical_window ? `<div class="muted" style="font-size:12px;margin-top:6px">⏱ Critical risk projected around <b>${UI.esc(e.critical_window.label)}</b></div>` : '';
    const anom = e.anomaly ? `<div style="font-size:12px;margin-top:6px;color:var(--alert)">⚠ ${UI.esc(e.anomaly.note || 'Anomaly detected')}</div>` : '';
    const driver = top ? `<div class="muted" style="font-size:12px;margin-top:6px">Main driver: ${UI.esc(top.label)}</div>` : '';
    return `<div style="padding:14px 0;border-top:1px solid var(--line)">
      <div class="row-between" style="align-items:flex-start;gap:12px;flex-wrap:wrap">
        <div>
          <div style="display:flex;align-items:center;gap:8px"><b style="font-size:14px">${UI.esc(e.name)}</b>${UI.chip(e.current_risk >= 60 ? 'alert' : e.current_risk >= 35 ? 'warn' : 'ok', NT_WORD(e.current_risk))}</div>
          ${driver}${cw}${anom}
          <div class="muted" style="font-size:12px;margin-top:6px">Recommended: ${UI.esc(e.recommendation || '—')}</div>
        </div>
        ${ntHorizonStrip(e)}
      </div>
      <div style="margin-top:10px">
        <button class="btn sm ghost" onclick="Screens.explainClientRisk('${UI.jsq(e.property_id)}', this)">Explain this</button>
        <div id="${briefDomId(e.property_id)}"></div>
      </div>
    </div>`;
  }

  async function renderNearTerm(document=window.document,propertyId=App.activeProperty()) {
    const el = document.getElementById('fc-nearterm');
    if (!el) return;
    el.innerHTML = `<div class="panel panel-pad mb-20">${UI.loading(2)}</div>`;
    let data;
    try { const r = await apiRequest('/client-forecast/horizons'); data = r && r.data; }
    catch (e) { el.innerHTML='<p class="record-context">Near-term projection unavailable: '+UI.esc(e.message)+'</p>'; return; }
    if (!data || !Array.isArray(data.estates) || !data.estates.length) { el.innerHTML = ''; return; }

    data.estates=data.estates.filter(e=>String(e.property_id||e.id)===String(propertyId));
    if(!data.estates.length){el.innerHTML='<p class="record-context">No near-term projection supplied for this property.</p>';return;}
    const p = {critical_now:data.estates.filter(e=>e.current_risk>=80).length,anomalies:data.estates.filter(e=>e.anomaly).length};
    const chips = [];
    if (p.critical_now) chips.push(UI.chip('alert', `${p.critical_now} critical now`));
    if (p.entering_high_3h) chips.push(UI.chip('warn', `${p.entering_high_3h} entering high (3h)`));
    if (p.preventive_recommended) chips.push(UI.chip('warn', `${p.preventive_recommended} preventive due`));
    if (p.anomalies) chips.push(UI.chip('alert', `${p.anomalies} anomaly`));
    if (!chips.length) chips.push(UI.chip('progress', 'Selected-property projection'));
    const rain = data.rain_next_3h_mm != null ? `<span class="muted" style="font-size:12px">~${data.rain_next_3h_mm}mm rain next 3h</span>` : '';

    const shown = data.estates.slice(0, 6);
    const more = data.estates.length > shown.length ? `<div class="muted" style="font-size:12px;margin-top:10px">+${data.estates.length - shown.length} more estate${data.estates.length - shown.length > 1 ? 's' : ''}</div>` : '';

    el.innerHTML = `<div class="panel panel-pad mb-20">
      <div class="row-between mb-10" style="flex-wrap:wrap;gap:8px">
        <div><h3 style="margin:0">Live risk — next 6 hours</h3><div class="muted" style="font-size:12px;margin-top:2px">Sensor-driven projection from your nodes · water-level momentum + silt + forecast rainfall</div></div>
        <button class="btn sm" onclick="Screens.explainClientRisk('${UI.jsq(propertyId)}', this)">Brief me</button>
      </div>
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:6px">${chips.join(' ')} ${rain}</div>
      <div id="${briefDomId(propertyId)}"></div>
      ${shown.map(ntEstateCard).join('')}
      ${more}
      <p class="muted" style="margin-top:12px;font-size:11.5px">Rule-based projection (not a trained model): current risk blended with forecast rainfall and live water-level momentum. AI briefings phrase these figures in plain language.</p>
    </div>`;

    // Auto-fill the portfolio box with this morning's stored briefing (if any),
    // so it's visible on load. "Brief me" regenerates a fresh one on demand.
    try {
      const dr = await apiRequest('/client-forecast/daily');
      const daily = dr && dr.data;
      const box = document.getElementById(briefDomId('portfolio'));
      if (daily && daily.briefing && box && !box.innerHTML.trim()) {
        const when = daily.generated_at ? new Date(daily.generated_at).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) : '';
        box.innerHTML = `<div class="muted" style="white-space:pre-wrap;line-height:1.55;font-size:13px;margin-top:8px;color:var(--ink-2)">${UI.esc(daily.briefing)}</div><div class="muted" style="font-size:11px;margin-top:6px;opacity:.7">Morning briefing${when ? ' · ' + when : ''}</div>`;
      }
    } catch (_) { /* no stored briefing yet — the Brief me button still works */ }
  }

  async function explainClientRisk(id, btn) {
    const box = document.getElementById(briefDomId(id));
    if (!box) return;
    if (btn) { btn.disabled = true; btn.dataset._t = btn.textContent; btn.textContent = 'Analysing…'; }
    box.innerHTML = `<div style="margin-top:8px">${UI.loading(1)}</div>`;
    try {
      const body = id === 'portfolio' ? { scope: 'portfolio' } : { property_id: id };
      const r = await apiRequest('/client-forecast/brief', { method: 'POST', body });
      const d = (r && r.data) || {};
      box.innerHTML = `<div class="muted" style="white-space:pre-wrap;line-height:1.55;font-size:13px;margin-top:8px;color:var(--ink-2)">${UI.esc(d.briefing || '')}</div>`;
    } catch (e) {
      box.innerHTML = `<div class="muted" style="font-size:12px;margin-top:8px">Couldn't generate a briefing right now.</div>`;
    }
    if (btn) { btn.disabled = false; btn.textContent = btn.dataset._t || 'Explain this'; }
  }

  // ---------------- REPORTS & DOCUMENTS ----------------
  async function reports(view) {
    const document=UI.scopedDocument(view);
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
          <table class="tbl compact-records reports-table">
            <thead><tr><th>Report</th><th>Property</th><th>Date</th><th>Drainage score</th><th>Assessed risk</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>${items.map(reportRow).join('')}</tbody>
          </table>
        </div>`;
    } else {
      el.className = '';
      el.innerHTML = UI.state('empty', 'No reports yet',
        'When FlowGuard completes an inspection or sends you a document, it will appear here for you to review and download.');
    }
  }

  // ---------------- REPORT DETAIL ----------------
  async function reportDetail(view, id) {
    const document=UI.scopedDocument(view);
    view.innerHTML = `
      <div class="top"><div>
        <a class="portal-text-link crumb" href="#reports">← Reports &amp; documents</a>
        <h1 id="rd-title">Loading…</h1><div class="sub" id="rd-sub"></div>
      </div><div id="rd-actions"></div></div>
      ${demoBanner()}
      <div id="rd-body">${UI.loading(3)}</div>`;
    let d;
    if (Demo.isOn()) {
      d = (Demo.data.reports || []).find(r => (r.report_id || r.id) === id);
    } else {
      try { const r = await apiRequest('/field-reports/' + encodeURIComponent(id)); d = r && r.data; }
      catch (e) { document.getElementById('rd-body').innerHTML = UI.state('error', "Couldn't load the report", e.message || 'Please try again.', 'Retry', `onclick=\"App.openReport('${UI.jsq(id)}')\"`); return; }
    }
    if (!d) { document.getElementById('rd-body').innerHTML = UI.state('empty', 'Report not found', 'It may have been removed or is not yet shared with you.'); return; }

    const rid = d.report_id || d.id || id;
    const score = d.drainage_condition_score;
    const scoreColor = score == null ? 'var(--ink-3)' : score >= 70 ? 'var(--ok)' : score >= 50 ? 'var(--warn)' : 'var(--alert)';
    const risk = d.flood_risk_level;
    const riskKind = risk === 'high' || risk === 'critical' ? 'alert' : risk === 'moderate' || risk === 'medium' ? 'warn' : 'ok';
    const isReady = (d.status === 'sent' || d.status === 'approved' || d.status === 'completed' || d.sent_to_client_at);
    const loc = [d.city, d.state].filter(Boolean).join(', ');

    document.getElementById('rd-title').textContent = d.title || 'Inspection report';
    document.getElementById('rd-sub').textContent = `${d.property_name || d.property_id || ''}${loc ? ' · ' + loc : ''} · ${UI.fmtDate(d.sent_to_client_at || d.created_at)}`;
    document.getElementById('rd-actions').innerHTML = isReady
      ? `<div style="display:flex;gap:8px"><button class="btn ghost" onclick="App.viewReport('${UI.jsq(rid)}')">View PDF</button><button class="btn" onclick="App.downloadReport('${UI.jsq(rid)}')">Download PDF</button></div>`
      : `<span class="chip warn">${cap(d.status || 'In progress')}</span>`;

    const block = (title, body) => body ? `<div class="panel panel-pad mb-20"><h3 style="margin:0 0 10px">${title}</h3><div style="font-size:14px;color:var(--ink-2);line-height:1.7;white-space:pre-wrap">${UI.esc(body)}</div></div>` : '';
    const kpi = (label, valueHtml, sub) => `<div class="card statcard"><div class="lbl">${label}</div><div style="font-family:var(--ff-d);font-size:22px;font-weight:600;margin:6px 0 2px">${valueHtml}</div><div class="sub">${sub}</div></div>`;
    document.getElementById('rd-body').innerHTML = `
      <div class="kpi-row" style="margin-bottom:20px">
        ${kpi('Drainage condition', `<span style="color:${scoreColor}">${score != null ? score + '<span style="font-size:14px;color:var(--ink-3)">/100</span>' : '—'}</span>`, score == null ? 'Not scored' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Poor')}
        ${kpi('Flood risk', risk ? `<span style="color:${riskKind === 'alert' ? 'var(--alert)' : riskKind === 'warn' ? 'var(--warn)' : 'var(--ok)'}">${cap(String(risk))}</span>` : '—', 'Assessed at inspection')}
        ${kpi('Status', isReady ? 'Ready' : cap(d.status || 'In progress'), UI.fmtDate(d.sent_to_client_at || d.created_at))}
      </div>
      ${block('Summary', d.summary || d.executive_summary)}
      ${block('Findings', d.findings)}
      ${block('Recommendations', d.recommendations)}
      ${(!d.summary && !d.executive_summary && !d.findings && !d.recommendations) ? `<div class="panel panel-pad"><p class="muted" style="margin:0">The written details for this report aren't available here yet${isReady ? ' — the full document is in the PDF above.' : '.'}</p></div>` : ''}`;
  }

  // ---------------- SENSOR DETAIL (drill-down + time range) ----------------
  let _sensorRange = 24;
  async function sensorDetail(view, sensorId) {
    const document=UI.scopedDocument(view);
    view.innerHTML = `
      <div class="top"><div>
        <a class="portal-text-link crumb" href="#monitoring">← Water &amp; devices</a>
        <h1 id="sd-name">Loading…</h1><div class="sub" id="sd-sub"></div>
      </div>
      <div class="seg">
        ${[['24h', 24], ['7d', 168], ['30d', 720]].map(([lbl, h]) =>
          `<button class="${_sensorRange === h ? 'on' : ''}" onclick="App.setSensorRange(${h},'${UI.jsq(sensorId)}')">${lbl}</button>`).join('')}
      </div></div>
      ${demoBanner()}
      <div id="sd-body">${UI.loading(3)}</div>`;

    let d;
    if (Demo.isOn()) {
      const s = Demo.data.sensors.find(x => x.sensor_id === sensorId);
      d=s?{...s,series:PortalModel.sensorSeries(s,_sensorRange)}:null;
    } else {
      try { const r = await apiRequest(`/monitoring/sensor/${sensorId}?hours=${_sensorRange}`); d = r && r.data; }
      catch (e) { document.getElementById('sd-body').innerHTML = UI.state('error', 'Could not load sensor', e.message || 'Please try again.'); return; }
    }
    if (!d) { document.getElementById('sd-body').innerHTML = UI.state('error', 'Sensor not found', ''); return; }

    document.getElementById('sd-name').textContent = d.name || d.sensor_id;
    document.getElementById('sd-sub').textContent = `${d.zone ? cap(d.zone) + ' zone' : ''} · Monitoring device · ${d.sensor_id} · ${d.last_ping?'Last reported '+UI.fmtRelative(d.last_ping):'No report timestamp'}`;
    let linkedAlerts=[],alertsUnavailable=false;
    try{const r=Demo.isOn()?{data:Demo.data.alerts}:await apiRequest('/alerts');linkedAlerts=scopeToProperty(r.data||[],await getMyProperties()).map(normalizeAlert).filter(a=>a.sensor_id===d.sensor_id&&PortalModel.active(a)).sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at));}catch(_){alertsUnavailable=true;}

    const rangeLabel = _sensorRange === 24 ? 'last 24 hours' : _sensorRange === 168 ? 'last 7 days' : 'last 30 days';
    const battPct = d.battery_percent != null ? d.battery_percent : (d.battery_voltage != null ? Math.round((d.battery_voltage / 4.2) * 100) : null);
    const battColor = battPct == null ? 'var(--ink-3)' : battPct >= 40 ? 'var(--ok)' : battPct >= 20 ? 'var(--warn)' : 'var(--alert)';
    const sig = d.signal_strength;
    const sigLabel = sig == null ? '—' : sig >= 70 ? 'Strong' : sig >= 40 ? 'Fair' : 'Weak';
    const silt = d.silt_level;
    const siltLabel = silt == null ? '—' : silt >= 70 ? 'High' : silt >= 40 ? 'Moderate' : 'Low';
    const siltColor = silt == null ? 'var(--ink-3)' : silt >= 70 ? 'var(--alert)' : silt >= 40 ? 'var(--warn)' : 'var(--ok)';
    const q = UI.jsq;
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
      ${PortalModel.waterState(d)==='high'?`<section class="device-attention" role="status"><strong>High water · review now</strong><p>Latest reported level <b> ${PortalModel.levelText(d)}</b> is at or above the 70% alert threshold. An online device does not mean safe drainage.</p><button class="btn" data-service-property="${UI.esc(d.property_id)}" data-service-title="${UI.esc('High water review: '+(d.name||d.sensor_id))}" data-service-type="inspection" data-source-id="${UI.esc(linkedAlerts.find(a=>/water/i.test(a.title))?.id||d.sensor_id)}">Request provider inspection</button></section>`:d.status==='offline'?'<section class="device-attention" role="status"><strong>Monitoring coverage interrupted</strong><p>No current water reading is available. Last reported device diagnostics may be stale.</p></section>':''}
      <div class="grid-3 mb-20">
        ${UI.stat('Current level', `<span class="water-value" data-water-state="${PortalModel.waterState(d)}">${PortalModel.levelText(d)}</span>`, PortalModel.waterState(d)==='high'?'High water level · alert at 70%':PortalModel.waterState(d)==='unavailable'?'Current reading unavailable':'Water level · alert at 70%')}
        ${UI.stat('Flow rate', d.flow_rate != null ? d.flow_rate + ' L/s' : '—', 'Current')}
        ${UI.stat('Device connectivity', `<span style="font-size:18px;color:${d.status === 'active' ? 'var(--ok)' : d.status === 'offline' ? 'var(--alert)' : 'var(--ink)'}">${d.status === 'active' ? 'Reporting' : d.status === 'offline' ? 'Offline' : 'Idle'}</span>`, 'Connection status only · not drainage safety')}
      </div>
      <section class="related-alerts"><h3>Related active alerts</h3>${linkedAlerts.length?linkedAlerts.map(a=>`<a class="related-alert" data-severity="${UI.esc(a.severity)}" href="#alert/${encodeURIComponent(a.id)}"><span><b>${UI.esc(a.title)}</b><small>${UI.esc(cap(a.severity))} · ${UI.fmtRelative(a.created_at)}</small></span><span aria-hidden="true">↗</span></a>`).join(''):`<p>${alertsUnavailable?'Related alerts could not be loaded.':'No active alert records returned for this sensor.'}</p>`}</section>

      <div class="panel panel-pad mb-20">
        <div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 12px;gap:10px">
          <h3 style="font-family:var(--ff-d);font-size:16px;margin:0">Device health</h3>
          <button class="btn ghost sm" onclick="App.openTicket('sensor','${q('Issue with ' + (d.name || d.sensor_id))}','${d.status === 'offline' || (d.level != null && d.level >= 70) ? 'high' : 'normal'}','${q(reportDesc)}')">Report an issue</button>
        </div>
        <div class="device-health-layout"><img class="device-health-image" src="assets/flowguard-device.png" width="887" height="1000" alt="FlowGuard solar-powered monitoring device"><div class="profile-grid">
          ${healthRows.map(([k, v, c]) => `<div class="pf-row"><div class="pf-k">${k}</div><div class="pf-v" style="color:${c}">${v}</div></div>`).join('')}
        </div></div>
      </div>
      <section class="device-trends"><h2 style="font-size:20px;margin-top:24px">Device trends</h2><p class="muted">${rangeLabel} · ${Demo.isOn()?'Demo history':'Recorded readings'}</p>${metricCharts(d.series||[])}</section>`;
  }
  function setSensorRange(h, sensorId) { _sensorRange = h; }

  // ---------------- SUPPORT / TICKETS ----------------
  const TICKET_CATS = {
    sensor: 'Device monitoring', dispatch: 'Drain cleaning or inspection',
    emergency: 'Emergency', billing: 'Billing & Contract', general: 'General enquiry'
  };
  let _ticketFilter = 'all';

  async function support(view) {
    const document=UI.scopedDocument(view);
    view.innerHTML = `
      <div class="top"><div><h1>How can we help?</h1><div class="sub">Understand an update, arrange a visit or talk to the FlowGuard team.</div></div>
        ${App.can('submit_support')?'<button class="btn" onclick="App.openTicket()">Message FlowGuard</button>':''}</div>
      ${demoBanner()}
      <section class="help-choices" aria-label="Choose the help you need"><div class="help-choice"><h2>Not sure what a reading means?</h2><p>Your property guide explains what is happening and what to do next, without the technical language.</p><a class="btn" href="#overview">Explain my property →</a></div><div class="help-choice"><h2>Need a visit, cleaning or repair?</h2><p>Request a service. FlowGuard can coordinate with a provider, or keep a record when you use your own provider.</p><a class="btn" href="#services">Request or track a service →</a></div></section>
      <div class="seg" style="margin-bottom:16px">
        <button class="${_ticketFilter === 'all' ? 'on' : ''}" onclick="App.setTicketFilter('all')">All</button>
        <button class="${_ticketFilter === 'open' ? 'on' : ''}" onclick="App.setTicketFilter('open')">Open</button>
        <button class="${_ticketFilter === 'resolved' ? 'on' : ''}" onclick="App.setTicketFilter('resolved')">Resolved</button>
      </div>
      <div id="tk-list">${UI.loading(3)}</div>`;

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

    // Keep account questions visible; property-linked conversations follow the selected property.
    const supportProps=await getMyProperties();
    const selectedSupport=resolveActive(supportProps);
    items=items.filter(t=>!t.property_id||t.property_id===selectedSupport);
    if (_ticketFilter === 'open') items = items.filter(t => !['resolved', 'closed'].includes(t.status));
    if (_ticketFilter === 'resolved') items = items.filter(t => ['resolved', 'closed'].includes(t.status));

    const el = document.getElementById('tk-list');
    if (items && items.length) {
      el.innerHTML = `<div class="rows">${items.map(ticketRow).join('')}</div>`;
    } else {
      el.className = '';
      el.innerHTML = UI.state('ok', _ticketFilter === 'all' ? 'No tickets yet' : `No ${_ticketFilter} tickets`,
        'Need technical or account help? Raise a support ticket. Use Services for provider service requests.',
        'Raise a ticket', 'onclick="App.openTicket()"');
    }
  }

  function ticketIcon(t) {
    const s = `${t.subject || t.title || ''} ${t.category || ''}`.toLowerCase();
    // returns { c: accent color, p: svg path markup }
    if (/calibrat|tune|adjust|threshold/.test(s))
      return { c: '#06bcd4', p: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>' };
    if (/rain|forecast|weather|precip|flood|storm/.test(s))
      return { c: '#06bcd4', p: '<line x1="8" y1="19" x2="8" y2="21"/><line x1="8" y1="13" x2="8" y2="15"/><line x1="16" y1="19" x2="16" y2="21"/><line x1="16" y1="13" x2="16" y2="15"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="12" y1="15" x2="12" y2="17"/><path d="M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 15.25"/>' };
    if (/offline|sensor|node|device|telemetry|signal|connect/.test(s))
      return { c: '#06bcd4', p: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>' };
    if (/bill|invoice|payment|charge|dispute|contract|refund/.test(s))
      return { c: '#00e676', p: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/>' };
    if (/dispatch|crew|visit|plant|truck|vehicle|clean/.test(s))
      return { c: '#fe5252', p: '<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>' };
    if (/emergency|urgent|critical/.test(s))
      return { c: '#fe5252', p: '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>' };
    return { c: '#06bcd4', p: '<path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>' };
  }

  function ticketRow(t) {
    const done = ['resolved', 'closed'].includes(t.status);
    const st = done
      ? { c: 'ok', l: t.status === 'closed' ? 'Closed' : 'Resolved' }
      : { c: 'open', l: t.status === 'in_progress' ? 'In progress' : (t.status === 'new' ? 'New' : 'Open') };
    const prio = String(t.priority || '').toLowerCase();
    const pr = (prio === 'high' || prio === 'urgent') ? { c: 'alert', l: cap(prio) }
      : prio === 'medium' ? { c: 'warn', l: 'Medium' }
        : { c: 'low', l: prio ? cap(prio) : 'Low' };
    const ic = ticketIcon(t);
    const desc = t.description || t.last_message || t.body || '';
    const meta = `${UI.esc(t.ticket_id || '')} · ${UI.esc(TICKET_CATS[t.category] || t.category || 'General')} · ${UI.fmtDate(t.created_at)}`;
    const dot = (!done && t.needs_response) ? '<span class="ntf-dot"></span>' : '';
    return `<div class="tkt-item${done ? ' done' : ''}" onclick="App.openTicketDetail('${UI.jsq(t.ticket_id)}')">
      ${dot}
      <div class="ntf-ic" style="background:${ic.c}1f;color:${ic.c}">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ic.p}</svg>
      </div>
      <div class="tkt-body">
        <div class="tkt-t">${UI.esc(t.subject || t.title || 'Support request')}</div>
        ${desc ? `<div class="tkt-d">${UI.esc(desc)}</div>` : ''}
        <div class="tkt-m">${meta}</div>
      </div>
      <div class="tkt-right">
        <span class="tkt-pill ${pr.c}">${pr.l}</span>
        <span class="tkt-pill ${st.c}">${st.l}</span>
        <button class="tkt-view" onclick="event.stopPropagation();App.openTicketDetail('${UI.jsq(t.ticket_id)}')">View</button>
      </div>
    </div>`;
  }
  function setTicketFilter(f) { _ticketFilter = f; }

  // ---------------- TICKET DETAIL ----------------
  async function ticketDetail(view, ticketId) {
    const document=UI.scopedDocument(view);
    view.innerHTML = `
      <div class="top"><div>
        <a class="portal-text-link crumb" href="#support">← All conversations</a>
        <h1 id="td-subj">Loading…</h1><div class="sub" id="td-meta"></div>
      </div></div>
      ${demoBanner()}
      <div id="td-body">${UI.loading(3)}</div>`;

    let t;
    if (Demo.isOn()) {
      t = Demo.data.tickets.find(x => x.ticket_id === ticketId);
      if(!t){document.getElementById('td-body').innerHTML=UI.state('error','Ticket not found','No matching record.');return;}
      t = { ...t, messages: t.messages || [
        { author_type: 'client', author_name: 'You', message: t.description || 'Initial request.', created_at: t.created_at },
        { author_type: 'support', author_name: 'FlowGuard Support', message: 'Thanks for reaching out — our team is reviewing this and will update you shortly.', created_at: t.created_at }
      ] };
    } else {
      try { const r = await apiRequest(`/tickets/${ticketId}`); t = r && r.data; }
      catch (e) { document.getElementById('td-body').innerHTML = UI.state('error', 'Could not load ticket', e.message || ''); return; }
    }
    if (!t) { document.getElementById('td-body').innerHTML = UI.state('error', 'Ticket not found', ''); return; }

    const done = ['resolved', 'closed'].includes(t.status);
    const stStatus = done
      ? { dot: '#00e676', l: t.status === 'closed' ? 'Closed' : 'Resolved' }
      : t.status === 'in_progress' ? { dot: '#06bcd4', l: 'In progress' }
        : { dot: '#06bcd4', l: t.status === 'new' ? 'New' : 'Open' };
    const prio = String(t.priority || '').toLowerCase();
    const prDot = (prio === 'high' || prio === 'urgent') ? '#fe5252' : prio === 'medium' ? '#06bcd4' : 'var(--ink)';
    const prLabel = prio ? cap(prio) : 'Normal';
    const category = t.category_label || t.subcategory || TICKET_CATS[t.category] || t.category || 'General';
    document.getElementById('td-subj').textContent = t.subject || t.title || 'Support request';
    document.getElementById('td-meta').innerHTML = `${UI.esc(t.ticket_id || '')} · ${UI.esc(TICKET_CATS[t.category] || t.category || 'General')} · Opened ${UI.fmtDate(t.created_at)}`;

    let msgs = t.messages || [];
    // The client's original request is the ticket description. Make sure the
    // thread always opens with it — prepend client-side unless the API already
    // surfaced it as the first message (dedupe by text to avoid doubling up).
    const desc = (t.description || '').trim();
    if (desc && !(msgs.length && (msgs[0].message || '').trim() === desc)) {
      const me = (typeof Auth !== 'undefined' && Auth.getUser) ? Auth.getUser() : null;
      msgs = [{
        author_type: 'client',
        author_email: t.creator_email || t.created_by || (me && me.email) || null,
        author_name: t.creator_name || (me && me.fullName) || 'You',
        message: t.description,
        created_at: t.created_at,
      }, ...msgs];
    }
    document.getElementById('td-body').innerHTML = `
      <div class="conversation-layout"><aside class="conversation-summary"><h2>Your request</h2><p>${done?'This conversation is closed.':t.needs_response?'We are waiting for your reply.':'Your request is open. Check the latest reply below.'}</p><div class="td-cards">
        <div class="td-card"><div class="td-card-l">STATUS</div><div class="td-card-v"><span class="td-dot" style="background:${stStatus.dot}"></span>${stStatus.l}</div></div>
        <div class="td-card"><div class="td-card-l">PRIORITY</div><div class="td-card-v"><span class="td-dot" style="background:${prDot}"></span>${prLabel}</div></div>
        <div class="td-card"><div class="td-card-l">CATEGORY</div><div class="td-card-v">${UI.esc(category)}</div></div>
      </div><p>Need someone to visit? A support message does not book a provider. Use the service option below.</p></aside>
      <div class="panel panel-pad td-convo">
        <h3 class="td-convo-t">Chat with FlowGuard <span class="conversation-human">Support team · not AI</span></h3>
        <div class="thread" id="td-thread">
          ${msgs.length ? msgs.map(threadMsg).join('') : `<p class="muted">No messages yet.</p>`}
        </div>
        <div class="reply-box">
          <label for="td-reply">Your reply</label>
          <textarea id="td-reply" rows="3" placeholder="Tell us what you noticed, or ask a question…"></textarea>
          <div class="reply-bar">
            <span class="reply-attachment-note">Text messages only · file attachments are not available yet.</span>
            <button class="btn" onclick="App.sendReply('${UI.jsq(t.ticket_id)}', this)">Send message</button>
          </div>
        </div>
      </div></div>`;
    const related=document.createElement('section');related.className='ticket-related';
    const sensorId=t.sensor_id;
    related.innerHTML=`<h3>${sensorId?'Device & next step':'More help'}</h3>${sensorId?`<a class="text-link" href="#sensor/${encodeURIComponent(sensorId)}">See the device: ${UI.esc(sensorId)} ↗</a>`:''}${t.alert_id?`<a class="text-link" href="#alert/${encodeURIComponent(t.alert_id)}">See the related alert ↗</a>`:''}${t.service_request_id?`<a class="text-link" href="#service-request/${encodeURIComponent(t.service_request_id)}">Track the service request ↗</a>`:sensorId?`<p>If the device needs a visit, request a provider check. We will record the request here; the provider still needs to confirm the visit.</p><button class="btn" data-service-property="${UI.esc(t.property_id||'')}" data-service-title="${UI.esc('Check device: '+(t.subject||t.title||t.ticket_id))}" data-service-type="sensor_maintenance" data-source-id="${UI.esc(t.ticket_id)}">Request a device check</button>`:'<p>Reply in this conversation for help with your account or payment. You do not need to create another request for the same question.</p>'}`;
    if(!App.can('submit_support')){view.querySelector('.reply-box').innerHTML='<p>Your access is read-only. Ask your account administrator if you need to send a message.</p>';}
    else if(done){const reply=view.querySelector('.reply-box');reply.innerHTML='<p>This conversation is closed. <button class="btn neutral" onclick="App.openTicket()">Start a new conversation</button></p>';}
    if(!done&&App.can('submit_support')){
      const replies=document.createElement('div');replies.className='reply-suggestions';replies.setAttribute('aria-label','Help writing your reply');
      replies.innerHTML='<span>Need help writing?</span><button class="btn neutral" data-reply-prompt="Please update me on this request.">Ask for an update</button><button class="btn neutral" data-reply-prompt="What should I do next? Please explain in simple terms.">Ask what to do next</button>';
      view.querySelector('.reply-box label').before(replies);
      replies.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{const input=view.querySelector('#td-reply');if(input.value.trim()&&!confirm('Replace your unsent reply with this suggestion?'))return;input.value=button.dataset.replyPrompt;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();}));
    }
    const summary=view.querySelector('.conversation-summary');if(summary){summary.appendChild(related);if(!sensorId&&!t.service_request_id)summary.querySelector(':scope > p:last-of-type')?.remove();}
  }

  function threadMsg(m) {
    const mine = m.author_type === 'client';
    const sys = m.author_type === 'system';
    if (sys) return `<div class="thread-sys">${UI.esc(m.message)} · ${UI.fmtDate(m.created_at)}</div>`;
    const name = mine ? 'You' : (m.author_name || 'FlowGuard Support');
    const initials = (name.replace(/[^a-zA-Z ]/g, ' ').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('') || (mine ? 'U' : 'S')).toUpperCase();
    const av = m.avatar_url
      ? `<img src="${UI.esc(m.avatar_url)}" alt="">`
      : `<span>${UI.esc(initials)}</span>`;
    return `<div class="thread-msg ${mine ? 'mine' : 'them'}">
      <div class="thread-h">
        <span class="thread-av">${av}</span>
        <b>${UI.esc(name)}</b>
        <span class="thread-time">${UI.fmtTime(m.created_at)} WAT</span>
      </div>
      <div class="thread-b">${UI.esc(m.message)}</div>
    </div>`;
  }

  // ---------------- SETTINGS (platform) ----------------
  async function settings(view) {
    const document=UI.scopedDocument(view);
    const dark = (document.documentElement.getAttribute('data-theme') || 'light') === 'dark';
    let prefs = {};
    if (!Demo.isOn()||window.PortalPreview) { const r = await apiRequest('/preferences'); if(!r?.data)throw new Error('Preferences unavailable');prefs=r.data; }
    const on = v => v ? 'checked' : '';
    view.innerHTML = `
      <div class="top"><div><h1>Settings</h1><div class="sub">Manage how the portal works for you</div></div></div>
      <div class="detail-tabs" role="tablist" aria-label="Settings sections"><button id="settings-notifications-tab" role="tab" aria-selected="true" aria-controls="settings-notifications">Notifications</button><button id="settings-appearance-tab" role="tab" aria-selected="false" aria-controls="settings-appearance" tabindex="-1">Appearance & data</button><button id="settings-account-tab" role="tab" aria-selected="false" aria-controls="settings-account" tabindex="-1">Account</button></div>
        <section id="settings-notifications" class="settings-section" role="tabpanel" aria-labelledby="settings-notifications-tab">
          <h3>Notifications</h3>
          <div class="set-row"><div><b>Email alerts</b><small>Flood-risk and incident emails</small></div>
            <label class="switch"><input type="checkbox" id="set-email" ${on(prefs.email_alerts !== false)}><span class="slider"></span></label></div>
          <div class="set-row"><div><b>SMS alerts</b><small>Urgent alerts by text message</small></div>
            <label class="switch"><input type="checkbox" id="set-sms" ${on(prefs.sms_alerts)}><span class="slider"></span></label></div>
          <div class="set-row"><div><b>Weekly summary</b><small>A digest of your network each week</small></div>
            <label class="switch"><input type="checkbox" id="set-digest" ${on(prefs.weekly_digest !== false)}><span class="slider"></span></label></div>
          <button class="btn" style="margin-top:16px" onclick="App.saveSettings()">Save preferences</button>
        </section>
        <section id="settings-appearance" class="settings-section" role="tabpanel" aria-labelledby="settings-appearance-tab" hidden>
          <h3>Appearance & data</h3>
          <div class="set-row"><div><b>Dark mode</b><small>Easier on the eyes at night</small></div>
            <label class="switch"><input type="checkbox" id="set-theme" ${on(dark)} onchange="App.toggleTheme()"><span class="slider"></span></label></div>
          <div class="set-row"><div><b>Demo mode</b><small>Show sample data to explore the portal</small></div>
            <label class="switch"><input type="checkbox" id="set-demo" ${on(Demo.isOn())} onchange="App.toggleDemo(this.checked)"><span class="slider"></span></label></div>
        </section><section id="settings-account" class="settings-section" role="tabpanel" aria-labelledby="settings-account-tab" hidden>
          <h3>Account</h3>
          ${(() => { const u = Auth.getUser() || {}; const rl = u.client_role_label; return rl ? `<div class="set-row"><div><b>Your role</b><small>What you can do in this account</small></div><span class="record-badge">${UI.esc(rl)}</span></div>` : ''; })()}
          <button class="btn ghost" style="width:100%;margin-bottom:8px;justify-content:flex-start" onclick="App.go('account')">Profile & password →</button>
          ${App.can('manage_team') ? `<button class="btn ghost" style="width:100%;margin-bottom:8px;justify-content:flex-start" onclick="App.go('team')">People & access →</button>` : ''}
          <button class="btn neutral sign-out" onclick="Auth.logout()">Sign out</button>
          ${App.can('manage_account') ? `<details class="danger-zone account-close"><summary>Stop using this account</summary><p>Deactivation pauses your account and monitoring notifications. It does not cancel active service contracts. If you only want to leave this browser session, use Sign out instead.</p><button class="btn danger" onclick="App.deactivateAccount()">Review account deactivation</button></details>` : ''}
        </section>`;
  }

  // ---- TEAM & ROLES (client organisation RBAC) ----
  // Plain-language capability lists per role (presentation only — perms live server-side)
  const ROLE_CAPS = {
    platform_admin: ['Manage customer properties', 'Manage account members', 'View billing records'],
    facility_manager: ['Review monitoring and alerts', 'Request provider services'],
    finance: ['View invoices and contract records'],
    member: ['Review shared monitoring and reports', 'Ask Support questions'],
    viewer: ['Read permitted customer records', 'No service submissions or account changes'],
  };
  const CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';

  async function team(view) {
    const document=UI.scopedDocument(view);
    view.innerHTML = `
      <div class="top"><div><h1>People &amp; access</h1><div class="sub">Choose who can see your properties and what they can do.</div></div></div>
      <div id="team-body"><div class="card"><p class="muted">Loading team…</p></div></div>`;
    let members = [], roles = [];
    try {
      const [mRes, rRes] = await Promise.all([apiRequest('/client-team'), apiRequest('/client-team/roles')]);
      members = (mRes && mRes.data) || [];
      roles = (rRes && rRes.data) || [];
    } catch (e) {
      document.getElementById('team-body').innerHTML = UI.state('error', "Couldn't load your team", e.message || 'Please try again.', 'Retry', "onclick=\"App.go('team')\"");
      return;
    }
    const roleOpts = sel => roles.map(r => `<option value="${r.key}" ${r.key === sel ? 'selected' : ''}>${UI.esc(r.label)}</option>`).join('');
    const initialsOf = n => (String(n || '').replace(/[^a-zA-Z ]/g, ' ').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('') || '?').toUpperCase();

    const rows = members.map(m => {
      const canEdit = !m.is_account_owner && !m.is_you;
      const isAdmin = m.client_role === 'platform_admin';
      const av = m.avatar_url ? `<img src="${UI.esc(m.avatar_url)}" alt="">` : `<span>${UI.esc(initialsOf(m.full_name))}</span>`;
      const ownerTag = m.is_account_owner ? '<span class="tm-owner">Owner</span>' : (m.is_you ? '<span class="tm-owner">You</span>' : '');
      const roleCell = canEdit
        ? `<select class="tm-role-sel" onchange="App.setMemberRole(${m.id}, this.value)">${roleOpts(m.client_role)}</select>`
        : `<span class="tm-role-pill ${isAdmin ? 'admin' : 'neutral'}">${UI.esc(roles.find(r=>r.key===m.client_role)?.label || m.client_role_label || '—')}</span>`;
      const status = !m.is_active ? { c: 'off', l: 'Deactivated' }
        : m.invited_pending ? { c: 'pending', l: 'Pending Invite' }
          : { c: 'active', l: 'Active' };
      const deact = canEdit
        ? (m.is_active
            ? `<button class="tm-deact" onclick="App.toggleMember(${m.id}, false)">Deactivate</button>`
            : `<button class="tm-deact" onclick="App.toggleMember(${m.id}, true)">Reactivate</button>`)
        : '';
      return `<div class="trl-row">
        <div class="tm-member">
          <span class="trl-av">${av}</span>
          <div style="min-width:0">
            <div class="trl-name">${UI.esc(m.full_name || '—')}${ownerTag}</div>
            <div class="tm-email">${UI.esc(m.email)}</div>
          </div>
        </div>
        <div>${roleCell}</div>
        <div class="tm-status-cell"><span class="tm-status ${status.c}">${status.l}</span>${deact}</div>
      </div>`;
    }).join('');

    const roleCards = roles.map(r => {
      const caps = ROLE_CAPS[r.key] || [];
      return `<div class="tm-role-card">
        <h4>${UI.esc(r.label)}</h4>
        <div class="rc-desc">${UI.esc(r.desc || '')}</div>
        ${caps.length ? `<div class="tm-caps">${caps.map(c => `<div class="tm-cap">${CHECK_SVG}<span>${UI.esc(c)}</span></div>`).join('')}</div>` : ''}
      </div>`;
    }).join('');

    document.getElementById('team-body').innerHTML = `
      <div class="card panel-pad">
        <div class="section-t" style="margin-top:0">Give someone access</div>
        <div class="tm-invite-grid">
          <div class="tm-field"><label>Full name</label><input id="tm-name" placeholder="e.g. Jane Doe"></div>
          <div class="tm-field"><label>Email address</label><input id="tm-email" type="email" placeholder="jane@company.com"></div>
          <div class="tm-field"><label>Role</label><select id="tm-role">${roleOpts('member')}</select></div>
          <button class="btn tm-invite-btn" onclick="App.inviteTeammate()">Send Invite</button>
        </div>
        <p class="tm-hint">We will email them an invitation. They can join your account after setting a password.</p>
      </div>
      <div class="card panel-pad" style="margin-top:16px">
        <div class="section-t" style="margin-top:0">Team members</div>
        <div class="tm-thead"><span>MEMBER</span><span>ROLE</span><span>STATUS</span></div>
        ${rows}
      </div>
      <div class="section-t" style="margin-top:26px">What each role can do</div>
      <div class="tm-roles-grid">${roleCards}</div>`;
  }

  return { overview, monitoring, forecast, explainClientRisk, getMyProperties, propertySelector, sensorDetail, properties, propertyDetail, billing, alerts, alertDetail, notifications, reports, reportDetail, support, ticketDetail, settings, account, team, setNotifFilter, setTicketFilter, setFcRange, setSensorRange, monSearch, monFilter, monMetric, TICKET_CATS };
})();
window.Screens = Screens;
