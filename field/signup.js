var API='https://api.flowguard.ng/api/v1';
  var S={email:'',token:'',verifyToken:''};
  var $=function(id){return document.getElementById(id);};
  function msg(id,txt,type){var e=$(id);e.className='msg '+(type||'error')+' show';e.innerHTML=(type==='ok'?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-6.5"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>')+'<span></span>';e.querySelector('span').textContent=txt;}
  function clr(id){$(id).className='msg';}
  function show(step){['s1','s2','s3'].forEach(function(s){$(s).classList.toggle('on',s===step);var progress=$('progress-'+s);if(s===step)progress.setAttribute('aria-current','step');else progress.removeAttribute('aria-current');});window.scrollTo(0,0);$(step).querySelector('h1').focus();if(step==='s2')otp[0].focus();}
  function load(btn,on,label){btn.disabled=on;btn.innerHTML=on?'<span class="spinner"></span>'+(label||'Working…'):label;}

  $('provider-details').addEventListener('submit',async function(event){
    event.preventDefault();if($('b1').disabled)return;
    clr('m1');
    var company=$('f-company').value.trim(),name=$('f-name').value.trim(),email=$('f-email').value.trim().toLowerCase(),
        phone=$('f-phone').value.trim(),coverage=$('f-coverage').value.trim(),pass=$('f-pass').value,
        services=Array.from(document.querySelectorAll('input[name="services"]:checked')).map(function(o){return o.value;});
    if(company.length<2) return msg('m1','Enter your company name.');
    if(name.length<2) return msg('m1','Enter a contact person.');
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return msg('m1','Enter a valid work email.');
    if(phone.replace(/\D/g,'').length<7) return msg('m1','Enter a valid phone number.');
    if(!coverage) return msg('m1','Enter your coverage area.');
    if(!services.length) return msg('m1','Select at least one service.');
    if(pass.length<8||!/\d/.test(pass)) return msg('m1','Password needs 8+ characters and a number.');
    if(!$('f-consent').checked) return msg('m1','Please accept the Terms and Privacy Policy.');
    S={email:email,company:company,name:name,phone:phone,coverage:coverage,services:services,pass:pass};
    load($('b1'),true,'Sending verification code…');
    try{
      var r=await fetch(API+'/auth/send-email-code',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email})});
      var d=await r.json();
      if(!d.success) { load($('b1'),false,'Continue to email verification →'); return msg('m1',d.error||'Could not send a code.'); }
      S.token=d.data.token; $('v-email').textContent=email; show('s2');
    }catch(_){ msg('m1','Connection failed. Try again.'); }
    load($('b1'),false,'Continue to email verification →');
  });

  var otp=Array.from(document.querySelectorAll('.otp input'));
  otp.forEach(function(b,i){
    b.addEventListener('input',function(){b.value=b.value.replace(/\D/g,'').slice(0,1);if(b.value&&otp[i+1])otp[i+1].focus();});
    b.addEventListener('keydown',function(e){if(e.key==='Backspace'&&!b.value&&otp[i-1])otp[i-1].focus();});
    b.addEventListener('paste',function(e){e.preventDefault();var ds=(e.clipboardData.getData('text')||'').replace(/\D/g,'').slice(0,6).split('');ds.forEach(function(x,j){if(otp[j])otp[j].value=x;});(otp[Math.min(ds.length,6)-1]||b).focus();});
  });

  $('provider-verification').addEventListener('submit',async function(event){
    event.preventDefault();if($('b2').disabled)return;
    clr('m2');
    var code=otp.map(function(b){return b.value.trim();}).join('');
    if(code.length!==6) return msg('m2','Enter the full 6-digit code.');
    load($('b2'),true,'Submitting application…');$('resend').disabled=true;$('edit-details').disabled=true;
    try{
      var v=await fetch(API+'/auth/verify-email-code',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:S.token,code:code})});
      var vd=await v.json();
      if(!vd.success){return msg('m2',vd.error||'That code is incorrect.'); }
      S.verifyToken=vd.data.verifyToken;
      var r=await fetch(API+'/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        accountType:'service_provider', company:S.company, fullName:S.name, contactPerson:S.name,
        email:S.email, phone:S.phone, coverageArea:S.coverage, serviceTypes:S.services,
        password:S.pass, emailVerifyToken:S.verifyToken
      })});
      var d=await r.json();
      if(!d.success){return msg('m2',d.error||'Could not create your account.'); }
      try{ localStorage.setItem('token',d.data.token); localStorage.setItem('user',JSON.stringify(d.data.user)); }catch(_){}
      S.pass='';$('f-pass').value='';show('s3');
    }catch(_){ msg('m2','Connection failed. Try again.'); }
    finally{load($('b2'),false,'Verify & submit application');$('resend').disabled=false;$('edit-details').disabled=false;}
  });

  $('resend').addEventListener('click',async function(){
    if(this.disabled)return;clr('m2');this.disabled=true;this.textContent='Sending…';$('b2').disabled=true;$('edit-details').disabled=true;
    try{ var r=await fetch(API+'/auth/send-email-code',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:S.email})}); var d=await r.json(); if(d.success){S.token=d.data.token;otp.forEach(function(input){input.value='';});msg('m2','A new code has been sent.','ok');otp[0].focus();}else{msg('m2',d.error||'Could not resend the code. Try again.');} }catch(_){msg('m2','Connection failed. Try again.');}
    finally{this.disabled=false;this.textContent='Resend code';$('b2').disabled=false;$('edit-details').disabled=false;}
  });

  $('edit-details').addEventListener('click',function(){if(this.disabled)return;otp.forEach(function(input){input.value='';});clr('m2');show('s1');});
  $('password-toggle').addEventListener('click',function(){var visible=$('f-pass').type==='password';$('f-pass').type=visible?'text':'password';this.textContent=visible?'Hide':'Show';this.setAttribute('aria-label',visible?'Hide password':'Show password');this.setAttribute('aria-pressed',String(visible));});
  function syncTheme(){var light=document.documentElement.dataset.theme==='light';$('provider-theme-label').textContent=light?'Dark mode':'Light mode';$('provider-theme').setAttribute('aria-label',light?'Switch to dark mode':'Switch to light mode');}
  $('provider-theme').addEventListener('click',function(){var next=document.documentElement.dataset.theme==='light'?'dark':'light';document.documentElement.dataset.theme=next;try{localStorage.setItem('flowguard_theme',next);}catch(_){}syncTheme();});syncTheme();

  $('b3').addEventListener('click',function(){ window.location.href='./'; });
