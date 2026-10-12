/* Customer guidance: facts first, optional AI briefing second. No automatic actions. */
window.ClientGuide=(()=>{
  const esc=v=>UI.esc(v);
  function sceneFor(sensors){
    if(!Array.isArray(sensors))return 'unknown';
    if(sensors.some(s=>PortalModel.waterState(s)==='high'))return 'high-water';
    if(sensors.some(s=>s.status==='offline'))return 'offline';
    if(sensors.some(s=>PortalModel.observationState(s)!=='recent'))return 'unknown';
    if(sensors.some(s=>s.silt_level!=null&&Number(s.silt_level)>=70))return 'silt';
    return sensors.length?'normal':'setup';
  }
  const scenes={
    'high-water':{file:'guide-high-water-inspection-device-v2.png',alt:'High water contained below a dry estate road, with the FlowGuard device and a professional assessing the drain safely.',caption:'Illustration · a visit still needs confirmation.'},
    offline:{file:'guide-offline-device-v1.png',alt:'FlowGuard device with unlit indicators awaiting a device check. The drain water level is not shown.',caption:'Illustration · current water level is unknown.'},
    unknown:{file:'guide-unknown-device-v1.png',alt:'FlowGuard device beside an obscured drain and a clock, indicating missing recent readings.',caption:'Illustration · current conditions are unknown.'},
    normal:{file:'guide-normal-device-v1.png',alt:'FlowGuard monitoring device beside an estate drain with a low stream.',caption:'Illustration · refer to the latest readings.'},
    silt:{file:'guide-silt-device-v1.png',alt:'Sediment restricting an estate drain while a professional assesses it from dry pavement.',caption:'Illustration · a visit still needs confirmation.'},
    setup:{file:'guide-setup-device-v1.png',alt:'Estate inspection with a FlowGuard device prepared for installation.',caption:'Illustration · installation and visits need confirmation.'}
  };
  async function attach(view,screen){
    if(!['overview','monitoring','sensorDetail','forecast'].includes(screen)||!App.can('view_monitoring'))return;
    const props=await Screens.getMyProperties();
    let propertyId=props.find(p=>p.property_id===App.activeProperty())?.property_id||props[0]?.property_id;
    let sensors;
    try{sensors=Demo.isOn()?Demo.data.sensors:(await apiRequest('/monitoring/sensors')).data;}catch(_){sensors=null;}
    if(!view.isConnected)return;
    const recordId=decodeURIComponent(location.hash.split('/')[1]||'');
    if(screen==='sensorDetail'){const record=sensors?.find(s=>String(s.sensor_id||s.id)===recordId);if(props.some(p=>p.property_id===record?.property_id))propertyId=record.property_id;}
    sensors=sensors&&PortalModel.scope(sensors,props,propertyId);
    if(screen==='sensorDetail')sensors=sensors?.filter(s=>String(s.sensor_id||s.id)===recordId);
    const high=sensors?.filter(s=>PortalModel.waterState(s)==='high')||[];
    const offline=sensors?.filter(s=>s.status==='offline')||[];
    const uncertain=sensors?.filter(s=>PortalModel.observationState(s)!=='recent')||[];
    const silt=sensors?.filter(s=>s.silt_level!=null&&Number(s.silt_level)>=70)||[];
    const first=high[0]||offline[0]||uncertain[0]||silt[0];
    const urgent=high.length>0;
    const unavailable=!Array.isArray(sensors);
    const property=props.find(p=>p.property_id===propertyId);
    const inspectionPending=!unavailable&&!sensors.length&&property?.status==='inspection_scheduled';
    const sceneKey=sceneFor(sensors),scene=scenes[sceneKey];
    const title=unavailable?'We couldn’t load your updates.':urgent?'Water is high. Let’s arrange a check.':offline.length?'Let’s get your updates back.':uncertain.length?'Let’s check the missing updates.':sceneKey==='silt'?'Silt is building up. Let’s arrange a check.':sensors?.length?'No high water reported.':inspectionPending?'Your inspection is the next step.':'Let’s get your property connected.';
    const meaning=unavailable?'Monitoring information is unavailable right now. This does not mean water levels are safe.':urgent?`${first.name||'A monitoring point'}: ${PortalModel.levelText(first)} water level. Above the alert level; flooding is not confirmed.`:offline.length?`No current reading from ${first.name||'this device'}. The water level there is unknown.`:uncertain.length?'Some readings are missing or old. Current conditions are unknown at those locations.':sceneKey==='silt'?'A device reports high silt. Sediment may restrict drainage; arrange an inspection before conditions worsen.':sensors?.length?'No high water reported. Keep watching for new alerts.':'There are no connected monitoring devices for this property yet.';
    const next=unavailable?'Try Refresh readings. If updates still do not load, contact FlowGuard for help.':urgent?'Arrange a provider inspection. Keep away from moving water and open drains.':offline.length?'Request a device check. Report any water building up to your estate manager.':sceneKey==='silt'?'Arrange a drain inspection and ask the provider whether clearing is needed. Keep away from open drains.':inspectionPending?'Review your property’s inspection status and contact details. A preferred date is not a confirmed appointment.':'See a blockage or water building up? Ask your estate manager to arrange a check.';
    const observations=(sensors||[]).map(s=>Date.parse(s.last_ping)).filter(Number.isFinite);
    const lastReport=observations.length?new Date(Math.max(...observations)).toISOString():null;
    const freshness=lastReport?'Latest device update: '+UI.fmtTime(lastReport)+' WAT.':'No reliable device report time supplied.';
    const staleHigh=high.some(s=>PortalModel.observationState(s)!=='recent');
    const guide=document.createElement('section');guide.className='client-guide'+(urgent?' urgent':'');
    const top=view.querySelector('.top');
    if(top&&!top.querySelector('[data-refresh-readings]')){
      const refresh=document.createElement('button');refresh.className='btn neutral';refresh.dataset.refreshReadings='true';refresh.textContent='Refresh readings';
      refresh.addEventListener('click',()=>App.go(screen,screen==='sensorDetail'?recordId:undefined));
      const refreshSlot=screen==='overview'?view.querySelector('#ov-mon'):null;
      if(refreshSlot)refreshSlot.prepend(refresh);else (top.querySelector('.top-actions')||top).appendChild(refresh);
    }
    guide.setAttribute('aria-label','Help understanding your property');
guide.innerHTML=`<div class="guide-heading"><span class="guide-mark" aria-hidden="true">✦</span><div><span class="guide-eyebrow">FLOWGUARD GUIDE</span><h2>${esc(title)}</h2></div></div><p class="guide-freshness">${esc(freshness)}${staleHigh?' The high reading is not recent; arrange a check rather than assuming conditions have improved.':''}</p><div class="guide-columns"><div><h3>What this means</h3><p>${esc(meaning)}</p></div><div><h3>What to do next</h3><p>${esc(next)}</p></div></div><div class="guide-actions">${App.can('manage_properties')?`<button class="btn" data-service-property="${esc(propertyId)}" data-service-title="${esc(urgent?'Check high water at '+first.name:offline.length?'Check device at '+first.name:'Property inspection')}" data-service-type="${urgent?'inspection':offline.length?'sensor_maintenance':'inspection'}" ${first?`data-source-id="${esc(first.sensor_id||first.id)}"`:''}>${urgent?'Arrange an inspection':offline.length?'Request a device check':'Request a service'}</button>`:''}<button class="btn neutral" data-guide-explain>${window.PortalPreview?'Explain this to me':screen==='sensorDetail'?'AI forecast summary for this property':'AI forecast summary'}</button></div><div class="guide-answer" aria-live="polite" hidden></div><details class="guide-help"><summary>Questions you may have</summary><div class="guide-questions">${first?`<a class="btn neutral" href="#sensor/${encodeURIComponent(first.sensor_id||first.id)}">See ${esc(first.name||'the device')} →</a>`:''}<button class="btn neutral" data-guide-question="reading">What does the percentage mean?</button><button class="btn neutral" data-guide-question="visit">Is someone coming to fix it?</button><button class="btn neutral" data-guide-question="help">Who should I contact?</button></div><p class="guide-local-answer" aria-live="polite"></p></details>`;
    if(urgent)guide.querySelector('.guide-columns p').innerHTML=esc(first.name||'A monitoring point')+': <strong class="guide-water-reading">'+esc(PortalModel.levelText(first))+'</strong> water level. Above the alert level; flooding is not confirmed.';
    if(inspectionPending||unavailable){
      const action=guide.querySelector('[data-service-property]');
      if(action){const link=document.createElement('a');link.className='btn';link.href=unavailable?'#support':'#property/'+encodeURIComponent(propertyId);link.textContent=unavailable?'Contact FlowGuard':'View inspection details';action.replaceWith(link);}
    }
    if(scene){
      guide.className+=' guide-illustrated';
      guide.setAttribute('data-guide-scene',sceneKey);
      guide.innerHTML='<div class="guide-scene-layout"><div class="guide-copy">'+guide.innerHTML+'</div><figure class="guide-visual"><img src="assets/'+scene.file+'" width="1254" height="1254" alt="'+esc(scene.alt)+'" decoding="async"><figcaption>'+esc(scene.caption)+'</figcaption></figure></div>';
    }
    if(screen==='monitoring'||screen==='forecast')guide.innerHTML='<details class="guide-disclosure"><summary>Help me understand this page</summary><div class="guide-disclosure-body">'+guide.innerHTML+'</div></details>';
    const anchor=screen==='overview'?view.querySelector('#ov-kpis')||view.querySelector('.property-heading'):view.querySelector('.workspace-context')||view.querySelector('.top');
    if(anchor)anchor.after(guide);else view.prepend(guide);
    if(screen==='overview'){
      const attention=view.querySelector('#ov-attention');if(attention)attention.hidden=true;
      if(urgent&&offline.length&&screen!=='overview'){const note=document.createElement('p');note.className='guide-extra';note.innerHTML='<strong>'+offline.length+' device offline</strong> '+offline.map(s=>'<a class="btn neutral" href="#sensor/'+encodeURIComponent(s.sensor_id||s.id)+'">Check '+esc(s.name||s.sensor_id)+' →</a>').join(' ');guide.querySelector('.guide-actions').before(note);}
    }
    guide.querySelector('[data-guide-explain]').addEventListener('click',async e=>{
      const button=e.currentTarget,box=guide.querySelector('.guide-answer');box.hidden=false;
      if(window.PortalPreview||Demo.isOn()){box.innerHTML='<b>Sample explanation · not a live AI response</b><p>'+esc(meaning+' '+next)+'</p>';return;}
      button.disabled=true;box.textContent='Preparing an explanation for this property…';
      try{const r=await apiRequest('/client-forecast/brief',{method:'POST',body:{property_id:propertyId}});const d=r?.data;if(!d?.briefing)throw new Error('No explanation returned');box.innerHTML='<b>'+ (d.ai===true?'AI explanation':'Automated summary · AI unavailable')+'</b><p>'+esc(d.briefing)+'</p><small>This is a property forecast summary, not an explanation of an individual device reading. Check the readings and times before acting. This does not book a visit or confirm a flood.</small>';}
      catch(_){box.textContent='The explanation is unavailable right now. The guidance above and your device records are still available.';}
      finally{button.disabled=false;}
    });
    const answers={reading:'The percentage describes the water level reported by that device. It is not the chance of a flood. A high reading needs attention; a missing reading means we do not know the current level.',visit:'An alert or support message does not book a visit. Open Services to see your request and any provider updates. A visit is only confirmed when the provider confirms it.',help:'For a drain inspection, cleaning or device visit, use Request a service. FlowGuard can coordinate with a provider. If you already use your own provider, request directly and keep the record here. For account or payment questions, message Support.'};
    guide.querySelectorAll('[data-guide-question]').forEach(b=>b.addEventListener('click',()=>{guide.querySelector('.guide-local-answer').textContent=answers[b.dataset.guideQuestion];}));
  }
  return{attach,sceneFor};
})();
