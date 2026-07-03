document.addEventListener('DOMContentLoaded', function () {
  var menu = document.getElementById('menuBtn');
  var links = document.getElementById('navLinks');
  if (menu && links) menu.onclick = function () { links.classList.toggle('open'); };

  document.querySelectorAll('.faq-item button').forEach(function (button) {
    button.onclick = function () {
      var item = button.closest('.faq-item');
      document.querySelectorAll('.faq-item').forEach(function (other) {
        if (other !== item) other.classList.remove('open');
      });
      item.classList.toggle('open');
    };
  });

  document.querySelectorAll('[data-target]').forEach(function (button) {
    button.onclick = function () {
      var target = document.getElementById(button.getAttribute('data-target'));
      var dir = Number(button.getAttribute('data-dir') || 1);
      if (target) target.scrollBy({ left: dir * 395, behavior: 'smooth' });
    };
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) entry.target.classList.add('in');
    });
  }, { threshold: 0.14 });

  document.querySelectorAll('.reveal').forEach(function (el) { observer.observe(el); });
});
