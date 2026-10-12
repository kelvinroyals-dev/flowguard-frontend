// Shared, testable property and observation rules. Missing is never healthy.
const PortalModel = (() => {
  const active = a => ['active','new','acknowledged','in_progress'].includes(a.status || (a.resolved_at?'resolved':'active'));
  function scope(items, properties, id) {
    const p=(properties||[]).find(p=>p.property_id===id);
    if(!id||!p)return [];
    return (items||[]).filter(x=>!retiredFeature(x)).filter(x=>x.property_id===id || (!x.property_id && p.property_name && [x.property_name,x.property,x.site_name].includes(p.property_name)));
  }
  function riskFor(risk,sensors,id) {
    const online=sensors.filter(s=>s.status==='active'&&s.has_data!==false);
    const levels=online.filter(s=>s.level!=null).map(s=>Number(s.level));
    const owned=risk&&risk.property_id===id?risk:null;
    return {...(owned||{}),has_data:!!owned?.has_data&&online.length>0,sensors_total:sensors.length,sensors_online:online.length,
      peak_level:levels.length?Math.max(...levels):null,avg_level:levels.length?Math.round(levels.reduce((a,b)=>a+b)/levels.length):null};
  }
  function sensorSeries(s,hours=24) {
    if(!s||s.level==null||s.status!=='active')return [];
    const count=hours<=24?24:30,now=new Date(s.last_ping).getTime();
    return Array.from({length:count},(_,i)=>{
      const offset=Math.round(Math.sin(i/3)*9-Math.sin((count-1)/3)*9);
      const level=i===count-1?s.level:Math.max(0,Math.min(100,s.level+offset));
      const value=(key,delta)=>s[key]==null?null:i===count-1?Number(s[key]):+Math.max(0,Math.min(key==='temperature'?60:100,Number(s[key])+delta)).toFixed(1);
      return {t:new Date(now-(count-1-i)*hours*3600e3/(count-1)).toISOString(),avg:level,peak:level,flow:s.flow_rate==null?null:i===count-1?s.flow_rate:+Math.max(0,s.flow_rate+offset/5).toFixed(1),silt:value('silt_level',offset/4),battery:value('battery_percent',(count-1-i)*.12),signal:value('signal_strength',offset/3),temperature:value('temperature',offset/20)};
    });
  }
  function history(sensors,hours=24) {
    const rows=sensors.filter(s=>s.level!=null&&s.status==='active');
    if(!rows.length)return {series:[],log:[],has_data:false};
    const all=rows.map(s=>sensorSeries(s,hours));
    const mean=(key,i)=>{const values=all.map(a=>a[i][key]).filter(v=>v!=null);return values.length?+(values.reduce((sum,v)=>sum+v,0)/values.length).toFixed(1):null;};
    const series=all[0].map((_,i)=>({t:all[0][i].t,avg:Math.round(all.reduce((sum,a)=>sum+a[i].avg,0)/rows.length),peak:Math.max(...all.map(a=>a[i].avg)),flow:mean('flow',i),temperature:mean('temperature',i),silt:mean('silt',i),battery:mean('battery',i),signal:mean('signal',i)}));
    const log=rows.map(s=>({property_id:s.property_id,sensor_id:s.sensor_id,sensor:s.name,time:s.last_ping,level:s.level,flow:s.flow_rate,debris:s.silt_level>=70})).sort((a,b)=>new Date(b.time)-new Date(a.time));
    return {series,log,has_data:true};
  }
  function peakWindow(points,threshold) {
    let best=[],run=[];
    const commit=()=>{if(run.length&&(!best.length||Math.max(...run.map(p=>p.chance))>Math.max(...best.map(p=>p.chance))))best=run;run=[];};
    points.forEach((p,i)=>{if(p.chance>=threshold)run.push({...p,index:i});else commit();});commit();
    return best.length?[best[0].index,best.at(-1).index]:[-1,-1];
  }
  function coordinates(properties,id){
    const p=properties.find(p=>p.property_id===id);
    if(!p||p.latitude==null||p.longitude==null||!Number.isFinite(Number(p.latitude))||!Number.isFinite(Number(p.longitude)))throw Error('The selected property has no verified coordinates. A site-specific weather outlook is unavailable.');
    return {lat:Number(p.latitude),lon:Number(p.longitude)};
  }
  function levelText(s) {
    const value=s?.level;
    return s?.status==='offline'||s?.has_data===false||value==null||String(value).trim()===''||!Number.isFinite(Number(value))?'—':Number(value)+'%';
  }
  function attentionRank(s) {
    if(s.status==='offline')return 300;
    if(s.has_data===false||levelText(s)==='—')return 290;
    return (Number(s.level)>=70?400:0)+(Number(s.silt_level)>=70?200:0)+(s.battery_percent!=null&&Number(s.battery_percent)<=20?80:0)+Number(s.level||0);
  }
  function waterState(s) {
    if(levelText(s)==='—')return 'unavailable';
    return Number(s.level)>=70?'high':Number(s.level)>=50?'elevated':'low';
  }
  function prioritySensors(sensors) {return [...(sensors||[])].sort((a,b)=>attentionRank(b)-attentionRank(a));}
  // Both demo outlooks share the same calendar-day rainfall and risk ceiling.
  function sampleForecast(horizon,vulnerability,now=new Date()) {
    const start=new Date(now);start.setHours(0,0,0,0);
    const rain=[2.1,9.4,14.2,4,6.5,24.5,33,12.4,8.1,3,5.8,27.6,38.2,11,6.5,2];
    const codes=[2,61,63,51,3,65,95,63,3,1,51,65,95,63,3,2];
    const days=Array.from({length:Math.max(horizon,3)},(_,i)=>{
      const date=new Date(start);date.setDate(date.getDate()+i);
      const mm=rain[i%rain.length],prob=Math.min(95,Math.round(mm*4+15));
      const chance=Math.round(Math.min(96,Math.max(2,vulnerability*.4+Math.min(100,mm*4)*.45+prob*.15)));
      return {date,mm,prob,code:codes[i%codes.length],chance,level:chance>=65?'high':chance>=35?'moderate':'low'};
    });
    const weights=Array.from({length:24},(_,h)=>.2+Math.max(0,Math.sin((h-7)/24*Math.PI*2)));
    const total=weights.reduce((a,b)=>a+b,0),first=new Date(now);first.setMinutes(0,0,0);
    const hours=Array.from({length:48},(_,i)=>{
      const t=new Date(first.getTime()+i*3600e3),day=days.find(d=>d.date.toDateString()===t.toDateString());
      const chance=Math.round(day.chance*(.65+.35*weights[t.getHours()]/Math.max(...weights)));
      return {t,mm:day.mm*weights[t.getHours()]/total,prob:day.prob,chance,level:chance>=65?'high':chance>=35?'moderate':'low'};
    });
    return {days:days.slice(0,horizon),hours};
  }
  return {active,retiredFeature,observationState,scope,riskFor,sensorSeries,history,peakWindow,coordinates,levelText,waterState,attentionRank,prioritySensors,sampleForecast};
})();
if(typeof module!=='undefined')module.exports=PortalModel;
  function retiredFeature(x) { return /bio[-_ ]?(?:enzyme|dispenser|treatment)|cartridge|refill/i.test([x.type,x.title,x.subject,x.description].filter(Boolean).join(' ')); }
  function observationState(s,now=Date.now()) {
    if(s?.status==='offline')return 'offline';
    if(s?.has_data===false||s?.level==null||String(s.level).trim()===''||!Number.isFinite(Number(s.level)))return 'missing';
    const time=Date.parse(s.last_ping);
    if(!Number.isFinite(time)||time>now+300000)return 'time_unknown';
    const interval=Number(s.reporting_interval_minutes)||Number(String(s.ping_interval||'').match(/(\d+)\s*min/i)?.[1])||15;
    return now-time>Math.max(45,interval*3)*60000?'stale':'recent';
  }
