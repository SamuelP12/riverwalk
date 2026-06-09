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
  var layers = document.querySelectorAll(".layer[data-depth]");

  function onScroll(scrollY) {
    var y = scrollY != null ? scrollY : window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar) progressBar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";

    // nav
    if (nav) {
      nav.classList.toggle("scrolled", y > 40);
      var heroH = hero ? hero.offsetHeight - 90 : 400;
      nav.classList.toggle("at-top", y < heroH);
    }

    // hero parallax
    if (!reduceMotion && hero && y < hero.offsetHeight) {
      layers.forEach(function (l) {
        var d = parseFloat(l.getAttribute("data-depth")) || 0;
        l.style.transform = "translate3d(0," + (y * d).toFixed(1) + "px,0)";
      });
    }

    drawFlow();
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

  // initial paint
  onScroll();
})();
