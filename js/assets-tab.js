// ============================================
// SUBMITTED AREAS TAB
// Renders all user properties as pipeline cards
// matching the target client-portal.html design
// ============================================

const AssetsTab = (function() {
    const API_BASE = 'https://api.flowguard.ng/api/v1';

    // ── Status → pipeline step mapping ──────────────────────────────────
    const STATUS_STEP = {
        'submitted':            2,
        'inspection_scheduled': 3,
        'inspection_ongoing':   3,
        'report_ready':         4,
        'quote_sent':           5,
        'payment_pending':      6,
        'payment_completed':    6,
        'deployment_scheduled': 6,
        'active':               7,
    };

    const STATUS_BADGE = {
        'submitted':            { cls: 'watch',   label: 'Awaiting Review' },
        'inspection_scheduled': { cls: 'info',    label: 'Inspection Scheduled' },
        'inspection_ongoing':   { cls: 'info',    label: 'Inspection Ongoing' },
        'report_ready':         { cls: 'watch',   label: 'Report Ready' },
        'quote_sent':           { cls: 'info',    label: 'Quote Sent' },
        'payment_pending':      { cls: 'warning', label: 'Payment Pending' },
        'payment_completed':    { cls: 'nominal', label: 'Payment Received' },
        'deployment_scheduled': { cls: 'info',    label: 'Deployment Scheduled' },
        'active':               { cls: 'nominal', label: 'Active — Monitored' },
    };

    const STEPS = ['Submitted','Reviewed','Inspection','Report','Quote','Payment','Active'];

    // ── Entry points ─────────────────────────────────────────────────────
    async function render(container, property) {
        await _loadAndRender(container);
    }

    async function renderEmpty(container, property) {
        await _loadAndRender(container);
    }

    function renderDemo(container, property) {
        // Still fetch real data — demo mode shows the same pipeline view
        _loadAndRender(container);
    }

    // ── Main loader ───────────────────────────────────────────────────────
    async function _loadAndRender(container) {
        container.innerHTML = '<div style="display:flex;align-items:center;gap:9px;padding:40px 0;color:var(--ink-3);font-size:.82rem;">'
            + '<div class="fg-spin" style="width:17px;height:17px;flex-shrink:0;"></div>Loading areas…</div>';

        try {
            const token = Auth.getToken();
            const res = await fetch(`${API_BASE}/properties`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to load properties');
            const data = await res.json();
            const properties = data.data || [];
            _render(container, properties);
        } catch(e) {
            console.error('Areas load error:', e);
            container.innerHTML = '<div class="card"><div class="empty-state">'
                + '<svg width="38" height="38" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
                + '<h3>Failed to load areas</h3><p>Please refresh the page.</p>'
                + '</div></div>';
        }
    }

    function _render(container, properties) {
        var header = '<div class="sec-head">'
            + '<div><div class="sec-title">Submitted Areas</div>'
            + '<div class="sec-sub">All drainage estates and communities you have registered with FlowGuard</div></div>'
            + '<button class="btn btn-primary" onclick="openModal(\'modal-submit\')">'
            + '<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>'
            + 'Submit New Area</button>'
            + '</div>';

        if (properties.length === 0) {
            container.innerHTML = header
                + '<div class="card"><div class="empty-state">'
                + '<svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline stroke-linecap="round" stroke-linejoin="round" points="9 22 9 12 15 12 15 22"/></svg>'
                + '<h3>No areas submitted yet</h3>'
                + '<p>Submit your first drainage area to get started.</p>'
                + '</div></div>';
            return;
        }

        var cards = properties.map(function(p) { return _propertyCard(p); }).join('');
        container.innerHTML = header + cards;
    }

    function _propertyCard(p) {
        var status   = p.status || 'submitted';
        var step     = STATUS_STEP[status] || 1;
        var badge    = STATUS_BADGE[status] || { cls: 'offline', label: status.replace(/_/g,' ') };
        var isActive = status === 'active';

        var submittedStr = p.created_at
            ? new Date(p.created_at).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' })
            : '—';
        var inspDate = p.inspection_date || p.scheduled_date
            ? new Date(p.inspection_date || p.scheduled_date).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' })
            : '—';

        var typeLabel = (p.property_type || '').replace(/_/g,' ').replace(/\b\w/g, function(c){ return c.toUpperCase(); });
        var location  = [p.city, p.state].filter(Boolean).join(', ');
        var subtitle  = [typeLabel, location, p.coverage_area ? p.coverage_area + ' km²' : ''].filter(Boolean).join(' · ');

        // Action button
        var actionBtn = isActive
            ? '<button class="btn btn-primary btn-sm" onclick="switchTab(\'monitoring\')">View Sensors</button>'
            : '<button class="btn btn-ghost btn-sm">Edit</button>';

        // 4-col metadata grid — varies by status
        var meta;
        if (isActive) {
            meta = _metaGrid([
                { label: 'Active Since',  value: submittedStr },
                { label: 'Sensors',       value: p.sensors_online ? p.sensors_online + ' Online' : '—', color: 'var(--ok)' },
                { label: 'Monthly Fee',   value: p.monthly_fee ? '₦' + Number(p.monthly_fee).toLocaleString('en-NG') : '—', font: 'var(--ff-d)', size: '.9rem', weight: '800' },
                { label: 'SLA Uptime',    value: p.network_uptime ? p.network_uptime + '%' : '—', color: 'var(--ok)' },
            ]);
        } else if (status === 'inspection_scheduled' || status === 'inspection_ongoing') {
            meta = _metaGrid([
                { label: 'Submitted',       value: submittedStr },
                { label: 'Inspection Date', value: inspDate },
                { label: 'Urgency',         value: _urgencyBadge(p.urgency_level) },
                { label: 'Assigned Team',   value: p.inspection_team || p.assigned_team || '—' },
            ]);
        } else {
            meta = _metaGrid([
                { label: 'Submitted',    value: submittedStr },
                { label: 'Urgency',      value: _urgencyBadge(p.urgency_level) },
                { label: 'Ref',          value: p.property_id, font: 'var(--ff-m)', size: '.74rem', color: 'var(--ink-3)' },
                { label: 'Est. Response',value: '3–5 business days' },
            ]);
        }

        // Pipeline tracker
        var tracker = _pipelineTracker(step);

        // Contextual notice
        var notice = _contextNotice(status, p, inspDate);

        return '<div class="card">'
            + '<div class="card-head">'
            + '<div><div class="card-title">' + _esc(p.property_name) + '</div>'
            + (subtitle ? '<div style="font-size:.74rem;color:var(--ink-3);margin-top:2px;">' + _esc(subtitle) + '</div>' : '')
            + '</div>'
            + '<div style="display:flex;align-items:center;gap:8px;">'
            + '<span class="badge ' + badge.cls + '">' + badge.label + '</span>'
            + actionBtn
            + '</div>'
            + '</div>'
            + '<div class="card-body">'
            + meta
            + '<div style="font-size:.64rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--ink-3);margin-bottom:4px;">Pipeline Progress</div>'
            + tracker
            + notice
            + '</div>'
            + '</div>';
    }

    function _metaGrid(items) {
        var cols = items.map(function(item) {
            var val = item.value || '—';
            // If already contains HTML tags (badge), render raw
            var isHtml = val.indexOf('<') !== -1;
            var valHtml = isHtml ? val
                : '<div style="'
                    + 'font-family:' + (item.font || 'var(--ff-b)') + ';'
                    + 'font-size:' + (item.size || '.84rem') + ';'
                    + 'font-weight:' + (item.weight || '600') + ';'
                    + 'color:' + (item.color || 'var(--ink)') + ';">'
                    + _esc(String(val)) + '</div>';
            return '<div>'
                + '<div style="font-size:.62rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--ink-3);margin-bottom:4px;">' + item.label + '</div>'
                + valHtml
                + '</div>';
        }).join('');
        return '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;">' + cols + '</div>';
    }

    function _urgencyBadge(level) {
        if (!level) return '—';
        var map = { low:'offline', medium:'watch', high:'warning', critical:'critical' };
        var cls = map[level.toLowerCase()] || 'offline';
        var lbl = level.charAt(0).toUpperCase() + level.slice(1);
        return '<span class="badge ' + cls + '">' + lbl + '</span>';
    }

    function _pipelineTracker(currentStep) {
        var steps = STEPS.map(function(label, i) {
            var num = i + 1;
            var isDone = num < currentStep;
            var isCur  = num === currentStep;
            var isPend = num > currentStep;
            var dotCls = isDone ? 'done' : isCur ? 'cur' : 'pend';
            var lblCls = isDone ? 'done' : isCur ? 'cur' : 'pend';
            var stepCls= isDone ? 'done' : '';
            var dotContent = isDone ? '✓' : num;
            // Last step active = green
            var dotStyle = (isDone && num === 7) ? 'style="background:var(--ok);"' : '';
            var lblStyle = (isDone && num === 7) ? 'style="color:var(--ok);"' : '';
            return '<div class="pl-step ' + stepCls + '">'
                + '<div class="pl-dot ' + dotCls + '" ' + dotStyle + '>' + dotContent + '</div>'
                + '<div class="pl-lbl ' + lblCls + '" ' + lblStyle + '>' + label + '</div>'
                + '</div>';
        }).join('');
        return '<div class="pl-track">' + steps + '</div>';
    }

    function _contextNotice(status, p, inspDate) {
        var msg = '';
        var type = 'info';
        if (status === 'inspection_scheduled') {
            msg = 'Inspection confirmed for <strong>' + _esc(inspDate) + '</strong>.'
                + (p.contact_phone ? ' Our team will call you at ' + _esc(p.contact_phone) + ' at least 24 hours before arrival.' : '');
        } else if (status === 'inspection_ongoing') {
            msg = 'Site inspection is currently in progress. Our team is on site.';
        } else if (status === 'report_ready') {
            msg = 'Inspection complete. Your report is being reviewed and will be available in the Reports &amp; Docs section shortly.';
        } else if (status === 'quote_sent') {
            msg = 'Your inspection report is ready and a service quote has been sent. Review it in the <strong>Contract &amp; SLA</strong> section.';
        } else if (status === 'payment_pending' || status === 'payment_completed') {
            msg = 'Payment received. Our team is scheduling your system deployment — you\'ll be notified within 48 hours.';
            type = 'ok';
        } else if (status === 'active') {
            return '';
        } else {
            msg = 'Our team is currently reviewing your submission. You will be notified by email once an inspection date is confirmed.';
        }
        if (!msg) return '';
        return '<div class="notice ' + type + '" style="margin-top:14px;">'
            + '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
            + '<div>' + msg + '</div>'
            + '</div>';
    }

    function _esc(s) {
        return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    return { render, renderDemo, renderEmpty };
})();
