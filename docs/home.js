/* ============================================================
   actuallycoded home page script. Everything here is an enhancement:
   navigation, the brief, the chapter colour, the hero video, and the
   reveals. Libraries are self hosted (GSAP 3.15.0 under the GSAP
   Standard License, Lenis 1.3.26 under MIT) so the CSP's script-src
   'self' holds and the privacy page stays true.
   ============================================================ */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

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
    navigation.querySelectorAll("a").forEach(function (link) { link.addEventListener("click", closeMenu); });
    window.addEventListener("resize", function () { if (window.innerWidth > 860) closeMenu(); });
    document.addEventListener("keydown", function (event) { if (event.key === "Escape") closeMenu(); });
    document.addEventListener("click", function (event) {
      if (navigation.classList.contains("is-open") && !navigation.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
    });
  }

  /* ---- Current section in the navigation ---- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll("#site-nav a[href^='#']"));
  var spied = navLinks.map(function (a) { return document.querySelector(a.getAttribute("href")); }).filter(Boolean);
  if (spied.length && "IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          var on = a.getAttribute("href") === "#" + entry.target.id;
          if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    spied.forEach(function (s) { spy.observe(s); });
  }

  /* ---- Chapter colour: the body takes the theme of the section under the middle of the screen ---- */
  var chapters = document.querySelectorAll("[data-theme]");
  if (chapters.length && "IntersectionObserver" in window) {
    var chapterWatch = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) document.body.setAttribute("data-theme", entry.target.getAttribute("data-theme"));
      });
    }, { rootMargin: "-40% 0px -58% 0px" });
    chapters.forEach(function (c) { chapterWatch.observe(c); });
  }

  /* ---- The fire: play when it can, stop when off screen, and a real pause control ---- */
  var hero = document.querySelector(".hero");
  var video = document.querySelector(".hero-video");
  var videoToggle = document.querySelector(".video-toggle");
  if (hero && video) {
    var wantsPlay = !reduced;
    var markNoVideo = function () { hero.classList.add("no-video"); };
    /* The browser's own autoplay runs first. Script only steps in when the
       loop is still stopped once it can play, and treats a refusal (iOS
       Low Power Mode, a strict policy) as the still image being the design. */
    var tryPlay = function (strict) {
      if (!wantsPlay || hero.classList.contains("no-video")) return;
      var attempt = video.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(function () { if (strict && video.paused) markNoVideo(); });
      }
    };
    if (reduced) {
      video.removeAttribute("autoplay");
      video.pause();
      markNoVideo();
    } else {
      video.addEventListener("canplay", function () { if (video.paused) tryPlay(false); }, { once: true });
      window.setTimeout(function () { if (video.paused) tryPlay(true); }, 2500);
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (hero.classList.contains("no-video")) return;
          if (entry.isIntersecting) tryPlay(false);
          else video.pause();
        });
      }, { threshold: 0.05 }).observe(hero);
    }
    if (videoToggle) {
      videoToggle.addEventListener("click", function () {
        wantsPlay = !wantsPlay;
        videoToggle.setAttribute("aria-pressed", String(!wantsPlay));
        videoToggle.querySelector(".label").textContent = wantsPlay ? "Pause" : "Play";
        if (wantsPlay) tryPlay(false); else video.pause();
      });
    }
  }

  /* ---- Marquee pause (WCAG 2.2.2) ---- */
  var marquee = document.querySelector(".marquee");
  var marqueePause = document.querySelector(".marquee-pause");
  if (marquee && marqueePause) {
    marqueePause.addEventListener("click", function () {
      var paused = marquee.classList.toggle("is-paused");
      marqueePause.setAttribute("aria-pressed", String(paused));
      marqueePause.textContent = paused ? "Play" : "Pause";
    });
  }

  /* ---- The brief: a mailto built from the four answers. Nothing leaves
     this page until the visitor presses send in their own mail app. ---- */
  var sendButton = document.querySelector("#send-brief");
  var status = document.querySelector("#intake-status");
  if (sendButton && status) {
    var read = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; };
    sendButton.addEventListener("click", function () {
      var business = read("business"), visitor = read("visitor"), action = read("action"), linksText = read("links"), reply = read("reply");
      if (!business && !visitor && !action) {
        status.textContent = "Answer at least the first three questions first.";
        var first = document.getElementById("business");
        if (first) first.focus();
        return;
      }
      var lines = [
        "Site brief for actuallycoded", "",
        "THE BUSINESS", business || "(not answered)", "",
        "WHO THE PAGE IS FOR", visitor || "(not answered)", "",
        "THE ONE THING IT MUST MAKE THEM DO", action || "(not answered)", "",
        "LINKS TO ANYTHING THAT EXISTS", linksText || "(none yet)", "",
        "REPLY TO", reply || "(the address this email comes from)", "",
        "Founding price: $495, paid on Stripe. Delivery in 48 hours from a paid brief."
      ];
      window.location.href = "mailto:caleb@actuallycoded.com?subject=" +
        encodeURIComponent("Site brief" + (business ? ": " + business.slice(0, 60) : "")) +
        "&body=" + encodeURIComponent(lines.join("\n"));
      status.textContent = "Your mail app should be open with the brief in it. Press send there, then pay with the button beside it.";
    });
  }

  var year = document.querySelector("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ============================================================
     Motion. Only when the libraries loaded and nobody asked for less.
     ============================================================ */
  if (reduced || !window.gsap || !window.ScrollTrigger || !window.SplitText) {
    root.classList.remove("motion");
    return;
  }
  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var SplitText = window.SplitText;
  gsap.registerPlugin(ScrollTrigger, SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* Smooth wheel scrolling on mouse devices only. Touch stays native. */
  if (finePointer && typeof window.Lenis === "function") {
    var lenis = new window.Lenis({ autoRaf: false, lerp: 0.1, anchors: { offset: -80 } });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    window.addEventListener("beforeprint", function () { lenis.stop(); });
    window.addEventListener("afterprint", function () { lenis.start(); });
  }

  var EASE = "power4.out";

  /* The fire settles in over nine seconds and drifts at a third of the scroll. */
  var media = document.querySelector(".hero-media");
  if (media) {
    gsap.fromTo(media, { scale: 1.08 }, { scale: 1, duration: 9, ease: "power2.out" });
    gsap.to(media, {
      yPercent: 16, ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true }
    });
  }

  /* Headings rise line by line from behind a clip, once, when they arrive. */
  var splitHeading = function (el, delay) {
    SplitText.create(el, {
      type: "lines", mask: "lines", autoSplit: true, aria: "auto",
      onSplit: function (self) {
        gsap.set(el, { autoAlpha: 1 });
        return gsap.from(self.lines, {
          yPercent: 112, duration: 0.9, ease: EASE, stagger: 0.08, delay: delay || 0,
          scrollTrigger: el.closest(".hero") ? null : { trigger: el, start: "top 88%", once: true }
        });
      }
    });
  };

  var rise = function (targets, vars) {
    gsap.fromTo(targets, { autoAlpha: 0, y: 22 }, Object.assign({ autoAlpha: 1, y: 0, duration: 0.7, ease: EASE, stagger: 0.07 }, vars || {}));
  };

  document.fonts.ready.then(function () {
    /* Hero: the headline first, then the rest in one quick sequence. */
    var heroTitle = document.querySelector(".hero [data-lines]");
    if (heroTitle) splitHeading(heroTitle, 0.1);
    var heroRise = document.querySelectorAll(".hero [data-rise]");
    if (heroRise.length) rise(heroRise, { delay: 0.45 });

    /* Section headings. */
    document.querySelectorAll("[data-lines]:not(.hero [data-lines])").forEach(function (el) { splitHeading(el, 0); });

    /* Blocks that rise once as they enter. */
    document.querySelectorAll("[data-rise-group]").forEach(function (group) {
      var items = group.querySelectorAll("[data-rise]");
      if (!items.length) return;
      rise(items, { scrollTrigger: { trigger: group, start: "top 85%", once: true } });
    });
    document.querySelectorAll("[data-rise]:not(.hero [data-rise]):not([data-rise-group] [data-rise])").forEach(function (el) {
      rise(el, { scrollTrigger: { trigger: el, start: "top 88%", once: true } });
    });

    /* The work: each photo settles from a slight zoom as it enters. */
    ScrollTrigger.batch(".tile img", {
      start: "top 90%", once: true,
      onEnter: function (batch) {
        gsap.fromTo(batch, { opacity: 0, scale: 1.14 }, { opacity: 1, scale: 1.02, duration: 1.1, ease: EASE, stagger: 0.1, clearProps: "transform" });
      }
    });

    ScrollTrigger.refresh();
    root.classList.add("motion-ready");
  });

  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
