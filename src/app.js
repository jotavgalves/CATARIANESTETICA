(function () {
  function loadCss(href) {
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = href;
    document.head.appendChild(css);
  }
  loadCss('/src/exact-sections.css?v=3');
  loadCss('/src/procedure-interactions.css?v=1');
})();

document.addEventListener('DOMContentLoaded', function () {
  var siteConfig = null;
  var autoTimer = null;
  var autoResumeTimer = null;
  var dragState = null;
  var modalData = [];

  var menu = document.getElementById('menuBtn');
  var links = document.getElementById('navLinks');
  if (menu && links) menu.onclick = function () { links.classList.toggle('open'); };

  normalizeStaticCopy();
  bindFaq();
  initTicker();
  initReveal();
  setupProcedureCarousel();
  loadConfig();

  function safe(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char];
    });
  }

  function getWhatsAppUrl(text) {
    var contact = (siteConfig && siteConfig.site && siteConfig.site.contact) || {};
    var number = String(contact.whatsappNumber || '5581989844806').replace(/\D/g, '');
    var message = encodeURIComponent(text || contact.whatsappMessage || 'Olá, vim pelo site e gostaria de agendar uma avaliação.');
    return 'https://wa.me/' + number + '?text=' + message;
  }

  function normalizeStaticCopy() {
    var heroParagraph = document.querySelector('.hero-copy > p:not(.eyebrow)');
    if (heroParagraph) heroParagraph.textContent = 'Protocolos personalizados, tecnologia avançada e um olhar estético apurado para realçar o que há de melhor em você, com naturalidade e segurança.';
    var testimonialSubtitle = document.querySelector('.testimonials .section-subtitle');
    if (testimonialSubtitle) testimonialSubtitle.textContent = 'Histórias reais de pacientes que confiaram em nosso cuidado e transformaram sua autoestima.';
  }

  function initTicker(items) {
    var track = document.querySelector('.ticker-track');
    if (!track) return;
    var labels = items && items.length ? items : Array.from(track.querySelectorAll('span')).map(function (span) { return span.textContent.trim(); });
    labels = labels.filter(Boolean);
    if (!labels.length) labels = ['Limpeza de pele', 'Drenagem facial', 'Drenagem HD', 'Peeling químico', 'Botox', 'Endolaser'];
    var loops = labels.concat(labels, labels, labels);
    track.innerHTML = loops.map(function (label) { return '<span>' + safe(label) + '</span>'; }).join('');
    track.style.setProperty('--ticker-speed', Math.max(26, labels.length * 4) + 's');
  }

  function bindFaq() {
    document.querySelectorAll('.faq-item button').forEach(function (button) {
      button.onclick = function () {
        var item = button.closest('.faq-item');
        document.querySelectorAll('.faq-item').forEach(function (other) {
          if (other !== item) other.classList.remove('open');
        });
        item.classList.toggle('open');
      };
    });
  }

  function initReveal() {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) entry.target.classList.add('in');
      });
    }, { threshold: 0.14 });
    document.querySelectorAll('.reveal').forEach(function (el) { observer.observe(el); });
  }

  function setupProcedureCarousel() {
    var track = document.getElementById('proceduresTrack');
    if (!track) return;
    stopAutoplay();
    bindCarouselButtons();
    bindDrag(track);
    bindProcedureCards();
    startAutoplay();
  }

  function bindCarouselButtons() {
    document.querySelectorAll('[data-target]').forEach(function (button) {
      button.onclick = function () {
        var target = document.getElementById(button.getAttribute('data-target'));
        var dir = Number(button.getAttribute('data-dir') || 1);
        moveProcedureCarousel(dir, true);
      };
    });
  }

  function getMoveSize(track) {
    var card = track ? track.querySelector('.procedure-card') : null;
    if (!card) return 320;
    return card.getBoundingClientRect().width + 28;
  }

  function moveProcedureCarousel(dir, pause) {
    var track = document.getElementById('proceduresTrack');
    if (!track) return;
    if (pause) pauseAutoplayTemporarily();
    var max = track.scrollWidth - track.clientWidth;
    var move = getMoveSize(track);
    var next = track.scrollLeft + dir * move;
    if (next >= max - 4) next = 0;
    if (next < 0) next = max;
    track.scrollTo({ left: next, behavior: 'smooth' });
  }

  function startAutoplay() {
    var track = document.getElementById('proceduresTrack');
    if (!track) return;
    stopAutoplay();
    autoTimer = setInterval(function () {
      if (track.matches(':hover') || document.body.classList.contains('modal-open') || track.classList.contains('is-paused')) return;
      moveProcedureCarousel(1, false);
    }, 2600);
  }

  function stopAutoplay() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = null;
  }

  function pauseAutoplayTemporarily() {
    var track = document.getElementById('proceduresTrack');
    if (!track) return;
    track.classList.add('is-paused');
    clearTimeout(autoResumeTimer);
    autoResumeTimer = setTimeout(function () { track.classList.remove('is-paused'); }, 5500);
  }

  function bindDrag(track) {
    track.onpointerdown = function (event) {
      if (event.target.closest('a, button')) return;
      dragState = { x: event.clientX, left: track.scrollLeft, moved: false };
      track.classList.add('is-dragging', 'is-paused');
      track.setPointerCapture(event.pointerId);
    };
    track.onpointermove = function (event) {
      if (!dragState) return;
      var delta = event.clientX - dragState.x;
      if (Math.abs(delta) > 4) dragState.moved = true;
      track.scrollLeft = dragState.left - delta;
    };
    track.onpointerup = track.onpointercancel = function () {
      if (!dragState) return;
      setTimeout(function () { if (dragState) dragState = null; }, 0);
      track.classList.remove('is-dragging');
      pauseAutoplayTemporarily();
    };
  }

  function bindProcedureCards() {
    modalData = Array.from(document.querySelectorAll('.procedure-card')).map(function (card) {
      return cardToData(card);
    });
    document.querySelectorAll('.procedure-card').forEach(function (card, index) {
      card.onclick = function (event) {
        if (event.target.closest('a, button')) return;
        if (dragState && dragState.moved) return;
        openProcedureModal(cardToData(card) || modalData[index]);
      };
    });
  }

  function cardToData(card) {
    if (!card) return null;
    var image = card.querySelector('.procedure-image img');
    var mediaText = card.querySelector('.procedure-image');
    var label = card.querySelector('.procedure-body > span');
    var title = card.querySelector('.procedure-body h3');
    var text = card.querySelector('.procedure-body p');
    var tags = Array.from(card.querySelectorAll('.tags b')).map(function (tag) { return tag.textContent.trim(); });
    return {
      label: label ? label.textContent.trim() : 'Procedimento',
      title: title ? title.textContent.trim() : mediaText ? mediaText.childNodes[0].textContent.trim() : 'Procedimento',
      text: text ? text.textContent.trim() : '',
      tags: tags,
      image: image ? image.getAttribute('src') : ''
    };
  }

  function openProcedureModal(data) {
    if (!data) return;
    pauseAutoplayTemporarily();
    var old = document.querySelector('.proc-modal');
    if (old) old.remove();
    var modal = document.createElement('div');
    modal.className = 'proc-modal is-open';
    modal.innerHTML = '<div class="proc-modal__backdrop" data-close="1"></div>' +
      '<div class="proc-modal__dialog" role="dialog" aria-modal="true">' +
      '<button class="proc-modal__close" type="button" data-close="1">×</button>' +
      '<div class="proc-modal__media">' + (data.image ? '<img src="' + safe(data.image) + '" alt="' + safe(data.title) + '">' : safe(data.title)) + '</div>' +
      '<div class="proc-modal__content"><span>' + safe(data.label) + '</span><h3>' + safe(data.title) + '</h3><p>' + safe(data.text) + '</p>' +
      '<div class="proc-modal__tags">' + data.tags.map(function (tag) { return '<b>' + safe(tag) + '</b>'; }).join('') + '</div>' +
      '<a class="btn btn-gold" href="' + getWhatsAppUrl('Tenho interesse em ' + data.title + '.') + '">Tenho interesse →</a></div></div>';
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    modal.querySelectorAll('[data-close]').forEach(function (close) {
      close.onclick = function () { closeProcedureModal(modal); };
    });
    document.onkeydown = function (event) {
      if (event.key === 'Escape') closeProcedureModal(modal);
    };
  }

  function closeProcedureModal(modal) {
    if (modal) modal.remove();
    document.body.classList.remove('modal-open');
    document.onkeydown = null;
    pauseAutoplayTemporarily();
  }

  function loadConfig() {
    fetch('/api/config-v2', { cache: 'no-store' })
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (payload) {
        if (!payload || !payload.config) return;
        siteConfig = payload.config;
        applyConfig(siteConfig);
      })
      .catch(function () {});
  }

  function applyConfig(config) {
    updateGlobalLinks(config);
    updateHero(config);
    updateProcedures(config);
    updateTestimonials(config);
    updateFaq(config);
    updateAbout(config);
    updateContact(config);
  }

  function updateGlobalLinks(config) {
    document.querySelectorAll('a[href^="https://wa.me/"]').forEach(function (link) {
      link.href = getWhatsAppUrl(link.textContent && link.textContent.indexOf('Tenho interesse') >= 0 ? link.textContent : null);
    });
    var logo = config.site && config.site.logo;
    if (logo && logo.imageUrl) {
      document.querySelectorAll('.logo').forEach(function (el) {
        el.innerHTML = '<img src="' + safe(logo.imageUrl) + '" alt="Catarina Queiroz Clínica Estética">';
      });
    }
  }

  function updateHero(config) {
    var hero = config.sections && config.sections.hero;
    if (!hero) return;
    var kicker = document.querySelector('.hero .eyebrow');
    var title = document.querySelector('.hero h1');
    var subtitle = document.querySelector('.hero-copy > p:not(.eyebrow)');
    var photo = document.querySelector('.hero-photo');
    if (kicker && hero.kicker) kicker.textContent = hero.kicker;
    if (title && hero.title) title.textContent = hero.title;
    if (subtitle && hero.subtitle) subtitle.textContent = hero.subtitle;
    if (photo && hero.image && hero.image.url) photo.innerHTML = '<img src="' + safe(hero.image.url) + '" alt="' + safe(hero.image.alt || hero.title || 'Foto principal') + '">';
  }

  function updateProcedures(config) {
    var procedures = config.sections && config.sections.procedures;
    if (!procedures || !Array.isArray(procedures.items)) return;
    var title = document.querySelector('#procedimentos h2');
    var lead = document.querySelector('#procedimentos .lead');
    if (procedures.title && title) title.textContent = procedures.title;
    if (procedures.subtitle && lead) lead.textContent = procedures.subtitle;
    initTicker(procedures.items.map(function (item) { return item.title; }));
    var track = document.getElementById('proceduresTrack');
    if (!track) return;
    track.innerHTML = procedures.items.map(function (item, index) {
      var titleText = item.title || 'Procedimento';
      var image = item.imageUrl || (item.image && item.image.url) || '';
      var tags = item.tags || item.benefits || item.highlights || [];
      if (!Array.isArray(tags)) tags = [String(tags)];
      if (!tags.length && item.highlight) tags = [item.highlight];
      var type = item.category || item.type || (index === 3 ? 'CORPORAL' : 'FACIAL');
      return '<article class="procedure-card ' + (index === 1 ? 'active' : index === 0 || index === 2 ? 'dim' : '') + '">' +
        '<div class="procedure-image">' + (image ? '<img src="' + safe(image) + '" alt="' + safe(titleText) + '">' : safe(titleText).toUpperCase() + '<small>substitua por foto real do procedimento</small>') + '</div>' +
        '<div class="procedure-body"><span>' + safe(type).toUpperCase() + '</span><h3>' + safe(titleText) + '</h3><p>' + safe(item.description || item.text || '') + '</p>' +
        '<div class="tags">' + tags.slice(0, 3).map(function (tag) { return '<b>' + safe(tag) + '</b>'; }).join('') + '</div>' +
        '<a class="btn btn-gold" href="' + getWhatsAppUrl('Tenho interesse em ' + titleText + '.') + '">Tenho interesse →</a></div></article>';
    }).join('');
    setupProcedureCarousel();
  }

  function updateTestimonials(config) {
    var testimonials = config.sections && config.sections.testimonials;
    if (!testimonials || !Array.isArray(testimonials.items)) return;
    var title = document.querySelector('#depoimentos h2');
    var subtitle = document.querySelector('#depoimentos .section-subtitle');
    if (testimonials.title && title) title.textContent = testimonials.title;
    if (subtitle) subtitle.textContent = testimonials.subtitle && testimonials.subtitle.indexOf('painel') === -1 ? testimonials.subtitle : 'Histórias reais de pacientes que confiaram em nosso cuidado e transformaram sua autoestima.';
    var track = document.querySelector('.testimonial-track');
    if (!track) return;
    track.innerHTML = testimonials.items.filter(function (item) { return item.visible !== false; }).slice(0, 8).map(function (item) {
      return '<article class="testimonial-card"><div>★★★★★</div><p>“' + safe(item.text || '') + '”</p><strong>' + safe(item.name || 'Cliente') + '</strong><span>' + safe(item.role || '') + '</span></article>';
    }).join('');
  }

  function updateFaq(config) {
    var faq = config.sections && config.sections.faq;
    if (!faq || !Array.isArray(faq.items)) return;
    var title = document.querySelector('#faq h2');
    var subtitle = document.querySelector('#faq .section-subtitle');
    if (faq.title && title) title.textContent = faq.title;
    if (faq.subtitle && subtitle) subtitle.textContent = faq.subtitle;
    var list = document.querySelector('.faq-list');
    if (!list) return;
    list.innerHTML = faq.items.map(function (item, index) {
      return '<article class="faq-item ' + (index === 0 ? 'open' : '') + '"><button>' + safe(item.question) + '<span>' + (index === 0 ? '×' : '+') + '</span></button><p>' + safe(item.answer) + '</p></article>';
    }).join('');
    bindFaq();
  }

  function updateAbout(config) {
    var about = config.sections && config.sections.about;
    if (!about) return;
    var section = document.querySelector('#sobre');
    if (!section) return;
    var textNodes = section.querySelectorAll('.about-copy p:not(.eyebrow)');
    if (about.text && textNodes[0]) textNodes[0].textContent = about.text;
    var list = section.querySelector('.about-copy ul');
    if (list && Array.isArray(about.bullets)) list.innerHTML = about.bullets.map(function (item) { return '<li>' + safe(item) + '</li>'; }).join('');
    var photo = section.querySelector('.about-photo');
    if (photo && about.image && about.image.url) photo.innerHTML = '<img src="' + safe(about.image.url) + '" alt="Catarina Queiroz">';
  }

  function updateContact(config) {
    var contact = config.site && config.site.contact;
    if (!contact) return;
    document.querySelectorAll('.location-card p').forEach(function (p) {
      if (p.textContent.indexOf('R. Ribeiro') >= 0 && contact.address) p.innerHTML = '<strong>Endereço</strong><br>' + safe(contact.address);
      if (p.textContent.indexOf('(81)') >= 0 && contact.phoneDisplay) p.innerHTML = '<strong>WhatsApp</strong><br>' + safe(contact.phoneDisplay);
    });
    var map = document.querySelector('.map iframe');
    if (map) map.src = contact.mapsEmbedUrl || ('https://www.google.com/maps?q=' + encodeURIComponent(contact.mapsQuery || contact.address || '') + '&output=embed');
  }
});
