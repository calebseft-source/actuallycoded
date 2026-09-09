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
      var stuck = document.querySelectorAll("[data-reveal]:not(.is-revealed)");
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
   THE LIVING BACKGROUND. This site's own code, written behind each
   section one character at a time. Decoration only: the layers are
   aria-hidden and sit behind everything. A layer types only while its
   section is on screen, holds when finished, then writes the next
   fragment. Under reduced motion every layer shows its first fragment
   finished and still. Nothing here fetches anything.
   ============================================================ */
(function () {
  "use strict";
  var layers = document.querySelectorAll(".code-layer[data-code]");
  if (!layers.length) return;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var CODE = {
    html: [
      [
        "<!doctype html>",
        "<html lang=\"en\">",
        "<head>",
        "  <meta charset=\"utf-8\">",
        "  <title>actuallycoded</title>",
        "  <link rel=\"stylesheet\" href=\"styles.css\">",
        "</head>",
        "<body>",
        "  <main id=\"main\">",
        "    <section class=\"hero\" id=\"top\">",
        "      <h1>One page. Real code you own.</h1>",
        "      <a class=\"button button-accent\" href=\"#start\">Start your site</a>",
        "    </section>"
      ],
      [
        "<aside class=\"offer\" aria-label=\"The offer\">",
        "  <span class=\"display-num\">$495</span>",
        "  <small>Founding price</small>",
        "  <ul class=\"offer-list\">",
        "    <li>One custom page, designed and coded</li>",
        "    <li>Delivered in 48 hours from a paid brief</li>",
        "    <li>You own the code</li>",
        "  </ul>",
        "</aside>"
      ]
    ],
    css: [
      [
        ":root {",
        "  --bg: #0b0a08;",
        "  --text: #f1ebe0;",
        "  --accent: #f5891c;",
        "  --display: \"Big Shoulders\";",
        "  --font: \"Newsreader\";",
        "}",
        "",
        ".button {",
        "  border-radius: 0;",
        "  background: var(--accent);",
        "  font-family: var(--display);",
        "  letter-spacing: 0.07em;",
        "  text-transform: uppercase;",
        "}",
        "",
        "h1 { font-size: clamp(3rem, 7vw, 5.6rem); line-height: 0.95; }"
      ],
      [
        "/* the tells, kept out on purpose */",
        "* { border-radius: 0; }",
        "em, i { font-style: normal; }",
        ".card { box-shadow: none; }",
        "",
        "@font-face {",
        "  font-family: \"Newsreader\";",
        "  src: url(fonts/newsreader-latin.woff2) format(\"woff2\");",
        "  font-display: swap;",
        "}"
      ]
    ],
    js: [
      [
        "const targets = document.querySelectorAll(\"[data-reveal]\");",
        "",
        "const revealer = new IntersectionObserver((entries) => {",
        "  for (const entry of entries) {",
        "    if (!entry.isIntersecting) continue;",
        "    entry.target.classList.add(\"is-revealed\");",
        "    revealer.unobserve(entry.target);",
        "  }",
        "}, { rootMargin: \"0px 0px -12% 0px\", threshold: 0.08 });",
        "",
        "targets.forEach((el) => revealer.observe(el));"
      ],
      [
        "// the receipt, measured on the live page",
        "const all = [...document.querySelectorAll(\"*\")];",
        "const rounded = all.filter((el) =>",
        "  getComputedStyle(el).borderRadius !== \"0px\").length;",
        "const gradients = all.filter((el) =>",
        "  getComputedStyle(el).backgroundImage.includes(\"gradient\")).length;",
        "console.log({ rounded, gradients }); // { rounded: 0, gradients: 0 }"
      ]
    ],
    shell: [
      [
        "$ git add docs/",
        "$ git commit -m \"Finished: one page, measured against the standard\"",
        "$ git push origin master",
        "$ curl -sI https://actuallycoded.com | head -1",
        "HTTP/2 200",
        "$ grep -c \"border-radius\" docs/styles.css",
        "0",
        "$ grep -c \"gradient(\" docs/styles.css",
        "0"
      ],
      [
        "$ python -m http.server 8642 --directory docs",
        "Serving HTTP on :: port 8642 ...",
        "$ ls docs/fonts",
        "bigshoulders-latin.woff2  newsreader-latin.woff2",
        "$ du -sh docs/vendor/lenis.min.js",
        "13K  docs/vendor/lenis.min.js"
      ]
    ]
  };

  var escapeHtml = function (str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };

  // Two tones only: keywords in the accent, strings a shade brighter.
  var paint = function (line, lang) {
    // Strings first, then keywords, so the painter never matches the
    // quotes inside its own markup.
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
           .replace(/(--[a-z-]+|@font-face|font-family|border-radius|background|letter-spacing|text-transform|line-height|font-size|font-style|font-display|box-shadow|src)\b/g, "<span class=\"kw\">$1</span>");
    } else if (lang === "js") {
      h = h.replace(/(\/\/.*)$/g, "<span class=\"cm\">$1</span>")
           .replace(/\b(const|new|for|of|if|continue|return)\b/g, "<span class=\"kw\">$1</span>");
    } else {
      h = h.replace(/^\$ (\S+)/, "$ <span class=\"kw\">$1</span>");
    }
    h = h.replace(/\u0001(\d+)\u0001/g, function (_, i) { return strings[Number(i)]; });
    return h;
  };

  var lineHtml = function (n, line, lang, now, caret) {
    return "<span class=\"ln\">" + String(n).padStart(2, " ") + "</span>" +
      "<span class=\"" + (now ? "now" : "old") + "\">" + paint(line, lang) + "</span>" +
      (caret ? "<span class=\"caret\"></span>" : "") + "\n";
  };

  var renderStatic = function (pre, lines, lang) {
    var out = "";
    for (var i = 0; i < lines.length; i++) out += lineHtml(i + 1, lines[i], lang, false, false);
    pre.innerHTML = out;
  };

  layers.forEach(function (layer, index) {
    var lang = layer.getAttribute("data-code");
    var fragments = CODE[lang];
    var pre = layer.querySelector("pre");
    if (!fragments || !pre) return;

    if (reduced) { renderStatic(pre, fragments[0], lang); return; }

    var frag = 0, line = 0, col = 0, done = [], timer = null, visible = false;
    var started = false;

    var draw = function () {
      var out = "";
      for (var i = 0; i < done.length; i++) out += lineHtml(i + 1, done[i], lang, false, false);
      var current = fragments[frag][line] || "";
      out += lineHtml(done.length + 1, current.slice(0, col), lang, true, true);
      pre.innerHTML = out;
    };

    var step = function () {
      if (!visible) { timer = null; return; }
      var lines = fragments[frag];
      var current = lines[line];
      var delay;
      if (col < current.length) {
        col += 1;
        var ch = current.charAt(col - 1);
        delay = 22 + Math.random() * 34;
        if (ch === " ") delay += 30;
        if (ch === ";" || ch === "{" || ch === "}" || ch === ">") delay += 90;
      } else {
        done.push(current);
        line += 1; col = 0;
        delay = current.length ? 260 + Math.random() * 320 : 120;
        if (line >= lines.length) {
          // Finished this fragment. Hold it, then clear and write the next one.
          draw();
          timer = window.setTimeout(function () {
            frag = (frag + 1) % fragments.length;
            done = []; line = 0; col = 0;
            draw();
            timer = window.setTimeout(step, 600);
          }, 5200);
          return;
        }
      }
      draw();
      timer = window.setTimeout(step, delay);
    };

    // No IntersectionObserver here: it can stall in non compositing
    // contexts. A bounding rect check is cheap and always answers.
    var inView = function () {
      var r = layer.getBoundingClientRect();
      var vh = window.innerHeight || 0;
      return !vh || (r.bottom > -240 && r.top < vh + 240);
    };

    var start = function () {
      if (timer) return;
      if (!inView()) return;
      visible = true;
      if (!started) { started = true; draw(); }
      timer = window.setTimeout(step, 400 + index * 300);
    };

    var tick = false;
    window.addEventListener("scroll", function () {
      if (tick) return;
      tick = true;
      window.setTimeout(function () {
        tick = false;
        visible = inView();
        if (visible) start();
      }, 150);
    }, { passive: true });
    window.addEventListener("resize", function () { visible = inView(); if (visible) start(); }, { passive: true });
    start();
    window.setTimeout(start, 800);
  });
})();
