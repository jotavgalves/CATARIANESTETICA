const app = document.getElementById('adminApp');
let C = {};
let DEFAULT_CONFIG = {};
let activeTab = 'content';
let statusTimer = null;

const tabs = [
  ['content', 'Conteúdo principal', ['site', 'navigation', 'sections.hero', 'sections.ticker', 'sections.complaints']],
  ['procedures', 'Procedimentos e método', ['sections.procedures', 'sections.method', 'sections.featured']],
  ['about', 'Sobre, confiança e localização', ['sections.about', 'sections.authority', 'sections.location', 'sections.finalCta']],
  ['proof', 'Depoimentos e FAQ', ['sections.testimonials', 'sections.faq']],
  ['design', 'Visual, rodapé e pixels', ['theme', 'footer', 'pixels', 'maintenance']],
  ['drive', 'Drive, imagens e tamanhos', ['drive']]
];

const titles = {
  site: 'Geral, SEO e contato', navigation: 'Menu do topo', theme: 'Cores e aparência', footer: 'Rodapé', pixels: 'Meta Pixel e Google', maintenance: 'Manutenção', drive: 'Drive e imagens',
  'sections.hero': 'Hero / início', 'sections.ticker': 'Faixa horizontal que se move', 'sections.complaints': 'Queixas / cards iniciais',
  'sections.procedures': 'Procedimentos', 'sections.method': 'Método', 'sections.featured': 'Protocolos em destaque',
  'sections.about': 'Sobre Catarina', 'sections.authority': 'Confiança', 'sections.location': 'Localização', 'sections.finalCta': 'CTA final',
  'sections.testimonials': 'Depoimentos e antes/depois', 'sections.faq': 'FAQ'
};

const labels = {
  visible: 'Mostrar no site', name: 'Nome curto', businessName: 'Nome da clínica', brandLine1: 'Logo texto linha 1', brandLine2: 'Logo texto linha 2', brandSubtitle: 'Subtítulo da logo',
  imageUrl: 'URL da imagem', beforeImageUrl: 'Foto ANTES', afterImageUrl: 'Foto DEPOIS', photoUrl: 'Foto da cliente', url: 'URL', alt: 'Texto alternativo', label: 'Etiqueta', note: 'Observação',
  title: 'Título', subtitle: 'Subtítulo', kicker: 'Texto pequeno acima', text: 'Texto', description: 'Descrição', button: 'Texto do botão', primaryButton: 'Botão principal', secondaryButton: 'Botão secundário',
  icon: 'Ícone Lucide', number: 'Número', category: 'Categoria', tags: 'Tags', items: 'Itens', steps: 'Etapas', paragraphs: 'Parágrafos', bullets: 'Lista de destaques',
  ctaText: 'Texto do botão do menu', href: 'Link/âncora', phoneDisplay: 'Telefone visível', whatsappNumber: 'Número WhatsApp com DDI', whatsappMessage: 'Mensagem automática WhatsApp',
  address: 'Endereço', mapsQuery: 'Busca do mapa', mapsEmbedUrl: 'URL embed do mapa', hours: 'Horários/atendimento',
  seo: 'SEO', metaPixelId: 'Meta Pixel ID antigo', browserPixelId: 'Meta Pixel do navegador', serverAccessToken: 'Token de servidor / Conversions API', testEventCode: 'Código de teste do evento', googleAdsId: 'Google Ads ID', enabled: 'Ativado',
  copyright: 'Direitos autorais', tagline: 'Frase do rodapé', procedureLinks: 'Links de procedimentos no rodapé', navigationLinks: 'Links de navegação no rodapé',
  speedSeconds: 'Velocidade da faixa em segundos', metaText: 'Texto abaixo do carrossel', cardTitle: 'Título do card', addressLabel: 'Rótulo endereço', whatsappLabel: 'Rótulo WhatsApp', hoursLabel: 'Rótulo atendimento', routeButton: 'Botão rota',
  folderUrl: 'Link da pasta do Drive', folderId: 'ID da pasta do Drive', specs: 'Tamanhos recomendados', field: 'Campo', size: 'Tamanho recomendado'
};

const lucideDefaults = ['sparkles','smile','waves','star','badge-check','check-circle','clipboard-check','route','wand-sparkles','trending-up','check','calendar-days','map-pinned'];
function isLucide(v){ return /^[a-z0-9-]+$/i.test(String(v||'')) && String(v||'').length > 1; }
function clone(v){ return JSON.parse(JSON.stringify(v)); }
function merge(target, source){ if(!source||typeof source!=='object')return target; Object.keys(source).forEach(k=>{ if(Array.isArray(source[k]))target[k]=source[k]; else if(source[k]&&typeof source[k]==='object')target[k]=merge(target[k]&&typeof target[k]==='object'?target[k]:{},source[k]); else if(source[k]!==undefined&&source[k]!==null)target[k]=source[k]; }); return target; }
function get(obj,path){ return String(path||'').split('.').filter(Boolean).reduce((a,k)=>a&&a[k],obj); }
function set(obj,path,value){ const parts=String(path).split('.').filter(Boolean); let ref=obj; while(parts.length>1){ const k=parts.shift(); if(ref[k]==null)ref[k]=/^\d+$/.test(parts[0])?[]:{}; ref=ref[k]; } ref[parts[0]]=value; }
function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function labelFor(key,path){ return labels[key]||labels[String(path).split('.').pop()]||key.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase()); }
function status(msg,type='ok'){ const el=document.querySelector('#saveStatus'); if(!el)return; el.textContent=msg; el.className='status '+type; clearTimeout(statusTimer); statusTimer=setTimeout(()=>{el.textContent='';el.className='status'},5000); }

function ensureDefaults(){
  C.sections ||= {}; C.sections.ticker ||= {}; C.pixels ||= {}; C.drive ||= {};
  if(!Array.isArray(C.sections.ticker.items)){
    C.sections.ticker.items = ['Limpeza de pele','Drenagem facial','Drenagem HD','Peeling químico','Botox','Endolaser'].map(text=>({text,visible:true}));
  }
  C.pixels.enabled ??= false; C.pixels.browserPixelId ??= C.pixels.metaPixelId || ''; C.pixels.serverAccessToken ??= ''; C.pixels.testEventCode ??= ''; C.pixels.googleAdsId ??= '';
  C.drive.folderUrl ??= ''; C.drive.folderId ??= '';
  C.drive.specs ||= [
    {field:'Logo',size:'SVG transparente ou PNG 900x300px'},
    {field:'Hero',size:'1600x2000px JPG/WebP'},
    {field:'Sobre',size:'1400x1800px JPG/WebP'},
    {field:'Procedimentos',size:'1200x900px JPG/WebP'},
    {field:'Depoimentos / antes e depois',size:'1080x1350px ou mesma proporção nas duas fotos'}
  ];
  const sets=[C.sections.complaints&&C.sections.complaints.items,C.sections.method&&C.sections.method.steps,C.sections.authority&&C.sections.authority.items];
  let n=0; sets.forEach(arr=>Array.isArray(arr)&&arr.forEach(item=>{ if(!isLucide(item.icon)) item.icon=lucideDefaults[n%lucideDefaults.length]; n++; }));
}

async function load(){
  try{ DEFAULT_CONFIG=await fetch('/config/site.v2.json',{cache:'no-store'}).then(r=>r.json()); }catch{ DEFAULT_CONFIG={version:2,site:{},theme:{},navigation:{},sections:{},footer:{}}; }
  try{ const payload=await fetch('/api/config-v2',{cache:'no-store'}).then(r=>r.json()); C=merge(clone(DEFAULT_CONFIG),payload.config||{}); }catch{ C=clone(DEFAULT_CONFIG); }
  ensureDefaults(); render();
}

function render(){
  const tab=tabs.find(t=>t[0]===activeTab)||tabs[0];
  const paths=Array.isArray(tab[2])?tab[2]:[tab[2]];
  app.innerHTML=`<section class="admin-shell"><aside class="admin-side"><div class="admin-brand"><b>Catarina Queiroz</b><span>Painel visual completo</span></div><div class="tabs">${tabs.map(t=>`<button class="tab ${t[0]===activeTab?'active':''}" data-tab="${t[0]}">${esc(t[1])}</button>`).join('')}</div></aside><section class="admin-main"><div class="admin-top"><div><p class="eyebrow">Editor visual</p><h1>${esc(tab[1])}</h1><p>As abas foram agrupadas. Tudo salvo aqui reflete no site público.</p></div><div class="top-actions"><a class="ghost" href="/" target="_blank">Abrir site</a><button class="primary" id="saveBtn">Salvar alterações</button></div></div><div class="login-box"><input id="adminPassword" type="password" placeholder="Senha do painel, se pedir autorização"><button id="loginBtn">Entrar</button><span id="saveStatus" class="status"></span></div><div class="panel-card">${paths.map(p=>`<div class="editor-block full section-block"><h2>${esc(titles[p]||p)}</h2>${renderValue(get(C,p),p,titles[p]||p)}</div>`).join('')}</div></section></section>`;
  bind();
}
function renderValue(value,path,title){ if(Array.isArray(value))return renderArray(value,path,title); if(value&&typeof value==='object')return renderObject(value,path); return renderField(path,value); }
function renderObject(obj,path){ return `<div class="editor-grid">${Object.keys(obj||{}).map(key=>{ const childPath=path?`${path}.${key}`:key; const value=obj[key]; if(Array.isArray(value))return `<div class="editor-block full"><h2>${esc(labelFor(key,childPath))}</h2>${renderArray(value,childPath,key)}</div>`; if(value&&typeof value==='object')return `<div class="editor-block full"><h2>${esc(labelFor(key,childPath))}</h2>${renderObject(value,childPath)}</div>`; return renderField(childPath,value,key); }).join('')}</div>`; }
function renderArray(arr,path,title){ const primitive=!arr.length||typeof arr[0]!=='object'; return `<div class="array-box" data-array="${esc(path)}"><div class="array-head"><span>${esc(labelFor(title,path))}</span><button class="ghost small" data-add="${esc(path)}">Adicionar</button></div>${arr.map((item,i)=>primitive?renderPrimitiveArrayItem(item,`${path}.${i}`,i):renderObjectArrayItem(item,`${path}.${i}`,i)).join('')}</div>`; }
function renderPrimitiveArrayItem(item,path,i){ return `<div class="array-item primitive"><label>Item ${i+1}</label><input data-path="${esc(path)}" value="${esc(item)}"><button class="danger small" data-remove="${esc(path)}">Remover</button></div>`; }
function renderObjectArrayItem(item,path,i){ const name=item.title||item.name||item.question||item.text||item.label||`Item ${i+1}`; return `<details class="array-item" open><summary><b>${esc(name)}</b><span><button class="ghost small" data-duplicate="${esc(path)}">Duplicar</button><button class="danger small" data-remove="${esc(path)}">Remover</button></span></summary>${renderObject(item,path)}</details>`; }
function renderField(path,value,keyOverride){
  const key=keyOverride||path.split('.').pop(); const label=labelFor(key,path); const full=/text|description|subtitle|message|answer|paragraph|copyright|address|note|token/i.test(key+path); const isBool=typeof value==='boolean'; const isNumber=typeof value==='number'; const isColor=typeof value==='string'&&/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
  const iconList = key==='icon' ? `<small>Use nomes do Lucide, ex: sparkles, smile, waves, badge-check, calendar-days, map-pinned, wand-sparkles.</small>` : '';
  const preview = /imageUrl|\.url$/i.test(path) && value ? `<img class="img-preview" src="${esc(value)}" alt="preview" onerror="this.style.display='none'">` : '';
  const input=isBool?`<label class="check"><input type="checkbox" data-path="${esc(path)}" ${value?'checked':''}> ${esc(label)}</label>`:isColor?`<div class="color-row"><input type="color" data-path="${esc(path)}" value="${esc(value)}"><input data-path="${esc(path)}" value="${esc(value)}"></div>`:full?`<textarea data-path="${esc(path)}" rows="4">${esc(value)}</textarea>`:`<input ${isNumber?'type="number"':''} data-path="${esc(path)}" value="${esc(value)}">`;
  return `<div class="field ${isBool?'bool':''}">${isBool?input:`<label>${esc(label)}</label>${input}${preview}${hint(path)}${iconList}</div>`}`;
}
function hint(path){ if(/beforeImageUrl|afterImageUrl/i.test(path))return '<small>Antes/depois: use imagens com a mesma proporção. Recomendado 1080x1350px.</small>'; if(/imageUrl|\.url$/i.test(path))return '<small>Cole a URL pública da imagem ou uma imagem do Drive com acesso liberado.</small>'; if(/serverAccessToken/i.test(path))return '<small>Token de servidor é protegido: não é enviado para o site público.</small>'; if(/browserPixelId/i.test(path))return '<small>Esse é o ID do Pixel usado no navegador.</small>'; if(/sections\.ticker\.items/i.test(path))return '<small>Esse texto aparece na faixa horizontal em movimento.</small>'; return ''; }
function bind(){ document.querySelectorAll('[data-tab]').forEach(btn=>btn.onclick=()=>{activeTab=btn.dataset.tab;render()}); document.querySelectorAll('[data-path]').forEach(input=>{input.oninput=()=>{let value=input.type==='checkbox'?input.checked:input.type==='number'?Number(input.value):input.value;set(C,input.dataset.path,value);if(input.type==='color')document.querySelectorAll(`[data-path="${input.dataset.path}"]`).forEach(o=>{if(o!==input)o.value=input.value})}}); document.querySelectorAll('[data-add]').forEach(btn=>btn.onclick=()=>{addItem(btn.dataset.add);render()}); document.querySelectorAll('[data-remove]').forEach(btn=>btn.onclick=()=>{removeItem(btn.dataset.remove);render()}); document.querySelectorAll('[data-duplicate]').forEach(btn=>btn.onclick=e=>{e.preventDefault();duplicateItem(btn.dataset.duplicate);render()}); document.getElementById('saveBtn').onclick=save; document.getElementById('loginBtn').onclick=login; }
function arrayAndIndex(path){const parts=path.split('.');const index=Number(parts.pop());return{arr:get(C,parts.join('.')),index}}
function blankLike(item){ if(Array.isArray(item))return[]; if(item&&typeof item==='object'){const out={};Object.keys(item).forEach(k=>{if(typeof item[k]==='boolean')out[k]=k==='visible';else if(typeof item[k]==='number')out[k]=item[k];else if(Array.isArray(item[k]))out[k]=[];else if(item[k]&&typeof item[k]==='object')out[k]=blankLike(item[k]);else out[k]=''}); if('visible'in out)out.visible=true; return out;} return ''; }
function addItem(path){const arr=get(C,path); if(Array.isArray(arr))arr.push(arr.length?blankLike(arr[arr.length-1]):'')}
function removeItem(path){const{arr,index}=arrayAndIndex(path); if(Array.isArray(arr))arr.splice(index,1)}
function duplicateItem(path){const{arr,index}=arrayAndIndex(path); if(Array.isArray(arr))arr.splice(index+1,0,clone(arr[index]))}
async function login(){ const password=document.getElementById('adminPassword').value; if(!password)return status('Digite a senha.','warn'); const res=await fetch('/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password})}); if(!res.ok)return status('Senha incorreta ou ADMIN_PASSWORD ausente.','bad'); document.cookie='cq_session=ok; path=/; max-age=86400; SameSite=Lax; Secure'; status('Login feito. Agora pode salvar.','ok'); setTimeout(load,300); }
async function save(){ ensureDefaults(); status('Salvando...','warn'); const res=await fetch('/api/config-v2',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({config:C})}); if(res.status===401)return status('Não autorizado. Digite a senha e clique em Entrar.','bad'); if(!res.ok)return status('Erro ao salvar. Verifique o KV SITE_CONFIG.','bad'); status('Salvo. Abra o site e dê Ctrl+F5 para ver refletido.','ok'); }
load();
