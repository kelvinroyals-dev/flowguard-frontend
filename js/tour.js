/* ══════════════════════════════════════════════════════════════
   FlowGuard client portal — interactive guided tour
   Spotlights each sidebar menu, explains what it's for, what's
   healthy vs risky, and what to do when a reading looks risky.
   User-driven: they click Next/Back themselves. Runs automatically
   on a new client's first sign-in (flag set at signup), and can be
   replayed from the "Guided tour" button in the sidebar.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const PAD = 8;               // highlight padding around the target
  const PENDING = 'flowguard_tour_pending';

  // Each step: a sidebar menu to spotlight (so the real screen shows behind it),
  // with plain-language guidance and, where it matters, healthy vs risky bands.
  const STEPS = [
    { center: true, icon: '👋', title: 'Welcome to FlowGuard',
      html: `Explore your property records, monitoring coverage, service requests and account tools. Sample readings are illustrative, not evidence of site conditions. Tap <b>Next</b> to go at your own pace.` },

    { tab: 'overview', title: 'Overview — your home base',
      html: `A summary of the <b>selected property</b>: monitoring coverage, active alerts, service requests and recent reports. Follow a record link for its authoritative details. Missing readings do not mean that a site is safe.` },

    { tab: 'monitoring', title: 'Monitoring — reported water levels',
      html: `Review sensor readings and timestamps. Water level is not a measurement of hydraulic capacity. An offline sensor means coverage is unavailable, not that flooding is occurring. Request provider attendance through <b>Services</b>; use <b>Support</b> for technical enquiries.` },

    { tab: 'forecast', title: 'Risk forecast — before it rains',
      html: `A rule-based risk index combines weather context with supplied site inputs. It is <b>not a calibrated probability of flooding</b>. Check the date, location and coverage before deciding whether to request a provider inspection.` },

    { tab: 'properties', title: 'Properties — what we protect',
      html: `Your registered properties and the drainage assets we monitor for each — canals, catch basins, pump stations. Add a new property here and we'll assess it.` },

    { tab: 'alerts', title: 'Alerts — what needs you',
      html: `Review recorded events, their state and related sensor records. Severity does not automatically dispatch a provider. Use <b>Services</b> when attendance is needed. No recorded alerts is not proof of safe conditions.` },

    { tab: 'billing', title: 'Billing — invoices & payments',
      html: `Review account-wide invoices and the selected property's supplied contract. Follow the invoice for payment instructions. Sample documents are clearly marked; local design preview does not process payments.` },

    { tab: 'support', title: 'Support — talk to us',
      html: `Use Support for account, billing and technical enquiries. Provider work belongs in <b>Services</b>, with either FlowGuard coordination or direct-provider routing. Direct-provider work gives FlowGuard visibility and a maintained record.` },

    { center: true, icon: '🎉', title: "You're all set",
      html: `Replay this tour from the sidebar. Local design preview is fixed to sample data and blocks submissions. Outside local preview, Demo mode is controlled in Settings.` },
  ];

  let _i = 0, _els = null, _keyHandler = null, _resizeHandler = null, _previousFocus = null;

  // ── styling ──
  function injectCss() {
    if (document.getElementById('tg-css')) return;
    const s = document.createElement('style');
    s.id = 'tg-css';
    s.textContent = `
      .tg-block { position:fixed; inset:0; z-index:99990; background:transparent; transition:background .2s; }
      /* Center steps have no spotlight ring, so dim + blur the page ourselves
         to put the card in focus. */
      .tg-block.tg-dim { background:rgba(21,25,27,.55); backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px); }
      .tg-hole { position:fixed; z-index:99991; border-radius:12px; box-shadow:0 0 0 9999px rgba(21,25,27,.60); transition:top .25s,left .25s,width .25s,height .25s,opacity .2s; pointer-events:none; }
      .tg-hole.hidden { opacity:0; }
      .tg-card { position:fixed; z-index:99993; width:400px; max-width:calc(100vw - 32px); background:var(--surface,#ffffff); color:var(--ink,#15191b);
        border:1px solid var(--line); border-radius:16px; box-shadow:0 18px 48px rgba(21,25,27,.28); padding:18px 18px 14px; font-family:inherit; }
      .tg-icon { font-size:22px; line-height:1; margin-bottom:8px; }
      .tg-close {position:absolute;right:12px;top:10px;font-size:22px;padding:0 8px;}
      .tg-title { padding-right:28px;font-size:18px; font-weight:800; letter-spacing:-.01em; margin:0 0 8px; color:var(--ink,#15191b); }
      .tg-body { font-size:15px; line-height:1.6; color:var(--ink,#15191b); }
      .tg-body b { color:var(--ink,#15191b); }
      .tg-band { display:inline-block; font-size:11px; font-weight:800; padding:1px 8px; border-radius:20px; margin-right:2px; }
      .tg-band.ok { background:#00e676; color:#15191b; }
      .tg-band.warn { background:#06bcd4; color:#15191b; }
      .tg-band.bad { background:#fe5252; color:#15191b; }
      .tg-foot { display:flex; align-items:center; gap:8px; margin-top:16px; }
      .tg-dots { display:flex; gap:5px; margin-right:auto; }
      .tg-dot { width:6px; height:6px; border-radius:50%; background:var(--line); }
      .tg-dot.on { background:#06bcd4; width:16px; border-radius:4px; }
      .tg-btn { font-size:13px; font-weight:700; padding:8px 14px; border-radius:10px; cursor:pointer; border:1px solid var(--line); background:var(--surface,#ffffff); color:var(--ink,#15191b); }
      .tg-btn:hover { color:var(--ink,#15191b); }
      .tg-btn.primary { background:#06bcd4; color:#ffffff; border:none; }
      .tg-skip { position:fixed; z-index:99993; top:16px; right:18px; font-size:12.5px; font-weight:700; color:#fff; background:rgba(21,25,27,.55); border:none; padding:7px 13px; border-radius:20px; cursor:pointer; backdrop-filter:blur(4px); }
      @media (max-width:640px){ .tg-card{ width:auto; left:16px; right:16px; } }
    `;
    document.head.appendChild(s);
  }

  function q(sel) { return document.querySelector(sel); }

  function targetFor(step) {
    if (step.center) return null;
    return q(`.navbtn[data-tab="${step.tab}"]`);
  }

  function place(card, hole, target) {
    // Fixed children of a zoomed body use layout CSS pixels, not viewport pixels.
    const scale = Number.parseFloat(getComputedStyle(document.body).zoom) || 1;
    const vw = window.innerWidth / scale, vh = window.innerHeight / scale;
    const block = _els && _els.block;
    if (!target) {
      hole.classList.add('hidden');
      if (block) block.classList.add('tg-dim');   // no spotlight → dim+blur the page
      card.style.left = Math.round((vw - card.offsetWidth) / 2) + 'px';
      card.style.top = Math.round((vh - card.offsetHeight) / 2) + 'px';
      return;
    }
    const rect = target.getBoundingClientRect();
    const r = {top:rect.top/scale,left:rect.left/scale,right:rect.right/scale,bottom:rect.bottom/scale,width:rect.width/scale,height:rect.height/scale};
    // if the target isn't really on-screen (e.g. collapsed mobile rail) → center
    if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > vh) {
      hole.classList.add('hidden');
      if (block) block.classList.add('tg-dim');
      card.style.left = Math.round((vw - card.offsetWidth) / 2) + 'px';
      card.style.top = Math.round((vh - card.offsetHeight) / 2) + 'px';
      return;
    }
    hole.classList.remove('hidden');
    if (block) block.classList.remove('tg-dim');   // spotlight ring handles focus
    hole.style.top = (r.top - PAD) + 'px';
    hole.style.left = (r.left - PAD) + 'px';
    hole.style.width = (r.width + PAD * 2) + 'px';
    hole.style.height = (r.height + PAD * 2) + 'px';
    const cw = card.offsetWidth, ch = card.offsetHeight;
    let left, top;
    if (vw > 700 && r.right + 16 + cw < vw) { left = r.right + 16; top = r.top; }       // to the right of the rail
    else if (r.top - 16 - ch > 0) { left = Math.min(r.left, vw - cw - 16); top = r.top - 16 - ch; } // above
    else { left = Math.min(r.left, vw - cw - 16); top = r.bottom + 16; }                 // below
    card.style.left = Math.max(16, Math.min(left, vw - cw - 16)) + 'px';
    card.style.top = Math.max(16, Math.min(top, vh - ch - 16)) + 'px';
  }

  function render() {
    const step = STEPS[_i];
    // switch to the relevant screen so real content is behind the spotlight
    if (step.tab) { const nav = q(`.navbtn[data-tab="${step.tab}"]`); if (nav) nav.click(); }
    const { card, hole } = _els;
    card.innerHTML = `
      ${step.icon ? `<div class="tg-icon">${step.icon}</div>` : ''}
      <button class="tg-close tg-btn" id="tg-close" aria-label="Close tour">×</button>
      <h3 class="tg-title" id="tg-title">${step.title}</h3>
      <div class="tg-body">${step.html}</div>
      <div class="tg-foot">
        <div class="tg-dots">${STEPS.map((_, k) => `<span class="tg-dot ${k === _i ? 'on' : ''}"></span>`).join('')}</div>
        ${_i > 0 ? `<button class="tg-btn" id="tg-back">Back</button>` : ''}
        <button class="tg-btn primary" id="tg-next">${_i === STEPS.length - 1 ? 'Done' : 'Next'}</button>
      </div>`;
    // let the screen switch settle, then position
    setTimeout(() => place(card, hole, targetFor(step)), step.tab ? 120 : 0);
    card.querySelector('#tg-close').onclick = () => stop(true);
    card.querySelector('#tg-next').onclick = () => (_i === STEPS.length - 1) ? stop(true) : go(_i + 1);
    const back = card.querySelector('#tg-back'); if (back) back.onclick = () => go(_i - 1);
    card.querySelector('#tg-next').focus();
  }

  function go(i) { _i = Math.max(0, Math.min(STEPS.length - 1, i)); render(); }

  function start() {
    if (_els) return;   // already running
    _previousFocus=document.activeElement;
    injectCss();
    const block = document.createElement('div'); block.className = 'tg-block';
    const hole = document.createElement('div'); hole.className = 'tg-hole';
    const card = document.createElement('div'); card.className = 'tg-card';card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.setAttribute('aria-labelledby','tg-title');
    const skip = document.createElement('button'); skip.className = 'tg-skip'; skip.textContent = 'Skip tour';
    skip.onclick = () => stop(true);
    document.body.append(block, hole, card, skip);
    _els = { block, hole, card, skip };
    _i = 0; render();
    _keyHandler = e => {
      if (e.key === 'Escape') stop(true);
      else if (e.key === 'ArrowRight') go(_i + 1);
      else if (e.key === 'ArrowLeft') go(_i - 1);
      else if(e.key==='Tab'){
        const buttons=[...card.querySelectorAll('button'),skip];
        const at=buttons.indexOf(document.activeElement);
        e.preventDefault();buttons[(at+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();
      }
    };
    _resizeHandler = () => place(card, hole, targetFor(STEPS[_i]));
    document.addEventListener('keydown', _keyHandler);
    window.addEventListener('resize', _resizeHandler);
    window.addEventListener('scroll', _resizeHandler, true);
  }

  function stop(clearFlag) {
    if (!_els) return;
    Object.values(_els).forEach(el => el.remove());
    _els = null;
    if(_previousFocus?.isConnected)_previousFocus.focus();
    document.removeEventListener('keydown', _keyHandler);
    window.removeEventListener('resize', _resizeHandler);
    window.removeEventListener('scroll', _resizeHandler, true);
    if (clearFlag) {
      try { localStorage.removeItem(PENDING); } catch (_) {}
      // Record completion server-side so the tour doesn't relaunch on the
      // client's other devices.
      if (window.apiRequest && !window.PortalPreview) window.apiRequest('/preferences', { method: 'PUT', body: { onboarding_completed: true } }).catch(()=>{});
    }
  }

  // Replay button in the sidebar (Account group).
  function injectReplayButton() {
    if (document.getElementById('tg-replay')) return;
    const settings = q('.navbtn[data-tab="settings"]');
    if (!settings || !settings.parentElement) return;
    const b = document.createElement('button');
    b.id = 'tg-replay'; b.className = 'navbtn'; b.type = 'button';
    b.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg><span class="navlabel">Guided tour</span>`;
    b.onclick = () => start();
    settings.parentElement.appendChild(b);
  }

  function init() {
    injectReplayButton();
    // Auto-launch for new clients (flag set at signup) once the app has rendered.
    if (localStorage.getItem(PENDING) === 'true') {
      try { if (window.Demo && Demo.isOn && !Demo.isOn()) Demo.setAuto(true); } catch (_) {}
      setTimeout(() => start(), 900);
    }
  }

  window.Tour = { start, stop, init };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
