(function(){
  var app = document.getElementById('app');
  var WA_ICON = '/assets/icons/whatsapp.svg';

  var base = {
    site: {
      businessName: 'Catarina Queiroz Clínica Estética',
      contact: {
        whatsappNumber: '5581989844806',
        phoneDisplay: '(81) 98984-4806',
        address: 'R. Ribeiro de Brito, 554 — Boa Viagem, Recife — PE',
        mapsQuery: 'R. Ribeiro de Brito, 554 Boa Viagem Recife PE',
        whatsappMessage: 'Olá! Vim pelo site e gostaria de agendar uma avaliação.'
      },
      seo: { title: 'Catarina Queiroz Clínica Estética' }
    },
    sections: {
      hero: {
        kicker: 'Estética facial e corporal em Boa Viagem',
        title: 'A beleza que você quer valorizar tem um caminho certo.',
        subtitle: 'A avaliação transforma uma queixa genérica em uma indicação técnica, coerente e personalizada.',
        primaryButton: 'Agendar avaliação',
        secondaryButton: 'Ver procedimentos',
        note: 'Atendimento com hora marcada em Boa Viagem, Recife.',
        image: { url: '' }
      },
      complaints: {
        kicker: 'Cuidado direcionado',
        subtitle: 'A avaliação transforma uma queixa genérica em uma indicação técnica, coerente e personalizada.',
        items: [
          { icon:'droplets', title:'Pele com cravos, oleosidade ou textura irregular', text:'Cuidados para limpeza profunda, renovação, hidratação e melhora da luminosidade.' },
          { icon:'smile', title:'Rosto inchado ou aparência cansada', text:'Drenagem e protocolos faciais para leveza, viço e contorno mais descansado.' },
          { icon:'waves', title:'Retenção, celulite e sensação de peso', text:'Tratamentos corporais para circulação, firmeza, uniformidade da pele e definição.' }
        ]
      },
      procedures: {
        kicker: 'Procedimentos',
        subtitle: 'Veja os principais protocolos disponíveis e use a avaliação para confirmar a indicação correta para sua pele, corpo e objetivo.',
        items: [
          { title:'Limpeza de Pele', icon:'sparkles', description:'Remove impurezas, cravos, células mortas e excesso de oleosidade, promovendo pele mais limpa, saudável e renovada.' },
          { title:'Drenagem Facial', icon:'smile', description:'Massagem suave que estimula circulação e sistema linfático, reduzindo inchaço e melhorando o contorno facial.' },
          { title:'Peeling Químico', icon:'wand-2', description:'Utiliza ativos específicos para renovação da pele, suavização de manchas, textura irregular, marcas de acne e opacidade.' },
          { title:'Drenagem HD', icon:'activity', description:'Protocolo corporal para sensação de leveza, retenção de líquidos e definição visual.' },
          { title:'Botox', icon:'syringe', description:'Planejamento facial para suavizar linhas e preservar naturalidade.' },
          { title:'Endolaser', icon:'zap', description:'Tecnologia estética indicada após avaliação personalizada.' }
        ]
      },
      method: {
        steps: [
          { icon:'clipboard-check', title:'Avaliação estética', text:'Entendimento da queixa, rotina, objetivo, histórico e características individuais.' },
          { icon:'route', title:'Planejamento', text:'Definição dos procedimentos mais adequados para pele, corpo e expectativa.' },
          { icon:'sparkles', title:'Execução técnica', text:'Atendimento com hora marcada, ambiente preparado e orientação clara.' },
          { icon:'trending-up', title:'Evolução', text:'Recomendações e acompanhamento para potencializar resultado progressivo.' }
        ]
      },
      about: {
        kicker: 'A especialista',
        text: 'Graduada em Estética e Cosmetologia, Catarina atua com tratamentos faciais e corporais voltados à autoestima, ao bem-estar e à valorização da beleza individual.',
        bullets: ['Protocolos personalizados após avaliação', 'Atendimento com hora marcada', 'Clínica em Boa Viagem, Recife'],
        image: { url: '' }
      },
      testimonials: {
        kicker: 'Depoimentos',
        title: 'Experiências de quem passou pela clínica',
        subtitle: 'Depoimentos editáveis pelo painel administrativo.',
        items: [
          { name:'Cliente 01', role:'Atendimento facial', text:'Atendimento muito cuidadoso, com explicação clara do protocolo e um ambiente lindo.', visible:true },
          { name:'Cliente 02', role:'Drenagem', text:'Me senti acolhida desde o primeiro contato. Tudo foi explicado com muita calma.', visible:true },
          { name:'Cliente 03', role:'Limpeza de pele', text:'Amei a experiência. A pele ficou com sensação de limpeza e leveza.', visible:true },
          { name:'Cliente 04', role:'Protocolo corporal', text:'Gostei muito da avaliação individual e do cuidado no acompanhamento.', visible:true },
          { name:'Cliente 05', role:'Facial', text:'Ambiente elegante, atendimento pontual e muita atenção aos detalhes.', visible:true },
          { name:'Cliente 06', role:'Avaliação estética', text:'Catarina explicou tudo sem pressa e indicou exatamente o que fazia sentido para mim.', visible:true },
          { name:'Cliente 07', role:'Peeling', text:'Experiência segura e profissional. Senti muita confiança no atendimento.', visible:true },
          { name:'Cliente 08', role:'Drenagem facial', text:'O atendimento foi delicado e o resultado visual ficou muito natural.', visible:true },
          { name:'Cliente 09', role:'Protocolo personalizado', text:'Gostei de não ser algo pronto. Ela avaliou meu caso antes de indicar qualquer coisa.', visible:true },
          { name:'Cliente 10', role:'Experiência premium', text:'Tudo muito organizado: do WhatsApp ao atendimento presencial.', visible:true }
        ]
      },
      faq: {
        kicker: 'Dúvidas frequentes',
        title: 'Antes de agendar.',
        items: [
          { question:'Preciso saber qual procedimento quero antes de agendar?', answer:'Não. A avaliação existe justamente para entender sua queixa e indicar o caminho mais adequado.' },
          { question:'Os resultados são imediatos?', answer:'Depende do protocolo, da resposta individual e dos cuidados indicados.' },
          { question:'Posso combinar procedimentos?', answer:'Sim, quando houver indicação profissional e segurança para a combinação.' },
          { question:'O atendimento é por hora marcada?', answer:'Sim. O atendimento é organizado para preservar tempo, conforto e privacidade.' },
          { question:'Como faço para agendar?', answer:'Clique no botão de WhatsApp e envie a mensagem automática.' }
        ]
      }
    }
  };

  function safe(v){ return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]; }); }
  function icon(name){ return '<i data-lucide="'+safe(name || 'sparkles')+'"></i>'; }
  function whatsapp(C, text){
    var n = ((C.site.contact || {}).whatsappNumber || '').replace(/\D/g,'');
    var msg = encodeURIComponent(text || (C.site.contact || {}).whatsappMessage || 'Olá!');
    return 'https://wa.me/' + n + '?text=' + msg;
  }
  function brand(){
    return '<a class="brand" href="#inicio"><span class="brandText"><b>CATARINA<br>QUEIROZ</b><span>CLÍNICA ESTÉTICA</span></span></a>';
  }
  function nav(C){
    var links = ['Início','Procedimentos','Método','Sobre','FAQ','Localização'];
    var ids = ['inicio','procedimentos','metodo','sobre','faq','localizacao'];
    return '<header class="nav"><div class="container">'+brand()+'<nav class="links" id="links">'+links.map(function(l,i){return '<a href="#'+ids[i]+'">'+l+'</a>';}).join('')+'</nav><a class="navCta" href="'+whatsapp(C)+'">Agendar avaliação</a><button class="menu" id="menu"><span></span><span></span><span></span></button></div></header>';
  }
  function ticker(C){
    var items = ((C.sections.procedures || {}).items || base.sections.procedures.items).map(function(x){return x.title;});
    return '<div class="ticker"><div class="tickerInner">'+items.concat(items).map(function(x){return '<span>'+safe(x)+'</span>';}).join('')+'</div></div>';
  }
  function hero(C){
    var h = C.sections.hero || base.sections.hero;
    return '<section class="section hero" id="inicio"><div class="container center reveal"><div class="eyebrow">'+safe(h.kicker)+'</div><h1 class="title">'+safe(h.title)+'</h1><p class="lead">'+safe(h.subtitle)+'</p><div class="actions" style="justify-content:center"><a class="btn btnPrimary" href="'+whatsapp(C)+'"><img src="'+WA_ICON+'" alt="">'+safe(h.primaryButton)+'</a><a class="btn" href="#procedimentos">'+safe(h.secondaryButton)+'</a></div></div></section>';
  }
  function complaints(C){
    var s = C.sections.complaints || base.sections.complaints;
    return '<section class="section" id="queixas"><div class="container center reveal"><div class="eyebrow">Cuidado direcionado</div><h2 class="title">A beleza que você quer valorizar tem um caminho certo.</h2><p class="lead">'+safe(s.subtitle)+'</p><div class="cards3">'+(s.items||[]).slice(0,6).map(function(x){return '<article class="card"><div class="iconBox">'+icon(x.icon)+'</div><h3>'+safe(x.title)+'</h3><p>'+safe(x.text)+'</p></article>';}).join('')+'</div></div></section>';
  }
  function procedures(C){
    var s = C.sections.procedures || base.sections.procedures;
    return '<section class="section dark" id="procedimentos"><div class="container procedureHead reveal"><div class="eyebrow">Procedimentos</div><h2 class="title">Procedimentos disponíveis após avaliação.</h2><p class="lead">'+safe(s.subtitle)+'</p></div><div class="carouselWrap reveal"><div class="carousel" id="procedureCarousel">'+(s.items||[]).map(function(x){return '<article class="procedureCard"><div class="procMedia"><strong>'+safe(x.title)+'</strong></div><div class="procContent"><span class="pill">FACIAL</span><h3>'+safe(x.title)+'</h3><p>'+safe(x.description)+'</p><div class="tags"><span>'+safe(x.icon||'protocolo')+'</span></div><a class="btn btnPrimary" href="'+whatsapp(C,'Tenho interesse em '+x.title)+'"><img src="'+WA_ICON+'" alt="">Tenho interesse</a></div></article>';}).join('')+'</div><div class="container carouselBtns"><button class="circleBtn" data-car="-1">'+icon('arrow-left')+'</button><button class="circleBtn" data-car="1">'+icon('arrow-right')+'</button><div class="progress"><div class="bar"></div></div><b>Setas • arraste • swipe</b></div></div></section>';
  }
  function method(C){
    var s = C.sections.method || base.sections.method;
    return '<section class="section" id="metodo"><div class="container center reveal"><div class="eyebrow">Método Catarina Queiroz</div><h2 class="title">Um processo mais elegante que uma lista de procedimentos.</h2><p class="lead">A experiência premium começa antes do procedimento: começa na clareza da indicação.</p><div class="cards4">'+(s.steps||[]).map(function(x){return '<article class="card"><div class="iconBox">'+icon(x.icon)+'</div><h3>'+safe(x.title)+'</h3><p>'+safe(x.text)+'</p></article>';}).join('')+'</div></div></section>';
  }
  function about(C){
    var s = C.sections.about || base.sections.about;
    return '<section class="section" id="sobre"><div class="container split reveal"><div class="aboutPhoto"><div class="mockText"><b>FOTO SOBRE</b><span>coloque uma foto real na clínica</span></div></div><div class="aboutText"><div class="eyebrow">A especialista</div><h2 class="title">Catarina Queiroz</h2><p class="lead">'+safe(s.text)+'</p><ul class="checkList">'+(s.bullets||[]).map(function(x){return '<li>'+safe(x)+'</li>';}).join('')+'</ul><a class="btn btnPrimary" href="'+whatsapp(C)+'"><img src="'+WA_ICON+'" alt="">Falar pelo WhatsApp</a></div></div></section>';
  }
  function testimonials(C){
    var s = C.sections.testimonials || base.sections.testimonials;
    var items = (s.items || []).filter(function(x){return x.visible !== false;});
    return '<section class="section" id="depoimentos"><div class="container center reveal"><div class="eyebrow">Depoimentos</div><h2 class="title">'+safe(s.title)+'</h2><p class="lead">'+safe(s.subtitle)+'</p><div class="carousel" style="padding-inline:0;margin-top:44px">'+items.map(function(x){return '<article class="card" style="flex:0 0 350px;text-align:left"><div style="color:var(--gold)">★★★★★</div><p>“'+safe(x.text)+'”</p><h3>'+safe(x.name)+'</h3><p>'+safe(x.role||'')+'</p></article>';}).join('')+'</div></div></section>';
  }
  function faq(C){
    var s = C.sections.faq || base.sections.faq;
    return '<section class="section" id="faq"><div class="container center reveal"><div class="eyebrow">'+safe(s.kicker)+'</div><h2 class="title">'+safe(s.title)+'</h2><p class="lead">Respostas objetivas para reduzir atrito e facilitar o primeiro contato pelo WhatsApp.</p><div class="faqList">'+(s.items||[]).map(function(x,i){return '<article class="faqItem '+(i===0?'open':'')+'"><button class="faqQ"><span>'+safe(x.question)+'</span><span>+</span></button><div class="faqA">'+safe(x.answer)+'</div></article>';}).join('')+'</div></div></section>';
  }
  function location(C){
    var c = C.site.contact || base.site.contact;
    var map = 'https://www.google.com/maps?q=' + encodeURIComponent(c.mapsQuery || c.address) + '&output=embed';
    return '<section class="section dark" id="localizacao"><div class="container center reveal"><div class="eyebrow">Localização</div><h2 class="title">Atendimento em Boa Viagem, Recife.</h2><div class="locationGrid" style="margin-top:48px;text-align:left"><div class="infoBox"><h3>'+safe(C.site.businessName)+'</h3><p><b>Endereço</b><br>'+safe(c.address)+'</p><p><b>WhatsApp</b><br>'+safe(c.phoneDisplay)+'</p><div class="actions"><a class="btn btnPrimary" href="'+whatsapp(C)+'">Agendar</a><a class="btn btnOutline" href="https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(c.mapsQuery || c.address)+'">Traçar rota</a></div></div><div class="map"><iframe src="'+map+'" loading="lazy"></iframe></div></div></div></section>';
  }
  function footer(C){
    return '<section class="section compact dark"><div class="container center reveal"><h2 class="title">O próximo passo não é escolher um procedimento. É entender o que faz sentido para você.</h2><p class="lead">Fale com a clínica, explique sua principal queixa e receba orientação para agendar uma avaliação estética personalizada.</p><a class="btn btnPrimary" href="'+whatsapp(C)+'" style="margin-top:30px">Agendar avaliação estética</a></div></section><footer class="footer"><div class="container footerGrid"><div>'+brand()+'<p>Estética facial e corporal em Boa Viagem, Recife.</p></div><div><b>Procedimentos</b><a>Limpeza de Pele</a><a>Drenagem HD</a><a>Endolaser</a><a>Botox</a></div><div><b>Navegação</b><a href="#inicio">Início</a><a href="#procedimentos">Procedimentos</a><a href="#metodo">Método</a><a href="#sobre">Sobre</a></div><div><b>Contato</b><p>WhatsApp: '+safe(C.site.contact.phoneDisplay)+'</p><p>'+safe(C.site.contact.address)+'</p></div></div></footer><a class="whatsappFloat" href="'+whatsapp(C)+'"><img src="'+WA_ICON+'" alt="WhatsApp"></a>';
  }
  function normalize(C){
    C = C || base;
    C.site = C.site || base.site;
    C.site.contact = C.site.contact || base.site.contact;
    C.sections = C.sections || base.sections;
    ['hero','complaints','procedures','method','about','testimonials','faq'].forEach(function(k){ if(!C.sections[k]) C.sections[k] = base.sections[k]; });
    return C;
  }
  function render(C){
    C = normalize(C);
    document.title = (C.site.seo && C.site.seo.title) || C.site.businessName || 'Catarina Queiroz Clínica Estética';
    app.innerHTML = nav(C) + ticker(C) + hero(C) + complaints(C) + procedures(C) + method(C) + about(C) + testimonials(C) + faq(C) + location(C) + footer(C);
    bind();
    setTimeout(function(){ if(window.lucide){ window.lucide.createIcons(); } }, 80);
  }
  function bind(){
    var menu = document.getElementById('menu');
    if(menu){ menu.onclick = function(){ document.getElementById('links').classList.toggle('open'); }; }
    document.querySelectorAll('.faqQ').forEach(function(b){ b.onclick = function(){ b.closest('.faqItem').classList.toggle('open'); }; });
    document.querySelectorAll('[data-car]').forEach(function(b){ b.onclick = function(){ var el = document.getElementById('procedureCarousel'); if(el){ el.scrollBy({ left: Number(b.getAttribute('data-car')) * 410, behavior: 'smooth' }); } }; });
    var io = new IntersectionObserver(function(entries){ entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); } }); }, { threshold:.12 });
    document.querySelectorAll('.reveal').forEach(function(e){ io.observe(e); });
  }

  render(base);
  fetch('/api/config-v2', { cache:'no-store' }).then(function(r){ return r.ok ? r.json() : null; }).then(function(j){ if(j && j.config){ render(j.config); } }).catch(function(){});
})();
