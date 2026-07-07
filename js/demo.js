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
    { sensor_id: 'S-01', name: 'Main Gate', zone: 'entrance', status: 'active', level: 28, has_data: true, trend: [40, 55, 35, 60, 45, 50, 28] },
    { sensor_id: 'S-02', name: 'North Culvert', zone: 'north', status: 'active', level: 19, has_data: true, trend: [30, 25, 40, 20, 35, 28, 19] },
    { sensor_id: 'S-03', name: 'East Channel', zone: 'east', status: 'active', level: 41, has_data: true, trend: [50, 60, 70, 55, 65, 72, 41] },
    { sensor_id: 'S-04', name: 'South Drain', zone: 'south', status: 'active', level: 23, has_data: true, trend: [35, 30, 45, 38, 33, 40, 23] }
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

  return { isOn, set, data: { floodRisk, sensors, properties, invoices, alerts, timeline, reports, services } };
})();
window.Demo = Demo;
