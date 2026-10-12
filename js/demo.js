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
  // AUTO marks demo that WE switched on (new signup, so the dashboard isn't
  // empty during the tour) rather than a choice the client made. Only auto demo
  // is switched off again once they have real properties — an explicit choice
  // is never overridden.
  const AUTO = 'flowguard_demo_auto';

  function isOn()   { return localStorage.getItem(KEY) === 'true'; }
  function isAuto() { return localStorage.getItem(AUTO) === 'true'; }
  // Sessions that pre-date the AUTO flag: demo is on but we never recorded who
  // switched it on. Treat those as auto once (a one-time migration) so they also
  // step aside for real data; afterwards the flag is always written explicitly.
  function isLegacyAuto() { return isOn() && localStorage.getItem(AUTO) === null; }

  // Explicit user action (Settings toggle) — clears the auto flag so their
  // choice sticks.
  async function set(on) {
    localStorage.setItem(KEY, on ? 'true' : 'false');
    localStorage.setItem(AUTO, 'false');
    // best-effort backend sync (non-blocking, honest failure)
    try { await apiRequest('/preferences', { method: 'PUT', body: { show_demo_data: on } }); }
    catch (_) { /* offline is fine; localStorage is source of truth for the toggle */ }
  }

  // Automatic enable/disable (signup, or once real properties exist).
  async function setAuto(on) {
    localStorage.setItem(KEY, on ? 'true' : 'false');
    localStorage.setItem(AUTO, on ? 'true' : 'false');
    try { await apiRequest('/preferences', { method: 'PUT', body: { show_demo_data: on } }); }
    catch (_) { /* non-blocking */ }
  }

  // ---- Sample data (only used when the toggle is ON) ----
  // Bayo Akinwale manages Sunrise Court Estate — 8 Sentinel nodes across the estate.
  // Every other demo collection reconciles to this one story.
  const _now = Date.now();
  const dateAt=offset=>new Date(_now+offset*864e5).toISOString().slice(0,10);
  const _ago = mins => new Date(_now - mins * 60e3).toISOString();
  const sensors = [
    { property_id: 'PROP-DEMO-1', sensor_id: 'S-01', name: 'Main Gate', zone: 'entrance', status: 'active', device_variant: 'basic', level: 52, flow_rate: 16.8, silt_level: 38, battery_percent: 88, signal_strength: 82, last_ping: _ago(2), ping_interval: 'Every 15 min', temperature: 27.4, has_data: true, trend: [58, 70, 52, 74, 61, 66, 52] },
    { property_id: 'PROP-DEMO-1', sensor_id: 'S-02', name: 'North Culvert', zone: 'north', status: 'active', device_variant: 'basic', level: 44, flow_rate: 11.3, silt_level: 58, battery_percent: 71, signal_strength: 64, last_ping: _ago(1), ping_interval: 'Every 15 min', temperature: 26.9, has_data: true, trend: [50, 44, 58, 40, 52, 47, 44] },
    { property_id: 'PROP-DEMO-1', sensor_id: 'S-03', name: 'East Channel', zone: 'east', status: 'active', device_variant: 'basic', level: 78, flow_rate: 24.6, silt_level: 84, battery_percent: 54, signal_strength: 77, last_ping: _ago(3), ping_interval: 'Every 15 min', temperature: 28.1, has_data: true, trend: [66, 74, 85, 70, 80, 88, 78] },
    { property_id: 'PROP-DEMO-1', sensor_id: 'S-04', name: 'South Drain', zone: 'south', status: 'active', device_variant: 'basic', level: 49, flow_rate: 13.1, silt_level: 41, battery_percent: 92, signal_strength: 58, last_ping: _ago(4), ping_interval: 'Every 15 min', temperature: 27.0, has_data: true, trend: [52, 46, 60, 54, 49, 56, 49] },
    { property_id: 'PROP-DEMO-1', sensor_id: 'S-05', name: 'West Outfall', zone: 'west', status: 'active', device_variant: 'basic', level: 57, flow_rate: 18.4, silt_level: 46, battery_percent: 79, signal_strength: 71, last_ping: _ago(2), ping_interval: 'Every 15 min', temperature: 26.5, has_data: true, trend: [50, 57, 52, 61, 55, 59, 57] },
    { property_id: 'PROP-DEMO-1', sensor_id: 'S-06', name: 'Central Junction', zone: 'central', status: 'active', device_variant: 'basic', level: 61, flow_rate: 20.2, silt_level: 64, battery_percent: 66, signal_strength: 69, last_ping: _ago(5), ping_interval: 'Every 15 min', temperature: 27.8, has_data: true, trend: [63, 58, 66, 60, 55, 60, 61] },
    { property_id: 'PROP-DEMO-1', sensor_id: 'S-07', name: 'Lakeside Inlet', zone: 'north', status: 'active', device_variant: 'basic', level: 48, flow_rate: 14.7, silt_level: 35, battery_percent: 45, signal_strength: 52, last_ping: _ago(6), ping_interval: 'Every 15 min', temperature: 26.2, has_data: true, trend: [51, 48, 53, 45, 47, 50, 48] },
    { property_id: 'PROP-DEMO-1', sensor_id: 'S-08', name: 'Marina Culvert', zone: 'east', status: 'offline', device_variant: 'basic', level: null, flow_rate: null, silt_level: null, battery_percent: 8, signal_strength: null, last_ping: _ago(220), ping_interval: 'Every 15 min', temperature: null, has_data: false, trend: [] }
  ];

  // Derive flood-risk counts FROM the sensor array so the numbers are always consistent
  const _online = sensors.filter(s => s.status === 'active').length;
  const _levels = sensors.filter(s => s.level != null).map(s => s.level);
  const floodRisk = {
    has_data: true, risk_index: 58, level: 'moderate',
    peak_level: Math.max(..._levels), avg_level: Math.round(_levels.reduce((a, b) => a + b, 0) / _levels.length),
    sensors_online: _online, sensors_total: sensors.length, reading_count: _levels.length
  };

  const properties = [
    { property_id: 'PROP-DEMO-1', property_name: 'Sunrise Court Estate', city: 'Lekki', state: 'Lagos', status: 'monitoring_active', property_type: 'residential_estate', monthly_fee: 185000, sensors_online: 7,
      address_line1: '12 Admiralty Way', total_area_sqm: 15400, number_of_units: 64, number_of_buildings: 12, estimated_population: 480,
      contact_person_name: 'Bayo Akinwale', contact_person_role: 'Facility Manager', contact_phone: '+234 802 345 6789',
      issue_description: 'Recurring flooding at the main gate after heavy rain, and standing water along the east perimeter road that takes days to clear.',
      urgency_level: 'high', preferred_inspection_date: dateAt(8), preferred_inspection_time: 'morning', created_at: dateAt(-20) },
    { property_id: 'PROP-DEMO-2', property_name: 'Palm Gardens', city: 'Ajah', state: 'Lagos', status: 'inspection_scheduled', property_type: 'residential_estate',
      address_line1: '7 Palm Grove Crescent', total_area_sqm: 8900, number_of_units: 28, number_of_buildings: 5, estimated_population: 210,
      contact_person_name: 'Ngozi Okafor', contact_person_role: 'Estate Chairperson', contact_phone: '+234 805 111 2222',
      issue_description: 'Blocked culvert near the entrance causes water to back up onto the access road during storms.',
      urgency_level: 'medium', created_at: dateAt(-8) },
    { property_id: 'PROP-DEMO-3', property_name: 'Marina Heights', city: 'Victoria Island', state: 'Lagos', status: 'submitted', property_type: 'commercial_complex',
      address_line1: '3 Ozumba Mbadiwe Avenue', total_area_sqm: 22000, number_of_buildings: 3, estimated_population: 1200,
      contact_person_name: 'Tunde Bello', contact_person_role: 'Operations Lead', contact_phone: '+234 809 333 4444',
      issue_description: 'Basement car park floods during exceptionally heavy rainfall; drainage pumps appear undersized.',
      urgency_level: 'critical', created_at: dateAt(-1) }
  ];

  const invoices = [
    { invoice_id: 'INV-DEMO-1', invoice_type: 'monthly', total_amount: 185000, payment_status: 'pending', issue_date: dateAt(-6), due_date: dateAt(8) },
    { invoice_id: 'INV-DEMO-2', invoice_type: 'monthly', total_amount: 185000, payment_status: 'paid', issue_date: dateAt(-38), due_date: dateAt(-24) },
    { invoice_id: 'INV-DEMO-3', invoice_type: 'monthly', total_amount: 185000, payment_status: 'paid', issue_date: dateAt(-68), due_date: dateAt(-54) }
  ];

  const alerts = [
    { property_id: 'PROP-DEMO-1', type: 'critical', severity: 'critical', status: 'active', title: 'Marina Culvert device is not sending updates', description: 'We cannot see the current water level here. The device battery was very low (8%) when it last sent an update.', created_at: '3 hours ago' },
    { property_id: 'PROP-DEMO-1', type: 'critical', severity: 'critical', status: 'active', title: 'East Channel silt high', description: 'Silt at 84% — clearing urgently recommended', created_at: '12 min ago' },
    { property_id: 'PROP-DEMO-1', type: 'warning', severity: 'warning', status: 'active', title: 'Light rain expected', description: 'Tomorrow, 14:00–18:00 · drainage clear', created_at: '1 hour ago' },
    { property_id: 'PROP-DEMO-1', type: 'info', severity: 'info', status: 'resolved', title: 'Device check passed', description: '7 of 8 devices are sending updates', created_at: '2 hours ago', resolved_at: dateAt(-3) },
    { property_id: 'PROP-DEMO-1', type: 'info', severity: 'info', status: 'resolved', title: 'East Channel cleared', description: 'Scheduled maintenance completed', created_at: 'Yesterday', resolved_at: dateAt(-4) }
  ];

  const timeline = [
    { status: 'done', title: 'Property submitted', sub: 'Sunrise Court Estate · Lekki, Lagos', when: '5 Jul' },
    { status: 'done', title: 'Inspection completed', sub: 'Drainage assessed, plan approved', when: '8 Jul' },
    { status: 'now', title: 'Monitoring active', sub: '8 nodes across the estate, reporting every 15 min', when: 'Now' },
    { status: 'pending', title: 'First maintenance', sub: 'Channel clearing', when: '18 Jul' }
  ];

  const reports = [
    { report_id: 'RPT-1', title: 'Initial drainage inspection', property_name: 'Sunrise Court Estate', status: 'sent', sent_to_client_at: dateAt(-2), created_at: dateAt(-2),
      drainage_condition_score: 61, flood_risk_level: 'high',
      findings: 'Primary channels are clear and flowing well. Two secondary drains along the east perimeter show early silt accumulation (approx. 30% capacity reduction). Gate-area gulley is functioning but would benefit from a debris screen.',
      recommendations: 'Schedule silt clearing for the east perimeter drains within 3 weeks. Install a debris screen at the main gate gulley before peak rainfall. Continue monthly sensor monitoring.' },
    { report_id: 'RPT-2', title: 'Channel capacity assessment', property_name: 'Sunrise Court Estate', status: 'sent', sent_to_client_at: dateAt(-2), created_at: dateAt(-2),
      drainage_condition_score: 47, flood_risk_level: 'high',
      findings: 'Main outfall channel is operating near capacity during heavy rainfall. Downstream constriction identified at the road culvert crossing.',
      recommendations: 'Prioritise clearing of the road culvert. Consider a Tier-2 upgrade for automated flow monitoring at the outfall.' },
    { report_id: 'RPT-3', title: 'Inspection preparation summary', property_name: 'Palm Gardens', status: 'in_progress', created_at: dateAt(-10) }
  ];

  const services = [
    { key: 'sentinel', name: 'Sentinel Network', desc: 'IoT drainage monitoring', status: 'active', detail: '7 of 8 nodes online', icon: 'sensor' },
    { key: 'dispatch', name: 'Heavy-Plant Dispatch', desc: 'Clearing & maintenance crews', status: 'scheduled', detail: 'Next visit 18 Jul', icon: 'truck' }
  ];

  const tickets = [
    { sensor_id:'S-08',alert_id:'ALERT-1',ticket_id: 'TKT-1045', subject: 'Marina Culvert node offline', category: 'sensor', priority: 'high', status: 'in_progress', created_at: dateAt(0), description: 'Node S-08 (Marina Culvert) stopped reporting this morning.',
      messages: [
        { author_type: 'client', author_name: 'You', message: 'The Marina Culvert node dropped offline this morning — dashboard shows battery at 8%. Can you check it?', created_at: dateAt(0) },
        { author_type: 'support', author_name: 'FlowGuard Support', message: 'Thanks Bayo — the node battery is depleted. We have scheduled a field visit to replace it during the 18 Jul maintenance window. Monitoring for that zone is covered by the East Channel node in the meantime.', created_at: dateAt(0) }
      ] },
    { ticket_id: 'TKT-1042', subject: 'East Channel silt buildup', category: 'dispatch', priority: 'high', status: 'in_progress', created_at: dateAt(-4), description: 'Silt level reading high, requesting crew.',
      messages: [
        { author_type: 'client', author_name: 'You', message: 'Silt level reading high at East Channel, requesting a clearing crew.', created_at: dateAt(-4) },
        { author_type: 'support', author_name: 'FlowGuard Support', message: 'Thanks — we\'ve logged this and a Heavy-Plant Dispatch crew is scheduled for 8 Jul. We\'ll confirm the window shortly.', created_at: dateAt(-4) }
      ] },
    { ticket_id: 'TKT-1038', subject: 'North Culvert device lost connection', category: 'sensor', priority: 'normal', status: 'resolved', created_at: dateAt(-8), description: 'The device at North Culvert stopped sending updates twice.' },
    { ticket_id: 'TKT-1031', subject: 'Monitoring invoice query', category: 'billing', priority: 'low', status: 'resolved', created_at: dateAt(-12), description: 'Question about pro-rating.' }
  ];

  // hourly average water level for the last 24h (chart series) + a reading log
  const history = (() => {
    const now = Date.now();
    const series = Array.from({ length: 24 }, (_, i) => {
      const base = 25 + Math.sin(i / 3) * 12 + (i > 16 ? (i - 16) * 2 : 0);
      return { t: new Date(now - (23 - i) * 3600e3).toISOString(), avg: Math.round(base), peak: Math.round(base + 8), flow: Math.round((9 + Math.sin(i / 2.5) * 4 + (i > 16 ? (i - 16) * 1.2 : 0)) * 10) / 10 };
    });
    const names = ['Main Gate', 'North Culvert', 'East Channel', 'South Drain'];
    const log = Array.from({ length: 20 }, (_, i) => ({
      time: new Date(now - i * 22 * 60e3).toISOString(),
      sensor: names[i % 4],
      level: 18 + Math.round(15),
      flow: +(6 + 7).toFixed(1),
      debris: false
    }));
    return { series, log, has_data: true };
  })();

  const contract = {
    subscription: { plan: 'FlowGuard', tier: 'flowguard', monthly_fee: 185000, next_billing: dateAt(22) },
    sla: { uptime_guarantee: 98, uptime: 99.8, response_time: '4h' }
  };

  const activity = [
    { type: 'dispatch', title: 'Bayo Akinwale requested heavy-plant dispatch', sub: 'East Channel silt clearing', when: 'Yesterday' },
    { type: 'report', title: 'FlowGuard Ops sent inspection report', sub: 'Sunrise Court Estate · score 72/100', when: '8 Jul' },
    { type: 'team', title: 'Field Team Alpha checked in on site', sub: 'Sunrise Court Estate — initial inspection', when: '8 Jul' },
    { type: 'inspection', title: 'FlowGuard Ops scheduled an inspection', sub: 'Confirmed for 8 Jul, morning window', when: '6 Jul' },
    { type: 'payment', title: 'Payment attempted — ₦185,000', sub: 'July invoice · successful', when: '4 Jul' },
    { type: 'property', title: 'Bayo Akinwale updated property details', sub: 'Sunrise Court Estate', when: '3 Jul' },
    { type: 'property', title: 'Bayo Akinwale registered a new property', sub: 'Sunrise Court Estate · Lekki, Lagos', when: '20 Jun' }
  ];

  const outcomes = {
    protected_since: dateAt(-20), days_since_flood: 34, flood_free_basis: 'last_incident',
    clearings: 3, dispatches: 4, incidents_prevented: 5, maintenance_visits: 3,
    recent_events: [
      { event_type: 'silt_clearing', label: 'Clearing', occurred_at: new Date(Date.now() - 52 * 864e5).toISOString() },
      { event_type: 'silt_clearing', label: 'Drain clearing', occurred_at: new Date(Date.now() - 21 * 864e5).toISOString() },
    ],
  };
  // 90-day health series: rough start, dips when East Channel silted, climbing since clearings
  const healthHistory = (() => {
    const out = []; let score = 45;
    for (let i = 89; i >= 0; i--) {
      const day = new Date(Date.now() - i * 864e5);
      if (i === 60) score = 41;         // silt buildup found
      else if (i === 52) score = 50;    // first clearing
      else if (i === 30) score = 47;    // rainy spell strain
      else if (i === 21) score = 56;    // second drain clearing
      else if (i === 3) score = 63;
      else score += (Math.sin(i * 1.7) * 0.8);
      score = Math.max(36, Math.min(70, score));
      out.push({ score: Math.round(i === 0 ? 66 : score), recorded_at: day.toISOString().slice(0, 10) });
    }
    return out;
  })();


  floodRisk.property_id='PROP-DEMO-1';
  properties.forEach(p=>{p.preferred_inspection_date=dateAt(7);});
  properties[0].latitude=6.4478;properties[0].longitude=3.5476;
  properties[1].latitude=6.47;properties[1].longitude=3.6;
  properties[2].latitude=6.43;properties[2].longitude=3.42;
  reports.forEach(r=>{r.property_id=properties.find(p=>p.property_name===r.property_name)?.property_id;});
  invoices.forEach(i=>{i.property_id='PROP-DEMO-1';i.property_name='Sunrise Court Estate';});
  tickets.forEach(t=>{t.property_id='PROP-DEMO-1';});
  const oldDispatch=tickets.findIndex(t=>t.category==='dispatch');if(oldDispatch>=0)tickets.splice(oldDispatch,1);
  tickets[0].subject='Marina Culvert device is not sending updates';
  tickets[0].description='The device at Marina Culvert stopped sending updates this morning. Please help me check what is wrong.';
  tickets[0].messages=[{author_type:'client',author_name:'You',message:tickets[0].description,created_at:tickets[0].created_at},{author_type:'support',author_name:'FlowGuard Support',message:'Thank you for letting us know. We cannot see the current water level at Marina Culvert while the device is offline. If you need someone to check the device on site, choose “Request a device check”. The provider will need to confirm the visit. No visit has been booked yet.',created_at:tickets[0].created_at}];
  alerts.forEach((a,i)=>{a.id='ALERT-'+[1,2,4,5,6][i];a.created_at=_ago([220,12,60,120,1440][i]);const sensor=sensors.find(s=>a.title.includes(s.name));if(sensor)a.sensor_id=sensor.sensor_id;});
  alerts.find(a=>a.title==='Light rain expected').description='Regional weather context; not evidence of flooding or clear drainage.';
  Object.assign(alerts.find(a=>a.title==='Light rain expected'),{type:'info',severity:'info'});
  alerts.push({id:'ALERT-7',property_id:'PROP-DEMO-1',sensor_id:'S-03',type:'critical',severity:'critical',status:'active',title:'East Channel high water level',description:'Water is at 78%, above the 70% alert level. Check the area from a safe place and request a drain inspection.',created_at:_ago(3)});
  contract.subscription.plan='Infrastructure monitoring';contract.subscription.tier='Monitoring';contract.subscription.next_billing=dateAt(22);
  healthHistory.forEach(x=>x.property_id='PROP-DEMO-1');healthHistory.at(-1).score=67;
  const notifications=[
    {id:'N-1',title:'Inspection report available',message:'Initial drainage inspection is ready to review.',type:'report',read:false,created_at:_ago(20),target_tab:'reportDetail',target_id:'RPT-1'},
    {id:'N-2',title:'Service request received',message:'Inspect the north collector is awaiting review. No provider dispatch is confirmed.',type:'service',read:false,created_at:_ago(40),link:'#service-request/11111111-1111-4111-8111-111111111111'},
    {id:'N-3',title:'Invoice available',message:'Your monitoring invoice is available in Billing.',type:'billing',read:true,created_at:_ago(120),link:'#invoice/'+invoices[0].invoice_id}
  ];
  return { isOn, isAuto, isLegacyAuto, set, setAuto, data: { notifications, activity, outcomes, healthHistory, floodRisk, sensors, properties, invoices, alerts, timeline, reports, services, tickets, history, contract } };
})();
window.Demo = Demo;
