/* ============================================================
   Emberline extras. Two small things on top of concept-motion.js:
   the hero photograph drifts as the page scrolls, and the numbers
   count up the first time they are seen. Both are progressive
   enhancements; with JavaScript off the page is complete.
   ============================================================ */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  /* ---- Hero drift: the photo moves at a third of the scroll speed ---- */
  var photo = document.querySelector(".hero-photo");
  var hero = document.querySelector(".hero");
  if (photo && hero) {
    var drifting = false;
    var drift = function () {
      var y = window.scrollY || 0;
      var limit = hero.offsetHeight || 1;
      var t = Math.min(1, Math.max(0, y / limit));
      photo.style.setProperty("--drift", (t * 18).toFixed(2) + "%");
      drifting = false;
    };
    window.addEventListener("scroll", function () {
      if (drifting) return;
      drifting = true;
      window.requestAnimationFrame(drift);
    }, { passive: true });
    drift();
  }

  /* ---- Numbers: count to the value once revealed ---- */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var run = function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10) || 0;
      var start = null;
      var dur = 1100;
      var step = function (now) {
        if (start === null) start = now;
        var p = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(target * eased));
        if (p < 1) window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
    };
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        seen.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { seen.observe(el); });
    // If the observer never fires (a hidden tab), show the real numbers after a moment.
    window.setTimeout(function () {
      counters.forEach(function (el) {
        if (el.textContent === "0" && el.getAttribute("data-count") !== "0") el.textContent = el.getAttribute("data-count");
      });
    }, 4000);
  }
})();
