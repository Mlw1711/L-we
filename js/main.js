// Header logo: swap the placeholder emblem for the real logo file only
// once it has actually loaded, so a missing file never shows a broken
// image icon in the header.
(function () {
  var mark = document.getElementById('logo-mark');
  if (!mark) return;
  var src = 'images/loewen-neureut-logo.png';
  var probe = new Image();
  probe.onload = function () {
    mark.innerHTML = '';
    var img = document.createElement('img');
    img.src = src;
    img.alt = 'Löwen Neureut';
    mark.appendChild(img);
  };
  probe.src = src;
})();

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

// Speisekarte / Mittagskarte mode switch
(function () {
  var modeBtns = Array.prototype.slice.call(document.querySelectorAll('.mode-btn'));
  var speisekarteView = document.getElementById('menu-speisekarte-view');
  var mittagView = document.getElementById('menu-mittag-view');
  if (!modeBtns.length || !speisekarteView || !mittagView) return;

  modeBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var isMittag = btn.dataset.mode === 'mittag';
      modeBtns.forEach(function (b) { b.setAttribute('aria-selected', String(b === btn)); });
      speisekarteView.hidden = isMittag;
      mittagView.hidden = !isMittag;
    });
  });
})();

// Impressum / Datenschutz: click to expand in place
(function () {
  var toggles = document.querySelectorAll('[data-legal-toggle]');
  toggles.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var panel = document.getElementById(btn.dataset.legalToggle);
      if (!panel) return;
      var willOpen = panel.hidden;
      panel.hidden = !willOpen;
      btn.setAttribute('aria-expanded', String(willOpen));
      if (willOpen) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
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

// Impressionen carousel: prev/next buttons scroll the track by roughly
// one screen; native touch/trackpad swipe on .carousel-track keeps working.
(function () {
  var track = document.querySelector('[data-carousel-track]');
  var prevBtn = document.querySelector('[data-carousel-prev]');
  var nextBtn = document.querySelector('[data-carousel-next]');
  if (!track || !prevBtn || !nextBtn) return;

  function scrollByScreen(direction) {
    track.scrollBy({ left: track.clientWidth * 0.85 * direction, behavior: 'smooth' });
  }

  prevBtn.addEventListener('click', function () { scrollByScreen(-1); });
  nextBtn.addEventListener('click', function () { scrollByScreen(1); });
})();

// Graceful fallback for missing photos: keep the styled placeholder
// background instead of showing a broken-image icon.
(function () {
  var imgs = document.querySelectorAll('img[data-fallback]');
  imgs.forEach(function (img) {
    function markMissing() {
      var holder = img.closest('.hero, .carousel-item, .food-break');
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
