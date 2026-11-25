/* 鲜知科技 Xenzify — 交互脚本
   1) 滚动进场（.fade → .on，只触发一次）
   2) 整屏吸附滚动（仅桌面端，尊重 prefers-reduced-motion）
*/

(function () {
  'use strict';

  /* ---------- 1. 滚动进场 ---------- */
  var reveal = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('on');
      reveal.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.fade').forEach(function (el) {
    reveal.observe(el);
  });

  /* ---------- 2. 整屏吸附滚动 ---------- */
  (function snapScroll() {
    var sections = Array.prototype.slice.call(document.querySelectorAll('[data-snap]'));
    var rafId = null;
    var debounceId = null;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function stopAnimation() {
      if (!rafId) return;
      cancelAnimationFrame(rafId);
      rafId = null;
      document.documentElement.style.scrollBehavior = '';
    }

    window.addEventListener('wheel', stopAnimation, { passive: true });
    window.addEventListener('touchstart', stopAnimation, { passive: true });
    window.addEventListener('keydown', function (e) {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].indexOf(e.key) !== -1) {
        stopAnimation();
      }
    });

    function scrollToTarget(target) {
      var start = window.scrollY;
      var delta = target - start;
      if (Math.abs(delta) < 2) return;

      var duration = Math.min(620, 240 + 0.22 * Math.abs(delta));
      var startTime = performance.now();

      document.documentElement.style.scrollBehavior = 'auto';
      cancelAnimationFrame(rafId);

      function step(now) {
        var t = Math.min(1, (now - startTime) / duration);
        var eased = 1 - Math.pow(1 - t, 3);
        window.scrollTo(0, start + delta * eased);
        if (t < 1) {
          rafId = requestAnimationFrame(step);
        } else {
          rafId = null;
          document.documentElement.style.scrollBehavior = '';
        }
      }
      rafId = requestAnimationFrame(step);
    }

    window.addEventListener('scroll', function () {
      if (rafId) return;
      clearTimeout(debounceId);

      debounceId = setTimeout(function () {
        if (reduceMotion || window.innerWidth < 900) return;

        var vh = window.innerHeight;
        var y = window.scrollY;
        var maxScroll = document.documentElement.scrollHeight;

        // 首屏附近不吸附，避免与 hero 抢滚动
        if (y < 0.15 * vh) return;

        var targets = sections.map(function (el) {
          return Math.max(0, el.getBoundingClientRect().top + y - 48);
        });
        targets.push(maxScroll - vh);

        var nearest = null;
        var minDist = Infinity;

        targets.forEach(function (top) {
          var dist = Math.abs(top - y);
          if (dist < minDist) {
            minDist = dist;
            nearest = top;
          }
        });

        if (nearest !== null && minDist < 0.4 * vh) {
          scrollToTarget(nearest);
        }
      }, 150);
    }, { passive: true });
  })();
})();
