/* ===== Methow Valley Riverwalk ===== */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Lenis smooth scroll ---------- */
  var lenis = null;
  if (window.Lenis && !reduceMotion) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    // anchor links
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (!id || id.charAt(0) !== "#" || id.length < 2) return; // ignore external (e.g. donate) links
        var el = document.querySelector(id);
        if (!el) return;
        e.preventDefault();
        lenis.scrollTo(el, { offset: -70 });
      });
    });
  }

  /* ---------- progress bar + nav state ---------- */
  var progressBar = document.getElementById("progressBar");
  var nav = document.getElementById("nav");
  var hero = document.querySelector(".hero");
  var heroRidge = document.querySelector(".hero-ridge");
  var heroContent = document.querySelector(".hero .hero-content");
  var floatDonate = document.getElementById("floatDonate");

  function onScroll(scrollY) {
    var y = scrollY != null ? scrollY : window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var prog = max > 0 ? y / max : 0;
    if (progressBar) progressBar.style.width = prog * 100 + "%";

    // nav
    if (nav) {
      nav.classList.toggle("scrolled", y > 40);
      var heroH = hero ? hero.offsetHeight - 90 : 400;
      nav.classList.toggle("at-top", y < heroH);
    }

    // persistent donate button appears once past the hero
    if (floatDonate) floatDonate.classList.toggle("show", y > (hero ? hero.offsetHeight * 0.6 : 500));

    // hero parallax (scroll + cursor)
    lastY = y;
    applyParallax();

    drawFlow();
  }

  /* ---------- hero parallax: scroll + cursor drift ---------- */
  var lastY = 0, mouse = { x: 0, y: 0 };
  function applyParallax() {
    if (reduceMotion || !hero || lastY >= hero.offsetHeight) return;
    // ridge drifts with scroll + cursor (background depth)
    if (heroRidge) {
      heroRidge.style.transform = "translate3d(" + (mouse.x * 16).toFixed(1) +
        "px," + (lastY * 0.22 + mouse.y * 10).toFixed(1) + "px,0)";
    }
    // logo + text drift gently opposite the cursor (foreground depth)
    if (heroContent) {
      heroContent.style.transform = "translate3d(" + (mouse.x * -14).toFixed(1) +
        "px," + (mouse.y * -9).toFixed(1) + "px,0)";
    }
  }
  if (!reduceMotion && hero) {
    hero.addEventListener("pointermove", function (e) {
      mouse.x = e.clientX / window.innerWidth - 0.5;
      mouse.y = e.clientY / window.innerHeight - 0.5;
      applyParallax();
    });
    hero.addEventListener("pointerleave", function () {
      mouse.x = 0; mouse.y = 0; applyParallax();
    });
  }
  if (lenis) lenis.on("scroll", function (e) { onScroll(e.scroll); });
  else window.addEventListener("scroll", function () { onScroll(); }, { passive: true });
  nav && nav.classList.add("at-top");

  /* ---------- reveal on scroll ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add("in");
        if (en.target.classList.contains("phase")) en.target.classList.add("in");
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal, .phase").forEach(function (el) { io.observe(el); });

  /* ---------- timeline: footsteps appear along the path on scroll ---------- */
  var timeline = document.getElementById("timeline");
  var trailPath = document.getElementById("trailPath");
  var trailFlow = document.querySelector(".timeline-flow");
  var steps = [];

  function buildSteps() {
    if (!trailPath || !trailFlow) return;
    var H = trailFlow.clientHeight, W = trailFlow.clientWidth;
    if (!H) return;
    trailFlow.querySelectorAll(".step").forEach(function (s) { s.remove(); });
    steps = [];
    var len = trailPath.getTotalLength();
    var N = Math.max(7, Math.round(H / 64)); // ~one step every 64px
    for (var i = 0; i < N; i++) {
      var f = (i + 0.5) / N;
      var l = len * f;
      var p = trailPath.getPointAtLength(l);
      var p2 = trailPath.getPointAtLength(Math.min(len, l + 1));
      var x = (p.x / 40) * W, y = (p.y / 1000) * H;
      var x2 = (p2.x / 40) * W, y2 = (p2.y / 1000) * H;
      var ang = Math.atan2(y2 - y, x2 - x) * 180 / Math.PI; // travel direction
      var side = i % 2 ? 1 : -1;                              // alternate feet
      var perp = (ang + 90) * Math.PI / 180, off = 7;
      var el = document.createElement("div");
      el.className = "step";
      el.style.left = (x + Math.cos(perp) * off * side) + "px";
      el.style.top = (y + Math.sin(perp) * off * side) + "px";
      el.style.transform = "rotate(" + (ang - 90) + "deg)" + (side < 0 ? " scaleX(-1)" : "");
      el.innerHTML = "<i></i>";
      trailFlow.appendChild(el);
      steps.push({ el: el, frac: f });
    }
    if (reduceMotion) steps.forEach(function (s) { s.el.classList.add("in"); });
  }

  function updateSteps() {
    if (!steps.length || !timeline || reduceMotion) return;
    var r = timeline.getBoundingClientRect(), vh = window.innerHeight;
    var start = vh * 0.82, end = vh * 0.2;
    var prog = (start - r.top) / (r.height + (start - end));
    prog = Math.max(0, Math.min(1, prog));
    for (var i = 0; i < steps.length; i++) {
      steps[i].el.classList.toggle("in", prog + 0.0001 >= steps[i].frac);
    }
  }
  function drawFlow() { updateSteps(); } // called from onScroll

  /* ---------- YouTube lazy embed ---------- */
  var videoEmbed = document.getElementById("videoEmbed");
  var videoPlay = document.getElementById("videoPlay");
  if (videoPlay && videoEmbed) {
    var vid = videoEmbed.getAttribute("data-youtube");
    if (vid) {
      var thumb = new Image();
      thumb.onload = function () { if (thumb.naturalWidth > 120) videoEmbed.style.backgroundImage = "url('" + thumb.src + "')"; };
      thumb.src = "https://img.youtube.com/vi/" + vid + "/maxresdefault.jpg";
    }
    videoPlay.addEventListener("click", function () {
      var id = videoEmbed.getAttribute("data-youtube");
      var ifr = document.createElement("iframe");
      ifr.src = "https://www.youtube.com/embed/" + id + "?autoplay=1&rel=0";
      ifr.title = "Winthrop Riverwalk film";
      ifr.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      ifr.allowFullscreen = true;
      videoEmbed.innerHTML = "";
      videoEmbed.appendChild(ifr);
    });
  }

  /* ---------- updates: load JSON, render ---------- */
  var featureCard = document.getElementById("featureCard");
  var archiveGrid = document.getElementById("archiveGrid");
  var modal = document.getElementById("modal");
  var modalBody = document.getElementById("modalBody");

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function mediaHTML(u, cls, weekCls) {
    if (u.image) {
      return '<div class="' + cls + '"><span class="' + weekCls + '">' + esc(u.week) + "</span>" +
        '<img src="' + esc(u.image) + '" alt="" loading="lazy"></div>';
    }
    return '<div class="' + cls + '"><span class="' + weekCls + '">' + esc(u.week) + "</span></div>";
  }
  function tagsHTML(u) {
    if (!u.tags || !u.tags.length) return "";
    return '<div class="feature-tags">' + u.tags.map(function (t) {
      return '<span class="tag">' + esc(t) + "</span>";
    }).join("") + "</div>";
  }

  function renderFeature(u) {
    featureCard.innerHTML =
      mediaHTML(u, "feature-media", "feature-week") +
      '<div class="feature-text">' +
        '<span class="feature-date">' + esc(u.date) + "</span>" +
        "<h3>" + esc(u.title) + "</h3>" +
        "<p>" + esc(u.summary) + "</p>" +
        tagsHTML(u) +
      "</div>";
  }

  function renderArchive(list) {
    archiveGrid.innerHTML = "";
    list.forEach(function (u, i) {
      var card = document.createElement("button");
      card.className = "update-card reveal";
      card.innerHTML =
        mediaHTML(u, "update-thumb", "update-week") +
        '<div class="update-meta">' +
          '<span class="d">' + esc(u.date) + "</span>" +
          "<h4>" + esc(u.title) + "</h4>" +
          "<p>" + esc(u.summary) + "</p>" +
        "</div>";
      card.addEventListener("click", function () { openModal(u); });
      archiveGrid.appendChild(card);
      io.observe(card);
    });
  }

  function openModal(u) {
    var bodyHTML = (u.body || u.summary || "").split("\n").filter(Boolean).map(function (p) {
      return "<p>" + esc(p) + "</p>";
    }).join("");
    modalBody.innerHTML =
      mediaHTML(u, "modal-media", "modal-week") +
      '<div class="modal-text">' +
        '<span class="d">' + esc(u.date) + "</span>" +
        "<h3>" + esc(u.title) + "</h3>" +
        bodyHTML +
        tagsHTML(u) +
      "</div>";
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (lenis) lenis.stop();
  }
  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lenis) lenis.start();
  }
  if (modal) {
    modal.querySelectorAll("[data-close]").forEach(function (el) {
      el.addEventListener("click", closeModal);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
    });
  }

  fetch("data/updates.json?v=2")
    .then(function (r) { if (!r.ok) throw new Error("fetch failed"); return r.json(); })
    .then(function (data) {
      var list = (data && data.updates) || [];
      if (!list.length) throw new Error("no updates");
      // newest first — guarantees "This Week" is the latest regardless of file order
      list.sort(function (a, b) {
        var da = Date.parse(a.date), db = Date.parse(b.date);
        return (isNaN(db) ? 0 : db) - (isNaN(da) ? 0 : da);
      });
      renderFeature(list[0]);                 // This Week = latest
      renderArchive(list.slice(1, 4));        // archive = the previous 3
      requestAnimationFrame(function () { tiltCards(); onScroll(); });
    })
    .catch(function () {
      if (featureCard) {
        featureCard.innerHTML =
          '<div class="feature-text" style="grid-column:1/-1">' +
          '<span class="feature-date">Heads up</span>' +
          "<h3>Updates load on the live site</h3>" +
          "<p>The weekly updates are pulled from <code>data/updates.json</code>. " +
          "If you're opening this file directly from your computer, your browser may block that for security — " +
          "view it on the published GitHub Pages URL and the updates will appear.</p></div>";
      }
    });

  /* ---------- subtle pointer-tilt on cards (hover devices only) ---------- */
  function tiltCards() {
    if (reduceMotion || !window.matchMedia("(hover:hover)").matches) return;
    document.querySelectorAll(".update-card, .feature-card").forEach(function (c) {
      if (c.dataset.tilt) return;
      c.dataset.tilt = "1";
      c.addEventListener("pointermove", function (e) {
        var r = c.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        c.style.transform = "perspective(720px) rotateX(" + (-py * 4.5).toFixed(2) +
          "deg) rotateY(" + (px * 6).toFixed(2) + "deg) translateY(-6px)";
      });
      c.addEventListener("pointerleave", function () { c.style.transform = ""; });
    });
  }
  tiltCards();

  /* ---------- count-up stats ---------- */
  function countUp(el) {
    var raw = el.getAttribute("data-count");
    var target = parseFloat(raw);
    var dotI = raw.indexOf(".");
    var dec = dotI > -1 ? raw.length - dotI - 1 : 0;
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion) { el.textContent = prefix + target.toFixed(dec) + suffix; return; }
    var dur = 1500, start = null;
    function step(t) {
      if (start === null) start = t;
      var p = Math.min(1, (t - start) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + (target * e).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var countObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { countUp(en.target); countObs.unobserve(en.target); }
    });
  }, { threshold: 0.4 });
  document.querySelectorAll("[data-count]").forEach(function (el) { countObs.observe(el); });

  /* ---------- live figures (money + length) from data/site.json ---------- */
  function fmtMoney(n) {
    if (n >= 1e6) { var m = n / 1e6; return "$" + (m % 1 ? +m.toFixed(2) : m) + "M"; }
    if (n >= 1e3) return "$" + Math.round(n / 1e3) + "K";
    return "$" + Math.round(n);
  }
  function moneyCount(n) {
    if (n >= 1e6) return { c: String(Math.round(n / 1e4) / 100), p: "$", s: "M" };
    return { c: String(Math.round(n / 1e3)), p: "$", s: "K" };
  }
  function moneyWords(n) {
    if (n >= 1e6) { var m = n / 1e6; return "$" + (m % 1 ? +m.toFixed(2) : m) + " million"; }
    if (n >= 1e3) return "$" + Math.round(n / 1e3) + "K";
    return "$" + Math.round(n);
  }
  var fundBar = document.getElementById("fundBar");
  if (fundBar) {
    var fundObs = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) { en.target.style.width = (en.target.dataset.target || 25) + "%"; fundObs.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    fundObs.observe(fundBar);
  }
  function applySite(d) {
    try {
      var f = d.fundraising || {}, t = d.trail || {};
      var goal = +f.goal || 0, raised = +f.raised || 0, remaining = Math.max(0, goal - raised);
      var L = document.getElementById("statLength");
      if (L && t.goalLengthFeet) L.setAttribute("data-count", String(t.goalLengthFeet));
      var R = document.getElementById("statRaise");
      if (R) { var mc = moneyCount(remaining); R.setAttribute("data-count", mc.c); R.setAttribute("data-prefix", mc.p); R.setAttribute("data-suffix", mc.s); }
      var pct = goal > 0 ? Math.max(0, Math.min(100, Math.round(raised / goal * 100))) : 0;
      if (fundBar) { fundBar.dataset.target = pct; if (fundBar.style.width) fundBar.style.width = pct + "%"; }
      var ft = document.getElementById("fundText"); if (ft) ft.textContent = fmtMoney(raised) + " raised of " + fmtMoney(goal);
      var fr = document.getElementById("fundRemaining"); if (fr) fr.textContent = fmtMoney(remaining) + " to go";
      var gap = document.getElementById("gapAmount"); if (gap) gap.textContent = moneyWords(goal);
      donateUrl = (d.links && d.links.donate) || "";
      updateDonate();
    } catch (e) {}
  }
  fetch("data/site.json?v=3").then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(applySite).catch(function () {});

  /* ---------- donate: suggested amounts + platform links ---------- */
  var donateUrl = "";
  var selectedAmount = "100";
  var IMPACT = {
    "25": "A gift of $25 plants native willow and dogwood to hold the riverbank.",
    "50": "A gift of $50 helps fund an interpretive sign along the trail.",
    "100": "A gift of $100 helps lay the hard-surface path along the water.",
    "250": "A gift of $250 sets a stretch of boardwalk railing.",
    "1000": "A gift of $1,000 funds a span of the trail's micro-pile support.",
    "": "Give what feels right — every dollar helps unlock the state grant."
  };
  function updateDonate() {
    document.querySelectorAll(".js-donate").forEach(function (a) {
      if (!donateUrl) return;                 // no platform yet → leave the #involved scroll link
      var url = donateUrl;
      if (a.id === "donateBtn" && selectedAmount) url += (url.indexOf("?") > -1 ? "&" : "?") + "amount=" + selectedAmount;
      a.href = url; a.target = "_blank"; a.rel = "noopener";
    });
    var db = document.getElementById("donateBtn");
    if (db) db.textContent = selectedAmount ? "Donate $" + Number(selectedAmount).toLocaleString() : "Donate";
  }
  var tiers = document.getElementById("donateTiers");
  if (tiers) {
    var impactEl = document.getElementById("tierImpact");
    tiers.querySelectorAll(".tier").forEach(function (t) {
      t.addEventListener("click", function () {
        tiers.querySelectorAll(".tier").forEach(function (x) { x.classList.remove("is-selected"); });
        t.classList.add("is-selected");
        selectedAmount = t.getAttribute("data-amount") || "";
        if (impactEl) impactEl.textContent = IMPACT[selectedAmount] || IMPACT[""];
        updateDonate();
      });
    });
  }

  /* ---------- email signup ---------- */
  var form = document.getElementById("signupForm");
  if (form) {
    var input = document.getElementById("signupEmail");
    var msg = document.getElementById("signupMsg");
    input.addEventListener("input", function () { input.classList.remove("invalid"); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var val = (input.value || "").trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val)) {
        input.classList.add("invalid");
        msg.textContent = "Please enter a valid email address.";
        msg.className = "signup-msg show err";
        input.focus();
        return;
      }
      input.classList.remove("invalid");
      function celebrate() {
        form.classList.add("done");
        msg.innerHTML = "🌊 You're on the list — see you on the river.";
        msg.className = "signup-msg show";
      }
      var endpoint = form.getAttribute("data-endpoint");
      if (endpoint) {
        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ email: val })
        }).then(celebrate).catch(celebrate);
      } else {
        celebrate();
      }
    });
  }

  // initial paint
  buildSteps();
  onScroll();

  var resizeT;
  window.addEventListener("resize", function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () { buildSteps(); onScroll(); }, 160);
  });
  window.addEventListener("load", function () { buildSteps(); onScroll(); });
})();
