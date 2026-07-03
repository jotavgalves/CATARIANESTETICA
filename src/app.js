(function () {
  function loadCss(href) {
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = href;
    document.head.appendChild(css);
  }
  loadCss('/src/exact-sections.css?v=5');
  loadCss('/src/final-fixes.css?v=4');
})();

const CQ_DEFAULT = {
  version: 2,
  site: {
    name: 'Catarina Queiroz',
    businessName: 'Catarina Queiroz Clínica Estética',
    brandLine1: 'CATARINA',
    brandLine2: 'QUEIROZ',
    brandSubtitle: 'CLÍNICA ESTÉTICA',
    logo: { imageUrl: '', alt: 'Catarina Queiroz Clínica Estética' },
    seo: {
      title: 'Clínica Estética em Boa Viagem, Recife | Catarina Queiroz',
      description: 'Clínica estética em Boa Viagem, Recife. Avaliação personalizada e protocolos faciais e corporais.'
    },
    contact: {
      whatsappNumber: '5581989844806',
      phoneDisplay: '(81) 98984-4806',
      whatsappMessage: 'Olá, vim pelo site e gostaria de agendar uma avaliação.',
      address: 'R. Ribeiro de Brito, 554 — Boa Viagem, Recife — PE',
      mapsQuery: 'R. Ribeiro de Brito, 554 Boa Viagem Recife PE',
      mapsEmbedUrl: '',
      hours: 'Com hora marcada. Confirme os horários disponíveis pelo WhatsApp.'
    }
  },
  theme: {
    colors: {
      navy: '#02111f',
      navy2: '#263746',
      ink: '#071827',
      muted: '#526176',
      cream: '#fffaf6',
      rose: '#b98578',
      roseDark: '#7a4e48',
      gold: '#c9a86a',
      whatsapp: '#25d366'
    }
  },
  navigation: {
    ctaText: 'Agendar avaliação',
    items: [
      { label: 'Início', href: '#inicio', visible: true },
      { label: 'Procedimentos', href: '#procedimentos', visible: true },
      { label: 'Método', href: '#metodo', visible: true },
      { label: 'Sobre', href: '#sobre', visible: true },
      { label: 'FAQ', href: '#faq', visible: true },
      { label: 'Localização', href: '#localizacao', visible: true }
    ]
  },
  sections: {
    hero: {
      visible: true,
      kicker: 'Estética facial e corporal em Boa Viagem',
      title: 'A beleza que você quer valorizar tem um caminho certo.',
      subtitle: 'Protocolos personalizados, tecnologia avançada e um olhar estético apurado para realçar o que há de melhor em você, com naturalidade e segurança.',
      primaryButton: 'Agendar avaliação',
      secondaryButton: 'Ver procedimentos',
      image: { url: '', alt: 'Foto principal', label: 'FOTO PRINCIPAL', note: 'substitua por foto real da clínica' }
    },
    ticker: { visible: true, speedSeconds: 34 },
    complaints: {
      visible: true,
      kicker: 'Cuidado direcionado',
      title: 'A beleza que você quer valorizar tem um caminho certo.',
      subtitle: 'A paciente não precisa escolher sozinha. A indicação vem depois de entender queixa, rotina e objetivo.',
      items: [
        { icon: '♧', title: 'Pele com cravos, oleosidade ou textura irregular', text: 'Cuidados para limpeza profunda, renovação, hidratação e melhora da luminosidade.', visible: true },
        { icon: '☺', title: 'Rosto inchado ou aparência cansada', text: 'Drenagem e protocolos faciais para leveza, viço e contorno mais descansado.', visible: true },
        { icon: '≈', title: 'Retenção, celulite e sensação de peso', text: 'Tratamentos corporais para circulação, firmeza, uniformidade da pele e definição.', visible: true },
        { icon: '✦', title: 'Linhas e sinais de idade', text: 'Condutas faciais planejadas para naturalidade e rejuvenescimento.', visible: true },
        { icon: '◇', title: 'Contorno corporal', text: 'Protocolos corporais personalizados, definidos após avaliação.', visible: true },
        { icon: '✓', title: 'Indicação com segurança', text: 'Escolha do procedimento com orientação técnica e expectativa realista.', visible: true }
      ]
    },
    procedures: {
      visible: true,
      kicker: 'Procedimentos',
      title: 'Procedimentos disponíveis após avaliação.',
      subtitle: 'Veja os principais protocolos disponíveis e use a avaliação para confirmar a indicação correta para sua pele, corpo e objetivo.',
      metaText: 'Setas • arraste • swipe • teclado',
      items: [
        { title: 'Limpeza de Pele', category: 'FACIAL', description: 'Remove impurezas, cravos, células mortas e excesso de oleosidade, promovendo pele mais limpa, saudável e renovada.', imageUrl: '', imageLabel: 'LIMPEZA DE PELE', imageNote: 'substitua por foto real do procedimento', tags: ['Pele renovada', 'Hidratação'], visible: true },
        { title: 'Drenagem Facial', category: 'FACIAL', description: 'Massagem suave que estimula circulação e sistema linfático, reduzindo inchaço, melhorando contorno facial e aparência descansada.', imageUrl: '', imageLabel: 'DRENAGEM FACIAL', imageNote: 'substitua por foto real do procedimento', tags: ['Leveza', 'Contorno'], visible: true },
        { title: 'Peeling Químico', category: 'FACIAL', description: 'Utiliza ativos específicos para renovação da pele, suavização de manchas, textura irregular, marcas de acne, linhas finas e opacidade.', imageUrl: '', imageLabel: 'PEELING QUÍMICO', imageNote: 'substitua por foto real do procedimento', tags: ['Luminosidade', 'Textura'], visible: true },
        { title: 'Drenagem HD', category: 'CORPORAL', description: 'Protocolo corporal para sensação de leveza, retenção de líquidos e definição visual, sempre após avaliação individual.', imageUrl: '', imageLabel: 'DRENAGEM HD', imageNote: 'substitua por foto real do procedimento', tags: ['Corpo', 'Leveza'], visible: true },
        { title: 'Botox', category: 'FACIAL', description: 'Aplicação planejada para suavizar sinais, preservando expressão e naturalidade.', imageUrl: '', imageLabel: 'BOTOX', imageNote: 'substitua por foto real do procedimento', tags: ['Naturalidade'], visible: true },
        { title: 'Endolaser', category: 'FACIAL', description: 'Tecnologia para protocolos corporais e faciais, sempre com avaliação e indicação adequadas.', imageUrl: '', imageLabel: 'ENDOLASER', imageNote: 'substitua por foto real do procedimento', tags: ['Tecnologia'], visible: true }
      ]
    },
    method: {
      visible: true,
      kicker: 'Método Catarina Queiroz',
      title: 'Um processo mais elegante que uma lista de procedimentos.',
      subtitle: 'A experiência premium começa antes do procedimento: começa na clareza da indicação.',
      steps: [
        { icon: '▣', number: '01', title: 'Avaliação estética', text: 'Entendimento da queixa, rotina, objetivo, histórico e características individuais.', visible: true },
        { icon: '⌘', number: '02', title: 'Planejamento', text: 'Definição dos procedimentos mais adequados para pele, corpo e expectativa.', visible: true },
        { icon: '✧', number: '03', title: 'Execução técnica', text: 'Atendimento com hora marcada, ambiente preparado e orientação clara.', visible: true },
        { icon: '↗', number: '04', title: 'Evolução', text: 'Recomendações e acompanhamento para potencializar resultado progressivo.', visible: true }
      ]
    },
    featured: {
      visible: true,
      kicker: 'Protocolos em destaque',
      title: 'Tratamentos que geram desejo na primeira visita.',
      subtitle: 'Uma vitrine curta para direcionar pacientes que já chegam com uma queixa mais definida.',
      items: [
        { label: 'Tecnologia', title: 'Endolaser', text: 'Para quem busca melhora de contorno corporal, flacidez e gordura localizada com tecnologia avançada e evolução progressiva.', button: 'Tenho interesse →', visible: true },
        { label: 'Contorno', title: 'Drenagem HD', text: 'Para reduzir inchaço, retenção de líquidos e promover sensação de leveza com contorno corporal mais definido.', button: 'Tenho interesse →', visible: true },
        { label: 'Naturalidade', title: 'Botox', text: 'Para suavizar linhas de expressão e manter uma aparência jovem, descansada e natural, sem exageros.', button: 'Tenho interesse →', visible: true }
      ]
    },
    about: {
      visible: true,
      kicker: 'A especialista',
      title: 'Catarina Queiroz',
      paragraphs: [
        'Graduada em Estética e Cosmetologia, Catarina atua com tratamentos faciais e corporais voltados à autoestima, ao bem-estar e à valorização da beleza individual.',
        'Sua abordagem une técnica, atendimento humanizado e planejamento personalizado para indicar o procedimento mais adequado, sem transformar a paciente em um padrão artificial.'
      ],
      bullets: ['Protocolos personalizados após avaliação', 'Atendimento com hora marcada', 'Clínica em Boa Viagem, Recife'],
      button: 'Falar pelo WhatsApp',
      image: { url: '', alt: 'Foto sobre', label: 'FOTO SOBRE', note: 'coloque uma foto real na clínica' }
    },
    authority: {
      visible: true,
      kicker: 'Confiança',
      title: 'Mais segurança antes de decidir.',
      subtitle: 'Clareza na indicação, localização acessível e atendimento organizado para tornar a decisão mais segura.',
      items: [
        { icon: '✓', title: 'Avaliação antes da indicação', text: 'A paciente não precisa escolher sozinha. A indicação vem depois de entender queixa, rotina e objetivo.', visible: true },
        { icon: '▣', title: 'Agenda organizada', text: 'Atendimento com hora marcada para reduzir espera e manter uma experiência mais confortável.', visible: true },
        { icon: '⌖', title: 'Atendimento local', text: 'Clínica localizada em Boa Viagem, facilitando o acesso para pacientes de Recife e região.', visible: true }
      ]
    },
    testimonials: {
      visible: true,
      kicker: 'Depoimentos',
      title: 'Experiências de quem já passou pela clínica',
      subtitle: 'Histórias reais de pacientes que confiaram em nosso cuidado e transformaram sua autoestima.',
      items: [
        { name: 'Cliente 01', role: 'Atendimento facial', text: 'Atendimento muito cuidadoso, com explicação clara do protocolo e um ambiente lindo.', imageUrl: '', beforeImageUrl: '', afterImageUrl: '', visible: true },
        { name: 'Cliente 02', role: 'Drenagem', text: 'Me senti acolhida desde o primeiro contato. Tudo foi explicado com muita calma.', imageUrl: '', beforeImageUrl: '', afterImageUrl: '', visible: true },
        { name: 'Cliente 03', role: 'Limpeza de pele', text: 'Amei a experiência. A pele ficou com sensação de limpeza e leveza.', imageUrl: '', beforeImageUrl: '', afterImageUrl: '', visible: true }
      ]
    },
    faq: {
      visible: true,
      kicker: 'Dúvidas frequentes',
      title: 'Antes de agendar.',
      subtitle: 'Respostas objetivas para reduzir atrito e facilitar o primeiro contato pelo WhatsApp.',
      items: [
        { question: 'Preciso saber qual procedimento quero antes de agendar?', answer: 'Não. A avaliação existe justamente para entender sua queixa e indicar o caminho mais adequado.', visible: true },
        { question: 'Os resultados são imediatos?', answer: 'Depende do protocolo, da resposta individual e dos cuidados indicados.', visible: true },
        { question: 'Posso combinar procedimentos?', answer: 'Sim, quando houver indicação profissional e segurança para a combinação.', visible: true },
        { question: 'O atendimento é por hora marcada?', answer: 'Sim. O atendimento é organizado para preservar tempo, conforto e privacidade.', visible: true },
        { question: 'Como faço para agendar?', answer: 'Clique no botão de WhatsApp e envie a mensagem automática.', visible: true }
      ]
    },
    location: {
      visible: true,
      kicker: 'Localização',
      title: 'Atendimento em Boa Viagem, Recife.',
      cardTitle: 'Catarina Queiroz Clínica Estética',
      addressLabel: 'Endereço',
      whatsappLabel: 'WhatsApp',
      hoursLabel: 'Atendimento',
      primaryButton: 'Agendar',
      routeButton: 'Traçar rota'
    },
    finalCta: {
      visible: true,
      title: 'O próximo passo não é escolher um procedimento. É entender o que faz sentido para você.',
      subtitle: 'Fale com a clínica, explique sua principal queixa e receba orientação para agendar uma avaliação estética personalizada.',
      button: 'Agendar avaliação estética'
    }
  },
  footer: {
    visible: true,
    tagline: 'Estética facial e corporal em Boa Viagem, Recife.',
    proceduresTitle: 'Procedimentos',
    navigationTitle: 'Navegação',
    contactTitle: 'Contato',
    copyright: 'Todos os direitos reservados — Catarina Queiroz Clínica Estética.',
    procedureLinks: ['Limpeza de Pele', 'Drenagem HD', 'Endolaser', 'Botox'],
    navigationLinks: ['Início', 'Procedimentos', 'Método', 'Sobre']
  },
  pixels: { metaPixelId: '', googleAdsId: '', enabled: false },
  maintenance: { enabled: false, title: 'Site em manutenção', message: 'Voltaremos em breve.' }
};

document.addEventListener('DOMContentLoaded', function () {
  var config = merge(clone(CQ_DEFAULT), {});
  var carousel = null;

  renderSite(config);
  bindAll(config);
  loadConfig();

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function merge(target, source) {
    if (!source || typeof source !== 'object') return target;
    Object.keys(source).forEach(function (key) {
      if (Array.isArray(source[key])) target[key] = source[key];
      else if (source[key] && typeof source[key] === 'object') target[key] = merge(target[key] && typeof target[key] === 'object' ? target[key] : {}, source[key]);
      else if (source[key] !== undefined && source[key] !== null) target[key] = source[key];
    });
    return target;
  }
  function safe(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]; }); }
  function visible(item) { return !item || item.visible !== false; }
  function publicText(value, fallback) { var s = String(value || ''); return /painel|edit[aá]ve|lucide|cadastrad/i.test(s) ? fallback : (value || fallback || ''); }
  function wa(text) { var n = String(config.site.contact.whatsappNumber || '5581989844806').replace(/\D/g, ''); return 'https://wa.me/' + n + '?text=' + encodeURIComponent(text || config.site.contact.whatsappMessage || 'Olá'); }
  function mapUrl() { var c = config.site.contact; return c.mapsEmbedUrl || ('https://www.google.com/maps?q=' + encodeURIComponent(c.mapsQuery || c.address || '') + '&output=embed'); }
  function routeUrl() { var c = config.site.contact; return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(c.mapsQuery || c.address || ''); }

  function applyTheme() {
    var colors = config.theme && config.theme.colors || {};
    var root = document.documentElement;
    Object.keys(colors).forEach(function (key) { if (colors[key]) root.style.setProperty('--' + key, colors[key]); });
  }

  function brandHtml(extraClass) {
    var logo = config.site.logo || {};
    if (logo.imageUrl) return '<a class="logo ' + (extraClass || '') + '" href="#inicio"><img src="' + safe(logo.imageUrl) + '" alt="' + safe(logo.alt || config.site.businessName) + '"></a>';
    return '<a class="logo ' + (extraClass || '') + '" href="#inicio" aria-label="' + safe(config.site.businessName) + '"><strong>' + safe(config.site.brandLine1 || 'CATARINA') + '<br>' + safe(config.site.brandLine2 || 'QUEIROZ') + '</strong><span>' + safe(config.site.brandSubtitle || 'CLÍNICA ESTÉTICA') + '</span></a>';
  }
  function navHtml() {
    var items = (config.navigation.items || []).filter(visible);
    return '<header class="site-header"><div class="container nav-shell">' + brandHtml('') + '<nav class="nav-links" id="navLinks" aria-label="Navegação principal">' + items.map(function (i) { return '<a href="' + safe(i.href) + '">' + safe(i.label) + '</a>'; }).join('') + '</nav><a class="nav-cta" href="' + wa() + '">' + safe(config.navigation.ctaText) + '</a><button class="menu-btn" id="menuBtn" aria-label="Abrir menu"><span></span><span></span><span></span></button></div></header>';
  }
  function placeholder(kind, obj) { return '<div class="photo-placeholder ' + kind + '"><span>' + safe(obj.label || 'FOTO') + '</span><small>' + safe(obj.note || '') + '</small></div>'; }
  function imageOrPlaceholder(cls, img) { return '<div class="' + cls + ' reveal">' + (img && img.url ? '<img src="' + safe(img.url) + '" alt="' + safe(img.alt || '') + '">' : placeholder(cls === 'hero-photo' ? 'large' : '', img || {})) + '</div>'; }
  function cardsGrid(items, columns) { return '<div class="container cards-grid ' + columns + ' reveal">' + (items || []).filter(visible).map(function (x) { return '<article class="soft-card"><div class="icon-box">' + safe(x.icon || '✦') + '</div><h3>' + safe(x.title) + '</h3><p>' + safe(x.text) + '</p></article>'; }).join('') + '</div>'; }

  function heroHtml() { var s = config.sections.hero; if (!visible(s)) return ''; return '<section class="hero section-light" id="inicio"><div class="container hero-grid"><div class="hero-copy reveal"><p class="eyebrow">' + safe(s.kicker) + '</p><h1>' + safe(s.title) + '</h1><p>' + safe(s.subtitle) + '</p><div class="actions"><a class="btn btn-gold" href="' + wa() + '"><img src="/assets/icons/whatsapp.svg" alt="">' + safe(s.primaryButton) + '</a><a class="btn btn-outline-dark" href="#procedimentos">' + safe(s.secondaryButton) + '</a></div></div>' + imageOrPlaceholder('hero-photo', s.image) + '</div></section>'; }
  function tickerHtml() { if (!visible(config.sections.ticker)) return ''; var labels = (config.sections.procedures.items || []).filter(visible).map(function (x) { return x.title; }); var loops = labels.concat(labels, labels, labels); return '<div class="ticker" aria-hidden="true"><div class="ticker-track" style="--ticker-speed:' + (config.sections.ticker.speedSeconds || 34) + 's">' + loops.map(function (x) { return '<span>' + safe(x) + '</span>'; }).join('') + '</div></div>'; }
  function simpleHeader(s, fallbackSub) { return '<div class="container narrow center reveal"><p class="eyebrow centered">' + safe(s.kicker) + '</p><h2>' + safe(s.title) + '</h2><p class="section-subtitle">' + safe(publicText(s.subtitle, fallbackSub || '')) + '</p></div>'; }
  function complaintsHtml() { var s = config.sections.complaints; if (!visible(s)) return ''; return '<section class="section section-light" id="queixas">' + simpleHeader(s) + cardsGrid(s.items, 'three') + '</section>'; }
  function proceduresHtml() { var s = config.sections.procedures; if (!visible(s)) return ''; var items = (s.items || []).filter(visible); return '<section class="section section-dark procedures" id="procedimentos"><div class="container procedure-layout"><div class="procedure-copy reveal"><p class="eyebrow">' + safe(s.kicker) + '</p><h2>' + safe(s.title) + '</h2><p class="lead">' + safe(publicText(s.subtitle, CQ_DEFAULT.sections.procedures.subtitle)) + '</p></div></div><div class="procedure-carousel reveal"><button class="carousel-arrow prev" type="button" data-target="proceduresTrack" data-dir="-1">←</button><div class="procedure-track" id="proceduresTrack">' + items.map(procedureCardHtml).join('') + '</div><button class="carousel-arrow next" type="button" data-target="proceduresTrack" data-dir="1">→</button></div><div class="container carousel-meta"><span>01 / ' + String(items.length).padStart(2, '0') + '</span><div class="progress"><i></i></div><span>' + safe(s.metaText || '') + '</span></div></section>'; }
  function procedureCardHtml(item) { var tags = Array.isArray(item.tags) ? item.tags : []; return '<article class="procedure-card"><div class="procedure-image">' + (item.imageUrl ? '<img src="' + safe(item.imageUrl) + '" alt="' + safe(item.title) + '">' : safe(item.imageLabel || item.title).toUpperCase() + '<small>' + safe(item.imageNote || '') + '</small>') + '</div><div class="procedure-body"><span>' + safe(item.category || 'FACIAL') + '</span><h3>' + safe(item.title) + '</h3><p>' + safe(item.description) + '</p><div class="tags">' + tags.map(function (t) { return '<b>' + safe(t) + '</b>'; }).join('') + '</div><a class="btn btn-gold" href="' + wa('Tenho interesse em ' + item.title + '.') + '">Tenho interesse →</a></div></article>'; }
  function methodHtml() { var s = config.sections.method; if (!visible(s)) return ''; return '<section class="section section-light" id="metodo">' + simpleHeader(s) + '<div class="container cards-grid four reveal">' + (s.steps || []).filter(visible).map(function (x) { return '<article class="soft-card step"><div class="icon-box">' + safe(x.icon || '✦') + '</div><span>' + safe(x.number || '') + '</span><h3>' + safe(x.title) + '</h3><p>' + safe(x.text) + '</p></article>'; }).join('') + '</div></section>'; }
  function featuredHtml() { var s = config.sections.featured; if (!visible(s)) return ''; return '<section class="section section-light compact-section">' + simpleHeader(s) + '<div class="container cards-grid three reveal">' + (s.items || []).filter(visible).map(function (x) { return '<article class="soft-card interest"><span>' + safe(x.label) + '</span><h3>' + safe(x.title) + '</h3><p>' + safe(x.text) + '</p><a class="btn btn-gold" href="' + wa('Tenho interesse em ' + x.title + '.') + '">' + safe(x.button || 'Tenho interesse →') + '</a></article>'; }).join('') + '</div></section>'; }
  function aboutHtml() { var s = config.sections.about; if (!visible(s)) return ''; var paragraphs = s.paragraphs || (s.text ? [s.text] : []); return '<section class="section section-light about" id="sobre"><div class="container about-grid reveal">' + imageOrPlaceholder('about-photo', s.image) + '<div class="about-copy"><p class="eyebrow">' + safe(s.kicker) + '</p><h2>' + safe(s.title) + '</h2>' + paragraphs.map(function (p) { return '<p>' + safe(p) + '</p>'; }).join('') + '<ul>' + (s.bullets || []).map(function (b) { return '<li>' + safe(b) + '</li>'; }).join('') + '</ul><a class="btn btn-gold" href="' + wa() + '"><img src="/assets/icons/whatsapp.svg" alt="">' + safe(s.button) + '</a></div></div></section>'; }
  function authorityHtml() { var s = config.sections.authority; if (!visible(s)) return ''; return '<section class="section section-light compact-section">' + simpleHeader(s) + cardsGrid(s.items, 'three') + '</section>'; }
  function testimonialsHtml() { var s = config.sections.testimonials; if (!visible(s)) return ''; return '<section class="section section-light testimonials" id="depoimentos">' + simpleHeader(s, CQ_DEFAULT.sections.testimonials.subtitle) + '<div class="container testimonial-track reveal">' + (s.items || []).filter(visible).map(testimonialCardHtml).join('') + '</div></section>'; }
  function testimonialCardHtml(item) { var body = '<div class="testimonial-body"><div>★★★★★</div><p>“' + safe(item.text) + '”</p><strong>' + safe(item.name) + '</strong><span>' + safe(item.role) + '</span></div>'; if (item.beforeImageUrl && item.afterImageUrl) return '<article class="testimonial-card has-ba"><div class="before-after"><figure><img src="' + safe(item.beforeImageUrl) + '" alt="Antes"><figcaption>Antes</figcaption></figure><figure><img src="' + safe(item.afterImageUrl) + '" alt="Depois"><figcaption>Depois</figcaption></figure></div>' + body + '</article>'; if (item.imageUrl) return '<article class="testimonial-card has-photo"><img class="client-photo" src="' + safe(item.imageUrl) + '" alt="' + safe(item.name) + '">' + body + '</article>'; return '<article class="testimonial-card">' + body + '</article>'; }
  function faqHtml() { var s = config.sections.faq; if (!visible(s)) return ''; return '<section class="section section-light" id="faq">' + simpleHeader(s) + '<div class="container faq-list reveal">' + (s.items || []).filter(visible).map(function (x, i) { return '<article class="faq-item ' + (i === 0 ? 'open' : '') + '"><button>' + safe(x.question) + '<span>' + (i === 0 ? '×' : '+') + '</span></button><p>' + safe(x.answer) + '</p></article>'; }).join('') + '</div></section>'; }
  function locationHtml() { var s = config.sections.location, c = config.site.contact; if (!visible(s)) return ''; return '<section class="section section-dark location" id="localizacao"><div class="container narrow center reveal"><p class="eyebrow centered">' + safe(s.kicker) + '</p><h2>' + safe(s.title) + '</h2></div><div class="container location-grid reveal"><div class="location-card"><h3>' + safe(s.cardTitle || config.site.businessName) + '</h3><p><strong>' + safe(s.addressLabel) + '</strong><br>' + safe(c.address) + '</p><p><strong>' + safe(s.whatsappLabel) + '</strong><br>' + safe(c.phoneDisplay) + '</p><p><strong>' + safe(s.hoursLabel) + '</strong><br>' + safe(c.hours) + '</p><div class="actions"><a class="btn btn-gold" href="' + wa() + '">' + safe(s.primaryButton) + '</a><a class="btn btn-outline" href="' + routeUrl() + '">' + safe(s.routeButton) + '</a></div></div><div class="map"><iframe src="' + mapUrl() + '" loading="lazy"></iframe></div></div></section>'; }
  function finalCtaHtml() { var s = config.sections.finalCta; if (!visible(s)) return ''; return '<section class="final-cta section-dark"><div class="container center reveal"><h2>' + safe(s.title) + '</h2><p>' + safe(s.subtitle) + '</p><a class="btn btn-gold" href="' + wa() + '">' + safe(s.button) + '</a></div></section>'; }
  function footerHtml() { var f = config.footer; if (!visible(f)) return ''; return '<footer class="site-footer"><div class="container footer-grid"><div>' + brandHtml('footer-logo') + '<p>' + safe(f.tagline) + '</p></div><div><strong>' + safe(f.proceduresTitle) + '</strong>' + (f.procedureLinks || []).map(function (x) { return '<a href="#procedimentos">' + safe(x) + '</a>'; }).join('') + '</div><div><strong>' + safe(f.navigationTitle) + '</strong>' + (f.navigationLinks || []).map(function (x) { var href = '#' + x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ç/g, 'c').replace(/[^a-z0-9]+/g, ''); if (x === 'Início') href = '#inicio'; if (x === 'Procedimentos') href = '#procedimentos'; if (x === 'Método') href = '#metodo'; if (x === 'Sobre') href = '#sobre'; return '<a href="' + href + '">' + safe(x) + '</a>'; }).join('') + '</div><div><strong>' + safe(f.contactTitle) + '</strong><p>WhatsApp: ' + safe(config.site.contact.phoneDisplay) + '</p><p>' + safe(config.site.contact.address) + '</p></div></div><div class="container copyright">' + safe(f.copyright) + '</div></footer>'; }

  function renderSite(nextConfig) {
    config = merge(clone(CQ_DEFAULT), nextConfig || {});
    applyTheme();
    document.title = config.site.seo.title || config.site.businessName;
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', config.site.seo.description || '');
    document.body.innerHTML = navHtml() + '<main>' + heroHtml() + tickerHtml() + complaintsHtml() + proceduresHtml() + methodHtml() + featuredHtml() + aboutHtml() + authorityHtml() + testimonialsHtml() + faqHtml() + locationHtml() + finalCtaHtml() + '</main>' + footerHtml() + '<a class="whatsapp-float" href="' + wa() + '" aria-label="WhatsApp"><img src="/assets/icons/whatsapp.svg" alt="WhatsApp"></a>';
  }

  function bindAll(current) {
    config = current || config;
    var menu = document.getElementById('menuBtn');
    var links = document.getElementById('navLinks');
    if (menu && links) menu.onclick = function () { links.classList.toggle('open'); };
    bindFaq();
    initReveal();
    initProcedureCarousel();
  }
  function bindFaq() { document.querySelectorAll('.faq-item button').forEach(function (button) { button.onclick = function () { var item = button.closest('.faq-item'); document.querySelectorAll('.faq-item').forEach(function (other) { if (other !== item) other.classList.remove('open'); }); item.classList.toggle('open'); }; }); }
  function initReveal() { var observer = new IntersectionObserver(function (entries) { entries.forEach(function (entry) { if (entry.isIntersecting) entry.target.classList.add('in'); }); }, { threshold: 0.14 }); document.querySelectorAll('.reveal').forEach(function (el) { observer.observe(el); }); }

  function initProcedureCarousel() {
    var track = document.getElementById('proceduresTrack');
    if (!track) return;
    if (carousel && carousel.destroy) carousel.destroy();
    carousel = createProcedureCarousel(track);
    carousel.init();
  }
  function createProcedureCarousel(track) {
    var state = { index: Math.min(1, Math.max(0, track.querySelectorAll('.procedure-card').length - 1)), timer: null, pausedUntil: 0, startX: 0, startOffset: 0, moved: false, dragging: false, offset: 0, listeners: [] };
    function cards() { return Array.from(track.querySelectorAll('.procedure-card')); }
    function viewport() { return track.parentElement || track; }
    function desiredOffset(index) { var list = cards(); if (!list.length) return 0; if (index >= list.length) index = 0; if (index < 0) index = list.length - 1; var card = list[index]; var center = card.offsetLeft + card.offsetWidth / 2; return viewport().clientWidth / 2 - center; }
    function applyOffset(offset, animated) { state.offset = offset; track.style.transition = animated ? 'transform .62s cubic-bezier(.22,1,.36,1)' : 'none'; track.style.transform = 'translate3d(' + offset + 'px,0,0)'; }
    function setIndex(index, animated) { var list = cards(); if (!list.length) return; if (index >= list.length) index = 0; if (index < 0) index = list.length - 1; state.index = index; applyOffset(desiredOffset(index), animated !== false); updateActive(); }
    function updateActive() { var list = cards(); list.forEach(function (card, i) { var near = Math.abs(i - state.index) === 1 || Math.abs(i - state.index) === list.length - 1; card.classList.toggle('is-active', i === state.index); card.classList.toggle('is-near', near && i !== state.index); card.classList.toggle('dim', !near && i !== state.index); }); var progress = document.querySelector('.carousel-meta .progress i') || document.querySelector('.progress i'); var counter = document.querySelector('.carousel-meta span:first-child'); var pct = list.length <= 1 ? 100 : ((state.index + 1) / list.length) * 100; if (progress) progress.style.width = pct + '%'; if (counter) counter.textContent = String(state.index + 1).padStart(2, '0') + ' / ' + String(list.length).padStart(2, '0'); }
    function move(dir, manual) { if (manual) pause(4800); setIndex(state.index + dir, true); }
    function pause(ms) { state.pausedUntil = Date.now() + (ms || 4500); }
    function autoplay() { clearInterval(state.timer); state.timer = setInterval(function () { if (Date.now() < state.pausedUntil || document.body.classList.contains('modal-open') || viewport().matches(':hover')) return; move(1, false); }, 3000); }
    function add(el, type, fn, opts) { el.addEventListener(type, fn, opts); state.listeners.push([el, type, fn, opts]); }
    function bind() {
      add(window, 'resize', function () { setIndex(state.index, false); });
      document.querySelectorAll('[data-target="proceduresTrack"]').forEach(function (btn) { add(btn, 'click', function (event) { event.preventDefault(); event.stopPropagation(); move(Number(btn.getAttribute('data-dir') || 1), true); }); });
      add(track, 'pointerdown', function (event) { if (event.target.closest('a, button')) return; state.dragging = true; state.moved = false; state.startX = event.clientX; state.startOffset = state.offset; pause(6000); track.classList.add('is-dragging'); try { track.setPointerCapture(event.pointerId); } catch (_) {} }, true);
      add(track, 'pointermove', function (event) { if (!state.dragging) return; var dx = event.clientX - state.startX; if (Math.abs(dx) > 5) state.moved = true; applyOffset(state.startOffset + dx, false); }, true);
      add(track, 'pointerup', function (event) { if (!state.dragging) return; var dx = event.clientX - state.startX; state.dragging = false; track.classList.remove('is-dragging'); if (dx < -46) setIndex(state.index + 1, true); else if (dx > 46) setIndex(state.index - 1, true); else setIndex(state.index, true); pause(4800); }, true);
      add(track, 'pointercancel', function () { state.dragging = false; track.classList.remove('is-dragging'); setIndex(state.index, true); }, true);
      add(track, 'click', function (event) { var card = event.target.closest('.procedure-card'); if (!card || event.target.closest('a, button')) return; event.preventDefault(); event.stopPropagation(); if (event.stopImmediatePropagation) event.stopImmediatePropagation(); if (state.moved) { state.moved = false; return; } var index = cards().indexOf(card); if (index !== state.index) { setIndex(index, true); pause(3500); return; } openProcedureModal(cardToData(card)); }, true);
    }
    return { init: function () { track.style.overflow = 'visible'; track.style.willChange = 'transform'; bind(); setTimeout(function () { setIndex(state.index, false); }, 80); autoplay(); }, destroy: function () { clearInterval(state.timer); state.listeners.forEach(function (row) { row[0].removeEventListener(row[1], row[2], row[3]); }); state.listeners = []; } };
  }
  function cardToData(card) { var img = card.querySelector('.procedure-image img'); var label = card.querySelector('.procedure-body > span'); var title = card.querySelector('.procedure-body h3'); var text = card.querySelector('.procedure-body p'); var tags = Array.from(card.querySelectorAll('.tags b')).map(function (x) { return x.textContent.trim(); }); return { image: img && img.src || '', label: label && label.textContent.trim() || 'Procedimento', title: title && title.textContent.trim() || 'Procedimento', text: text && text.textContent.trim() || '', tags: tags }; }
  function openProcedureModal(data) { if (!data) return; document.querySelectorAll('.proc-modal').forEach(function (modal) { modal.remove(); }); var modal = document.createElement('div'); modal.className = 'proc-modal is-open'; modal.innerHTML = '<div class="proc-modal__backdrop" data-close="1"></div><div class="proc-modal__dialog" role="dialog" aria-modal="true"><button class="proc-modal__close" data-close="1" type="button">×</button><div class="proc-modal__media">' + (data.image ? '<img src="' + safe(data.image) + '" alt="' + safe(data.title) + '">' : safe(data.title)) + '</div><div class="proc-modal__content"><span>' + safe(data.label) + '</span><h3>' + safe(data.title) + '</h3><p>' + safe(data.text) + '</p><div class="proc-modal__tags">' + data.tags.map(function (tag) { return '<b>' + safe(tag) + '</b>'; }).join('') + '</div><a class="btn btn-gold" href="' + wa('Tenho interesse em ' + data.title + '.') + '">Tenho interesse →</a></div></div>'; document.body.appendChild(modal); document.body.classList.add('modal-open'); modal.querySelectorAll('[data-close]').forEach(function (close) { close.onclick = function () { modal.remove(); document.body.classList.remove('modal-open'); }; }); }

  function loadConfig() { fetch('/api/config-v2', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (payload) { if (!payload || !payload.config) return; renderSite(payload.config); bindAll(config); }).catch(function () {}); }
});
