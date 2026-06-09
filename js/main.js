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
        if (id.length < 2) return;
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

  /* ---------- timeline flow draw ---------- */
  var flowDraw = document.getElementById("flowPathDraw");
  var timeline = document.getElementById("timeline");
  var flowLen = 0;
  if (flowDraw) {
    flowLen = flowDraw.getTotalLength();
    flowDraw.style.strokeDasharray = flowLen;
    flowDraw.style.strokeDashoffset = flowLen;
  }
  function drawFlow() {
    if (!flowDraw || !timeline || reduceMotion) return;
    var r = timeline.getBoundingClientRect();
    var vh = window.innerHeight;
    var start = vh * 0.8, end = vh * 0.2;
    var prog = (start - r.top) / (r.height + (start - end));
    prog = Math.max(0, Math.min(1, prog));
    flowDraw.style.strokeDashoffset = flowLen * (1 - prog);
  }
  if (reduceMotion && flowDraw) flowDraw.style.strokeDashoffset = 0;

  /* ---------- YouTube lazy embed ---------- */
  var videoEmbed = document.getElementById("videoEmbed");
  var videoPlay = document.getElementById("videoPlay");
  if (videoPlay && videoEmbed) {
    videoPlay.addEventListener("click", function () {
      var id = videoEmbed.getAttribute("data-youtube");
      var ifr = document.createElement("iframe");
      ifr.src = "https://www.youtube.com/embed/" + id + "?autoplay=1&rel=0";
      ifr.title = "Methow Valley Riverwalk film";
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

  fetch("data/updates.json?v=1")
    .then(function (r) { if (!r.ok) throw new Error("fetch failed"); return r.json(); })
    .then(function (data) {
      var list = (data && data.updates) || [];
      if (!list.length) throw new Error("no updates");
      renderFeature(list[0]);
      renderArchive(list);
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
    var dec = raw.indexOf(".") > -1 ? 1 : 0;
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion) { el.textContent = target.toFixed(dec) + suffix; return; }
    var dur = 1500, start = null;
    function step(t) {
      if (start === null) start = t;
      var p = Math.min(1, (t - start) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * e).toFixed(dec) + suffix;
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
  onScroll();

  var resizeT;
  window.addEventListener("resize", function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () { onScroll(); }, 160);
  });
  window.addEventListener("load", onScroll);
})();
