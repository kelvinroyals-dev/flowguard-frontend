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
  // Bayo Akinwale manages Sunrise Court Estate — 8 Sentinel nodes across the estate.
  // Every other demo collection reconciles to this one story.
  const _now = Date.now();
  const _ago = mins => new Date(_now - mins * 60e3).toISOString();
  const sensors = [
    { sensor_id: 'S-01', name: 'Main Gate', zone: 'entrance', status: 'active', device_variant: 'basic', level: 28, flow_rate: 12.4, silt_level: 18, battery_percent: 88, signal_strength: 82, last_ping: _ago(2), ping_interval: 'Every 15 min', temperature: 27.4, has_data: true, trend: [40, 55, 35, 60, 45, 50, 28], enzyme: null },
    { sensor_id: 'S-02', name: 'North Culvert', zone: 'north', status: 'active', device_variant: 'bio_dispenser', level: 19, flow_rate: 8.1, silt_level: 42, battery_percent: 71, signal_strength: 64, last_ping: _ago(1), ping_interval: 'Every 15 min', temperature: 26.9, has_data: true, trend: [30, 25, 40, 20, 35, 28, 19],
      enzyme: { level_percent: 64, status: 'dispensing', capacity_ml: 5000, days_left: 21 } },
    { sensor_id: 'S-03', name: 'East Channel', zone: 'east', status: 'active', device_variant: 'bio_dispenser', level: 41, flow_rate: 18.7, silt_level: 71, battery_percent: 54, signal_strength: 77, last_ping: _ago(3), ping_interval: 'Every 15 min', temperature: 28.1, has_data: true, trend: [50, 60, 70, 55, 65, 72, 41],
      enzyme: { level_percent: 11, status: 'due_replacement', capacity_ml: 5000, days_left: 3 } },
    { sensor_id: 'S-04', name: 'South Drain', zone: 'south', status: 'active', device_variant: 'basic', level: 23, flow_rate: 9.6, silt_level: 25, battery_percent: 92, signal_strength: 58, last_ping: _ago(4), ping_interval: 'Every 15 min', temperature: 27.0, has_data: true, trend: [35, 30, 45, 38, 33, 40, 23], enzyme: null },
    { sensor_id: 'S-05', name: 'West Outfall', zone: 'west', status: 'active', device_variant: 'bio_dispenser', level: 33, flow_rate: 14.2, silt_level: 30, battery_percent: 79, signal_strength: 71, last_ping: _ago(2), ping_interval: 'Every 15 min', temperature: 26.5, has_data: true, trend: [28, 34, 30, 38, 32, 36, 33],
      enzyme: { level_percent: 78, status: 'loaded', capacity_ml: 5000, days_left: 34 } },
    { sensor_id: 'S-06', name: 'Central Junction', zone: 'central', status: 'active', device_variant: 'basic', level: 37, flow_rate: 16.0, silt_level: 48, battery_percent: 66, signal_strength: 69, last_ping: _ago(5), ping_interval: 'Every 15 min', temperature: 27.8, has_data: true, trend: [42, 38, 45, 40, 35, 39, 37], enzyme: null },
    { sensor_id: 'S-07', name: 'Lakeside Inlet', zone: 'north', status: 'active', device_variant: 'bio_dispenser', level: 26, flow_rate: 10.5, silt_level: 22, battery_percent: 45, signal_strength: 52, last_ping: _ago(6), ping_interval: 'Every 15 min', temperature: 26.2, has_data: true, trend: [30, 28, 32, 25, 27, 29, 26],
      enzyme: { level_percent: 45, status: 'dispensing', capacity_ml: 5000, days_left: 14 } },
    { sensor_id: 'S-08', name: 'Marina Culvert', zone: 'east', status: 'offline', device_variant: 'basic', level: null, flow_rate: null, silt_level: null, battery_percent: 8, signal_strength: null, last_ping: _ago(220), ping_interval: 'Every 15 min', temperature: null, has_data: false, trend: [], enzyme: null }
  ];

  // Derive flood-risk counts FROM the sensor array so the numbers are always consistent
  const _online = sensors.filter(s => s.status === 'active').length;
  const _levels = sensors.filter(s => s.level != null).map(s => s.level);
  const floodRisk = {
    has_data: true, risk_index: 27, level: 'low',
    peak_level: Math.max(..._levels), avg_level: Math.round(_levels.reduce((a, b) => a + b, 0) / _levels.length),
    sensors_online: _online, sensors_total: sensors.length, reading_count: _levels.length
  };

  const properties = [
    { property_id: 'PROP-DEMO-1', property_name: 'Sunrise Court Estate', city: 'Lekki', state: 'Lagos', status: 'monitoring_active', property_type: 'residential_estate', monthly_fee: 185000, sensors_online: 7,
      address_line1: '12 Admiralty Way', total_area_sqm: 15400, number_of_units: 64, number_of_buildings: 12, estimated_population: 480,
      contact_person_name: 'Bayo Akinwale', contact_person_role: 'Facility Manager', contact_phone: '+234 802 345 6789',
      issue_description: 'Recurring flooding at the main gate after heavy rain, and standing water along the east perimeter road that takes days to clear.',
      urgency_level: 'high', preferred_inspection_date: '2026-07-18', preferred_inspection_time: 'morning', created_at: '2026-06-20' },
    { property_id: 'PROP-DEMO-2', property_name: 'Palm Gardens', city: 'Ajah', state: 'Lagos', status: 'inspection_scheduled', property_type: 'residential_estate',
      address_line1: '7 Palm Grove Crescent', total_area_sqm: 8900, number_of_units: 28, number_of_buildings: 5, estimated_population: 210,
      contact_person_name: 'Ngozi Okafor', contact_person_role: 'Estate Chairperson', contact_phone: '+234 805 111 2222',
      issue_description: 'Blocked culvert near the entrance causes water to back up onto the access road during storms.',
      urgency_level: 'medium', created_at: '2026-07-02' },
    { property_id: 'PROP-DEMO-3', property_name: 'Marina Heights', city: 'Victoria Island', state: 'Lagos', status: 'submitted', property_type: 'commercial_complex',
      address_line1: '3 Ozumba Mbadiwe Avenue', total_area_sqm: 22000, number_of_buildings: 3, estimated_population: 1200,
      contact_person_name: 'Tunde Bello', contact_person_role: 'Operations Lead', contact_phone: '+234 809 333 4444',
      issue_description: 'Basement car park floods during exceptionally heavy rainfall; drainage pumps appear undersized.',
      urgency_level: 'critical', created_at: '2026-07-09' }
  ];

  const invoices = [
    { invoice_id: 'INV-DEMO-1', invoice_type: 'monthly', total_amount: 185000, payment_status: 'pending', issue_date: '2026-07-04', due_date: '2026-07-18' },
    { invoice_id: 'INV-DEMO-2', invoice_type: 'monthly', total_amount: 185000, payment_status: 'paid', issue_date: '2026-06-02', due_date: '2026-06-16' },
    { invoice_id: 'INV-DEMO-3', invoice_type: 'monthly', total_amount: 185000, payment_status: 'paid', issue_date: '2026-05-03', due_date: '2026-05-17' }
  ];

  const alerts = [
    { type: 'critical', severity: 'critical', status: 'active', title: 'Marina Culvert node offline', description: 'Node S-08 stopped reporting ~3.5 hrs ago — battery critically low (8%)', created_at: '3 hours ago' },
    { type: 'critical', severity: 'critical', status: 'active', title: 'East Channel silt high', description: 'Silt at 71% — clearing recommended', created_at: '12 min ago' },
    { type: 'warning', severity: 'warning', status: 'active', title: 'Bio-enzyme low — East Channel', description: 'Cartridge at 11%, refill due in ~3 days', created_at: '40 min ago' },
    { type: 'warning', severity: 'warning', status: 'active', title: 'Light rain expected', description: 'Tomorrow, 14:00–18:00 · drainage clear', created_at: '1 hour ago' },
    { type: 'info', severity: 'info', status: 'resolved', title: 'Sensor check passed', description: '7 of 8 nodes reporting normally', created_at: '2 hours ago', resolved_at: '2026-07-07' },
    { type: 'info', severity: 'info', status: 'resolved', title: 'East Channel cleared', description: 'Scheduled maintenance completed', created_at: 'Yesterday', resolved_at: '2026-07-06' }
  ];

  const timeline = [
    { status: 'done', title: 'Area submitted', sub: 'Sunrise Court Estate · Lekki, Lagos', when: '5 Jul' },
    { status: 'done', title: 'Inspection completed', sub: 'Drainage assessed, plan approved', when: '8 Jul' },
    { status: 'now', title: 'Monitoring active', sub: '8 nodes across the estate, reporting every 15 min', when: 'Now' },
    { status: 'pending', title: 'First maintenance', sub: 'Bio-treatment + channel clearing', when: '18 Jul' }
  ];

  const reports = [
    { report_id: 'RPT-1', title: 'Initial drainage inspection', property_name: 'Sunrise Court Estate', status: 'sent', sent_to_client_at: '2026-07-08', created_at: '2026-07-08',
      drainage_condition_score: 72, flood_risk_level: 'moderate',
      findings: 'Primary channels are clear and flowing well. Two secondary drains along the east perimeter show early silt accumulation (approx. 30% capacity reduction). Gate-area gulley is functioning but would benefit from a debris screen.',
      recommendations: 'Schedule silt clearing for the east perimeter drains within 3 weeks. Install a debris screen at the main gate gulley before peak rainfall. Continue monthly sensor monitoring.' },
    { report_id: 'RPT-2', title: 'Channel capacity assessment', property_name: 'Sunrise Court Estate', status: 'sent', sent_to_client_at: '2026-07-08', created_at: '2026-07-08',
      drainage_condition_score: 58, flood_risk_level: 'high',
      findings: 'Main outfall channel is operating near capacity during heavy rainfall. Downstream constriction identified at the road culvert crossing.',
      recommendations: 'Prioritise clearing of the road culvert. Consider a Tier-2 upgrade for automated flow monitoring at the outfall.' },
    { report_id: 'RPT-3', title: 'Monthly monitoring summary — June', property_name: 'Palm Gardens', status: 'in_progress', created_at: '2026-06-30' }
  ];

  const services = [
    { key: 'sentinel', name: 'Sentinel Network', desc: 'IoT drainage monitoring', status: 'active', detail: '7 of 8 nodes online', icon: 'sensor' },
    { key: 'biotreatment', name: 'Bio-Treatment', desc: 'Biological drainage prevention', status: 'active', detail: 'Last applied 2 Jul', icon: 'drop' },
    { key: 'dispatch', name: 'Heavy-Plant Dispatch', desc: 'Clearing & maintenance crews', status: 'scheduled', detail: 'Next visit 18 Jul', icon: 'truck' }
  ];

  const tickets = [
    { ticket_id: 'TKT-1045', subject: 'Marina Culvert node offline', category: 'sensor', priority: 'high', status: 'in_progress', created_at: '2026-07-10', description: 'Node S-08 (Marina Culvert) stopped reporting this morning.',
      messages: [
        { author_type: 'client', author_name: 'You', message: 'The Marina Culvert node dropped offline this morning — dashboard shows battery at 8%. Can you check it?', created_at: '2026-07-10' },
        { author_type: 'support', author_name: 'FlowGuard Support', message: 'Thanks Bayo — the node battery is depleted. We have scheduled a field visit to replace it during the 18 Jul maintenance window. Monitoring for that zone is covered by the East Channel node in the meantime.', created_at: '2026-07-10' }
      ] },
    { ticket_id: 'TKT-1042', subject: 'East Channel silt buildup', category: 'dispatch', priority: 'high', status: 'in_progress', created_at: '2026-07-06', description: 'Silt level reading high, requesting crew.',
      messages: [
        { author_type: 'client', author_name: 'You', message: 'Silt level reading high at East Channel, requesting a clearing crew.', created_at: '2026-07-06' },
        { author_type: 'support', author_name: 'FlowGuard Support', message: 'Thanks — we\'ve logged this and a Heavy-Plant Dispatch crew is scheduled for 8 Jul. We\'ll confirm the window shortly.', created_at: '2026-07-06' }
      ] },
    { ticket_id: 'TKT-1038', subject: 'Node S-02 intermittent', category: 'sensor', priority: 'normal', status: 'resolved', created_at: '2026-07-02', description: 'North Culvert node dropped offline twice.' },
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

  const contract = {
    subscription: { plan: 'FlowGuard', tier: 'flowguard', monthly_fee: 185000, next_billing: '2026-08-01' },
    sla: { uptime_guarantee: 98, uptime: 99.8, response_time: '4h' }
  };

  return { isOn, set, data: { floodRisk, sensors, properties, invoices, alerts, timeline, reports, services, tickets, history, contract } };
})();
window.Demo = Demo;
