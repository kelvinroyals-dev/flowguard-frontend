// Shared lifecycle for dynamically rendered portal controls.
(()=>{
  const drafts=new Map(),dialogs=new Map();
  let serial=0,scheduled=false;
  const routeKey=()=>location.hash+'|'+App.activeProperty();
  function enhance(){
    scheduled=false;
    document.querySelectorAll('.rail .navbtn').forEach(b=>{if(b.classList.contains('on'))b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    document.querySelectorAll('[aria-label="Billing sections"],[aria-label="Settings sections"]').forEach(tabs=>{
      if(tabs.dataset.bound)return;tabs.dataset.bound='true';
      const buttons=[...tabs.querySelectorAll('[role="tab"]')];
      const activate=button=>buttons.forEach(b=>{const selected=b===button;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;document.getElementById(b.getAttribute('aria-controls')).hidden=!selected;});
      buttons.forEach((button,i)=>{
        button.addEventListener('click',()=>activate(button));
        button.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const index=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;activate(buttons[index]);buttons[index].focus();});
      });
    });
    document.querySelectorAll('#view input,#view select,#view textarea,.modal-bg input,.modal-bg select,.modal-bg textarea').forEach(input=>{
      if(!input.id)input.id='portal-field-'+(++serial);
      if((!input.labels?.length||![...input.labels].some(l=>l.textContent.trim()))&&!input.getAttribute('aria-label')){
        const holder=input.closest('.field,.tm-field,.set-row');
        const label=holder?.querySelector('label:not(.switch)');
        if(label)label.htmlFor=input.id;
        else input.setAttribute('aria-label',holder?.querySelector('b,strong,h4')?.textContent||input.placeholder||input.name||'Select an option');
      }
      if(input.id==='mon-search')input.setAttribute('aria-label','Search devices');
      if(input.classList.contains('tm-role-sel'))input.setAttribute('aria-label','Role for '+(input.closest('.trl-row')?.querySelector('.trl-name')?.textContent||'team member'));
      if(input.type==='password'){input.autocomplete=input.id.includes('curpw')?'current-password':'new-password';return;}
      if(input.id!=='mon-search'&&!input.dataset.draftBound&&/^(text|email|tel|textarea)$/.test(input.type)){
        input.dataset.draftBound='true';const key=routeKey()+'|'+input.id;
        if(drafts.has(key))input.value=drafts.get(key);
        input.addEventListener('input',()=>{
          drafts.set(key,input.value);
          const holder=input.closest('form,.panel,.modal-b')||input.parentElement;
          if(!holder.querySelector('.draft-note')){const note=document.createElement('p');note.className='hint draft-note';note.textContent='Unsent edits stay in this browser tab while you navigate. They are not saved to the server and are lost on refresh.';holder.append(note);}
        });
      }
    });
    document.querySelectorAll('#view [onclick]:not(button):not(input):not(select):not(textarea)').forEach(el=>{
      if(el.dataset.keyboardBound)return;
      el.dataset.keyboardBound='true';
      const code=el.getAttribute('onclick')||'';
      if(/^event\.stopPropagation\(\);?$/.test(code))return;
      const detail=code.match(/App\.open(Property|Sensor|Report|TicketDetail)\('([^']+)'\)/);
      const screen=code.match(/^App\.go\('([^']+)'\)$/);
      const href=detail?'#'+({Property:'property',Sensor:'sensor',Report:'report',TicketDetail:'ticket'}[detail[1]])+'/'+encodeURIComponent(detail[2]):screen?'#'+screen[1]:null;
      if(el.tagName==='A'&&href){el.href=href;return;}
      el.tabIndex=0;el.setAttribute('role',href?'link':'button');
      el.addEventListener('keydown',event=>{if(event.target===el&&['Enter',' '].includes(event.key)){event.preventDefault();el.click();}});
    });
    document.querySelectorAll('button').forEach(btn=>{
      const text=btn.textContent.trim();
      if(/^(Close|Cancel|Back to|←)/.test(text))btn.classList.add('neutral');
      if(/^Deactivate/.test(text))btn.classList.add('danger');
      if(!btn.matches('.neutral,.ghost,.danger')&&(/^(Request|Arrange|Book|Send|Submit|Save|Pay|Add|New|Register|Message|Contact|Try again|Retry)\b/i.test(text)||btn.hasAttribute('data-service-title')))btn.classList.add('primary');
    });
    // Secondary navigation is a text link; explicit actions keep their solid buttons.
    document.querySelectorAll('#view a[href],#view a[onclick],#view .crumb[onclick]').forEach(link=>{
      if(link.classList.contains('btn')||link.classList.contains('portal-link-button')||link.classList.contains('portal-text-link'))return;
      if(link.matches('.text-link,.crumb')||/^(All\b|Full forecast\b|Talk to us\b|←)/.test(link.textContent.trim())){
        link.classList.add('portal-text-link');return;
      }
      if(link.matches('.reading-row,.sensor-directory-row,.related-alert,.ntf-body')){
        if(link.matches('.related-alert')&&!link.querySelector('.row-open')){const end=link.lastElementChild;if(end){end.className='row-open';end.textContent='View →';end.removeAttribute('aria-hidden');}}
        return;
      }
      link.classList.add('portal-link-button');
    });
    document.querySelectorAll('.btn:not(.neutral),.tm-invite-btn,.tkt-view,.ntf-act,.journey .jcta button').forEach(btn=>{
      if(btn.querySelector(':scope > .action-label'))return;
      const label=document.createElement('span');label.className='action-label';
      label.append(...btn.childNodes);btn.append(label);
    });
    document.querySelectorAll('.modal-bg').forEach(bg=>{
      if(dialogs.has(bg))return;
      const modal=bg.querySelector('.modal');if(!modal)return;
      const previous=document.activeElement;
      modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
      const title=modal.querySelector('h2');if(title){title.id='dialog-title-'+(++serial);modal.setAttribute('aria-labelledby',title.id);}
      modal.tabIndex=-1;dialogs.set(bg,previous);
      (modal.querySelector('input:not([disabled]),select:not([disabled]),textarea:not([disabled]),button')||modal).focus();
    });
    for(const [bg,previous]of dialogs)if(!bg.isConnected){dialogs.delete(bg);if(previous?.isConnected)previous.focus();}
    const body=document.querySelector('#pd-body');
    if(body&&!body.dataset.tabbed&&body.querySelector('h3')&&!body.querySelector('.skel')){
      body.dataset.tabbed='true';
      const groups=new Map([['Summary',[]],['History',[]],['Related records',[]]]);
      body.querySelectorAll(':scope > .cols').forEach(row=>row.replaceWith(...row.children));
      [...body.children].forEach(child=>{const title=child.querySelector('h3')?.textContent||'';groups.get(/trend|history|progress|activity/i.test(title)?'History':/invoices|inspection/i.test(title)?'Related records':'Summary').push(child);});
      const tabs=document.createElement('div');tabs.className='detail-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Property record sections');
      body.prepend(tabs);
      [...groups].filter(([,nodes])=>nodes.length).forEach(([name,nodes],i)=>{
        const button=document.createElement('button'),panel=document.createElement('section');
        const id='property-panel-'+i;panel.id=id;panel.setAttribute('role','tabpanel');panel.hidden=i!==0;
        button.id=id+'-tab';button.textContent=name;button.setAttribute('role','tab');button.setAttribute('aria-controls',id);button.setAttribute('aria-selected',String(i===0));button.tabIndex=i===0?0:-1;
        panel.setAttribute('aria-labelledby',button.id);
        button.addEventListener('click',()=>{tabs.querySelectorAll('button').forEach(b=>{b.setAttribute('aria-selected',String(b===button));b.tabIndex=b===button?0:-1;document.getElementById(b.getAttribute('aria-controls')).hidden=b!==button;});});
        button.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const buttons=[...tabs.children];const index=e.key==='Home'?0:e.key==='End'?buttons.length-1:(buttons.indexOf(button)+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;buttons[index].click();buttons[index].focus();});
        nodes.forEach(node=>panel.append(node));tabs.append(button);body.append(panel);
      });
    }
    if(window.PortalPreview){
      document.querySelectorAll('#set-demo').forEach(el=>{el.checked=true;el.disabled=true;el.setAttribute('aria-label','Sample data is fixed in local design preview');});
    }
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-service-title]');
    if(button){if(!App.can('manage_properties')){UI.toast('Ask your account administrator or facility manager to request this service.','info');return;}ClientServices.prefill({...(button.dataset.serviceProperty?{property_id:button.dataset.serviceProperty}:{}),title:button.dataset.serviceTitle,job_type:button.dataset.serviceType||'inspection',description:'Please help with: '+button.dataset.serviceTitle+'.'+(button.dataset.sourceId?' Related device or request: '+button.dataset.sourceId+'.':'')});App.go('services');}
  });
  document.addEventListener('keydown',event=>{
    const bg=[...dialogs.keys()].filter(x=>x.isConnected).at(-1);
    if(!bg){if(event.key==='Escape')document.getElementById('rail')?.classList.remove('open');return;}
    if(event.key==='Escape'){event.preventDefault();bg.remove();return;}
    if(event.key==='Tab'){
      const focusable=[...bg.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')].filter(el=>el.getClientRects().length);
      const first=focusable[0],last=focusable.at(-1);
      if(!first){event.preventDefault();bg.querySelector('.modal').focus();return;}
      if(event.shiftKey&&(document.activeElement===first||!bg.contains(document.activeElement))){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&(document.activeElement===last||!bg.contains(document.activeElement))){event.preventDefault();first.focus();}
    }
  });
  document.addEventListener('DOMContentLoaded',()=>{
    new MutationObserver(()=>{if(!scheduled){scheduled=true;queueMicrotask(enhance);}}).observe(document.body,{subtree:true,childList:true});enhance();
  });
})();
