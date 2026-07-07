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

  // A live sensor card showing ALL metrics the Sentinel device captures:
  // water level, flow rate, and silt/debris — not just water level.
  function sensorCard(s) {
    const spark = (s.trend && s.trend.length)
      ? s.trend.map(v => `<i style="height:${Math.max(8, Math.min(100, v))}%"></i>`).join('')
      : '<i style="height:8%"></i>'.repeat(7);
    const live = s.status === 'active';
    const flow = s.flow_rate != null ? `${s.flow_rate} L/s` : '—';
    const siltPct = s.silt_level != null ? s.silt_level : null;
    const siltLabel = siltPct == null ? '—'
      : siltPct >= 70 ? 'High' : siltPct >= 40 ? 'Moderate' : 'Low';
    const siltColor = siltPct == null ? 'var(--ink-3)'
      : siltPct >= 70 ? 'var(--alert)' : siltPct >= 40 ? 'var(--warn)' : 'var(--ok)';
    return `
      <div class="sensor">
        <div class="sh">
          <span class="nm">${esc(s.name || s.sensor_id)}</span>
          ${live ? '<span class="live"><span class="d"></span>Live</span>' : '<span class="live off">Offline</span>'}
        </div>
        <div class="v">${s.level != null ? Math.round(s.level) : '—'}<span class="u2">${s.level != null ? '%' : ''}</span></div>
        <div class="u">water level</div>
        <div class="spark">${spark}</div>
        <div class="sensor-metrics">
          <div class="sm"><span class="sm-l">Flow</span><span class="sm-v">${flow}</span></div>
          <div class="sm"><span class="sm-l">Silt</span><span class="sm-v" style="color:${siltColor}">${siltLabel}</span></div>
        </div>
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

  return { esc, toast, loading, state, chip, gauge, sensorCard, stat, fmtNaira, fmtDate };
})();
window.UI = UI;
