// Direct client requests do not use FlowGuard job verification or dispatch.
const ProviderServiceRequests=(()=>{
  let revision=0;
  async function render(){
    const rev=++revision;
    $('view').innerHTML=topBar('Direct client requests','Services requested from your organisation · FlowGuard receives visibility')+stateBox('empty','Loading requests…','');
    const r=await api('/service-requests');if(rev!==revision||STATE.tab!=='requests')return;
    if(!r.ok||!Array.isArray(r.j.data)){$('view').innerHTML=topBar('Direct client requests','')+stateBox('error','Requests unavailable','Retry to restore this view.')+'<button class="btn" id="pr-retry">Retry</button>';$('pr-retry').onclick=render;return;}
    $('view').innerHTML=topBar('Direct client requests','Your organisation owns service delivery. FlowGuard does not approve or verify these requests.')+
      (!r.j.data.length?stateBox('empty','No direct requests returned','Requests routed through FlowGuard remain in Jobs.'):'<div class="card tbl-wrap"><table class="tbl"><thead><tr><th>Request</th><th>Estate</th><th>Service</th><th>Received</th></tr></thead><tbody>'+r.j.data.map(x=>'<tr class="rowlink" data-request="'+esc(x.id)+'"><td><button class="btn ghost sm" data-open="'+esc(x.id)+'">'+esc(x.title)+'</button></td><td data-label="Estate">'+esc(x.property_id)+'</td><td data-label="Service">'+esc(JT[x.job_type]||x.job_type)+'</td><td data-label="Received">'+esc(fmtDT(x.created_at))+'</td></tr>').join('')+'</tbody></table></div>');
    document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>open(b.dataset.open)));
  }
  async function open(id){
    const rev=++revision;const r=await api('/service-requests/'+encodeURIComponent(id));
    if(rev!==revision||STATE.tab!=='requests')return;
    if(!r.ok||!r.j.data){$('view').innerHTML=topBar('Direct client request','')+stateBox('error','Request unavailable','Return to the request list and retry.')+'<button class="btn" id="pr-back">Back to requests</button>';$('pr-back').onclick=render;return;}
    const x=r.j.data;
    $('view').innerHTML=topBar(x.title,'Direct client request · FlowGuard visibility only','<button class="btn ghost sm" id="pr-back">Back to requests</button>')+
      '<section class="card" style="padding:20px;overflow-wrap:anywhere"><h2>Service scope</h2><p>'+esc(x.description)+'</p><p>Estate: '+esc(x.property_id)+'</p></section>'+
      '<section class="card" style="padding:20px;margin-top:16px;overflow-wrap:anywhere"><h2>Reported progress</h2>'+(x.events?.length?x.events.map(e=>'<article><strong>'+esc(String(e.event_type).replace(/_/g,' '))+'</strong><p>'+esc(e.note)+'</p><small>'+esc(fmtDT(e.created_at))+'</small></article>').join(''):'<p>No updates recorded yet.</p>')+
      '<form id="pr-progress"><div class="fld"><label for="pr-state">Progress update</label><select id="pr-state" required><option value="acknowledged">Acknowledged</option><option value="in_progress">In progress</option><option value="completed">Provider-reported completion</option><option value="declined">Declined</option></select></div><div class="fld"><label for="pr-note">Findings or coordination note</label><textarea id="pr-note" required maxlength="10000" rows="3"></textarea></div><p>This records your organisation’s report. It does not represent FlowGuard verification.</p><p id="pr-error" role="alert"></p><button class="btn" type="submit">Record provider update</button></form></section>';
    $('pr-back').onclick=render;
    $('pr-progress').onsubmit=async event=>{
      event.preventDefault();const button=event.target.querySelector('button');if(button.disabled)return;button.disabled=true;
      const result=await api('/service-requests/'+encodeURIComponent(id)+'/events','POST',{event_type:$('pr-state').value,note:$('pr-note').value});
      if(rev!==revision||STATE.tab!=='requests')return;
      if(result.ok)open(id);else{$('pr-error').textContent=result.j.error||'Update could not be recorded. Retry.';button.disabled=false;}
    };
  }
  return {render};
})();
