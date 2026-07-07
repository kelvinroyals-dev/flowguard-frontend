/* ============================================================
   FlowGuard Portal v2 — Demo mode
   Reuses the SAME mechanism as before:
     - localStorage('flowguard_demo_mode')
     - synced to backend via PUT /preferences { show_demo_data }
   Provides realistic sample data for the gauge/sensors/timeline
   until real customers + sensors exist.
   ============================================================ */
const Demo = (function () {
  const KEY = 'flowguard_demo_mode';

  function isOn() {
    return localStorage.getItem(KEY) === 'true';
  }

  async function set(on) {
    localStorage.setItem(KEY, on ? 'true' : 'false');
    // best-effort backend sync (non-blocking, honest failure)
    try { await apiRequest('/preferences', { method: 'PUT', body: { show_demo_data: on } }); }
    catch (_) { /* offline is fine; localStorage is source of truth for the toggle */ }
  }

  // ---- Sample data (only used when the toggle is ON) ----
  const floodRisk = {
    has_data: true, risk_index: 27, level: 'low',
    peak_level: 41, avg_level: 28, sensors_online: 12, sensors_total: 12, reading_count: 12
  };

  const sensors = [
    { sensor_id: 'S-01', name: 'Main Gate', zone: 'entrance', status: 'active', level: 28, flow_rate: 12.4, silt_level: 18, has_data: true, trend: [40, 55, 35, 60, 45, 50, 28] },
    { sensor_id: 'S-02', name: 'North Culvert', zone: 'north', status: 'active', level: 19, flow_rate: 8.1, silt_level: 42, has_data: true, trend: [30, 25, 40, 20, 35, 28, 19] },
    { sensor_id: 'S-03', name: 'East Channel', zone: 'east', status: 'active', level: 41, flow_rate: 18.7, silt_level: 71, has_data: true, trend: [50, 60, 70, 55, 65, 72, 41] },
    { sensor_id: 'S-04', name: 'South Drain', zone: 'south', status: 'active', level: 23, flow_rate: 9.6, silt_level: 25, has_data: true, trend: [35, 30, 45, 38, 33, 40, 23] }
  ];

  const properties = [
    { property_id: 'PROP-DEMO-1', property_name: 'Sunrise Court Estate', city: 'Lekki', state: 'Lagos', status: 'monitoring_active', property_type: 'residential estate' },
    { property_id: 'PROP-DEMO-2', property_name: 'Palm Gardens', city: 'Ajah', state: 'Lagos', status: 'inspection_scheduled', property_type: 'residential estate' },
    { property_id: 'PROP-DEMO-3', property_name: 'Marina Heights', city: 'Victoria Island', state: 'Lagos', status: 'submitted', property_type: 'commercial' }
  ];

  const invoices = [
    { invoice_id: 'INV-DEMO-1', invoice_type: 'monthly', total_amount: 185000, payment_status: 'pending', issue_date: '2026-07-04', due_date: '2026-07-18' },
    { invoice_id: 'INV-DEMO-2', invoice_type: 'monthly', total_amount: 185000, payment_status: 'paid', issue_date: '2026-06-02', due_date: '2026-06-16' },
    { invoice_id: 'INV-DEMO-3', invoice_type: 'monthly', total_amount: 185000, payment_status: 'paid', issue_date: '2026-05-03', due_date: '2026-05-17' }
  ];

  const alerts = [
    { type: 'info', title: 'Sensor check passed', description: 'All 12 sensors reporting normally', created_at: '2 min ago' },
    { type: 'warning', title: 'Light rain expected', description: 'Tomorrow, 14:00–18:00 · drainage clear', created_at: '1 hour ago' },
    { type: 'info', title: 'East Channel cleared', description: 'Scheduled maintenance completed', created_at: 'Yesterday' }
  ];

  const timeline = [
    { status: 'done', title: 'Area submitted', sub: 'Sunrise Court Estate · Lekki, Lagos', when: '5 Jul' },
    { status: 'done', title: 'Inspection completed', sub: 'Drainage assessed, plan approved', when: '8 Jul' },
    { status: 'now', title: 'Monitoring active', sub: '12 sensors reporting every 60s', when: 'Now' },
    { status: 'pending', title: 'First maintenance', sub: 'Bio-treatment + channel clearing', when: '18 Jul' }
  ];

  const reports = [
    { report_id: 'RPT-1', title: 'Initial drainage inspection', property_name: 'Sunrise Court Estate', status: 'completed', created_at: '2026-07-08' },
    { report_id: 'RPT-2', title: 'Channel capacity assessment', property_name: 'Sunrise Court Estate', status: 'completed', created_at: '2026-07-08' },
    { report_id: 'RPT-3', title: 'Monthly monitoring summary — June', property_name: 'Palm Gardens', status: 'sent', created_at: '2026-06-30' }
  ];

  const services = [
    { key: 'sentinel', name: 'Sentinel Network', desc: 'IoT drainage monitoring', status: 'active', detail: '12 sensors online', icon: 'sensor' },
    { key: 'biotreatment', name: 'Bio-Treatment', desc: 'Biological drainage prevention', status: 'active', detail: 'Last applied 2 Jul', icon: 'drop' },
    { key: 'dispatch', name: 'Heavy-Plant Dispatch', desc: 'Clearing & maintenance crews', status: 'scheduled', detail: 'Next visit 18 Jul', icon: 'truck' }
  ];

  const tickets = [
    { ticket_id: 'TKT-1042', subject: 'East Channel silt buildup', category: 'dispatch', priority: 'high', status: 'in_progress', created_at: '2026-07-06', description: 'Silt level reading high, requesting crew.' },
    { ticket_id: 'TKT-1038', subject: 'Sensor S-02 intermittent', category: 'sensor', priority: 'normal', status: 'resolved', created_at: '2026-07-02', description: 'North Culvert sensor dropped offline twice.' },
    { ticket_id: 'TKT-1031', subject: 'June invoice query', category: 'billing', priority: 'low', status: 'resolved', created_at: '2026-06-28', description: 'Question about pro-rating.' }
  ];

  // hourly average water level for the last 24h (chart series) + a reading log
  const history = (() => {
    const now = Date.now();
    const series = Array.from({ length: 24 }, (_, i) => {
      const base = 25 + Math.sin(i / 3) * 12 + (i > 16 ? (i - 16) * 2 : 0);
      return { t: new Date(now - (23 - i) * 3600e3).toISOString(), avg: Math.round(base), peak: Math.round(base + 8) };
    });
    const names = ['Main Gate', 'North Culvert', 'East Channel', 'South Drain'];
    const log = Array.from({ length: 20 }, (_, i) => ({
      time: new Date(now - i * 22 * 60e3).toISOString(),
      sensor: names[i % 4],
      level: 18 + Math.round(Math.random() * 30),
      flow: +(6 + Math.random() * 14).toFixed(1),
      debris: Math.random() > 0.85
    }));
    return { series, log, has_data: true };
  })();

  return { isOn, set, data: { floodRisk, sensors, properties, invoices, alerts, timeline, reports, services, tickets, history } };
})();
window.Demo = Demo;
