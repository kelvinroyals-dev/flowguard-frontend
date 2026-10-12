// Service intake owns requests, not a duplicate of Support or provider work.
const ClientServices=(()=>{
  const esc=v=>UI.esc(v);
  let revision=0;
  let draft={};
  let creating=false;
  function showCreate(value){if(value&&!App.can('manage_properties')){UI.toast('Ask your account administrator or facility manager to request a service.','info');return;}creating=value;App.go('services');}
  const types=['inspection','drain_cleaning','sensor_maintenance','repair','survey','other'];
  const label=s=>({inspection:'Check the drains',drain_cleaning:'Clean the drains',sensor_maintenance:'Check or repair a device',repair:'Repair drainage',survey:'Survey the property',other:'Something else',received:'Request received',draft_prepared:'Being reviewed',acknowledged:'Provider has received the request',in_progress:'Work in progress',completed:'Reported complete',declined:'Provider declined',draft:'Being prepared for review',dispatched:'Sent to provider',accepted:'Provider accepted',en_route:'Provider reports being on the way',verified:'Completion checked',rejected:'Work needs another review',cancelled:'Cancelled'}[s]||String(s||'').replace(/_/g,' '));
  function progress(x){
    const status=x.work_order_status||x.status;
    const stages={received:0,draft_prepared:0,draft:0,dispatched:0,acknowledged:1,accepted:1,en_route:1,in_progress:2,completed:3,verified:3};
    const step=stages[status]??-1;
    const stopped=['declined','cancelled','rejected'].includes(status);
    const next=stopped?'Contact '+(x.route==='direct_provider'?'your provider':'FlowGuard')+' about the next step.':step===3?'Check the completion update. Tell us if you still need help.':step===2?'Your provider is working. Open the request for updates.':step===1?'Waiting for the provider’s next update.':x.route==='direct_provider'?'Waiting for your provider to respond.':'FlowGuard will review and arrange a provider.';
    return {status,step,stopped,next,heading:step===3?'Work reported complete':step===2?'Work in progress':status==='en_route'?'Provider is on the way':step===1?'Provider has responded':stopped?label(status):step===0?'Waiting for a provider':'Awaiting an update'};
  }
  function progressCard(x,options={}){
    const p=progress(x),visit=x.work_order_scheduled_for&&Number.isFinite(Date.parse(x.work_order_scheduled_for))?UI.fmtTime(x.work_order_scheduled_for)+' WAT':'No date recorded',owner=x.provider_name||(x.route==='direct_provider'?'Your chosen provider':'FlowGuard');
    const last=[...(x.events||[])].filter(e=>e.created_at).sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at))[0];
    return `<article class="request-progress" data-stage="${p.stopped?'stopped':p.step===3?'complete':'pending'}"><div class="request-progress-heading"><span class="request-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 4h6v4H9zM9 6H6v15h12V6h-3M9 12h6M9 16h4"/></svg></span><div><h3>${esc(x.title)}</h3><span class="request-owner">Handled by ${esc(owner)}</span></div><span class="request-status">${esc(p.heading)}</span></div><div class="request-visit"><span>Planned visit</span><b>${esc(visit)}</b></div><ol class="request-steps" aria-label="Service progress">${['Request sent','Provider response','Work started','Completed'].map((s,i)=>`<li class="${i<p.step?'done':i===p.step?'current':'waiting'}"${i===p.step?' aria-current="step"':''}><span aria-hidden="true">${i<p.step?'✓':i+1}</span><b>${s}</b></li>`).join('')}</ol><div class="request-next"><span><b>${p.step===3?'Next: review the work':p.stopped?'Your next step':'What happens next'}</b><span>${esc(p.next)}</span>${last?`<small>Latest update: ${esc(UI.fmtDate(last.created_at))}</small>`:''}</span>${options.detail?'<a class="btn" href="#support">Get help →</a>':`<a class="btn" href="#service-request/${encodeURIComponent(x.id)}" aria-label="Track request: ${esc(x.title)}">Track request <span aria-hidden="true">→</span></a>`}</div></article>`;
  }
  function prefill(values){if(!App.can('manage_properties'))return;creating=true;draft={property_id:App.activeProperty(),route:'flowguard',...values};}
  async function render(view,id){
    const document=UI.scopedDocument(view);
    const rev=++revision;
    view.innerHTML='<div class="top"><div><h1>Requests &amp; visits</h1><div class="sub">Request provider services and track reported progress</div></div></div>'+UI.loading(2);
    try{
      if(id){
        const r=await apiRequest('/service-requests/'+encodeURIComponent(id));if(rev!==revision||!view.isConnected)return;
        const x=r.data;
        const providerResult=await apiRequest('/service-requests/providers').catch(()=>({data:[]}));
        if(rev!==revision||!view.isConnected)return;
        const provider=providerResult.data.find(p=>String(p.id)===String(x.service_provider_org_id));
        view.innerHTML=`<div class="top"><div><h1>${esc(x.title)}</h1><div class="sub">${x.route==='direct_provider'?'Direct to your provider · FlowGuard visibility only':'Coordinated by FlowGuard'}</div></div><button class="btn ghost" onclick="App.go('services')">Back to requests</button></div><section class="card svc-panel"><h2>Request summary</h2><p>${esc(x.description)}</p><dl><dt>Estate reference</dt><dd>${esc(x.property_id)}</dd><dt>Service</dt><dd>${esc(label(x.job_type))}</dd><dt>Intake state</dt><dd>${esc(label(x.status))}</dd><dt>Provider</dt><dd>${esc(provider?.name||x.provider_name||'Not assigned or not supplied')}</dd><dt>Provider contact</dt><dd>${esc(provider?.contact||[provider?.contact_name||x.provider_contact_name,provider?.email||x.provider_email,provider?.phone||x.provider_phone].filter(Boolean).join(' · ')||'Not supplied')}</dd><dt>Work reference</dt><dd>${esc(x.work_order_reference||(x.job_id ? 'Linked work record '+x.job_id : 'No linked work record supplied'))}</dd></dl></section><section class="card svc-panel"><h2>Provider updates</h2>${x.events?.length?x.events.map(e=>`<article><h3>${esc(label(e.event_type))}</h3><p>${esc(e.note)}</p><small>${esc(UI.fmtDate(e.created_at))}</small></article>`).join(''):'<p>No provider updates recorded yet.</p>'}</section>`;
        const estateValue=view.querySelector('dd');
        const properties=await Screens.getMyProperties();
        if(rev!==revision||!view.isConnected)return;
        const property=properties.find(p=>p.property_id===x.property_id);
        const estateLink=document.createElement('a');estateLink.href='#property/'+encodeURIComponent(x.property_id);estateLink.textContent=x.property_name||property?.property_name||x.property_id;estateValue.replaceChildren(estateLink);
        const terms=view.querySelectorAll('dt'),values=view.querySelectorAll('dd');
        terms[0].textContent='Property';terms[2].textContent='Request status';terms[5].textContent='Provider work';
        if(!provider?.name&&!x.provider_name)values[3].textContent=x.route==='direct_provider'?'Provider details unavailable':'Awaiting provider assignment';
        if(!x.work_order_reference&&!x.job_id)values[5].textContent='No provider work linked yet';
        if(x.work_order_status){const workStatus=document.createElement('p');workStatus.className='record-context';workStatus.textContent='Provider work: '+label(x.work_order_status)+'. This is separate from the original request status.';view.querySelector('.svc-panel').appendChild(workStatus);}
        const stage=document.createElement('section');stage.className='service-progress-detail';
        stage.innerHTML=progressCard(x,{detail:true});
        view.querySelector('.top').after(stage);
        view.querySelectorAll('.svc-panel').forEach(panel=>panel.classList.add('record-panel'));
        return;
      }
      const [requests,props,providers]=await Promise.all([apiRequest('/service-requests'),Screens.getMyProperties(),apiRequest('/service-requests/providers')]);
      if(rev!==revision||!view.isConnected)return;
      if(!Array.isArray(requests.data)||!Array.isArray(props)||!Array.isArray(providers.data))throw new Error('Service data was not supplied. Retry to restore this view.');
      const active=App.activeProperty();
      const rows=(requests.data||[]).filter(x=>!active||active==='all'||x.property_id===active);
      view.innerHTML=`<div class="top"><div><h1>Requests &amp; visits</h1><div class="sub">Request services and follow provider progress</div></div></div><section class="card svc-panel"><h2>Request a service</h2><form id="svc-form"><div class="svc-fields"><label>Property<select name="property_id" required>${props.map(p=>`<option value="${esc(p.property_id)}"${p.property_id===active?' selected':''}>${esc(p.property_name||p.name||p.property_id)}</option>`).join('')}</select></label><label>Who should arrange this?<select name="route"><option value="flowguard">Ask FlowGuard to coordinate</option><option value="direct_provider">Request my existing provider directly</option></select></label><label>What do you need?<select name="job_type">${types.map(t=>`<option value="${t}">${esc(label(t))}</option>`).join('')}</select></label><label id="svc-provider-label" hidden>Existing provider<select name="service_provider_org_id"></select></label></div><label>Request title<input name="title" required maxlength="255"></label><label>Service details<textarea name="description" required maxlength="10000" rows="3"></textarea></label><p id="svc-route-note" class="hint">We will review your request and find a provider. The provider must confirm the visit.</p><div class="svc-submit"><span id="svc-error" role="alert"></span><button class="btn" type="submit"${props.length?'':' disabled'}>Send request for review</button></div></form></section><section class="card svc-panel"><h2>Your service requests</h2>${rows.length?`<div class="svc-list">${rows.map(progressCard).join('')}</div>`:'<p>No service requests for this property yet.</p>'}</section>`;
      const composer=view.querySelector('.svc-panel');
      const tracking=composer.nextElementSibling;
      tracking.classList.add('service-tracking');
      composer.classList.add('service-composer');
      composer.hidden=!creating;
      tracking.hidden=creating;
      view.insertBefore(tracking,composer);
      const toolbar=view.querySelector('.top');
      const action=document.createElement('button');action.className='btn';action.textContent=creating?'Back to requests':'New request +';action.addEventListener('click',()=>showCreate(!creating));if(App.can('manage_properties'))toolbar.appendChild(action);
      const intro=document.createElement('section');intro.className='service-intro';intro.innerHTML=creating?'<h2>What does your property need?</h2><p>Choose a service and tell us where help is needed.</p>':'<p>See who is handling each request and what happens next.</p>';
      view.insertBefore(intro,tracking);
      const form=document.getElementById('svc-form');
      if(props.some(p=>p.property_id===draft.property_id)){
        for(const [key,value] of Object.entries(draft))if(form.elements[key]&&key!=='service_provider_org_id')form.elements[key].value=value;
      }
      const update=()=>{
        const previousProvider=form.elements.service_provider_org_id.value;
        const direct=form.elements.route.value==='direct_provider';
        const choices=(providers.data||[]).filter(p=>p.property_id===form.elements.property_id.value);
        document.getElementById('svc-provider-label').hidden=!direct;
        form.elements.service_provider_org_id.required=direct;
        form.elements.service_provider_org_id.innerHTML=choices.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
        if(choices.some(p=>String(p.id)===previousProvider))form.elements.service_provider_org_id.value=previousProvider;
        document.getElementById('svc-route-note').textContent=direct?(choices.length?'Your provider handles service delivery. FlowGuard receives visibility and maintains the record; it does not approve this work.':'No active provider relationship is recorded for this estate. Ask FlowGuard to coordinate instead.'):'FlowGuard reviews your request and coordinates provider assignment. Submission does not dispatch a provider.';
        form.querySelector('button[type=submit]').disabled=!props.length||(direct&&!choices.length);
      };
      form.elements.route.addEventListener('change',update);form.elements.property_id.addEventListener('change',update);update();
      if(draft.service_provider_org_id&&Array.from(form.elements.service_provider_org_id.options).some(o=>o.value===draft.service_provider_org_id))form.elements.service_provider_org_id.value=draft.service_provider_org_id;
      form.addEventListener('input',()=>{draft=Object.fromEntries(new FormData(form));});
      form.addEventListener('submit',async event=>{
        event.preventDefault();const button=form.querySelector('button[type=submit]');if(button.disabled)return;button.disabled=true;
        const body=Object.fromEntries(new FormData(form));if(body.route!=='direct_provider')delete body.service_provider_org_id;
        try{const result=await apiRequest('/service-requests',{method:'POST',body});draft={};creating=false;if(form.isConnected)App.go('services',result.data.id);}
        catch(e){if(form.isConnected){form.querySelector('#svc-error').textContent=e.message;button.disabled=false;}}
      });
    }catch(e){if(rev===revision&&view.isConnected)view.innerHTML=UI.state('error','Services unavailable',e.message,'Retry','onclick="App.go(\'services\')"');}
  }
  return {render,prefill,showCreate,statusLabel:label,progress,progressCard};
})();
