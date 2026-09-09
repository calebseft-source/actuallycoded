/* ============================================================
   actuallycoded.com

   Everything here is a progressive enhancement. With JavaScript
   off, or motion reduced, the page is complete, readable, and the
   brief can still be sent by plain email. Nothing on this page
   transmits anything by itself: the brief travels through the
   visitor's own mail app and payment happens on Stripe's page.
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

  /* ---- Reveal on scroll ----
     The hidden state is applied only from here, so a visitor without
     JavaScript sees the whole page. Nothing below depends on
     requestAnimationFrame, which is paused in background tabs. */
  // Build sections reveal their own content in step with their code.
  var targets = Array.prototype.filter.call(document.querySelectorAll("[data-reveal]"), function (el) {
    return !el.closest("[data-build-section]");
  });
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
      var group = el.closest("[data-reveal-group]");
      if (group) {
        var peers = Array.prototype.slice.call(group.querySelectorAll("[data-reveal]"));
        var i = peers.indexOf(el);
        if (i > 0) el.style.setProperty("--reveal-delay", Math.min(i, 6) * 70 + "ms");
      }
      revealer.observe(el);
    });

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

    revealInView();
    window.addEventListener("load", revealInView);
    window.setTimeout(revealInView, 250);
    if (window.location.hash) window.setTimeout(revealInView, 700);

    var revealTick = false;
    window.addEventListener("scroll", function () {
      if (revealTick) return;
      revealTick = true;
      window.setTimeout(function () {
        revealInView();
        revealTick = false;
      }, 100);
    }, { passive: true });

    // Last resort: never leave a visitor looking at blank sections.
    window.setTimeout(function () {
      var stuck = Array.prototype.filter.call(document.querySelectorAll("[data-reveal]:not(.is-revealed)"), function (el) {
        return !el.closest("[data-build-section]");
      });
      if (!stuck.length) return;
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

  /* ---- Highlight the section being read ---- */
  var links = document.querySelectorAll("#site-nav a[href^='#']:not(.nav-cta)");
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

  /* ---- The brief ----
     Builds a mailto: from the four answers and opens it in the
     visitor's own mail app. Nothing leaves this page until they
     press send there. Field values are never stored. */
  var sendButton = document.querySelector("#send-brief");
  var status = document.querySelector("#intake-status");

  if (sendButton && status) {
    var read = function (id) {
      var el = document.getElementById(id);
      return el ? el.value.trim() : "";
    };

    sendButton.addEventListener("click", function () {
      var business = read("business");
      var visitor = read("visitor");
      var action = read("action");
      var linksText = read("links");
      var reply = read("reply");

      if (!business && !visitor && !action) {
        status.textContent = "Answer at least the first three questions first.";
        var first = document.getElementById("business");
        if (first) first.focus();
        return;
      }

      var lines = [
        "Site brief for actuallycoded",
        "",
        "THE BUSINESS",
        business || "(not answered)",
        "",
        "WHO THE PAGE IS FOR",
        visitor || "(not answered)",
        "",
        "THE ONE THING IT MUST MAKE THEM DO",
        action || "(not answered)",
        "",
        "LINKS TO ANYTHING THAT EXISTS",
        linksText || "(none yet)",
        "",
        "REPLY TO",
        reply || "(the address this email comes from)",
        "",
        "Founding price: $495, paid on Stripe. Delivery in 48 hours from a paid brief."
      ];

      var href = "mailto:hello@actuallycoded.com" +
        "?subject=" + encodeURIComponent("Site brief" + (business ? ": " + business.slice(0, 60) : "")) +
        "&body=" + encodeURIComponent(lines.join("\n"));

      window.location.href = href;
      status.textContent = "Your mail app should be open with the brief in it. Press send there, then pay below.";
    });
  }

  /* ---- The comparison switcher: one choice moves both windows ---- */
  var pick = document.querySelector(".compare-switch[data-pair]");
  var slopFrame = document.getElementById("compare-slop");
  var cleanFrame = document.getElementById("compare-clean");
  if (pick && slopFrame && cleanFrame) {
    var pickButtons = pick.querySelectorAll("button");
    Array.prototype.forEach.call(pickButtons, function (btn) {
      btn.addEventListener("click", function () {
        if (btn.classList.contains("is-active")) return;
        Array.prototype.forEach.call(pickButtons, function (b) {
          b.classList.remove("is-active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("is-active");
        btn.setAttribute("aria-pressed", "true");
        slopFrame.setAttribute("title", btn.getAttribute("data-slop-title"));
        slopFrame.src = btn.getAttribute("data-slop");
        cleanFrame.setAttribute("title", btn.getAttribute("data-clean-title"));
        cleanFrame.src = btn.getAttribute("data-clean");
      });
    });
  }

  var year = document.querySelector("#year");
  if (year) year.textContent = new Date().getFullYear();
})();

/* ============================================================
   Lenis smooth scroll (vendored, MIT, v1.1.18). Self-hosted so the
   CSP's script-src 'self' holds and the privacy policy stays true.
   Touch is left native.
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

  // Must not contain the substring "lenis": Lenis strips /lenis(-\w+)?/
  // from the root element on every class update.
  document.documentElement.classList.add("smooth-active");

  function raf(time) {
    lenis.raf(time);
    window.requestAnimationFrame(raf);
  }
  window.requestAnimationFrame(raf);

  var NAV_OFFSET = -84;
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

/* ============================================================
   THE BUILD. The code builds the page in front of you. The pane types
   the hero's own markup and each element appears the moment its line
   is finished; then the pane keeps writing the site's CSS and the
   receipt script, slowly, as the standing object on the page. Every
   section below types its opening tag as it reveals.

   Enhancement only. Without JavaScript nothing is hidden. Under
   reduced motion, or if the tab is hidden, the page is finished at
   once and the pane shows finished code. A failsafe finishes the build
   twelve seconds in no matter what.
   ============================================================ */
(function () {
  "use strict";
  var pane = document.querySelector(".build-pane pre");
  var root = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var escapeHtml = function (str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };
  var paint = function (line, lang) {
    var h = escapeHtml(line);
    var strings = [];
    h = h.replace(/"([^"]*)"/g, function (_, inner) {
      strings.push("<span class=\"st\">\"" + inner + "\"</span>");
      return "\u0001" + (strings.length - 1) + "\u0001";
    });
    if (lang === "html") {
      h = h.replace(/(&lt;\/?)([a-z][a-z0-9-]*)/g, "$1<span class=\"kw\">$2</span>");
    } else if (lang === "css") {
      h = h.replace(/(\/\*.*?\*\/)/g, "<span class=\"cm\">$1</span>")
           .replace(/(--[a-z-]+|@font-face|font-family|border-radius|background-color|background|letter-spacing|text-transform|line-height|font-size|font-style|font-display|box-shadow|src)\b/g, "<span class=\"kw\">$1</span>");
    } else if (lang === "js") {
      h = h.replace(/(\/\/.*)$/g, "<span class=\"cm\">$1</span>")
           .replace(/\b(const|new|for|of|if|continue|return|function|window)\b/g, "<span class=\"kw\">$1</span>");
    }
    h = h.replace(/\u0001(\d+)\u0001/g, function (_, i) { return strings[Number(i)]; });
    return h;
  };
  var lineHtml = function (n, line, lang, now, caret) {
    return "<span class=\"ln\">" + String(n).padStart(2, " ") + "</span>" +
      "<span class=\"" + (now ? "now" : "old") + "\">" + paint(line, lang) + "</span>" +
      (caret ? "<span class=\"caret\"></span>" : "") + "\n";
  };

  // The hero, as the pane writes it. b names the element that appears
  // when the line is finished.
  var BUILD = [
    { t: "<section class=\"hero\" id=\"top\">" },
    { t: "  <div class=\"shell hero-grid\">" },
    { t: "    <p class=\"eyebrow\">Custom one-page websites</p>", b: "eyebrow" },
    { t: "    <h1>One page. Real code you own. Finished in 48 hours.</h1>", b: "h1" },
    { t: "    <p class=\"hero-lede\">A website for your business that was written, not generated.</p>", b: "lede" },
    { t: "    <a class=\"button button-accent\" href=\"#start\">Start your site</a>", b: "cta" },
    { t: "    <a class=\"text-link\" href=\"#standard\">Read the standard</a>", b: "link" },
    { t: "    <p class=\"tagline\">Actually coded, finished by hand.</p>", b: "tagline" },
    { t: "" },
    { t: "    <aside class=\"offer\" aria-label=\"The offer\">", b: "offer" },
    { t: "      <span>The one product</span>", b: "offer-head" },
    { t: "      <span class=\"display-num\">$495</span> <small>Founding price</small>", b: "price" },
    { t: "      <p>For the first ten sites. Then <b>$850</b>.</p>", b: "then" },
    { t: "      <ul class=\"offer-list\">" },
    { t: "        <li>One custom page, designed and coded for your business</li>", b: "li1" },
    { t: "        <li>Delivered in 48 hours from a paid brief</li>", b: "li2" },
    { t: "        <li>One round of changes included</li>", b: "li3" },
    { t: "        <li>You own the code. Host it anywhere, keep it forever</li>", b: "li4" },
    { t: "        <li>Built to the published standard, and measured against it</li>", b: "li5" },
    { t: "      </ul>" },
    { t: "      <a class=\"button button-accent\" href=\"#start\">Start your site</a>", b: "offer-cta" },
    { t: "      <p class=\"offer-founding\"><b>10 of 10</b> founding places remaining</p>", b: "founding" },
    { t: "    </aside>" },
    { t: "  </div>" },
    { t: "</section>" }
  ];

  // What the pane keeps writing afterwards, slowly, forever.
  var AFTER = [
    { lang: "css", lines: [
      "/* styles.css */",
      ":root {",
      "  --bg: #0b0a08;",
      "  --text: #f1ebe0;",
      "  --accent: #f5891c;",
      "  --display: \"Big Shoulders\";",
      "  --font: \"Newsreader\";",
      "}",
      ".button { border-radius: 0; background: var(--accent); }",
      "* { border-radius: 0; }",
      "em, i { font-style: normal; }",
      "@font-face { font-family: \"Newsreader\"; src: url(fonts/newsreader-latin.woff2); }"
    ] },
    { lang: "js", lines: [
      "// the receipt, measured on the live page",
      "const all = [...document.querySelectorAll(\"*\")];",
      "const rounded = all.filter((el) =>",
      "  getComputedStyle(el).borderRadius !== \"0px\").length;",
      "const gradients = all.filter((el) =>",
      "  getComputedStyle(el).backgroundImage.includes(\"gradient\")).length;",
      "console.log({ rounded, gradients }); // { rounded: 0, gradients: 0 }"
    ] }
  ];

  var TAIL = 9;
  var built = function (key) {
    var el = document.querySelector("[data-build=\"" + key + "\"]");
    if (el) el.classList.add("is-built");
  };
  var finishAll = function () {
    var all = document.querySelectorAll("[data-build]");
    Array.prototype.forEach.call(all, function (el) { el.classList.add("is-built"); });
    window.setTimeout(function () { root.classList.remove("is-building"); }, 500);
  };

  // The pane shows the last few lines: a window onto a growing file.
  var makeWriter = function () {
    var done = [], base = 1;
    var render = function (lang, current, caret) {
      var out = "";
      for (var i = 0; i < done.length; i++) out += lineHtml(base + i, done[i], lang, false, false);
      out += lineHtml(base + done.length, current, lang, true, caret);
      pane.innerHTML = out;
    };
    var push = function (line) {
      done.push(line);
      while (done.length > TAIL - 1) { done.shift(); base += 1; }
    };
    return { render: render, push: push };
  };

  if (!pane) return;
  var writer = makeWriter();

  var renderFinished = function () {
    BUILD.forEach(function (l) { writer.push(l.t); });
    writer.render("html", "", true);
  };

  if (reduced || document.hidden) {
    renderFinished();
    return;
  }

  root.classList.add("is-building");
  var failsafe = window.setTimeout(finishAll, 12000);
  var finished = false;
  var finishNow = function () {
    if (finished) return;
    finished = true;
    window.clearTimeout(failsafe);
    finishAll();
  };
  document.addEventListener("visibilitychange", function () { if (document.hidden) finishNow(); });

  // Speed is a rate, not a timer: about 300 characters a second, so it
  // reads the same on every machine whatever the timer granularity.
  var MS_PER_CHAR = 3.4;
  var idx = 0, col = 0, last = 0;
  var typeBuild = function () {
    if (finished) return;
    var line = BUILD[idx];
    var now = Date.now();
    if (!last) last = now;
    if (col < line.t.length) {
      var n = Math.floor((now - last) / MS_PER_CHAR);
      if (n > 0) { col = Math.min(line.t.length, col + n); last += n * MS_PER_CHAR; }
      writer.render("html", line.t.slice(0, col), true);
      window.setTimeout(typeBuild, 16);
      return;
    }
    writer.push(line.t);
    if (line.b) built(line.b);
    idx += 1; col = 0; last = 0;
    if (idx >= BUILD.length) {
      writer.render("html", "", true);
      finishNow();
      window.setTimeout(typeAfter, 2600);
      return;
    }
    writer.render("html", "", true);
    window.setTimeout(typeBuild, line.t.length ? 40 + Math.random() * 40 : 30);
  };

  // Afterwards: the standing object, writing slowly.
  var frag = 0, aline = 0, acol = 0;
  var typeAfter = function () {
    var f = AFTER[frag];
    var line = f.lines[aline];
    if (acol < line.length) {
      acol += 1;
      writer.render(f.lang, line.slice(0, acol), true);
      window.setTimeout(typeAfter, 24 + Math.random() * 40);
      return;
    }
    writer.push(line);
    aline += 1; acol = 0;
    if (aline >= f.lines.length) {
      writer.push("");
      frag = (frag + 1) % AFTER.length; aline = 0;
      writer.render(AFTER[frag].lang, "", true);
      window.setTimeout(typeAfter, 3200);
      return;
    }
    writer.render(f.lang, "", true);
    window.setTimeout(typeAfter, 260 + Math.random() * 300);
  };

  writer.render("html", "", true);
  window.setTimeout(typeBuild, 500);
})();

/* ============================================================
   SECTION BUILDS. Each section below the hero is written in code as
   it scrolls into view: the section's own markup types across the
   empty section, the content pops up over it line by line, then the
   code fades and is removed. Fast, about two seconds, because people
   scroll. Interruptible: scroll past it and it finishes at once; land
   on it from a link and it is already built; a hidden tab finishes
   everything. Without JavaScript or under reduced motion nothing is
   hidden in the first place.
   ============================================================ */
(function () {
  "use strict";
  var sections = document.querySelectorAll("[data-build-section]");
  if (!sections.length) return;
  var root = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var FRAG = {
    standard: [
      "<section id=\"standard\">",
      "  <h2>Six things a generated site does. Six things yours will not.</h2>",
      "  <ol class=\"tells\">",
      "    <li>Rounded everything</li>",
      "    <li>Gradients as decoration</li>",
      "    <li>Whatever font the computer had, plus one cursive word</li>",
      "    <li>The section march</li>",
      "    <li>Card soup</li>",
      "    <li>Copy that describes a process</li>",
      "  </ol>",
      "  <div class=\"compare\"><iframe src=\"exhibit/dental.html\"></iframe><iframe src=\"concepts/northline-dental.html\"></iframe></div>",
      "  <div class=\"receipt\">rounded 0, gradients 0, third party 0, cookies 0</div>",
      "</section>"
    ],
    proof: [
      "<section id=\"proof\">",
      "  <h2>Four pages, built to the list above.</h2>",
      "  <div class=\"proof-grid\">",
      "    <article><a href=\"concepts/northline-dental.html\">Northline Dental</a></article>",
      "    <article><a href=\"concepts/fieldnote-coffee.html\">Fieldnote Coffee</a></article>",
      "    <article><a href=\"concepts/kestrel-electric.html\">Kestrel Electric</a></article>",
      "    <article><a href=\"concepts/hollis-barbershop.html\">Hollis Barbershop</a></article>",
      "  </div>",
      "</section>"
    ],
    start: [
      "<section id=\"start\">",
      "  <h2>Answer four questions. Pay once. Wait 48 hours.</h2>",
      "  <ol class=\"next-steps\">",
      "    <li>Send the brief</li>",
      "    <li>Pay the founding price</li>",
      "    <li>48 hours later, a link</li>",
      "    <li>One round of changes</li>",
      "  </ol>",
      "  <div class=\"intake\">",
      "    <label>The business, in a sentence or two</label>",
      "    <label>Who the page is for</label>",
      "    <label>The one thing it must make them do</label>",
      "    <label>Links to anything that already exists</label>",
      "    <button>Send the brief</button>",
      "  </div>",
      "</section>"
    ]
  };

  var escapeHtml = function (str) { return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
  var paint = function (line) {
    var h = escapeHtml(line);
    var strings = [];
    h = h.replace(/"([^"]*)"/g, function (_, inner) {
      strings.push("<span class=\"st\">\"" + inner + "\"</span>");
      return "\u0001" + (strings.length - 1) + "\u0001";
    });
    h = h.replace(/(&lt;\/?)([a-z][a-z0-9-]*)/g, "$1<span class=\"kw\">$2</span>");
    return h.replace(/\u0001(\d+)\u0001/g, function (_, i) { return strings[Number(i)]; });
  };
  var lineHtml = function (n, line, now, caret) {
    return "<span class=\"ln\">" + String(n).padStart(2, " ") + "</span>" +
      "<span class=\"" + (now ? "now" : "old") + "\">" + paint(line) + "</span>" +
      (caret ? "<span class=\"caret\"></span>" : "") + "\n";
  };

  var revealsOff = reduced || !root.classList.contains("has-reveal");

  var builders = [];
  Array.prototype.forEach.call(sections, function (sec) {
    var lines = FRAG[sec.getAttribute("data-build-section")] || [];
    var pre = sec.querySelector(".section-code");
    var reveals = Array.prototype.slice.call(sec.querySelectorAll("[data-reveal]"));
    var done = false, started = false, ri = 0;

    var revealNext = function (n) {
      for (var k = 0; k < n && ri < reveals.length; k++) reveals[ri++].classList.add("is-revealed");
    };
    var finish = function () {
      if (done) return;
      done = true;
      revealNext(reveals.length);
      sec.classList.add("is-built");
      if (pre) {
        pre.classList.add("is-fading");
        window.setTimeout(function () { if (pre.parentNode) pre.parentNode.removeChild(pre); }, 700);
      }
    };

    if (revealsOff || !pre || !lines.length) { finish(); return; }

    var per = Math.max(1, Math.ceil(reveals.length / Math.max(1, lines.length - 2)));
    var written = [], i = 0, col = 0;
    var render = function (current) {
      var out = "";
      for (var k = 0; k < written.length; k++) out += lineHtml(k + 1, written[k], false, false);
      out += lineHtml(written.length + 1, current, true, true);
      pre.innerHTML = out;
    };
    var rect = function () { return sec.getBoundingClientRect(); };
    var inView = function () { var r = rect(); var vh = window.innerHeight || 0; return !vh || (r.top < vh * 0.88 && r.bottom > 0); };
    var passed = function () { return rect().bottom < 0; };

    var MS_PER_CHAR = 2.6;
    var last = 0;
    var step = function () {
      if (done) return;
      if (passed()) { finish(); return; }
      var line = lines[i];
      var now = Date.now();
      if (!last) last = now;
      if (col < line.length) {
        var n = Math.floor((now - last) / MS_PER_CHAR);
        if (n > 0) { col = Math.min(line.length, col + n); last += n * MS_PER_CHAR; }
        render(line.slice(0, col));
        window.setTimeout(step, 16);
        return;
      }
      written.push(line);
      if (i > 0) revealNext(per);
      i += 1; col = 0; last = 0;
      if (i >= lines.length) { render(""); window.setTimeout(finish, 300); return; }
      render("");
      window.setTimeout(step, 30 + Math.random() * 40);
    };
    var start = function () {
      if (started || done) return;
      if (!inView()) return;
      started = true;
      render("");
      window.setTimeout(step, 120);
      window.setTimeout(finish, 6000);
    };
    builders.push({ start: start, finish: finish, inView: inView, sec: sec });
  });
  if (!builders.length) return;

  // A section already on screen at load is not held hostage: it is
  // simply built. The build is for sections you scroll to.
  builders.forEach(function (b) { if (document.hidden || b.inView() || ("#" + b.sec.id) === window.location.hash) b.finish(); });

  var startAll = function () { builders.forEach(function (b) { b.start(); }); };
  var tick = false;
  window.addEventListener("scroll", function () {
    if (tick) return;
    tick = true;
    window.setTimeout(function () { tick = false; startAll(); }, 80);
  }, { passive: true });
  window.addEventListener("resize", startAll, { passive: true });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) builders.forEach(function (b) { b.finish(); });
  });
  window.setTimeout(startAll, 300);
  // A cheap poll as well: a section that is on screen never waits on a
  // scroll event to notice. Stops itself once every section has started.
  var poll = window.setInterval(function () {
    startAll();
    var pending = builders.some(function (b) { return !b.sec.classList.contains("is-built"); });
    if (!pending) window.clearInterval(poll);
  }, 700);
})();
