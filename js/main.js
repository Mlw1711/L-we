(function () {
  var tablist = document.querySelector('.menu-tabs');
  if (!tablist) return;

  var tabs = Array.prototype.slice.call(tablist.querySelectorAll('.menu-tab'));
  var panels = tabs.map(function (tab) {
    return document.getElementById(tab.getAttribute('aria-controls'));
  });
  var prevBtn = document.querySelector('[data-menu-prev]');
  var nextBtn = document.querySelector('[data-menu-next]');
  var countEl = document.querySelector('[data-menu-count]');

  function centerTabInScroller(tab) {
    var tabRect = tab.getBoundingClientRect();
    var listRect = tablist.getBoundingClientRect();
    var offset = (tabRect.left + tabRect.right) / 2 - (listRect.left + listRect.right) / 2;
    tablist.scrollLeft += offset;
  }

  function activate(index, opts) {
    opts = opts || {};
    index = Math.max(0, Math.min(tabs.length - 1, index));

    tabs.forEach(function (tab, i) {
      var selected = i === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[i].hidden = !selected;
    });

    if (opts.focus) {
      tabs[index].focus();
    }
    centerTabInScroller(tabs[index]);

    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === tabs.length - 1;
    if (countEl) countEl.textContent = (index + 1) + ' / ' + tabs.length;
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () {
      activate(i);
    });
  });

  tablist.addEventListener('keydown', function (e) {
    var current = tabs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; });
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      activate(current + 1, { focus: true });
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      activate(current - 1, { focus: true });
    } else if (e.key === 'Home') {
      e.preventDefault();
      activate(0, { focus: true });
    } else if (e.key === 'End') {
      e.preventDefault();
      activate(tabs.length - 1, { focus: true });
    }
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      var current = tabs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; });
      activate(current - 1);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      var current = tabs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; });
      activate(current + 1);
    });
  }

  activate(0);
})();

// Mobile navigation drawer
(function () {
  var header = document.getElementById('site-header');
  var toggle = document.getElementById('nav-toggle');
  var drawer = document.getElementById('nav-drawer');
  if (!header || !toggle || !drawer) return;

  function setOpen(open) {
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
  }

  toggle.addEventListener('click', function () {
    setOpen(!header.classList.contains('is-open'));
  });

  drawer.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') setOpen(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });
})();

// Graceful fallback for missing photos: keep the styled placeholder
// background instead of showing a broken-image icon.
(function () {
  var imgs = document.querySelectorAll('img[data-fallback]');
  imgs.forEach(function (img) {
    function markMissing() {
      var holder = img.closest('.hero, .story-media, .about-media, .gallery-photo, .food-break');
      if (holder) holder.classList.add('img-missing');
    }
    // The browser may start loading (and failing) an image before this
    // script runs, so check the already-settled state first, and only
    // fall back to listening for a future error if it's still loading.
    if (img.complete) {
      if (img.naturalWidth === 0) markMissing();
    } else {
      img.addEventListener('error', markMissing, { once: true });
    }
  });
})();

// Subtle scroll reveal (progressive enhancement; content stays visible
// without JS or when IntersectionObserver is unsupported).
(function () {
  if (!('IntersectionObserver' in window)) return;
  var items = document.querySelectorAll('.reveal');
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  items.forEach(function (item) { observer.observe(item); });
})();

var yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
