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
      html: `A 60-second tour of your dashboard — what each area does, and (the important part) which readings are <b>healthy</b> and which mean <b>trouble</b>. You're in <b>demo mode</b> with sample data, so click around freely. Tap <b>Next</b> to go at your own pace.` },

    { tab: 'overview', title: 'Overview — your home base',
      html: `A snapshot of every property you have with us.<br><br><span class="tg-band ok">Healthy</span> drains clear, water flowing.<br><span class="tg-band warn">Attention</span> something to watch soon.<br><span class="tg-band bad">Action</span> a problem we're already on.<br><br>Start here each time to see if anything needs you.` },

    { tab: 'monitoring', title: 'Monitoring — live water levels',
      html: `Real-time readings from the Sentinel sensors in your drains.<br><br><span class="tg-band ok">Healthy</span> under 50% — plenty of capacity.<br><span class="tg-band warn">Watch</span> 50–70% — filling during rain.<br><span class="tg-band bad">Risky</span> over 70% — near capacity, flood risk rising.<br><br><b>If you see risky:</b> our team is alerted automatically. You can also message us from <b>Support</b> to confirm a visit.` },

    { tab: 'forecast', title: 'Risk forecast — before it rains',
      html: `Predicts flood risk from the weather forecast <i>and</i> the condition of your drains.<br><br><span class="tg-band ok">Low</span> routine — nothing to do.<br><span class="tg-band warn">Moderate</span> keep an eye out over the next day.<br><span class="tg-band bad">High</span> act early — a pre-clean is recommended, and we schedule preventive work so a storm doesn't catch you out.` },

    { tab: 'properties', title: 'Properties — what we protect',
      html: `Your registered estates and the drainage assets we monitor for each — canals, catch basins, pump stations. Add a new area here and we'll assess it.` },

    { tab: 'alerts', title: 'Alerts — what needs you',
      html: `When a reading turns risky, it shows up here with what happened and what we're doing.<br><br><span class="tg-band bad">Red</span> act now — we're dispatching a crew; keep the area clear.<br><span class="tg-band warn">Amber</span> monitor — no action needed yet.<br><br>A quiet Alerts screen is a good sign.` },

    { tab: 'billing', title: 'Billing — invoices & payments',
      html: `View invoices, download PDFs, and pay securely. New invoices also arrive in your email with a link straight back here.` },

    { tab: 'support', title: 'Support — talk to us',
      html: `Message our team any time — a question, a reading that worries you, or to request a site visit. Real people, quick replies.` },

    { center: true, icon: '🎉', title: "You're all set",
      html: `When you're ready to see your <b>real</b> data instead of the sample, switch off <b>Demo mode</b> in Settings. You can replay this tour any time from the <b>Guided tour</b> button in the sidebar.` },
  ];

  let _i = 0, _els = null, _keyHandler = null, _resizeHandler = null;

  // ── styling ──
  function injectCss() {
    if (document.getElementById('tg-css')) return;
    const s = document.createElement('style');
    s.id = 'tg-css';
    s.textContent = `
      .tg-block { position:fixed; inset:0; z-index:99990; background:transparent; }
      .tg-hole { position:fixed; z-index:99991; border-radius:12px; box-shadow:0 0 0 9999px rgba(8,20,27,.60); transition:top .25s,left .25s,width .25s,height .25s,opacity .2s; pointer-events:none; }
      .tg-hole.hidden { opacity:0; }
      .tg-card { position:fixed; z-index:99993; width:330px; max-width:calc(100vw - 32px); background:var(--surface,#fff); color:var(--ink,#0e2c3d);
        border:1px solid var(--line,rgba(10,42,61,.12)); border-radius:16px; box-shadow:0 18px 48px rgba(8,20,27,.28); padding:18px 18px 14px; font-family:inherit; }
      .tg-icon { font-size:22px; line-height:1; margin-bottom:8px; }
      .tg-title { font-size:16px; font-weight:800; letter-spacing:-.01em; margin:0 0 8px; color:var(--ink,#0e2c3d); }
      .tg-body { font-size:13.5px; line-height:1.6; color:var(--ink-2,#4d6d7d); }
      .tg-body b { color:var(--ink,#0e2c3d); }
      .tg-band { display:inline-block; font-size:11px; font-weight:800; padding:1px 8px; border-radius:20px; margin-right:2px; }
      .tg-band.ok { background:rgba(31,157,91,.14); color:#1f9d5b; }
      .tg-band.warn { background:rgba(224,142,18,.15); color:#c67c0e; }
      .tg-band.bad { background:rgba(217,70,60,.14); color:#d9463c; }
      .tg-foot { display:flex; align-items:center; gap:8px; margin-top:16px; }
      .tg-dots { display:flex; gap:5px; margin-right:auto; }
      .tg-dot { width:6px; height:6px; border-radius:50%; background:var(--line-2,rgba(10,42,61,.18)); }
      .tg-dot.on { background:var(--brand,#0891b2); width:16px; border-radius:4px; }
      .tg-btn { font-size:13px; font-weight:700; padding:8px 14px; border-radius:10px; cursor:pointer; border:1px solid var(--line-2,rgba(10,42,61,.16)); background:var(--surface,#fff); color:var(--ink-2,#4d6d7d); }
      .tg-btn:hover { color:var(--ink,#0e2c3d); }
      .tg-btn.primary { background:linear-gradient(135deg,var(--brand,#16a8d3),var(--brand-2,#0d7fa0)); color:#fff; border:none; }
      .tg-skip { position:fixed; z-index:99993; top:16px; right:18px; font-size:12.5px; font-weight:700; color:#fff; background:rgba(8,20,27,.55); border:none; padding:7px 13px; border-radius:20px; cursor:pointer; backdrop-filter:blur(4px); }
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
    const vw = window.innerWidth, vh = window.innerHeight;
    if (!target) {
      hole.classList.add('hidden');
      card.style.left = Math.round((vw - card.offsetWidth) / 2) + 'px';
      card.style.top = Math.round((vh - card.offsetHeight) / 2) + 'px';
      return;
    }
    const r = target.getBoundingClientRect();
    // if the target isn't really on-screen (e.g. collapsed mobile rail) → center
    if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > vh) {
      hole.classList.add('hidden');
      card.style.left = Math.round((vw - card.offsetWidth) / 2) + 'px';
      card.style.top = Math.round((vh - card.offsetHeight) / 2) + 'px';
      return;
    }
    hole.classList.remove('hidden');
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
      <h3 class="tg-title">${step.title}</h3>
      <div class="tg-body">${step.html}</div>
      <div class="tg-foot">
        <div class="tg-dots">${STEPS.map((_, k) => `<span class="tg-dot ${k === _i ? 'on' : ''}"></span>`).join('')}</div>
        ${_i > 0 ? `<button class="tg-btn" id="tg-back">Back</button>` : ''}
        <button class="tg-btn primary" id="tg-next">${_i === STEPS.length - 1 ? 'Done' : 'Next'}</button>
      </div>`;
    // let the screen switch settle, then position
    setTimeout(() => place(card, hole, targetFor(step)), step.tab ? 120 : 0);
    card.querySelector('#tg-next').onclick = () => (_i === STEPS.length - 1) ? stop(true) : go(_i + 1);
    const back = card.querySelector('#tg-back'); if (back) back.onclick = () => go(_i - 1);
  }

  function go(i) { _i = Math.max(0, Math.min(STEPS.length - 1, i)); render(); }

  function start() {
    if (_els) return;   // already running
    injectCss();
    const block = document.createElement('div'); block.className = 'tg-block';
    const hole = document.createElement('div'); hole.className = 'tg-hole';
    const card = document.createElement('div'); card.className = 'tg-card';
    const skip = document.createElement('button'); skip.className = 'tg-skip'; skip.textContent = 'Skip tour';
    skip.onclick = () => stop(true);
    document.body.append(block, hole, card, skip);
    _els = { block, hole, card, skip };
    _i = 0; render();
    _keyHandler = e => { if (e.key === 'Escape') stop(true); else if (e.key === 'ArrowRight') go(_i + 1); else if (e.key === 'ArrowLeft') go(_i - 1); };
    _resizeHandler = () => place(card, hole, targetFor(STEPS[_i]));
    document.addEventListener('keydown', _keyHandler);
    window.addEventListener('resize', _resizeHandler);
    window.addEventListener('scroll', _resizeHandler, true);
  }

  function stop(clearFlag) {
    if (!_els) return;
    Object.values(_els).forEach(el => el.remove());
    _els = null;
    document.removeEventListener('keydown', _keyHandler);
    window.removeEventListener('resize', _resizeHandler);
    window.removeEventListener('scroll', _resizeHandler, true);
    if (clearFlag) { try { localStorage.removeItem(PENDING); } catch (_) {} }
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
