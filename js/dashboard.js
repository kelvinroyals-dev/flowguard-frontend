// ============================================
// DASHBOARD MODULE
// Matches target client-portal.html exactly:
// – Optional inspection notice banner
// – 5 KPI cards
// – Areas summary table + Activity feed
// – Active alerts quick view
// All data from real API endpoints that exist
// ============================================

const Dashboard = (function() {
    const API_BASE = 'https://api.flowguard.ng/api/v1';

    // ── render() — called for ALL states ────────────────────────────────
    async function render(container, property) {
        container.innerHTML = '<div style="display:flex;align-items:center;gap:9px;padding:40px 0;color:var(--ink-3);font-size:.82rem;">'
            + '<div class="fg-spin" style="width:17px;height:17px;flex-shrink:0;"></div>Loading dashboard…</div>';

        try {
            const token = Auth.getToken();

            // Fetch all user properties (always exists)
            const propRes = await fetch(`${API_BASE}/properties`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const properties = propRes.ok ? ((await propRes.json()).data || []) : [];

            // Fetch alerts for current property (may return empty array)
            let alerts = [];
            if (property && property.property_id) {
                const alertRes = await fetch(
                    `${API_BASE}/properties/${property.property_id}/alerts`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                ).catch(() => null);
                if (alertRes && alertRes.ok) {
                    alerts = (await alertRes.json()).data || [];
                }
            }

            _render(container, property, properties, alerts);
        } catch(e) {
            console.error('Dashboard load error:', e);
            _renderError(container);
        }
    }

    // renderDemo still uses render — no fake data in live portal
    function renderDemo(container, property) {
        render(container, property);
    }

    // ── Main render ──────────────────────────────────────────────────────
    function _render(container, currentProp, properties, alerts) {
        // KPI calculations
        var total      = properties.length;
        var active     = properties.filter(function(p){ return p.status === 'active'; }).length;
        var inPipeline = properties.filter(function(p){
            return ['submitted','inspection_scheduled','inspection_ongoing','report_ready','quote_sent','payment_pending'].indexOf(p.status) !== -1;
        }).length;
        var activeAlerts = alerts.filter(function(a){
            return ['active','acknowledged','dispatched'].indexOf(a.status) !== -1;
        }).length;
        var uptime = currentProp && currentProp.network_uptime ? currentProp.network_uptime + '%' : '—';

        // Inspection notice — show if current prop has scheduled inspection
        var notice = '';
        if (currentProp && (currentProp.status === 'inspection_scheduled' || currentProp.status === 'inspection_ongoing')) {
            var inspDate = currentProp.inspection_date || currentProp.scheduled_date;
            var inspDateStr = inspDate
                ? new Date(inspDate).toLocaleDateString('en-NG',{weekday:'long',day:'numeric',month:'long',year:'numeric'})
                : 'a date to be confirmed';
            notice = '<div class="notice info">'
                + '<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
                + '<div>Your inspection for <strong>' + _esc(currentProp.property_name) + '</strong> is scheduled for <strong>' + inspDateStr + '</strong>.'
                + (currentProp.inspection_team ? ' ' + _esc(currentProp.inspection_team) + ' will contact you 24 hrs before arrival.' : '')
                + '</div></div>';
        }

        // 5 KPI cards
        var kpis = '<div class="kpis five">'
            + _kpi('blue',  'Submitted Areas',    total,        'Across all locations')
            + _kpi('green', 'Actively Monitored', active,       'With live sensors')
            + _kpi('amber', 'In Pipeline',        inPipeline,   'Inspection / review')
            + _kpi('red',   'Active Alerts',      activeAlerts, 'Require attention')
            + _kpi('teal',  'Network Uptime',     uptime,       'Last 30 days')
            + '</div>';

        // Areas summary table
        var tableRows = properties.slice(0, 5).map(function(p) {
            var statusMap = {
                'submitted': { cls:'watch', label:'Awaiting Review' },
                'inspection_scheduled': { cls:'info', label:'Inspection Scheduled' },
                'inspection_ongoing': { cls:'info', label:'In Inspection' },
                'report_ready': { cls:'watch', label:'Report Ready' },
                'quote_sent': { cls:'info', label:'Quote Sent' },
                'payment_pending': { cls:'warning', label:'Payment Pending' },
                'active': { cls:'nominal', label:'Active' },
            };
            var s = statusMap[p.status] || { cls:'offline', label: (p.status||'').replace(/_/g,' ') };
            var type = (p.property_type||'').replace(/_/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();});
            var loc = [p.city, p.state].filter(Boolean).join(', ');
            var btnTab = p.status === 'active' ? 'monitoring' : 'assets';
            var btnLabel = p.status === 'active' ? 'Monitor' : 'View';
            return '<tr>'
                + '<td class="bright">' + _esc(p.property_name) + '</td>'
                + '<td style="font-size:.78rem;">' + _esc(type) + '</td>'
                + '<td style="font-size:.78rem;">' + _esc(loc) + '</td>'
                + '<td><span class="badge ' + s.cls + '">' + s.label + '</span></td>'
                + '<td><button class="btn btn-ghost btn-sm" onclick="switchTab(\'' + btnTab + '\')">' + btnLabel + '</button></td>'
                + '</tr>';
        }).join('');

        var areasCard = '<div class="card">'
            + '<div class="card-head"><div class="card-title">My Submitted Areas</div>'
            + '<button class="btn btn-ghost btn-sm" onclick="switchTab(\'assets\')">View All</button></div>'
            + '<div style="overflow-x:auto;"><table class="tbl">'
            + '<thead><tr><th>Area</th><th>Type</th><th>Location</th><th>Status</th><th></th></tr></thead>'
            + '<tbody>' + (tableRows || '<tr><td colspan="5" style="text-align:center;padding:24px 0;color:var(--ink-3);font-size:.82rem;">No areas submitted yet</td></tr>') + '</tbody>'
            + '</table></div></div>';

        // Activity feed — built from real property events
        var actItems = _buildActivity(properties, alerts);
        var actCard = '<div class="card">'
            + '<div class="card-head"><div class="card-title">Recent Activity</div></div>'
            + '<div class="card-body-sm">'
            + (actItems.length > 0 ? actItems.join('') : '<div style="padding:20px 0;text-align:center;color:var(--ink-3);font-size:.82rem;">No recent activity</div>')
            + '</div></div>';

        // Active alerts quick view
        var alertsSection = '';
        var activeAlertList = alerts.filter(function(a){ return a.status === 'active' || a.status === 'acknowledged'; });
        if (activeAlertList.length > 0) {
            var alertRows = activeAlertList.slice(0, 3).map(function(a) {
                var sevCls = a.severity === 'critical' ? 'critical' : a.severity === 'high' ? 'high' : a.severity === 'moderate' ? 'moderate' : 'minor';
                var timeAgo = _timeAgo(a.created_at || a.triggered_at);
                return '<div class="al-item">'
                    + '<div class="al-sev ' + sevCls + '"></div>'
                    + '<div style="flex:1;min-width:0;">'
                    + '<div class="al-type">' + _esc(a.alert_type || a.type || 'Alert') + (a.location ? ' — ' + _esc(a.location) : '') + '</div>'
                    + '<div class="al-meta">' + _esc(a.notes || a.description || a.message || '') + '</div>'
                    + '</div>'
                    + '<span class="badge ' + (sevCls === 'critical' ? 'critical' : sevCls === 'high' ? 'warning' : 'watch') + '" style="flex-shrink:0;">' + (a.severity||'') + '</span>'
                    + '<div class="al-time">' + timeAgo + '</div>'
                    + '</div>';
            }).join('');
            alertsSection = '<div class="card">'
                + '<div class="card-head"><div class="card-title">Active Alerts</div>'
                + '<button class="btn btn-ghost btn-sm" onclick="switchTab(\'alerts-incidents\')">View All Alerts</button></div>'
                + '<div class="card-body-sm">' + alertRows + '</div>'
                + '</div>';
        }

        container.innerHTML = [
            notice,
            kpis,
            '<div class="g2">' + areasCard + actCard + '</div>',
            alertsSection,
        ].filter(Boolean).join('');
    }

    function _kpi(color, label, value, sub) {
        return '<div class="kpi ' + color + '">'
            + '<div class="kpi-lbl">' + label + '</div>'
            + '<div class="kpi-val ' + color + '">' + value + '</div>'
            + '<div class="kpi-sub">' + sub + '</div>'
            + '</div>';
    }

    function _buildActivity(properties, alerts) {
        var events = [];
        // From properties
        properties.forEach(function(p) {
            if (p.created_at) events.push({ time: new Date(p.created_at), type: 'submit', label: 'Area Submitted', sub: p.property_name + ' registered' });
            if (p.status === 'report_ready' && p.updated_at) events.push({ time: new Date(p.updated_at), type: 'report', label: 'Report Ready', sub: p.property_name + ' — report available' });
            if (p.status === 'active' && p.updated_at) events.push({ time: new Date(p.updated_at), type: 'active', label: 'System Active', sub: p.property_name + ' monitoring started' });
        });
        // From resolved alerts
        alerts.filter(function(a){ return a.status === 'resolved'; }).slice(0,3).forEach(function(a) {
            if (a.resolved_at) events.push({ time: new Date(a.resolved_at), type: 'resolved', label: 'Alert Resolved', sub: (a.alert_type || 'Incident') + ' — ' + (a.location || '') });
        });
        // Sort newest first
        events.sort(function(a,b){ return b.time - a.time; });

        var icons = {
            submit:   { bg: 'rgba(22,168,211,.08)', stroke: 'var(--blue)', path: '<path stroke-linecap="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>' },
            report:   { bg: 'rgba(22,168,211,.08)', stroke: 'var(--blue)', path: '<path stroke-linecap="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>' },
            active:   { bg: 'var(--ok-bg)',          stroke: 'var(--ok)',   path: '<path stroke-linecap="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>' },
            resolved: { bg: 'var(--ok-bg)',          stroke: 'var(--ok)',   path: '<path stroke-linecap="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>' },
        };

        return events.slice(0, 5).map(function(ev) {
            var ic = icons[ev.type] || icons.submit;
            return '<div class="act-item">'
                + '<div class="act-ico" style="background:' + ic.bg + ';">'
                + '<svg width="13" height="13" fill="none" stroke="' + ic.stroke + '" stroke-width="2" viewBox="0 0 24 24">' + ic.path + '</svg>'
                + '</div>'
                + '<div style="flex:1;min-width:0;">'
                + '<div class="act-title">' + _esc(ev.label) + '</div>'
                + '<div class="act-sub">' + _esc(ev.sub) + '</div>'
                + '</div>'
                + '<div class="act-time">' + _timeAgo(ev.time.toISOString()) + '</div>'
                + '</div>';
        });
    }

    function _timeAgo(iso) {
        if (!iso) return '—';
        var diff = Date.now() - new Date(iso).getTime();
        var mins = Math.floor(diff / 60000);
        var hrs  = Math.floor(diff / 3600000);
        var days = Math.floor(diff / 86400000);
        if (mins < 60)  return mins + 'min ago';
        if (hrs  < 24)  return hrs  + 'h ago';
        if (days < 7)   return days + 'd ago';
        return new Date(iso).toLocaleDateString('en-NG',{day:'numeric',month:'short'});
    }

    function _renderError(container) {
        container.innerHTML = '<div class="card"><div class="empty-state">'
            + '<svg width="38" height="38" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
            + '<h3>Failed to load dashboard</h3>'
            + '<p>Please refresh the page or contact support if the problem persists.</p>'
            + '</div></div>';
    }

    function _esc(s) {
        return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    return { render, renderDemo };
})();
