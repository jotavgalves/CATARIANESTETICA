// Extra visual fields for client before/after photos in testimonials.
(function(){
  function wait(){
    if (typeof C === 'undefined' || typeof set === 'undefined') return setTimeout(wait,500);
    enhance();
    new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});
  }
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]})}
  function get(o,p){return p.split('.').reduce(function(a,k){return a&&a[k]},o)}
  var busy=false;
  function enhance(){
    if(busy)return;
    var items=document.querySelectorAll('.item');
    items.forEach(function(item){
      if(item.dataset.baDone==='1')return;
      var marker=item.querySelector('[data-path*="sections.testimonials.items."][data-path$=".imageUrl"]');
      if(!marker)return;
      var m=marker.getAttribute('data-path').match(/sections\.testimonials\.items\.(\d+)\./);
      if(!m)return;
      var i=m[1];
      item.dataset.baDone='1';
      var wrap=document.createElement('div');
      wrap.className='grid before-after-admin';
      wrap.innerHTML='<div><label>Foto ANTES</label><input placeholder="URL da foto antes" data-ba-path="sections.testimonials.items.'+i+'.beforeImageUrl" value="'+esc(get(C,'sections.testimonials.items.'+i+'.beforeImageUrl')||'')+'"><div class="small">Use imagem autorizada. Ideal: 900x1200px ou 1080x1350px.</div></div><div><label>Foto DEPOIS</label><input placeholder="URL da foto depois" data-ba-path="sections.testimonials.items.'+i+'.afterImageUrl" value="'+esc(get(C,'sections.testimonials.items.'+i+'.afterImageUrl')||'')+'"><div class="small">Mesma proporção da foto antes para ficar alinhado no site.</div></div>';
      marker.closest('.grid').appendChild(wrap);
      wrap.querySelectorAll('[data-ba-path]').forEach(function(inp){
        inp.oninput=function(){set(C,inp.getAttribute('data-ba-path'),inp.value)};
      });
    });
  }
  document.addEventListener('DOMContentLoaded',wait);
})();
