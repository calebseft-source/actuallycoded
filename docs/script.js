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
   THE LIVING BACKGROUND. Each section writes its own code behind
   itself, one character at a time, in three or four columns across the
   full width. The fragments are this page's real markup, styles, and
   scripts for that section: the hero writes the hero, the standard
   writes the rules that make its receipt true, the proof writes the four
   concept cards and the engine that reveals them, the brief writes the
   JavaScript that builds the email. Decoration only: aria-hidden, no
   pointer events, behind everything, typing only while the section is
   near the viewport (a bounding rect check, not IntersectionObserver,
   which stalls in non compositing contexts). Under reduced motion each
   column shows one fragment finished and still.
   ============================================================ */
(function () {
  "use strict";
  var layers = document.querySelectorAll(".code-layer[data-code]");
  if (!layers.length) return;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var F = function (lang, lines) { return { lang: lang, lines: lines }; };

  var CODE = {
    // The hero writes the hero.
    html: [
      F("html", [
        "<section class=\"hero\" id=\"top\" aria-labelledby=\"hero-title\">",
        "  <div class=\"shell hero-grid\">",
        "    <p class=\"eyebrow\">Custom one-page websites</p>",
        "    <h1 id=\"hero-title\">One page. Real code you own. Finished in 48 hours.</h1>",
        "    <p class=\"hero-lede\">A website for your business that was written, not generated.</p>",
        "    <div class=\"hero-actions\">",
        "      <a class=\"button button-accent\" href=\"#start\">Start your site</a>",
        "      <a class=\"text-link\" href=\"#standard\">Read the standard</a>",
        "    </div>",
        "    <p class=\"tagline\"><b>Actually coded,</b> finished by hand.</p>"
      ]),
      F("html", [
        "<aside class=\"offer\" aria-label=\"The offer\">",
        "  <div class=\"offer-head\"><span>The one product</span></div>",
        "  <div class=\"offer-price\">",
        "    <span class=\"display-num\">$495</span>",
        "    <small>Founding price</small>",
        "  </div>",
        "  <p class=\"offer-then\">For the first ten sites. Then <b>$850</b>.</p>",
        "  <ul class=\"offer-list\">",
        "    <li>One custom page, designed and coded for your business</li>",
        "    <li>Delivered in 48 hours from a paid brief</li>",
        "    <li>One round of changes included</li>",
        "    <li>You own the code. Host it anywhere, keep it forever</li>",
        "  </ul>",
        "  <p class=\"offer-founding\"><b>10 of 10</b> founding places remaining</p>",
        "</aside>"
      ]),
      F("css", [
        ".hero h1 { max-width: 12ch; }",
        "h1 {",
        "  font-family: var(--display);",
        "  font-size: clamp(3rem, 7vw, 5.6rem);",
        "  line-height: 0.95;",
        "  letter-spacing: -0.005em;",
        "}",
        ".offer {",
        "  border: 1px solid var(--line-bright);",
        "  background: var(--surface);",
        "  border-radius: 0;",
        "}",
        ".display-num { font-family: var(--display); font-weight: 600; line-height: 0.9; }"
      ]),
      F("html", [
        "<header class=\"site-header\">",
        "  <a class=\"brand\" href=\"#top\" aria-label=\"actuallycoded home\">",
        "    <svg class=\"brand-mark\" viewBox=\"0 0 100 100\"></svg>",
        "    <span class=\"brand-word\">actuallycoded</span>",
        "  </a>",
        "  <nav id=\"site-nav\" class=\"site-nav\">",
        "    <a href=\"#standard\">The standard</a>",
        "    <a href=\"#proof\">Proof</a>",
        "    <a href=\"#start\">How it works</a>",
        "    <a class=\"nav-cta\" href=\"#start\">Start your site</a>",
        "  </nav>",
        "</header>"
      ])
    ],
    // The standard writes the rules that make its own receipt true.
    css: [
      F("css", [
        ":root {",
        "  --bg: #0b0a08;",
        "  --surface: #12100c;",
        "  --line: #2b2720;",
        "  --text: #f1ebe0;",
        "  --accent: #f5891c;",
        "  --display: \"Big Shoulders\", \"Arial Narrow\", Impact, sans-serif;",
        "  --font: \"Newsreader\", Georgia, serif;",
        "}",
        ".button {",
        "  border-radius: 0;",
        "  background-color: var(--accent);",
        "  font-family: var(--display);",
        "  letter-spacing: 0.07em;",
        "  text-transform: uppercase;",
        "}"
      ]),
      F("css", [
        "/* the six tells, kept out on purpose */",
        "* { border-radius: 0; }",
        "em, i { font-style: normal; }",
        ".card { box-shadow: none; }",
        "body { font-family: var(--font); }",
        "",
        "@font-face {",
        "  font-family: \"Newsreader\";",
        "  src: url(fonts/newsreader-latin.woff2) format(\"woff2\");",
        "  font-display: swap;",
        "}",
        "@font-face {",
        "  font-family: \"Big Shoulders\";",
        "  src: url(fonts/bigshoulders-latin.woff2) format(\"woff2\");",
        "}"
      ]),
      F("js", [
        "// the receipt, measured on the live page",
        "const all = [...document.querySelectorAll(\"*\")];",
        "const rounded = all.filter((el) =>",
        "  getComputedStyle(el).borderRadius !== \"0px\").length;",
        "const gradients = all.filter((el) =>",
        "  getComputedStyle(el).backgroundImage.includes(\"gradient\")).length;",
        "const italics = all.filter((el) =>",
        "  getComputedStyle(el).fontStyle === \"italic\").length;",
        "console.log({ rounded, gradients, italics }); // { 0, 0, 0 }"
      ]),
      F("css", [
        ".tells li {",
        "  display: grid;",
        "  grid-template-columns: 3.6rem minmax(0, 1fr) minmax(0, 1fr);",
        "  gap: 1.6rem;",
        "  padding: 2rem 0;",
        "  border-top: 1px solid var(--line);",
        "}",
        ".tell-index { font-family: var(--display); color: var(--accent); }",
        ".specimen { height: 170px; border: 1px solid var(--line-bright); }",
        ".compare-frame { height: 640px; }",
        ".compare-frame iframe { width: 100%; height: 100%; border: 0; }"
      ])
    ],
    // The proof writes the four cards and the engine that reveals them.
    js: [
      F("html", [
        "<div class=\"proof-grid\">",
        "  <article class=\"proof-card\">",
        "    <a class=\"proof-media\" href=\"concepts/northline-dental.html\">",
        "      <img src=\"assets/concepts/northline-dental/hero.jpg\" alt=\"\">",
        "      <span>Fictional business</span>",
        "    </a>",
        "    <h3>Northline Dental</h3>",
        "  </article>",
        "  <article class=\"proof-card\"><h3>Fieldnote Coffee</h3></article>",
        "  <article class=\"proof-card\"><h3>Kestrel Electric</h3></article>",
        "  <article class=\"proof-card\"><h3>Hollis Barbershop</h3></article>",
        "</div>"
      ]),
      F("js", [
        "const targets = document.querySelectorAll(\"[data-reveal]\");",
        "const revealer = new IntersectionObserver((entries) => {",
        "  for (const entry of entries) {",
        "    if (!entry.isIntersecting) continue;",
        "    entry.target.classList.add(\"is-revealed\");",
        "    revealer.unobserve(entry.target);",
        "  }",
        "}, { rootMargin: \"0px 0px -12% 0px\", threshold: 0.08 });",
        "targets.forEach((el) => revealer.observe(el));"
      ]),
      F("js", [
        "// concept-motion.js, vendored Lenis, touch left native",
        "const lenis = new window.Lenis({",
        "  duration: 0.9,",
        "  smoothWheel: true,",
        "  syncTouch: false,",
        "  wheelMultiplier: 1",
        "});",
        "function raf(time) {",
        "  lenis.raf(time);",
        "  window.requestAnimationFrame(raf);",
        "}",
        "window.requestAnimationFrame(raf);"
      ]),
      F("css", [
        ".proof-grid { display: grid; grid-template-columns: 1fr 1fr; }",
        ".proof-card { border-right: 1px solid var(--line-bright); border-bottom: 1px solid var(--line-bright); }",
        ".proof-media img { aspect-ratio: 3 / 2; object-fit: cover; }",
        ".proof-media span {",
        "  position: absolute;",
        "  left: 1rem; bottom: 1rem;",
        "  font-family: var(--display);",
        "  letter-spacing: 0.14em;",
        "  text-transform: uppercase;",
        "  background: var(--bg-deep);",
        "}"
      ])
    ],
    // The brief writes the JavaScript that builds the email, and the ship.
    shell: [
      F("js", [
        "const lines = [",
        "  \"Site brief for actuallycoded\",",
        "  \"\",",
        "  \"THE BUSINESS\", business || \"(not answered)\",",
        "  \"\",",
        "  \"WHO THE PAGE IS FOR\", visitor || \"(not answered)\",",
        "  \"\",",
        "  \"THE ONE THING IT MUST MAKE THEM DO\", action || \"(not answered)\",",
        "  \"\",",
        "  \"LINKS TO ANYTHING THAT EXISTS\", links || \"(none yet)\"",
        "];",
        "window.location.href = \"mailto:hello@actuallycoded.com\"",
        "  + \"?subject=\" + encodeURIComponent(\"Site brief\")",
        "  + \"&body=\" + encodeURIComponent(lines.join(\"\\n\"));"
      ]),
      F("shell", [
        "$ git add docs/",
        "$ git commit -m \"Finished: one page, measured against the standard\"",
        "$ git push origin master",
        "$ curl -sI https://actuallycoded.com | head -1",
        "HTTP/2 200",
        "$ grep -c \"border-radius\" docs/styles.css",
        "0",
        "$ grep -c \"gradient(\" docs/styles.css",
        "0"
      ]),
      F("html", [
        "<div class=\"intake\" id=\"intake\" aria-label=\"Site brief\">",
        "  <label for=\"business\">The business, in a sentence or two</label>",
        "  <textarea id=\"business\" rows=\"3\"></textarea>",
        "  <label for=\"visitor\">Who the page is for</label>",
        "  <input id=\"visitor\" type=\"text\">",
        "  <label for=\"action\">The one thing it must make them do</label>",
        "  <input id=\"action\" type=\"text\">",
        "  <button id=\"send-brief\" class=\"button button-accent\">Send the brief</button>",
        "</div>"
      ]),
      F("shell", [
        "$ ls docs/fonts",
        "bigshoulders-latin.woff2  newsreader-latin.woff2",
        "$ du -sh docs/vendor/lenis.min.js",
        "13K  docs/vendor/lenis.min.js",
        "$ python -m http.server 8642 --directory docs",
        "Serving HTTP on :: port 8642 ..."
      ])
    ]
  };

  var escapeHtml = function (str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };

  // Two tones only. Strings are painted first so the painter never
  // matches the quotes inside its own markup.
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
           .replace(/(--[a-z-]+|@font-face|font-family|border-radius|background-color|background|letter-spacing|text-transform|line-height|font-size|font-style|font-display|font-weight|box-shadow|grid-template-columns|object-fit|aspect-ratio|position|display|border|src)\b/g, "<span class=\"kw\">$1</span>");
    } else if (lang === "js") {
      h = h.replace(/(\/\/.*)$/g, "<span class=\"cm\">$1</span>")
           .replace(/\b(const|new|for|of|if|continue|return|function|window)\b/g, "<span class=\"kw\">$1</span>");
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

  var renderStatic = function (layer, pre, fragments, startFrag) {
    var lh = parseFloat(getComputedStyle(pre).lineHeight) || 26;
    var want = Math.max(8, Math.floor((layer.clientHeight - 60) / lh));
    var out = "", n = 1, frag = startFrag % fragments.length, line = 0, guard = 0;
    while (n <= want && guard++ < 4000) {
      var f = fragments[frag];
      if (line >= f.lines.length) { out += lineHtml(n++, "", f.lang, false, false); frag = (frag + 1) % fragments.length; line = 0; continue; }
      out += lineHtml(n++, f.lines[line++], f.lang, false, false);
    }
    pre.innerHTML = out;
  };

  var makeTypist = function (layer, pre, fragments, startFrag, startDelay) {
    // Each column is a live editor: it starts full of dim code, keeps
    // writing at the bottom, and the oldest line leaves the top. So the
    // code runs from the top of the section to the bottom from the
    // first frame, and it never stops moving.
    var frag = startFrag % fragments.length, line = 0, col = 0;
    var done = [], base = 1, timer = null, started = false;

    var inView = function () {
      var r = layer.getBoundingClientRect();
      var vh = window.innerHeight || 0;
      return !vh || (r.bottom > -240 && r.top < vh + 240);
    };
    var maxLines = function () {
      var lh = parseFloat(getComputedStyle(pre).lineHeight) || 26;
      return Math.max(8, Math.floor((layer.clientHeight - 60) / lh));
    };
    var advanceFragment = function () {
      frag = (frag + 1) % fragments.length;
      line = 0; col = 0;
    };
    var prefill = function () {
      // Fill the column with finished lines from the fragments in order,
      // leaving one row for the line being written.
      var want = maxLines() - 1;
      var guard = 0;
      while (done.length < want && guard++ < 4000) {
        var f = fragments[frag];
        if (line >= f.lines.length) { done.push(""); advanceFragment(); continue; }
        done.push(f.lines[line]);
        line += 1;
      }
      if (line >= fragments[frag].lines.length) { done.push(""); advanceFragment(); }
    };
    var trim = function () {
      var cap = maxLines() - 1;
      while (done.length > cap) { done.shift(); base += 1; }
    };
    var draw = function () {
      var f = fragments[frag];
      var out = "";
      for (var i = 0; i < done.length; i++) out += lineHtml(base + i, done[i], f.lang, false, false);
      var current = f.lines[line] || "";
      out += lineHtml(base + done.length, current.slice(0, col), f.lang, true, true);
      pre.innerHTML = out;
    };
    var step = function () {
      if (!inView()) { timer = null; return; }
      var f = fragments[frag];
      var current = f.lines[line];
      var delay;
      if (col < current.length) {
        col += 1;
        var ch = current.charAt(col - 1);
        delay = 9 + Math.random() * 14;
        if (ch === " ") delay += 12;
        if (ch === ";" || ch === "{" || ch === "}" || ch === ">") delay += 40;
      } else {
        done.push(current);
        line += 1; col = 0;
        delay = current.length ? 90 + Math.random() * 120 : 60;
        if (line >= f.lines.length) {
          done.push("");
          advanceFragment();
          delay = 1200;
        }
        trim();
      }
      draw();
      timer = window.setTimeout(step, delay);
    };
    var start = function () {
      if (timer) return;
      if (!inView()) return;
      if (!started) { started = true; prefill(); trim(); draw(); }
      timer = window.setTimeout(step, startDelay);
    };
    return start;
  };

  var starters = [];
  layers.forEach(function (layer, index) {
    var fragments = CODE[layer.getAttribute("data-code")];
    var pres = layer.querySelectorAll("pre");
    if (!fragments || !pres.length) return;
    Array.prototype.forEach.call(pres, function (pre, col) {
      if (getComputedStyle(pre).display === "none") return;
      if (reduced) { renderStatic(layer, pre, fragments, col + index); return; }
      starters.push(makeTypist(layer, pre, fragments, col + index, 300 + col * 700 + index * 200));
    });
  });
  if (reduced || !starters.length) return;

  var startAll = function () { starters.forEach(function (s) { s(); }); };
  var tick = false;
  window.addEventListener("scroll", function () {
    if (tick) return;
    tick = true;
    window.setTimeout(function () { tick = false; startAll(); }, 150);
  }, { passive: true });
  window.addEventListener("resize", startAll, { passive: true });
  startAll();
  window.setTimeout(startAll, 800);
})();
