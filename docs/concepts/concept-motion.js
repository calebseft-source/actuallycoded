/* ============================================================
   Shared behaviour for the fictional concept pages.

   Everything here is a progressive enhancement. With JavaScript
   off, or motion reduced, each page stays complete, readable,
   and fully navigable. Ported from the storefront's script.js so
   the concepts move the same way the rest of the site does.
   ============================================================ */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var supported = "IntersectionObserver" in window;

  /* ---- Mobile navigation ---- */
  var menuButton = document.querySelector(".menu-toggle");
  var navigation = document.querySelector("#site-nav");

  if (menuButton && navigation) {
    var closeMenu = function () {
      navigation.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open navigation");
    };

    menuButton.addEventListener("click", function () {
      var isOpen = menuButton.getAttribute("aria-expanded") === "true";
      navigation.classList.toggle("is-open", !isOpen);
      menuButton.setAttribute("aria-expanded", String(!isOpen));
      menuButton.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
    });

    navigation.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) closeMenu();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu();
    });

    document.addEventListener("click", function (event) {
      if (navigation.classList.contains("is-open") &&
          !navigation.contains(event.target) &&
          !menuButton.contains(event.target)) {
        closeMenu();
      }
    });
  }

  /* ---- Reveal on scroll ---- */
  var targets = document.querySelectorAll("[data-reveal]");
  if (targets.length && supported && !reduced) {
    document.documentElement.classList.add("has-reveal");

    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        revealer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });

    targets.forEach(function (el) {
      // Stagger children of a group so a row of cards arrives in sequence.
      var group = el.closest("[data-reveal-group]");
      if (group) {
        var peers = Array.prototype.slice.call(group.querySelectorAll("[data-reveal]"));
        var i = peers.indexOf(el);
        if (i > 0) el.style.setProperty("--reveal-delay", Math.min(i, 6) * 70 + "ms");
      }
      revealer.observe(el);
    });

    // Anything already on screen at load must not wait for a scroll, and
    // must not depend on requestAnimationFrame: rAF is paused in a
    // background or non-rendering tab, which would strand content at
    // opacity 0. This runs synchronously instead. If the viewport cannot
    // be measured, reveal everything rather than risk hiding the page.
    var revealInView = function () {
      var vh = window.innerHeight || 0;
      targets.forEach(function (el) {
        if (el.classList.contains("is-revealed")) return;
        if (!vh || el.getBoundingClientRect().top < vh * 0.92) {
          el.classList.add("is-revealed");
          revealer.unobserve(el);
        }
      });
    };

    // Run it now, and again once the page has settled. The second pass
    // matters for deep links: the browser jumps to #section AFTER this
    // script runs, so the first pass measures the wrong scroll position
    // and would leave the landed-on section invisible.
    revealInView();
    window.addEventListener("load", revealInView);
    window.setTimeout(revealInView, 250);
    if (window.location.hash) window.setTimeout(revealInView, 700);

    // Scroll-driven backstop. Deliberately NOT requestAnimationFrame:
    // rAF is paused in background and non-rendering tabs, which is
    // exactly when content must not be left blank.
    var revealTick = false;
    window.addEventListener("scroll", function () {
      if (revealTick) return;
      revealTick = true;
      window.setTimeout(function () {
        revealInView();
        revealTick = false;
      }, 100);
    }, { passive: true });

    // Last-resort failsafe. If the observer never delivers, drop the
    // hidden state entirely so no visitor sees blank sections.
    window.setTimeout(function () {
      if (!document.querySelector("[data-reveal]:not(.is-revealed)")) return;
      var stuck = document.querySelectorAll("[data-reveal]:not(.is-revealed)");
      var anyOnScreen = false;
      Array.prototype.forEach.call(stuck, function (el) {
        var box = el.getBoundingClientRect();
        if (box.top < (window.innerHeight || 0) && box.bottom > 0) anyOnScreen = true;
      });
      if (anyOnScreen) document.documentElement.classList.remove("has-reveal");
    }, 1500);
  }

  /* ---- Scroll progress hairline ---- */
  var bar = document.querySelector(".scroll-progress");
  if (bar && !reduced) {
    var ticking = false;
    var update = function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.setProperty("--progress", pct.toFixed(4));
      ticking = false;
    };
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
  }

  /* ---- Highlight the section being read, in the nav ---- */
  var links = document.querySelectorAll("#site-nav a[href^='#']");
  if (links.length && supported) {
    var byId = {};
    var watched = [];
    Array.prototype.forEach.call(links, function (link) {
      var id = link.getAttribute("href").slice(1);
      var section = id && document.getElementById(id);
      if (!section) return;
      byId[id] = link;
      watched.push(section);
    });

    if (watched.length) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var link = byId[entry.target.id];
          if (!link) return;
          if (entry.isIntersecting) {
            Object.keys(byId).forEach(function (k) { byId[k].removeAttribute("aria-current"); });
            link.setAttribute("aria-current", "true");
          }
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      watched.forEach(function (s) { spy.observe(s); });
    }
  }

  /* ---- Non-submitting demo form ----
     The concept businesses do not exist, so this control must never
     look like it sent anything. It clears the fields and says so. */
  var demoForm = document.querySelector("#demo-form");
  var demoSubmit = document.querySelector("#demo-submit");
  var formStatus = document.querySelector("#form-status");

  if (demoForm && demoSubmit && formStatus) {
    demoSubmit.addEventListener("click", function () {
      demoForm.querySelectorAll("input, textarea").forEach(function (control) {
        control.value = "";
      });
      demoForm.querySelectorAll("select").forEach(function (control) {
        control.selectedIndex = 0;
      });
      formStatus.textContent = "Demo complete. Nothing was sent, saved, or shared.";
    });
  }

  var year = document.querySelector("#year");
  if (year) year.textContent = new Date().getFullYear();
})();

/* ============================================================
   Lenis smooth scroll (vendored locally, MIT, v1.1.18).
   Self-hosted on purpose: a CDN copy would be blocked by the
   site's script-src 'self' policy and would contradict the
   privacy policy's no-third-party-scripts statement.

   Touch is left completely native. Phones already have real
   momentum scrolling and hijacking it makes a page feel worse.
   ============================================================ */
(function () {
  if (typeof window.Lenis !== "function") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var lenis = new window.Lenis({
    duration: 0.9,
    easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
    smoothWheel: true,
    syncTouch: false,
    wheelMultiplier: 1,
    touchMultiplier: 1.6
  });

  // Hand scroll behaviour fully to Lenis. This class deliberately avoids
  // the substring "lenis", because Lenis strips /lenis(-\w+)?/ from the
  // root element on every class update and would erase it.
  document.documentElement.classList.add("smooth-active");

  function raf(time) {
    lenis.raf(time);
    window.requestAnimationFrame(raf);
  }
  window.requestAnimationFrame(raf);

  // Keep in-page links smooth and clear of the sticky header.
  var NAV_OFFSET = -88;
  document.addEventListener("click", function (event) {
    var link = event.target.closest && event.target.closest("a[href^='#']");
    if (!link) return;
    var hash = link.getAttribute("href");
    if (!hash || hash === "#") return;
    var target = document.querySelector(hash);
    if (!target) return;
    event.preventDefault();
    lenis.scrollTo(target, { offset: NAV_OFFSET });
    if (history.replaceState) history.replaceState(null, "", hash);
  });

  // If the page is opened on a deep link, Lenis should own that jump too.
  if (window.location.hash) {
    var initial = document.querySelector(window.location.hash);
    if (initial) {
      window.setTimeout(function () {
        lenis.scrollTo(initial, { offset: NAV_OFFSET, immediate: true });
      }, 0);
    }
  }

  window.addEventListener("beforeprint", function () { lenis.stop(); });
  window.addEventListener("afterprint", function () { lenis.start(); });
})();
