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
    tabs[index].scrollIntoView({ inline: 'center', block: 'nearest' });

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

var yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
