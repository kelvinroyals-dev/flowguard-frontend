/* Protected estate weather only. No provider keys or browser-to-provider calls. */
const ClientEstateWeather=(()=>{
  const cache=new Map(),pending=new Map();
  const reading=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
  async function load(propertyId){
    if(!propertyId)throw new Error('Select a property with a verified location.');
    const key=String(propertyId),hit=cache.get(key);
    if(hit&&Date.now()-hit.at>=0&&Date.now()-hit.at<60000)return hit.value;
    if(pending.has(key))return pending.get(key);
    const request=(async()=>{
      const response=await apiRequest('/properties/'+encodeURIComponent(key)+'/weather');
      const value=response?.data;
      if(response?.success!==true||value?.property_id!==key||!Array.isArray(value.daily)||!Array.isArray(value.forecast))throw new Error('Estate weather response is incomplete.');
      cache.set(key,{at:Date.now(),value});if(cache.size>50)cache.delete(cache.keys().next().value);
      const expiry=setTimeout(()=>{if(cache.get(key)?.value===value)cache.delete(key);},60000);expiry.unref?.();
      return value;
    })();pending.set(key,request);
    try{return await request;}finally{pending.delete(key);}
  }
  async function daily(propertyId,horizon){
    const wx=await load(propertyId),days=wx.daily.slice(0,Math.min(horizon,3));
    if(!days.length||days.some(d=>!/^\d{4}-\d\d-\d\d$/.test(d.date)||!reading(d.mm)||!reading(d.prob)||d.prob>100))throw new Error('Complete daily weather estimates are unavailable. Missing rainfall is not zero.');
    return days.map(d=>({...d,date:new Date(d.date+'T12:00:00+01:00'),weatherSource:wx.source}));
  }
  async function hourly(propertyId,count=48){
    const wx=await load(propertyId),hours=wx.forecast.slice(0,count);
    if(hours.length!==count||hours.some((h,i)=>!reading(h.v)||!reading(h.prob)||h.prob>100||!Number.isFinite(Date.parse(h.start||h.t))||i&&Date.parse(h.start||h.t)-Date.parse(hours[i-1].start||hours[i-1].t)!==3600000))throw new Error('The provider has not supplied a complete '+count+'-hour outlook.');
    return hours.map(h=>({t:new Date(h.start||h.t),mm:h.v,prob:h.prob}));
  }
  return {load,daily,hourly};
})();
