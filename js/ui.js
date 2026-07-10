/* ============================================================
   FlowGuard Portal v2 — UI helpers / shared components
   Pure render helpers. No data fetching here.
   ============================================================ */
const UI = (function () {

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function toast(msg, type = 'info') {
    const wrap = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = 'toast ' + (type === 'success' ? 'ok' : type);
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 200); }, 3200);
  }

  // Loading skeleton block
  function loading(lines = 3) {
    let s = '<div class="card" style="padding:24px">';
    s += '<div class="skel" style="height:22px;width:40%;margin-bottom:18px"></div>';
    for (let i = 0; i < lines; i++) s += `<div class="skel" style="height:14px;width:${90 - i * 12}%;margin-bottom:12px"></div>`;
    return s + '</div>';
  }

  // Empty / error / awaiting states
  function state(kind, title, body, actionLabel, actionAttr) {
    const icons = {
      empty: '<path d="M3 7h18M3 12h18M3 17h18"/>',
      error: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>',
      awaiting: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      ok: '<path d="M20 6L9 17l-5-5"/>'
    };
    return `<div class="card"><div class="state">
      <div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icons[kind] || icons.empty}</svg></div>
      <b>${esc(title)}</b><p>${esc(body)}</p>
      ${actionLabel ? `<button class="btn" ${actionAttr || ''}>${esc(actionLabel)}</button>` : ''}
    </div></div>`;
  }

  function chip(kind, text) {
    return `<span class="chip ${kind}"><span class="d"></span>${esc(text)}</span>`;
  }

  // The signature: circular flood-risk gauge (SVG). value 0-100 or null (awaiting).
  function gauge(value, level) {
    const has = value != null;
    const r = 94;
    const circ = 2 * Math.PI * r;              // full circumference
    const pct = has ? Math.max(0, Math.min(100, value)) : 0;
    const filled = circ * (pct / 100);          // length of coloured arc
    const gap = circ - filled;
    const levelColor = level === 'high' ? 'var(--alert)' : level === 'moderate' ? 'var(--warn)' : 'var(--ok)';
    const levelText = has ? (level === 'high' ? 'High risk' : level === 'moderate' ? 'Moderate' : 'Low risk') : 'Awaiting data';
    return `
      <div class="gauge">
        <svg width="220" height="220" viewBox="0 0 220 220">
          <circle cx="110" cy="110" r="${r}" fill="none" stroke="var(--line)" stroke-width="14"/>
          ${has ? `<circle cx="110" cy="110" r="${r}" fill="none" stroke="url(#gg)" stroke-width="14" stroke-linecap="round"
             stroke-dasharray="${filled.toFixed(1)} ${gap.toFixed(1)}"
             transform="rotate(-90 110 110)"/>` : ''}
          <defs><linearGradient id="gg" x1="0" y1="0" x2="1" y2="1" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="var(--ok)"/><stop offset="1" stop-color="var(--brand-2)"/>
          </linearGradient></defs>
        </svg>
        <div class="gauge-center">
          <b>${has ? pct : '—'}</b>
          <small>Risk index</small>
          <div class="lvl" style="color:${levelColor}">${has ? '<span class="lvl-dot" style="background:' + levelColor + '"></span>' : ''}${levelText}</div>
        </div>
      </div>`;
  }

  // A live sensor card showing ALL metrics the Sentinel device captures.
  // Bio-dispenser variants also show the enzyme cartridge status.
  function sensorCard(s) {
    const spark = (s.trend && s.trend.length)
      ? s.trend.map(v => `<i style="height:${Math.max(8, Math.min(100, v))}%"></i>`).join('')
      : '<i style="height:8%"></i>'.repeat(7);
    const live = s.status === 'active';
    const offline = s.status === 'offline';
    const flow = s.flow_rate != null ? `${s.flow_rate} L/s` : '—';
    const siltPct = s.silt_level != null ? s.silt_level : null;
    const siltLabel = siltPct == null ? '—' : siltPct >= 70 ? 'High' : siltPct >= 40 ? 'Moderate' : 'Low';
    const siltColor = siltPct == null ? 'var(--ink-3)' : siltPct >= 70 ? 'var(--alert)' : siltPct >= 40 ? 'var(--warn)' : 'var(--ok)';
    const isBio = s.device_variant === 'bio_dispenser';
    // device health signals
    const batt = s.battery_percent != null ? s.battery_percent : (s.battery_voltage != null ? Math.round((s.battery_voltage / 4.2) * 100) : null);
    const battColor = batt == null ? 'var(--ink-3)' : batt >= 40 ? 'var(--ok)' : batt >= 20 ? 'var(--warn)' : 'var(--alert)';
    const signal = s.signal_strength != null ? s.signal_strength : null;
    const sigLabel = signal == null ? '—' : signal >= 70 ? 'Strong' : signal >= 40 ? 'Fair' : 'Weak';
    const lastPing = s.last_ping ? fmtRelative(s.last_ping) : '—';

    return `
      <div class="sensor sensor-clickable${offline ? ' sensor-offline' : ''}" onclick="App.openSensor('${esc(s.sensor_id)}')">
        <div class="sh">
          <span class="nm">${esc(s.name || s.sensor_id)}${isBio ? '<span class="bio-badge">Bio</span>' : ''}</span>
          ${live ? '<span class="live"><span class="d"></span>Live</span>'
                 : offline ? '<span class="live off-red"><span class="d"></span>Offline</span>'
                 : '<span class="live off">Idle</span>'}
        </div>
        ${offline
          ? `<div class="offline-body">
               <div class="offline-msg">Sensor not reporting</div>
               <div class="offline-sub">Last seen ${lastPing}</div>
             </div>`
          : `<div class="v">${s.level != null ? Math.round(s.level) : '—'}<span class="u2">${s.level != null ? '%' : ''}</span></div>
             <div class="u">water level</div>
             <div class="spark">${spark}</div>
             <div class="sensor-metrics">
               <div class="sm"><span class="sm-l">Flow</span><span class="sm-v">${flow}</span></div>
               <div class="sm"><span class="sm-l">Silt</span><span class="sm-v" style="color:${siltColor}">${siltLabel}</span></div>
             </div>
             <div class="sensor-metrics" style="margin-top:6px">
               <div class="sm"><span class="sm-l">Battery</span><span class="sm-v" style="color:${battColor}">${batt != null ? batt + '%' : '—'}</span></div>
               <div class="sm"><span class="sm-l">Signal</span><span class="sm-v">${sigLabel}</span></div>
             </div>
             <div class="sensor-ping">Last ping ${lastPing}</div>
             ${isBio ? enzymeBlock(s.enzyme) : '<div class="enzyme-none">Standard sensor</div>'}`}
      </div>`;
  }

  // Relative time helper for pings ("2 min ago", "3 hrs ago")
  function fmtRelative(ts) {
    try {
      const d = new Date(ts), now = new Date();
      const secs = Math.floor((now - d) / 1000);
      if (secs < 60) return 'just now';
      const mins = Math.floor(secs / 60);
      if (mins < 60) return `${mins} min ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
      const days = Math.floor(hrs / 24);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } catch (_) { return '—'; }
  }

  // Bio-enzyme cartridge status block
  function enzymeBlock(e) {
    if (!e) return '';
    const lvl = e.level_percent != null ? Math.round(e.level_percent) : null;
    const statusMap = {
      loaded: ['ok', 'Loaded'], dispensing: ['ok', 'Dispensing'], low: ['warn', 'Low'],
      depleted: ['alert', 'Depleted'], due_replacement: ['alert', 'Refill due']
    };
    const [sk, sl] = statusMap[e.status] || ['ok', 'Loaded'];
    const barColor = lvl == null ? 'var(--ink-3)' : lvl < 15 ? 'var(--alert)' : lvl < 30 ? 'var(--warn)' : 'var(--ok)';
    const daysNote = e.days_left != null
      ? (e.days_left <= 0 ? 'Overdue' : `~${e.days_left}d left`)
      : '';
    return `
      <div class="enzyme">
        <div class="enzyme-h"><span class="enzyme-t">Bio-enzyme</span>${chip(sk, sl)}</div>
        <div class="enzyme-bar"><span style="width:${lvl != null ? lvl : 0}%;background:${barColor}"></span></div>
        <div class="enzyme-f"><span>${lvl != null ? lvl + '% left' : 'No reading'}</span><span style="color:${e.days_left != null && e.days_left <= 7 ? 'var(--alert)' : 'var(--ink-3)'}">${daysNote}</span></div>
      </div>`;
  }

  // KPI stat tile
  function stat(label, value, sub, chipHtml) {
    return `<div class="card statcard">
      <div class="lbl">${esc(label)}</div>
      <div class="num">${value}</div>
      ${sub ? `<div class="sub">${esc(sub)}</div>` : ''}
      ${chipHtml || ''}
    </div>`;
  }

  function fmtNaira(n) {
    const v = Number(n) || 0;
    return '₦' + v.toLocaleString('en-NG');
  }

  function fmtDate(d) {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch (_) { return d; }
  }

  // Self-contained SVG chart. series: [{t, avg, peak, flow}]. opts.metrics: which lines to draw.
  function lineChart(series, opts = {}) {
    if (!series || series.length < 2) return '<div style="color:var(--ink-3);font-size:13px;padding:20px 0">Not enough data to chart yet.</div>';
    const metric = opts.metric || 'level'; // 'level' or 'flow'
    const w = 640, h = 180, pad = 24;
    const key = metric === 'flow' ? 'flow' : 'avg';
    const vals = series.map(d => d[key] != null ? d[key] : 0);
    const peaks = metric === 'flow' ? vals : series.map(d => d.peak != null ? d.peak : d.avg);
    const max = Math.max(...peaks, metric === 'flow' ? 20 : 50), min = 0;
    const x = i => pad + (i * (w - pad * 2)) / (series.length - 1);
    const y = v => h - pad - ((v - min) / (max - min)) * (h - pad * 2);
    const line = vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
    const area = `${line} L${x(series.length - 1).toFixed(1)} ${h - pad} L${x(0).toFixed(1)} ${h - pad} Z`;
    const showPeak = metric !== 'flow';
    const peakLine = showPeak ? peaks.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ') : '';
    const unit = metric === 'flow' ? '' : '%';
    const grid = (metric === 'flow' ? [0, 10, 20] : [0, 25, 50]).map(g => `<line x1="${pad}" y1="${y(g)}" x2="${w - pad}" y2="${y(g)}" stroke="var(--line)" stroke-width="1"/><text x="2" y="${y(g) + 3}" fill="var(--ink-3)" font-size="10">${g}${unit}</text>`).join('');
    return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto" preserveAspectRatio="none">
      <defs><linearGradient id="ch" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="var(--brand)" stop-opacity="0.25"/><stop offset="1" stop-color="var(--brand)" stop-opacity="0"/>
      </linearGradient></defs>
      ${grid}
      <path d="${area}" fill="url(#ch)"/>
      ${showPeak ? `<path d="${peakLine}" fill="none" stroke="var(--warn)" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.7"/>` : ''}
      <path d="${line}" fill="none" stroke="var(--brand)" stroke-width="2.5" stroke-linejoin="round"/>
    </svg>`;
  }

  function fmtTime(d) {
    try { return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
    catch (_) { return d; }
  }

  // Larger bio-enzyme block for the sensor detail page
  function enzymeDetail(e) {
    if (!e) return '';
    const lvl = e.level_percent != null ? Math.round(e.level_percent) : null;
    const barColor = lvl == null ? 'var(--ink-3)' : lvl < 15 ? 'var(--alert)' : lvl < 30 ? 'var(--warn)' : 'var(--ok)';
    const statusMap = { loaded: ['ok', 'Loaded'], dispensing: ['ok', 'Dispensing'], low: ['warn', 'Running low'], depleted: ['alert', 'Depleted'], due_replacement: ['alert', 'Due for refill'] };
    const [sk, sl] = statusMap[e.status] || ['ok', 'Loaded'];
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span style="font-family:var(--ff-d);font-size:24px;font-weight:700">${lvl != null ? lvl + '%' : '—'}</span>${chip(sk, sl)}
      </div>
      <div class="enzyme-bar" style="height:10px"><span style="width:${lvl != null ? lvl : 0}%;background:${barColor}"></span></div>
      ${e.depletion_date ? `<p style="color:var(--ink-3);font-size:12.5px;margin-top:10px">Estimated depletion: ${fmtDate(e.depletion_date)}</p>` : ''}`;
  }

  // Turn "residential_estate" / "RESIDENTIAL_ESTATE" into "Residential Estate"
  function prettyType(t) {
    if (!t) return 'Property';
    return String(t).replace(/[_-]+/g, ' ').trim()
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  return { esc, toast, loading, state, chip, gauge, sensorCard, enzymeDetail, stat, fmtNaira, fmtDate, lineChart, fmtTime, prettyType, fmtRelative };
})();
window.UI = UI;
