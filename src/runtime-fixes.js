// Public enhancements loaded after app.js: Lucide icons, editable ticker text and Meta Pixel browser script.
(function(){
  const lucideMap = ['sparkles','smile','waves','star','badge-check','check-circle','clipboard-check','route','wand-sparkles','trending-up','check','calendar-days','map-pinned'];
  let cfg=null;
  function loadLucide(){
    if(window.lucide)return Promise.resolve();
    return new Promise(resolve=>{const s=document.createElement('script');s.src='https://unpkg.com/lucide@latest/dist/umd/lucide.min.js';s.onload=resolve;s.onerror=resolve;document.head.appendChild(s)});
  }
  function safe(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
  function isLucideName(v){return /^[a-z0-9-]+$/i.test(String(v||''))&&String(v||'').length>1}
  function renderIconBoxes(){
    const icons=[];
    const complaints=cfg&&cfg.sections&&cfg.sections.complaints&&cfg.sections.complaints.items||[];
    const method=cfg&&cfg.sections&&cfg.sections.method&&cfg.sections.method.steps||[];
    const authority=cfg&&cfg.sections&&cfg.sections.authority&&cfg.sections.authority.items||[];
    complaints.forEach((x,i)=>icons.push(isLucideName(x.icon)?x.icon:lucideMap[i]||'sparkles'));
    method.forEach((x,i)=>icons.push(isLucideName(x.icon)?x.icon:lucideMap[i+6]||'clipboard-check'));
    authority.forEach((x,i)=>icons.push(isLucideName(x.icon)?x.icon:lucideMap[i+10]||'check-circle'));
    document.querySelectorAll('.icon-box').forEach((box,i)=>{box.innerHTML='<i data-lucide="'+safe(icons[i]||lucideMap[i%lucideMap.length])+'"></i>'});
    if(window.lucide)window.lucide.createIcons();
  }
  function renderTicker(){
    const track=document.querySelector('.ticker-track');
    if(!track)return;
    const ticker=cfg&&cfg.sections&&cfg.sections.ticker||{};
    let items=[];
    if(Array.isArray(ticker.items)&&ticker.items.length){items=ticker.items.filter(x=>x&&x.visible!==false).map(x=>typeof x==='string'?x:x.text||x.title).filter(Boolean)}
    if(!items.length){items=Array.from(track.querySelectorAll('span')).slice(0,8).map(s=>s.textContent.trim()).filter(Boolean)}
    if(!items.length)items=['Limpeza de pele','Drenagem facial','Drenagem HD','Peeling químico','Botox','Endolaser'];
    const loops=items.concat(items,items,items);
    track.innerHTML=loops.map(x=>'<span>'+safe(x)+'</span>').join('');
    track.style.setProperty('--ticker-speed',(ticker.speedSeconds||34)+'s');
  }
  function injectMetaPixel(){
    const p=cfg&&cfg.pixels||{};
    const pixel=p.browserPixelId||p.metaPixelId||p.pixelId;
    if(!p.enabled||!pixel||document.getElementById('cq-meta-pixel'))return;
    const id=String(pixel).replace(/[^0-9]/g,'');
    if(!id)return;
    const s=document.createElement('script');s.id='cq-meta-pixel';
    s.text="!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','"+id+"');fbq('track','PageView');";
    document.head.appendChild(s);
  }
  function enhance(){renderTicker();loadLucide().then(renderIconBoxes);injectMetaPixel()}
  fetch('/api/config-v2',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{cfg=j&&j.config||{};setTimeout(enhance,150);setTimeout(enhance,900)}).catch(()=>setTimeout(()=>loadLucide().then(renderIconBoxes),500));
})();
