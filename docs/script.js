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
   THE BUILD. Every section is coded in front of you. Each one has an
   editor pane that types the section's own markup, and each element
   appears the moment its line is written. The hero builds on load;
   the others build as they scroll into view, fast, and finish at once
   if you scroll past or land on them from a link. Afterwards the hero's
   pane keeps writing the site's CSS and the receipt script, slowly, as
   the standing object on the page; the others hold with the caret.

   Enhancement only. Without JavaScript nothing is hidden. Under
   reduced motion, or in a hidden tab, every section is finished at
   once and the panes show finished code. Failsafes finish any build
   that runs long. Speed is a rate in characters per second, not a
   timer, so it reads the same on every machine.
   ============================================================ */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var L = function (t, b) { return b ? { t: t, b: b } : { t: t }; };
  var SPECS = [
    { id: "hero", rate: 3.4, pause: [40, 80], failsafe: 14000, tail: 9, atLoad: true, after: [
        { lang: "css", lines: [
          "/* styles.css */", ":root {", "  --bg: #0b0a08;", "  --text: #f1ebe0;", "  --accent: #f5891c;",
          "  --display: \"Big Shoulders\";", "  --font: \"Newsreader\";", "}",
          ".button { border-radius: 0; background: var(--accent); }", "* { border-radius: 0; }",
          "em, i { font-style: normal; }", "@font-face { font-family: \"Newsreader\"; src: url(fonts/newsreader-latin.woff2); }"
        ] },
        { lang: "js", lines: [
          "// the receipt, measured on the live page", "const all = [...document.querySelectorAll(\"*\")];",
          "const rounded = all.filter((el) =>", "  getComputedStyle(el).borderRadius !== \"0px\").length;",
          "const gradients = all.filter((el) =>", "  getComputedStyle(el).backgroundImage.includes(\"gradient\")).length;",
          "console.log({ rounded, gradients }); // { rounded: 0, gradients: 0 }"
        ] }
      ], lines: [
        L("<section class=\"hero\" id=\"top\">"),
        L("  <div class=\"shell hero-grid\">"),
        L("    <p class=\"eyebrow\">Custom one-page websites</p>", "eyebrow"),
        L("    <h1>One page. Real code you own. Finished in 48 hours.</h1>", "h1"),
        L("    <p class=\"hero-lede\">A website for your business that was written, not generated.</p>", "lede"),
        L("    <a class=\"button button-accent\" href=\"#start\">Start your site</a>", "cta"),
        L("    <a class=\"text-link\" href=\"#standard\">Read the standard</a>", "link"),
        L("    <p class=\"tagline\">Actually coded, finished by hand.</p>", "tagline"),
        L(""),
        L("    <aside class=\"offer\" aria-label=\"The offer\">", "offer"),
        L("      <span>The one product</span>", "offer-head"),
        L("      <span class=\"display-num\">$495</span> <small>Founding price</small>", "price"),
        L("      <p>For the first ten sites. Then <b>$850</b>.</p>", "then"),
        L("      <ul class=\"offer-list\">"),
        L("        <li>One custom page, designed and coded for your business</li>", "li1"),
        L("        <li>Delivered in 48 hours from a paid brief</li>", "li2"),
        L("        <li>One round of changes included</li>", "li3"),
        L("        <li>You own the code. Host it anywhere, keep it forever</li>", "li4"),
        L("        <li>Built to the published standard, and measured against it</li>", "li5"),
        L("      </ul>"),
        L("      <a class=\"button button-accent\" href=\"#start\">Start your site</a>", "offer-cta"),
        L("      <p class=\"offer-founding\"><b>10 of 10</b> founding places remaining</p>", "founding"),
        L("    </aside>"),
        L("  </div>"),
        L("</section>")
      ] },
    { id: "proof", rate: 2.6, pause: [30, 60], failsafe: 9000, tail: 7, after: [
        { lang: "js", lines: [
          "// concept-motion.js: the reveal observer", "const targets = document.querySelectorAll(\"[data-reveal]\");",
          "const revealer = new IntersectionObserver((entries) => {", "  for (const entry of entries) {",
          "    if (!entry.isIntersecting) continue;", "    entry.target.classList.add(\"is-revealed\");", "  }",
          "}, { rootMargin: \"0px 0px -12% 0px\", threshold: 0.08 });", "targets.forEach((el) => revealer.observe(el));"
        ] },
        { lang: "css", lines: [
          "/* the proof grid */", ".proof-grid { display: grid; grid-template-columns: 1fr 1fr; }",
          ".proof-card { border-right: 1px solid var(--line-bright); }", ".proof-media img { aspect-ratio: 3 / 2; object-fit: cover; }",
          ".proof-media span { font-family: var(--display); letter-spacing: 0.14em; text-transform: uppercase; }"
        ] }
      ], lines: [
        L("<section id=\"proof\">"),
        L("  <p class=\"eyebrow\">Proof</p>", "p-eyebrow"),
        L("  <h2>Four pages, built to the list above.</h2>", "p-h2"),
        L("  <p>A dental practice, a coffee bar, an electrician and a barbershop.</p>", "p-p"),
        L("  <div class=\"proof-grid\">"),
        L("    <article><a href=\"concepts/northline-dental.html\">Northline Dental</a></article>", "p-card1"),
        L("    <article><a href=\"concepts/fieldnote-coffee.html\">Fieldnote Coffee</a></article>", "p-card2"),
        L("    <article><a href=\"concepts/kestrel-electric.html\">Kestrel Electric</a></article>", "p-card3"),
        L("    <article><a href=\"concepts/hollis-barbershop.html\">Hollis Barbershop</a></article>", "p-card4"),
        L("  </div>"),
        L("</section>")
      ] },
    { id: "start", rate: 2.6, pause: [30, 60], failsafe: 10000, tail: 7, after: [
        { lang: "js", lines: [
          "// the brief, built into an email you send yourself", "const lines = [", "  \"Site brief for actuallycoded\",", "  \"\",",
          "  \"THE BUSINESS\", business || \"(not answered)\",", "  \"WHO THE PAGE IS FOR\", visitor || \"(not answered)\",",
          "  \"THE ONE THING IT MUST MAKE THEM DO\", action || \"(not answered)\"", "];",
          "window.location.href = \"mailto:hello@actuallycoded.com\"", "  + \"?subject=\" + encodeURIComponent(\"Site brief\")",
          "  + \"&body=\" + encodeURIComponent(lines.join(\"\\n\"));"
        ] },
        { lang: "shell", lines: [
          "$ git push origin master", "$ curl -sI https://actuallycoded.com | head -1", "HTTP/2 200",
          "$ grep -c \"border-radius\" docs/styles.css", "0"
        ] }
      ], lines: [
        L("<section id=\"start\">"),
        L("  <p class=\"eyebrow\">How it works</p>", "h-eyebrow"),
        L("  <h2>Answer four questions. Pay once. Wait 48 hours.</h2>", "h-h2"),
        L("  <p>There is no call to book and no proposal to wait for.</p>", "h-p"),
        L("  <ol class=\"next-steps\">"),
        L("    <li>01 Send the brief</li>", "h-step1"),
        L("    <li>02 Pay the founding price</li>", "h-step2"),
        L("    <li>03 48 hours later, a link</li>", "h-step3"),
        L("    <li>04 One round of changes</li>", "h-step4"),
        L("  </ol>"),
        L("  <div class=\"intake\" id=\"intake\">"),
        L("    <div class=\"intake-head\">The brief. Four questions.</div>", "h-ihead"),
        L("    <textarea id=\"business\" placeholder=\"The business, in a sentence or two\"></textarea>", "h-q1"),
        L("    <input id=\"visitor\" placeholder=\"Who the page is for\">", "h-q2"),
        L("    <input id=\"action\" placeholder=\"The one thing it must make them do\">", "h-q3"),
        L("    <textarea id=\"links\" placeholder=\"Links to anything that already exists\"></textarea>", "h-q4"),
        L("    <input id=\"reply\" type=\"email\" placeholder=\"Reply to\">", "h-q5"),
        L("    <button id=\"send-brief\" class=\"button button-accent\">Send the brief</button>", "h-actions"),
        L("    <p class=\"intake-note\">The brief goes through your own email app and the payment through Stripe.</p>", "h-note"),
        L("  </div>"),
        L("</section>")
      ] }
  ];

  var escapeHtml = function (str) { return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
  var paint = function (line, lang) {
    var h = escapeHtml(line);
    var strings = [];
    h = h.replace(/"([^"]*)"/g, function (_, inner) {
      strings.push("<span class=\"st\">\"" + inner + "\"</span>");
      return "\u0001" + (strings.length - 1) + "\u0001";
    });
    if (lang === "css") {
      h = h.replace(/(\/\*.*?\*\/)/g, "<span class=\"cm\">$1</span>")
           .replace(/(--[a-z-]+|@font-face|font-family|border-radius|background|font-style|src)\b/g, "<span class=\"kw\">$1</span>");
    } else if (lang === "js") {
      h = h.replace(/(\/\/.*)$/g, "<span class=\"cm\">$1</span>")
           .replace(/\b(const|new|for|of|if|continue|return|function|window)\b/g, "<span class=\"kw\">$1</span>");
    } else if (lang === "shell") {
      h = h.replace(/^\$ (\S+)/, "$ <span class=\"kw\">$1</span>");
    } else {
      h = h.replace(/(&lt;\/?)([a-z][a-z0-9-]*)/g, "$1<span class=\"kw\">$2</span>");
    }
    return h.replace(/\u0001(\d+)\u0001/g, function (_, i) { return strings[Number(i)]; });
  };
  var lineHtml = function (n, line, lang, now, caret) {
    return "<span class=\"ln\">" + String(n).padStart(2, " ") + "</span>" +
      "<span class=\"" + (now ? "now" : "old") + "\">" + paint(line, lang) + "</span>" +
      (caret ? "<span class=\"caret\"></span>" : "") + "\n";
  };

  var makeBuild = function (spec) {
    var sec = document.querySelector("[data-build-section=\"" + spec.id + "\"]");
    if (!sec) return null;
    var pane = sec.querySelector(".build-pane pre");
    var targets = sec.querySelectorAll("[data-build]");
    var done = [], base = 1, finished = false, started = false, timer = null;

    var render = function (lang, current, caret) {
      if (!pane) return;
      var out = "";
      for (var i = 0; i < done.length; i++) out += lineHtml(base + i, done[i], lang, false, false);
      out += lineHtml(base + done.length, current, lang, true, caret);
      pane.innerHTML = out;
    };
    var push = function (line) {
      done.push(line);
      while (done.length > spec.tail - 1) { done.shift(); base += 1; }
    };
    var built = function (key) {
      var el = sec.querySelector("[data-build=\"" + key + "\"]");
      if (el) el.classList.add("is-built");
    };
    var renderFinished = function () {
      done = []; base = 1;
      spec.lines.forEach(function (l) { push(l.t); });
      render("html", "", true);
    };
    var finish = function () {
      if (finished) return;
      finished = true;
      if (timer) { window.clearTimeout(timer); timer = null; }
      Array.prototype.forEach.call(targets, function (el) { el.classList.add("is-built"); });
      window.setTimeout(function () { sec.classList.remove("is-building"); }, 450);
      if (!started) renderFinished();
      if (pane) pane.parentNode.classList.add("is-open");
      if (spec.after && !afterRunning) { afterRunning = true; window.setTimeout(typeAfter, 2400); }
    };

    var rect = function () { return sec.getBoundingClientRect(); };
    var inView = function () { var r = rect(); var vh = window.innerHeight || 0; return !vh || (r.top < vh * 0.7 && r.bottom > vh * 0.25); };
    var passed = function () { return rect().bottom < 0; };
    var mostlyIn = function () { var r = rect(); var vh = window.innerHeight || 0; return vh && r.top < vh * 0.4; };

    var idx = 0, col = 0, last = 0;
    var step = function () {
      if (finished) return;
      if (!spec.atLoad && passed()) { finish(); return; }
      var line = spec.lines[idx];
      var now = Date.now();
      if (!last) last = now;
      if (col < line.t.length) {
        var n = Math.floor((now - last) / spec.rate);
        if (n > 0) { col = Math.min(line.t.length, col + n); last += n * spec.rate; }
        render("html", line.t.slice(0, col), true);
        timer = window.setTimeout(step, 16);
        return;
      }
      push(line.t);
      if (line.b) built(line.b);
      if (idx === 0 && pane) pane.parentNode.classList.add("is-open");
      idx += 1; col = 0; last = 0;
      if (idx >= spec.lines.length) { render("html", "", true); finish(); return; }
      render("html", "", true);
      timer = window.setTimeout(step, line.t.length ? spec.pause[0] + Math.random() * (spec.pause[1] - spec.pause[0]) : 20);
    };

    // Afterwards, the hero's pane keeps writing, slowly.
    var afterRunning = false, frag = 0, aline = 0, acol = 0;
    var typeAfter = function () {
      var f = spec.after[frag];
      var line = f.lines[aline];
      if (acol < line.length) {
        acol += 1;
        render(f.lang, line.slice(0, acol), true);
        window.setTimeout(typeAfter, 24 + Math.random() * 40);
        return;
      }
      push(line);
      aline += 1; acol = 0;
      if (aline >= f.lines.length) {
        push("");
        frag = (frag + 1) % spec.after.length; aline = 0;
        render(spec.after[frag].lang, "", true);
        window.setTimeout(typeAfter, 3200);
        return;
      }
      render(f.lang, "", true);
      window.setTimeout(typeAfter, 260 + Math.random() * 300);
    };

    var start = function () {
      if (started || finished) return;
      if (!spec.atLoad && !inView()) return;
      started = true;
      render("html", "", true);
      timer = window.setTimeout(step, spec.atLoad ? 450 : 120);
      window.setTimeout(finish, spec.failsafe);
    };

    return { spec: spec, sec: sec, pane: pane, start: start, finish: finish, inView: inView, passed: passed, mostlyIn: mostlyIn,
             isDone: function () { return finished; } };
  };

  var builds = SPECS.map(makeBuild).filter(Boolean);
  if (!builds.length) return;

  // Off switch: reduced motion or a hidden tab means finished, at once.
  if (reduced || document.hidden) {
    builds.forEach(function (b) { b.finish(); });
    return;
  }

  builds.forEach(function (b) {
    if (!b.pane) { b.finish(); return; }
    b.sec.classList.add("is-building");
    if (b.spec.atLoad) { b.start(); return; }
    // Landed on it, or already reading it: simply finished.
    if (("#" + b.sec.id) === window.location.hash || b.mostlyIn()) b.finish();
  });

  var sweep = function () {
    builds.forEach(function (b) {
      if (b.isDone() || b.spec.atLoad) return;
      if (b.passed()) { b.finish(); return; }
      b.start();
    });
  };
  var tick = false;
  window.addEventListener("scroll", function () {
    if (tick) return;
    tick = true;
    window.setTimeout(function () { tick = false; sweep(); }, 80);
  }, { passive: true });
  window.addEventListener("resize", sweep, { passive: true });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) builds.forEach(function (b) { b.finish(); });
  });
  window.setTimeout(sweep, 300);
  var poll = window.setInterval(function () {
    sweep();
    if (builds.every(function (b) { return b.isDone(); })) window.clearInterval(poll);
  }, 700);
})();

/* ============================================================
   ROW BUILDS. The six tells are coded into existence as you reach
   them. Each row's two boxes start as a strip of code being written,
   the tell on the left and the answer on the right, then grow to size
   and the code fades to reveal what it made. Fast, so you can scroll.
   Same off switches as the section builds.
   ============================================================ */
(function () {
  "use strict";
  var rows = document.querySelectorAll(".tells li[data-row]");
  if (!rows.length) return;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || document.hidden) return;

  var ROWS = {
    1: { no: [".button {", "  border-radius: 999px;", "  box-shadow: 0 10px 30px rgba(0,0,0,.2);", "}"],
         yes: [".button {", "  border-radius: 0;", "  background: var(--accent);", "}"] },
    2: { no: [".hero {", "  background: linear-gradient(135deg, #6d5dfc, #37b5ff);", "}"],
         yes: [".hero { background: var(--bg); }", ".mark { background: var(--accent); }"] },
    3: { no: ["body { font-family: Inter, system-ui, sans-serif; }", "h1 em { font-family: cursive; font-style: italic; }"],
         yes: ["@font-face { font-family: \"Big Shoulders\"; src: url(fonts/bigshoulders-latin.woff2); }", "h1 { font-family: var(--display); }"] },
    4: { no: ["<section class=\"cards\">Why Choose Us</section>", "<section class=\"cards\">Our Services</section>", "<section class=\"cards\">Our Features</section>", "<section class=\"cards\">Our Benefits</section>"],
         yes: ["<section class=\"hero\">", "<section class=\"list\">", "<section class=\"split\">", "<section class=\"form\">"] },
    5: { no: [".card {", "  border-radius: 20px;", "  box-shadow: 0 10px 40px rgba(0,0,0,.1);", "}"],
         yes: [".row { border-top: 1px solid var(--line); }", ".row b { font-family: var(--display); }"] },
    6: { no: ["<p>We leverage a client-centric approach", "  to deliver seamless solutions.</p>"],
         yes: ["<p>Two slots held every weekday", "  for pain that cannot wait.</p>"] }
  };

  var escapeHtml = function (str) { return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
  var paint = function (line) {
    var h = escapeHtml(line);
    var strings = [];
    h = h.replace(/"([^"]*)"/g, function (_, inner) {
      strings.push("<span class=\"st\">\"" + inner + "\"</span>");
      return "\u0001" + (strings.length - 1) + "\u0001";
    });
    if (line.charAt(0) === "<" || line.indexOf("<") === 0) {
      h = h.replace(/(&lt;\/?)([a-z][a-z0-9-]*)/g, "$1<span class=\"kw\">$2</span>");
    } else {
      h = h.replace(/(--[a-z-]+|@font-face|font-family|border-radius|box-shadow|background|font-style|src)\b/g, "<span class=\"kw\">$1</span>");
    }
    return h.replace(/\u0001(\d+)\u0001/g, function (_, i) { return strings[Number(i)]; });
  };

  var RATE = 3.2, TAIL = 2;
  var makeTypist = function (pre, lines, onDone) {
    var done = [], i = 0, col = 0, last = 0, finished = false;
    var render = function (current) {
      var out = "";
      var shown = done.slice(-TAIL);
      for (var k = 0; k < shown.length; k++) out += "<span class=\"old\">" + paint(shown[k]) + "</span>\n";
      out += "<span class=\"now\">" + paint(current) + "</span><span class=\"caret\"></span>\n";
      pre.innerHTML = out;
    };
    var step = function () {
      if (finished) return;
      var line = lines[i];
      var now = Date.now();
      if (!last) last = now;
      if (col < line.length) {
        var n = Math.floor((now - last) / RATE);
        if (n > 0) { col = Math.min(line.length, col + n); last += n * RATE; }
        render(line.slice(0, col));
        window.setTimeout(step, 16);
        return;
      }
      done.push(line); i += 1; col = 0; last = 0;
      if (i >= lines.length) { finished = true; render(""); onDone(); return; }
      render("");
      window.setTimeout(step, 90 + Math.random() * 80);
    };
    return { start: function () { render(""); window.setTimeout(step, 60); }, stop: function () { finished = true; } };
  };

  var builds = [];
  Array.prototype.forEach.call(rows, function (li) {
    var spec = ROWS[li.getAttribute("data-row")];
    var pres = li.querySelectorAll(".spec-code");
    if (!spec || pres.length < 2) return;
    li.classList.add("is-building");
    var started = false, done = false, remaining = 2, typists = [];
    var rect = function () { return li.getBoundingClientRect(); };
    var inView = function () { var r = rect(); var vh = window.innerHeight || 0; return !vh || (r.top < vh * 0.8 && r.bottom > vh * 0.1); };
    var passed = function () { return rect().bottom < 0; };
    var finish = function (instant) {
      if (done) return;
      done = true;
      typists.forEach(function (t) { t.stop(); });
      if (instant) li.classList.add("is-instant");
      li.classList.add("is-grown");
      var t1 = instant ? 0 : 560, t2 = instant ? 0 : 420, t3 = instant ? 0 : 400;
      window.setTimeout(function () {
        li.classList.add("is-shown");
        window.setTimeout(function () {
          li.classList.add("is-done");
          window.setTimeout(function () { li.classList.remove("is-building"); }, t3);
        }, t2);
      }, t1);
    };
    var onDone = function () { remaining -= 1; if (remaining === 0) window.setTimeout(function () { finish(false); }, 220); };
    var start = function () {
      if (started || done) return;
      if (!inView()) return;
      started = true;
      typists = [makeTypist(pres[0], spec.no, onDone), makeTypist(pres[1], spec.yes, onDone)];
      typists[0].start();
      window.setTimeout(function () { typists[1].start(); }, 260);
      window.setTimeout(function () { finish(false); }, 5000);
    };
    builds.push({ start: start, finish: finish, passed: passed, isDone: function () { return done; }, li: li });
  });
  if (!builds.length) return;

  var sweep = function () {
    builds.forEach(function (b) {
      if (b.isDone()) return;
      if (b.passed()) { b.finish(true); return; }
      b.start();
    });
  };
  var tick = false;
  window.addEventListener("scroll", function () {
    if (tick) return;
    tick = true;
    window.setTimeout(function () { tick = false; sweep(); }, 80);
  }, { passive: true });
  window.addEventListener("resize", sweep, { passive: true });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) builds.forEach(function (b) { b.finish(true); });
  });
  window.setTimeout(sweep, 300);
  var poll = window.setInterval(function () {
    sweep();
    if (builds.every(function (b) { return b.isDone(); })) window.clearInterval(poll);
  }, 600);
})();
