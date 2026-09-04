// Public enhancements loaded after app.js: latest CSS, Lucide icons, editable ticker text and robust marketing tracking.
(function(){
  function addCss(href){const l=document.createElement('link');l.rel='stylesheet';l.href=href;document.head.appendChild(l)}
  addCss('/src/final-fixes.css?v=5');

  const lucideMap=['sparkles','smile','waves','star','badge-check','check-circle','clipboard-check','route','wand-sparkles','trending-up','check','calendar-days','map-pinned'];
  const CONSENT_KEY='cq_marketing_consent_v1';
  let cfg=null;
  let tracking=null;
  let clickBound=false;
  let metaLoaded=false;
  let googlePrepared=false;
  let gtmPrepared=false;

  function clean(v){return String(v==null?'':v).trim()}
  function safe(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
  function validMeta(v){return /^\d{5,25}$/.test(clean(v))}
  function validGA(v){return /^G-[A-Z0-9]+$/i.test(clean(v))}
  function validAW(v){return /^AW-\d+$/i.test(clean(v))}
  function validGTM(v){return /^GTM-[A-Z0-9]+$/i.test(clean(v))}

  function loadLucide(){
    if(window.lucide)return Promise.resolve();
    return new Promise(resolve=>{const s=document.createElement('script');s.src='https://unpkg.com/lucide@latest/dist/umd/lucide.min.js';s.onload=resolve;s.onerror=resolve;document.head.appendChild(s)});
  }
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

  function normalizeTracking(config){
    const legacy=(config&&config.pixels)||{};
    const modern=(config&&config.site&&config.site.marketing)||{};
    const raw=Object.keys(modern).length?{...legacy,...modern}:legacy;
    const consentRaw=raw.consent&&typeof raw.consent==='object'?raw.consent:{};
    return {
      enabled:raw.enabled===true,
      mode:raw.mode==='gtm'?'gtm':'direct',
      metaPixelId:clean(raw.metaPixelId||raw.browserPixelId||raw.pixelId),
      metaDomainVerification:clean(raw.metaDomainVerification),
      googleAnalyticsId:clean(raw.googleAnalyticsId).toUpperCase(),
      googleAdsId:clean(raw.googleAdsId).toUpperCase(),
      googleAdsLeadLabel:clean(raw.googleAdsLeadLabel),
      conversionValue:clean(raw.conversionValue),
      currency:clean(raw.currency||'BRL').toUpperCase()||'BRL',
      gtmId:clean(raw.gtmId).toUpperCase(),
      consent:{
        enabled:consentRaw.enabled===true,
        title:clean(consentRaw.title||'Privacidade e cookies'),
        text:clean(consentRaw.text||'Usamos cookies e tecnologias de medição para entender o uso do site e melhorar nossos anúncios.'),
        privacyUrl:clean(consentRaw.privacyUrl)
      }
    };
  }

  function consentChoice(){
    if(!tracking||!tracking.consent.enabled)return 'granted';
    try{const v=localStorage.getItem(CONSENT_KEY);return v==='granted'||v==='denied'?v:'unset'}catch{return 'unset'}
  }
  function ensureDataLayer(){
    window.dataLayer=window.dataLayer||[];
    window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
  }
  function setGoogleConsentDefault(){
    if(!tracking||!tracking.consent.enabled)return;
    ensureDataLayer();
    window.gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});
  }
  function updateGoogleConsent(choice){
    if(!tracking||!tracking.consent.enabled)return;
    ensureDataLayer();
    const value=choice==='granted'?'granted':'denied';
    window.gtag('consent','update',{ad_storage:value,analytics_storage:value,ad_user_data:value,ad_personalization:value});
  }
  function injectMetaVerification(token){
    if(!token)return;
    let meta=document.querySelector('meta[name="facebook-domain-verification"]');
    if(!meta){meta=document.createElement('meta');meta.name='facebook-domain-verification';document.head.appendChild(meta)}
    meta.content=token;
  }
  function loadMeta(){
    if(metaLoaded||!tracking||!validMeta(tracking.metaPixelId))return;
    if(tracking.consent.enabled&&consentChoice()!=='granted')return;
    if(!window.fbq){
      const fbq=function(){fbq.callMethod?fbq.callMethod.apply(fbq,arguments):fbq.queue.push(arguments)};
      if(!window._fbq)window._fbq=fbq;
      fbq.push=fbq;fbq.loaded=true;fbq.version='2.0';fbq.queue=[];window.fbq=fbq;
      const script=document.createElement('script');script.async=true;script.src='https://connect.facebook.net/en_US/fbevents.js';script.dataset.cqMetaPixel='1';
      const first=document.getElementsByTagName('script')[0];
      if(first&&first.parentNode)first.parentNode.insertBefore(script,first);else document.head.appendChild(script);
    }
    window.fbq('init',tracking.metaPixelId);
    window.fbq('track','PageView');
    metaLoaded=true;
  }
  function loadGoogleDirect(){
    if(!tracking||googlePrepared)return;
    const ids=[];
    if(validGA(tracking.googleAnalyticsId))ids.push(tracking.googleAnalyticsId);
    if(validAW(tracking.googleAdsId))ids.push(tracking.googleAdsId);
    if(!ids.length)return;
    ensureDataLayer();
    setGoogleConsentDefault();
    window.gtag('js',new Date());
    ids.forEach(id=>window.gtag('config',id));
    const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(ids[0]);script.dataset.cqGoogleTag='1';document.head.appendChild(script);
    googlePrepared=true;
    if(consentChoice()==='granted')updateGoogleConsent('granted');
  }
  function loadGTM(){
    if(!tracking||gtmPrepared||!validGTM(tracking.gtmId))return;
    ensureDataLayer();
    setGoogleConsentDefault();
    if(consentChoice()==='granted')updateGoogleConsent('granted');
    window.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});
    const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtm.js?id='+encodeURIComponent(tracking.gtmId);script.dataset.cqGtm='1';document.head.appendChild(script);
    gtmPrepared=true;
  }
  function googleEvent(name,params){
    if(!tracking||tracking.mode!=='direct'||(!validGA(tracking.googleAnalyticsId)&&!validAW(tracking.googleAdsId)))return;
    ensureDataLayer();window.gtag('event',name,params||{});
  }
  function metaEvent(name,params){
    if(!tracking||tracking.mode!=='direct'||!metaLoaded||typeof window.fbq!=='function')return;
    window.fbq('track',name,params||{});
  }
  function adsSendTo(label){
    const value=clean(label);
    if(!value||!tracking||!validAW(tracking.googleAdsId))return '';
    if(/^AW-\d+\//i.test(value))return value;
    return tracking.googleAdsId+'/'+value;
  }
  function fireAdsLead(){
    const sendTo=adsSendTo(tracking&&tracking.googleAdsLeadLabel);
    if(!sendTo||!tracking||tracking.mode!=='direct')return;
    ensureDataLayer();
    const params={send_to:sendTo};
    const value=Number(clean(tracking.conversionValue).replace(',','.'));
    if(Number.isFinite(value)&&value>0){params.value=value;params.currency=tracking.currency||'BRL'}
    window.gtag('event','conversion',params);
  }
  function bindMarketingClicks(){
    if(clickBound)return;clickBound=true;
    document.addEventListener('click',event=>{
      if(!tracking||!tracking.enabled)return;
      const anchor=event.target&&event.target.closest?event.target.closest('a'):null;
      if(!anchor)return;
      const href=clean(anchor.getAttribute('href'));
      if(!/(?:wa\.me|api\.whatsapp\.com|whatsapp:)/i.test(href))return;
      const details={content_name:'WhatsApp',link_url:anchor.href||href};
      window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:'whatsapp_click',link_url:details.link_url});
      googleEvent('generate_lead',{method:'whatsapp',link_url:details.link_url});
      fireAdsLead();
      metaEvent('Contact',details);
    },{capture:true});
  }

  function removeConsentBanner(){const el=document.querySelector('[data-cq-consent-banner]');if(el)el.remove()}
  function saveConsent(choice){
    try{localStorage.setItem(CONSENT_KEY,choice)}catch{}
    updateGoogleConsent(choice);
    if(choice==='granted'&&tracking&&tracking.mode==='direct')loadMeta();
    removeConsentBanner();
  }
  function showConsentBanner(force){
    if(!tracking||!tracking.consent.enabled)return;
    if(!force&&consentChoice()!=='unset')return;
    if(document.querySelector('[data-cq-consent-banner]'))return;
    const banner=document.createElement('aside');banner.dataset.cqConsentBanner='1';banner.setAttribute('role','dialog');banner.setAttribute('aria-label',tracking.consent.title);
    banner.style.cssText='position:fixed;left:16px;right:16px;bottom:16px;z-index:10000;max-width:620px;margin:auto;padding:18px;border:1px solid rgba(255,255,255,.16);border-radius:18px;background:rgba(2,17,31,.97);color:#fff;box-shadow:0 18px 55px rgba(0,0,0,.4);font-family:Inter,system-ui,sans-serif;';
    const title=document.createElement('strong');title.textContent=tracking.consent.title;title.style.cssText='display:block;font-size:15px;margin-bottom:6px;';
    const text=document.createElement('p');text.textContent=tracking.consent.text;text.style.cssText='font-size:12px;line-height:1.55;color:#dbe2e8;margin:0 0 12px;';
    banner.append(title,text);
    if(tracking.consent.privacyUrl){const link=document.createElement('a');link.href=tracking.consent.privacyUrl;link.textContent='Política de Privacidade';link.style.cssText='display:inline-block;color:#d9bd82;font-size:11px;margin-bottom:12px;text-decoration:underline;';banner.appendChild(link)}
    const actions=document.createElement('div');actions.style.cssText='display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;';
    const reject=document.createElement('button');reject.type='button';reject.textContent='Recusar';reject.style.cssText='border:1px solid rgba(255,255,255,.2);background:transparent;color:#fff;border-radius:999px;padding:9px 14px;font:600 11px Inter,system-ui,sans-serif;cursor:pointer;';reject.onclick=()=>saveConsent('denied');
    const accept=document.createElement('button');accept.type='button';accept.textContent='Aceitar';accept.style.cssText='border:0;background:#c9a86a;color:#02111f;border-radius:999px;padding:10px 16px;font:700 11px Inter,system-ui,sans-serif;cursor:pointer;';accept.onclick=()=>saveConsent('granted');
    actions.append(reject,accept);banner.appendChild(actions);document.body.appendChild(banner);
  }
  function initializeTracking(){
    tracking=normalizeTracking(cfg||{});
    injectMetaVerification(tracking.metaDomainVerification);
    if(!tracking.enabled)return;
    bindMarketingClicks();
    if(tracking.mode==='gtm')loadGTM();else{loadGoogleDirect();loadMeta()}
    showConsentBanner(false);
  }

  function enhance(){renderTicker();loadLucide().then(renderIconBoxes);initializeTracking()}

  window.CatarinaTracking={
    track:function(name,details){if(!tracking||!tracking.enabled)return;window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:name,...(details||{})});googleEvent(name,details||{})},
    consent:function(choice){if(choice==='granted'||choice==='denied')saveConsent(choice)},
    manageConsent:function(){showConsentBanner(true)},
    resetConsent:function(){try{localStorage.removeItem(CONSENT_KEY)}catch{}location.reload()}
  };

  fetch('/api/config-v2',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{cfg=j&&j.config||{};setTimeout(enhance,150);setTimeout(enhance,900)}).catch(()=>setTimeout(()=>loadLucide().then(renderIconBoxes),500));
})();
