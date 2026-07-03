(function(){
  function addCss(href){var l=document.createElement('link');l.rel='stylesheet';l.href=href;document.head.appendChild(l)}
  addCss('/src/final-fixes.css?v=1');
})();

document.addEventListener('DOMContentLoaded',function(){
  var cfg=null, auto=null, pauseUntil=0, down=null, dragged=false;
  var track=document.getElementById('proceduresTrack');
  var progress=document.querySelector('.carousel-meta .progress i')||document.querySelector('.progress i');
  var counter=document.querySelector('.carousel-meta span:first-child');

  function safe(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]})}
  function wa(text){var c=cfg&&cfg.site&&cfg.site.contact||{};var n=String(c.whatsappNumber||'5581989844806').replace(/\D/g,'');return 'https://wa.me/'+n+'?text='+encodeURIComponent(text||c.whatsappMessage||'Olá, vim pelo site e gostaria de agendar uma avaliação.')}

  function init(){
    track=document.getElementById('proceduresTrack');
    progress=document.querySelector('.carousel-meta .progress i')||document.querySelector('.progress i');
    counter=document.querySelector('.carousel-meta span:first-child');
    fixWhatsapp();
    bindProcedureCarousel();
    updateProgressAndActive();
    renderBeforeAfterFromConfig();
  }

  function fixWhatsapp(){
    document.querySelectorAll('.whatsapp-float').forEach(function(el){
      el.style.position='fixed';el.style.right='24px';el.style.left='auto';el.style.bottom='24px';el.style.zIndex='99999';
    });
  }

  function bindProcedureCarousel(){
    if(!track||track.dataset.fixed==='1')return;
    track.dataset.fixed='1';
    track.classList.add('is-paused');
    track.addEventListener('scroll',rafUpdate,{passive:true});
    track.addEventListener('pointerdown',function(e){if(e.target.closest('a,button'))return;down={x:e.clientX,left:track.scrollLeft};dragged=false;track.setPointerCapture&&track.setPointerCapture(e.pointerId)},true);
    track.addEventListener('pointermove',function(e){if(!down)return;var dx=e.clientX-down.x;if(Math.abs(dx)>6)dragged=true;track.scrollLeft=down.left-dx},true);
    track.addEventListener('pointerup',function(){down=null;temporaryPause()},true);
    track.addEventListener('click',function(e){
      var card=e.target.closest('.procedure-card');
      if(!card||e.target.closest('a,button'))return;
      e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();
      if(dragged){dragged=false;return;}
      openModal(cardToData(card));
    },true);
    document.querySelectorAll('[data-target="proceduresTrack"]').forEach(function(btn){
      btn.onclick=function(e){e.preventDefault();temporaryPause();move(Number(btn.getAttribute('data-dir')||1));};
    });
    clearInterval(auto);
    auto=setInterval(function(){
      if(!track||Date.now()<pauseUntil||document.body.classList.contains('modal-open')||track.matches(':hover'))return;
      move(1);
    },3000);
  }

  var ticking=false;
  function rafUpdate(){if(ticking)return;ticking=true;requestAnimationFrame(function(){ticking=false;updateProgressAndActive()})}
  function cards(){return track?Array.from(track.querySelectorAll('.procedure-card')):[]}
  function activeIndex(){
    var list=cards();if(!list.length)return 0;
    var rect=track.getBoundingClientRect(),center=rect.left+rect.width/2,best=0,dist=Infinity;
    list.forEach(function(card,i){var r=card.getBoundingClientRect(),c=r.left+r.width/2,d=Math.abs(c-center);if(d<dist){dist=d;best=i}});
    return best;
  }
  function updateProgressAndActive(){
    if(!track)return;var list=cards();if(!list.length)return;
    var idx=activeIndex();
    list.forEach(function(card,i){card.classList.toggle('is-active',i===idx);card.classList.toggle('is-near',Math.abs(i-idx)===1);card.classList.toggle('dim',Math.abs(i-idx)>1)});
    var pct=list.length<=1?100:((idx+1)/list.length)*100;
    if(progress)progress.style.width=pct+'%';
    if(counter)counter.textContent=String(idx+1).padStart(2,'0')+' / '+String(list.length).padStart(2,'0');
  }
  function move(dir){
    if(!track)return;var list=cards();if(!list.length)return;
    var idx=activeIndex()+dir;if(idx>=list.length)idx=0;if(idx<0)idx=list.length-1;
    list[idx].scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
    setTimeout(updateProgressAndActive,450);
  }
  function temporaryPause(){pauseUntil=Date.now()+4500;}

  function cardToData(card){
    var img=card.querySelector('.procedure-image img');
    var label=card.querySelector('.procedure-body>span');
    var title=card.querySelector('.procedure-body h3');
    var text=card.querySelector('.procedure-body p');
    var tags=Array.from(card.querySelectorAll('.tags b')).map(function(x){return x.textContent.trim()});
    return {image:img&&img.src||'',label:label&&label.textContent.trim()||'Procedimento',title:title&&title.textContent.trim()||'Procedimento',text:text&&text.textContent.trim()||'',tags:tags};
  }
  function openModal(d){
    if(!d)return;temporaryPause();document.querySelectorAll('.proc-modal').forEach(function(m){m.remove()});
    var m=document.createElement('div');m.className='proc-modal is-open';
    m.innerHTML='<div class="proc-modal__backdrop" data-close="1"></div><div class="proc-modal__dialog" role="dialog" aria-modal="true"><button class="proc-modal__close" data-close="1" type="button">×</button><div class="proc-modal__media">'+(d.image?'<img src="'+safe(d.image)+'" alt="'+safe(d.title)+'">':safe(d.title))+'</div><div class="proc-modal__content"><span>'+safe(d.label)+'</span><h3>'+safe(d.title)+'</h3><p>'+safe(d.text)+'</p><div class="proc-modal__tags">'+d.tags.map(function(t){return'<b>'+safe(t)+'</b>'}).join('')+'</div><a class="btn btn-gold" href="'+wa('Tenho interesse em '+d.title+'.')+'">Tenho interesse →</a></div></div>';
    document.body.appendChild(m);document.body.classList.add('modal-open');
    m.querySelectorAll('[data-close]').forEach(function(b){b.onclick=function(){m.remove();document.body.classList.remove('modal-open')}});
  }

  function testimonialHtml(item){
    var before=item.beforeImageUrl||item.beforeUrl||item.imageBefore||'';
    var after=item.afterImageUrl||item.afterUrl||item.imageAfter||'';
    var photo=item.imageUrl||item.photoUrl||'';
    var body='<div class="testimonial-body"><div>★★★★★</div><p>“'+safe(item.text||'')+'”</p><strong>'+safe(item.name||'Cliente')+'</strong><span>'+safe(item.role||'')+'</span></div>';
    if(before&&after){return '<article class="testimonial-card has-ba"><div class="before-after"><figure><img src="'+safe(before)+'" alt="Antes"><figcaption>Antes</figcaption></figure><figure><img src="'+safe(after)+'" alt="Depois"><figcaption>Depois</figcaption></figure></div>'+body+'</article>'}
    if(photo){return '<article class="testimonial-card has-photo"><img class="client-photo" src="'+safe(photo)+'" alt="'+safe(item.name||'Cliente')+'">'+body+'</article>'}
    return '<article class="testimonial-card">'+body+'</article>';
  }
  function renderBeforeAfterFromConfig(){
    if(!cfg||!cfg.sections||!cfg.sections.testimonials)return;
    var t=cfg.sections.testimonials,box=document.querySelector('.testimonial-track');if(!box||!Array.isArray(t.items))return;
    box.innerHTML=t.items.filter(function(x){return x.visible!==false}).slice(0,8).map(testimonialHtml).join('');
  }

  fetch('/api/config-v2',{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(function(j){
    if(j&&j.config){cfg=j.config;setTimeout(function(){renderBeforeAfterFromConfig();init()},300)}
  }).catch(function(){});
  setTimeout(init,550);
  setTimeout(init,1500);
});
