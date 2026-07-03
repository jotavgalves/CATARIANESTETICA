(function () {
  var css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = '/src/exact-sections.css?v=2';
  document.head.appendChild(css);
})();

document.addEventListener('DOMContentLoaded', function () {
  var siteConfig = null;
  var menu = document.getElementById('menuBtn');
  var links = document.getElementById('navLinks');
  if (menu && links) menu.onclick = function () { links.classList.toggle('open'); };

  normalizeStaticCopy();
  bindFaq();
  bindCarouselButtons();
  initTicker();
  initReveal();
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
    if (heroParagraph) {
      heroParagraph.textContent = 'Protocolos personalizados, tecnologia avançada e um olhar estético apurado para realçar o que há de melhor em você, com naturalidade e segurança.';
    }
    var testimonialSubtitle = document.querySelector('.testimonials .section-subtitle');
    if (testimonialSubtitle) {
      testimonialSubtitle.textContent = 'Histórias reais de pacientes que confiaram em nosso cuidado e transformaram sua autoestima.';
    }
  }

  function initTicker(items) {
    var track = document.querySelector('.ticker-track');
    if (!track) return;
    var labels = items && items.length ? items : Array.from(track.querySelectorAll('span')).map(function (span) { return span.textContent.trim(); });
    labels = labels.filter(Boolean);
    if (!labels.length) labels = ['Limpeza de pele', 'Drenagem facial', 'Drenagem HD', 'Peeling químico', 'Botox', 'Endolaser'];
    var repeated = labels.concat(labels);
    track.innerHTML = repeated.map(function (label) { return '<span>' + safe(label) + '</span>'; }).join('');
    var speed = Math.max(24, labels.length * 4);
    track.style.setProperty('--ticker-speed', speed + 's');
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

  function bindCarouselButtons() {
    document.querySelectorAll('[data-target]').forEach(function (button) {
      button.onclick = function () {
        var target = document.getElementById(button.getAttribute('data-target'));
        var dir = Number(button.getAttribute('data-dir') || 1);
        var card = target ? target.querySelector('.procedure-card') : null;
        var move = card ? card.getBoundingClientRect().width + 28 : 395;
        if (target) target.scrollBy({ left: dir * move, behavior: 'smooth' });
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
      return '<article class="procedure-card ' + (index === 1 ? 'active' : index === 0 || index === 2 ? 'dim' : '') + '">' +
        '<div class="procedure-image">' + (image ? '<img src="' + safe(image) + '" alt="' + safe(titleText) + '">' : safe(titleText).toUpperCase() + '<small>substitua por foto real do procedimento</small>') + '</div>' +
        '<div class="procedure-body"><span>' + safe(type).toUpperCase() + '</span><h3>' + safe(titleText) + '</h3><p>' + safe(item.description || item.text || '') + '</p>' +
        '<div class="tags">' + tags.slice(0, 3).map(function (tag) { return '<b>' + safe(tag) + '</b>'; }).join('') + '</div>' +
        '<a class="btn btn-gold" href="' + getWhatsAppUrl('Tenho interesse em ' + titleText + '.') + '">Tenho interesse →</a></div></article>';
    }).join('');
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
