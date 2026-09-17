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

  // Drift the photos past slowly and continuously, like a real carousel,
  // looping back to the start, for as long as nobody has scrolled/swiped
  // the carousel themselves and it's actually on screen. Because this
  // writes to scrollLeft every animation frame instead of in isolated
  // bursts, "was this scroll our own doing" can't be answered by a
  // timing guard (there's no gap between our writes to tell a real one
  // apart) - instead each frame compares the track's actual scrollLeft
  // against the value we last set it to. A match means nothing else has
  // touched it since; any mismatch means the visitor grabbed the track
  // themselves (touch, trackpad, drag), and autoplay stops for good.
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var SPEED = 25; // px/second - slow, ambient drift
    var REWIND_MS = 700; // duration of the loop-back-to-start animation
    var rafId = null;
    var lastTs = null;
    var accumulated = 0; // precise float position; scrollLeft itself rounds
                          // to an integer, so sub-pixel per-frame increments
                          // (well under 1px at this speed) would otherwise
                          // get truncated away on every single write and the
                          // track would never visibly move at all.
    var expected = null;
    var rewinding = false;
    var rewindStartTs = null;
    var rewindFrom = 0;
    var userTookOver = false;
    var visible = false;

    function atEnd() {
      return track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    }

    function externalScrollHappened() {
      return expected !== null && Math.abs(track.scrollLeft - expected) > 2;
    }

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function stopAuto() {
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
      // Restore the CSS-defined mandatory snap for manual interaction.
      track.style.scrollSnapType = '';
    }

    function stopForGood() {
      userTookOver = true;
      stopAuto();
    }

    function tick(ts) {
      if (externalScrollHappened()) { stopForGood(); return; }

      if (lastTs === null) {
        // First frame after a (re)start: just sync up, don't move yet.
        lastTs = ts;
        accumulated = track.scrollLeft;
        expected = track.scrollLeft;
        rafId = requestAnimationFrame(tick);
        return;
      }

      if (rewinding) {
        // Driven by our own easing rather than a native smooth-scroll +
        // guessed timeout: a fixed wait can't reliably tell when a native
        // animation has actually settled, and resyncing too early reads
        // a still-moving scrollLeft as "the visitor grabbed it," killing
        // autoplay for good right after every single lap.
        var t = Math.min(1, (ts - rewindStartTs) / REWIND_MS);
        accumulated = rewindFrom * (1 - easeOutCubic(t));
        track.scrollLeft = accumulated;
        expected = track.scrollLeft;
        if (t >= 1) {
          rewinding = false;
          lastTs = ts;
        }
        rafId = requestAnimationFrame(tick);
        return;
      }

      var dt = (ts - lastTs) / 1000;
      lastTs = ts;

      if (atEnd()) {
        rewinding = true;
        rewindStartTs = ts;
        rewindFrom = track.scrollLeft;
        rafId = requestAnimationFrame(tick);
        return;
      }

      accumulated += SPEED * dt;
      track.scrollLeft = accumulated;
      expected = track.scrollLeft;
      rafId = requestAnimationFrame(tick);
    }

    function startAuto() {
      if (rafId !== null || userTookOver || !visible) return;
      // Mandatory scroll-snap fights a continuous programmatic scroll -
      // Chromium snaps straight back to the nearest snap point (0) on
      // every sub-item-width write, so the track never visibly moves.
      // Suspend it for the duration of the drift; stopAuto() restores it.
      track.style.scrollSnapType = 'none';
      lastTs = null;
      expected = null;
      rafId = requestAnimationFrame(tick);
    }

    track.addEventListener('scroll', function () {
      if (externalScrollHappened()) stopForGood();
    }, { passive: true });
    prevBtn.addEventListener('click', stopForGood, { once: true });
    nextBtn.addEventListener('click', stopForGood, { once: true });

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          visible = entry.isIntersecting;
          if (visible) startAuto();
          else stopAuto();
        });
      }, { threshold: 0.4 });
      observer.observe(track);
    } else {
      visible = true;
      startAuto();
    }
  }
})();

// Graceful fallback for missing photos: keep the styled placeholder
// background instead of showing a broken-image icon.
(function () {
  var imgs = document.querySelectorAll('img[data-fallback]');
  imgs.forEach(function (img) {
    function markMissing() {
      var holder = img.closest('.hero, .carousel-item, .food-break, .atmosphere-strip-media');
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
