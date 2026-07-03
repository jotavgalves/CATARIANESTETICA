(function () {
  function loadCss(href) {
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = href;
    document.head.appendChild(css);
  }
  loadCss('/src/exact-sections.css?v=4');
  loadCss('/src/final-fixes.css?v=3');
})();

document.addEventListener('DOMContentLoaded', function () {
  var siteConfig = null;
  var carousel = null;

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

  normalizeStaticCopy();
  bindMenu();
  bindFaq();
  initTicker();
  initReveal();
  fixWhatsapp();
  initProcedureCarousel();
  loadConfig();

  function bindMenu() {
    var menu = document.getElementById('menuBtn');
    var links = document.getElementById('navLinks');
    if (menu && links) menu.onclick = function () { links.classList.toggle('open'); };
  }

  function normalizeStaticCopy() {
    var heroParagraph = document.querySelector('.hero-copy > p:not(.eyebrow)');
    if (heroParagraph) {
      heroParagraph.textContent = 'Protocolos personalizados, tecnologia avançada e um olhar estético apurado para realçar o que há de melhor em você, com naturalidade e segurança.';
    }
    var testimonialSubtitle = document.querySelector('.testimonials .section-subtitle');
    if (testimonialSubtitle) {
      testimonialSubtitle.textContent = 'Histórias reais de pacientes que confiaram em nosso cuidado e transformaram sua autoestima.';
    }
  }

  function fixWhatsapp() {
    document.querySelectorAll('.whatsapp-float').forEach(function (el) {
      el.style.position = 'fixed';
      el.style.right = '24px';
      el.style.left = 'auto';
      el.style.bottom = '24px';
      el.style.top = 'auto';
      el.style.zIndex = '99999';
    });
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

  function initProcedureCarousel() {
    var track = document.getElementById('proceduresTrack');
    if (!track) return;
    if (carousel && carousel.destroy) carousel.destroy();
    carousel = createProcedureCarousel(track);
    carousel.init();
  }

  function createProcedureCarousel(track) {
    var state = {
      index: Math.min(1, Math.max(0, track.querySelectorAll('.procedure-card').length - 1)),
      timer: null,
      pausedUntil: 0,
      startX: 0,
      startOffset: 0,
      moved: false,
      dragging: false,
      offset: 0,
      listeners: []
    };

    function cards() {
      return Array.from(track.querySelectorAll('.procedure-card'));
    }

    function viewport() {
      return track.parentElement || track;
    }

    function desiredOffset(index) {
      var list = cards();
      if (!list.length) return 0;
      if (index >= list.length) index = 0;
      if (index < 0) index = list.length - 1;
      var card = list[index];
      var center = card.offsetLeft + card.offsetWidth / 2;
      return viewport().clientWidth / 2 - center;
    }

    function applyOffset(offset, animated) {
      state.offset = offset;
      track.style.transition = animated ? 'transform .62s cubic-bezier(.22,1,.36,1)' : 'none';
      track.style.transform = 'translate3d(' + offset + 'px,0,0)';
    }

    function setIndex(index, animated) {
      var list = cards();
      if (!list.length) return;
      if (index >= list.length) index = 0;
      if (index < 0) index = list.length - 1;
      state.index = index;
      applyOffset(desiredOffset(index), animated !== false);
      updateActive();
    }

    function updateActive() {
      var list = cards();
      list.forEach(function (card, i) {
        var near = Math.abs(i - state.index) === 1 || Math.abs(i - state.index) === list.length - 1;
        card.classList.toggle('is-active', i === state.index);
        card.classList.toggle('is-near', near && i !== state.index);
        card.classList.toggle('dim', !near && i !== state.index);
      });
      var progress = document.querySelector('.carousel-meta .progress i') || document.querySelector('.progress i');
      var counter = document.querySelector('.carousel-meta span:first-child');
      var pct = list.length <= 1 ? 100 : ((state.index + 1) / list.length) * 100;
      if (progress) progress.style.width = pct + '%';
      if (counter) counter.textContent = String(state.index + 1).padStart(2, '0') + ' / ' + String(list.length).padStart(2, '0');
    }

    function move(dir, manual) {
      if (manual) pause(4800);
      setIndex(state.index + dir, true);
    }

    function pause(ms) {
      state.pausedUntil = Date.now() + (ms || 4500);
    }

    function autoplay() {
      clearInterval(state.timer);
      state.timer = setInterval(function () {
        if (Date.now() < state.pausedUntil) return;
        if (document.body.classList.contains('modal-open')) return;
        if (viewport().matches(':hover')) return;
        move(1, false);
      }, 3000);
    }

    function add(el, type, fn, opts) {
      el.addEventListener(type, fn, opts);
      state.listeners.push([el, type, fn, opts]);
    }

    function bind() {
      add(window, 'resize', function () { setIndex(state.index, false); });
      document.querySelectorAll('[data-target="proceduresTrack"]').forEach(function (btn) {
        add(btn, 'click', function (event) {
          event.preventDefault();
          event.stopPropagation();
          move(Number(btn.getAttribute('data-dir') || 1), true);
        });
      });

      add(track, 'pointerdown', function (event) {
        if (event.target.closest('a, button')) return;
        state.dragging = true;
        state.moved = false;
        state.startX = event.clientX;
        state.startOffset = state.offset;
        pause(6000);
        track.classList.add('is-dragging');
        try { track.setPointerCapture(event.pointerId); } catch (_) {}
      }, true);

      add(track, 'pointermove', function (event) {
        if (!state.dragging) return;
        var dx = event.clientX - state.startX;
        if (Math.abs(dx) > 5) state.moved = true;
        applyOffset(state.startOffset + dx, false);
      }, true);

      add(track, 'pointerup', function (event) {
        if (!state.dragging) return;
        var dx = event.clientX - state.startX;
        state.dragging = false;
        track.classList.remove('is-dragging');
        if (dx < -46) setIndex(state.index + 1, true);
        else if (dx > 46) setIndex(state.index - 1, true);
        else setIndex(state.index, true);
        pause(4800);
      }, true);

      add(track, 'pointercancel', function () {
        state.dragging = false;
        track.classList.remove('is-dragging');
        setIndex(state.index, true);
      }, true);

      add(track, 'click', function (event) {
        var card = event.target.closest('.procedure-card');
        if (!card || event.target.closest('a, button')) return;
        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        if (state.moved) { state.moved = false; return; }
        var index = cards().indexOf(card);
        if (index !== state.index) {
          setIndex(index, true);
          pause(3500);
          return;
        }
        openProcedureModal(cardToData(card));
      }, true);
    }

    return {
      init: function () {
        track.style.overflow = 'visible';
        track.style.willChange = 'transform';
        bind();
        setTimeout(function () { setIndex(state.index, false); }, 80);
        autoplay();
      },
      destroy: function () {
        clearInterval(state.timer);
        state.listeners.forEach(function (row) { row[0].removeEventListener(row[1], row[2], row[3]); });
        state.listeners = [];
      },
      goTo: setIndex
    };
  }

  function cardToData(card) {
    var img = card.querySelector('.procedure-image img');
    var label = card.querySelector('.procedure-body > span');
    var title = card.querySelector('.procedure-body h3');
    var text = card.querySelector('.procedure-body p');
    var tags = Array.from(card.querySelectorAll('.tags b')).map(function (x) { return x.textContent.trim(); });
    return {
      image: img && img.src || '',
      label: label && label.textContent.trim() || 'Procedimento',
      title: title && title.textContent.trim() || 'Procedimento',
      text: text && text.textContent.trim() || '',
      tags: tags
    };
  }

  function openProcedureModal(data) {
    if (!data) return;
    document.querySelectorAll('.proc-modal').forEach(function (modal) { modal.remove(); });
    var modal = document.createElement('div');
    modal.className = 'proc-modal is-open';
    modal.innerHTML = '<div class="proc-modal__backdrop" data-close="1"></div>' +
      '<div class="proc-modal__dialog" role="dialog" aria-modal="true">' +
      '<button class="proc-modal__close" data-close="1" type="button">×</button>' +
      '<div class="proc-modal__media">' + (data.image ? '<img src="' + safe(data.image) + '" alt="' + safe(data.title) + '">' : safe(data.title)) + '</div>' +
      '<div class="proc-modal__content"><span>' + safe(data.label) + '</span><h3>' + safe(data.title) + '</h3><p>' + safe(data.text) + '</p>' +
      '<div class="proc-modal__tags">' + data.tags.map(function (tag) { return '<b>' + safe(tag) + '</b>'; }).join('') + '</div>' +
      '<a class="btn btn-gold" href="' + getWhatsAppUrl('Tenho interesse em ' + data.title + '.') + '">Tenho interesse →</a></div></div>';
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    modal.querySelectorAll('[data-close]').forEach(function (close) {
      close.onclick = function () {
        modal.remove();
        document.body.classList.remove('modal-open');
      };
    });
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
    fixWhatsapp();
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
    if (photo && hero.image && hero.image.url) {
      photo.innerHTML = '<img src="' + safe(hero.image.url) + '" alt="' + safe(hero.image.alt || hero.title || 'Foto principal') + '">';
    }
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
      return '<article class="procedure-card">' +
        '<div class="procedure-image">' + (image ? '<img src="' + safe(image) + '" alt="' + safe(titleText) + '">' : safe(titleText).toUpperCase() + '<small>substitua por foto real do procedimento</small>') + '</div>' +
        '<div class="procedure-body"><span>' + safe(type).toUpperCase() + '</span><h3>' + safe(titleText) + '</h3><p>' + safe(item.description || item.text || '') + '</p>' +
        '<div class="tags">' + tags.slice(0, 3).map(function (tag) { return '<b>' + safe(tag) + '</b>'; }).join('') + '</div>' +
        '<a class="btn btn-gold" href="' + getWhatsAppUrl('Tenho interesse em ' + titleText + '.') + '">Tenho interesse →</a></div></article>';
    }).join('');
    initProcedureCarousel();
  }

  function testimonialHtml(item) {
    var before = item.beforeImageUrl || item.beforeUrl || item.imageBefore || '';
    var after = item.afterImageUrl || item.afterUrl || item.imageAfter || '';
    var photo = item.imageUrl || item.photoUrl || '';
    var body = '<div class="testimonial-body"><div>★★★★★</div><p>“' + safe(item.text || '') + '”</p><strong>' + safe(item.name || 'Cliente') + '</strong><span>' + safe(item.role || '') + '</span></div>';
    if (before && after) return '<article class="testimonial-card has-ba"><div class="before-after"><figure><img src="' + safe(before) + '" alt="Antes"><figcaption>Antes</figcaption></figure><figure><img src="' + safe(after) + '" alt="Depois"><figcaption>Depois</figcaption></figure></div>' + body + '</article>';
    if (photo) return '<article class="testimonial-card has-photo"><img class="client-photo" src="' + safe(photo) + '" alt="' + safe(item.name || 'Cliente') + '">' + body + '</article>';
    return '<article class="testimonial-card">' + body + '</article>';
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
    track.innerHTML = testimonials.items.filter(function (item) { return item.visible !== false; }).slice(0, 8).map(testimonialHtml).join('');
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
