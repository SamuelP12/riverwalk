/* ===== Winthrop Riverwalk v2 — GSAP-driven editorial site ===== */
(function () {
  "use strict";
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var GS = window.gsap, ST = window.ScrollTrigger;
  var anim = !reduce && !!GS && !!ST;
  if (anim) GS.registerPlugin(ST);
  else document.documentElement.classList.add("no-motion");

  /* ---------- Lenis smooth scroll + GSAP sync ---------- */
  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    if (anim) {
      lenis.on("scroll", ST.update);
      GS.ticker.add(function (t) { lenis.raf(t * 1000); });
      GS.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })();
    }
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (!id || id.charAt(0) !== "#" || id.length < 2) return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(el, { offset: -64 });
      else el.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ---------- progress bar + nav + float ---------- */
  var bar = document.getElementById("scrollBar"), nav = document.getElementById("nav"),
      floatGive = document.getElementById("floatGive"), hero = document.querySelector(".hero");
  function onScroll(y) {
    y = (y == null) ? window.scrollY : y;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (max > 0 ? y / max * 100 : 0) + "%";
    if (nav) nav.classList.toggle("scrolled", y > 60);
    if (floatGive) floatGive.classList.toggle("show", y > (hero ? hero.offsetHeight * 0.72 : 600));
  }
  if (lenis) lenis.on("scroll", function (e) { onScroll(e.scroll); });
  else window.addEventListener("scroll", function () { onScroll(); }, { passive: true });
  onScroll(0);

  /* ---------- hero entrance + parallax ---------- */
  if (anim) {
    var tl = GS.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".hero-eyebrow", { y: 20, opacity: 0, duration: .7 })
      .to(".hero-title .line > span", { y: 0, duration: 1.05, stagger: .12 }, "-=.3")
      .from(".hero-sub", { y: 24, opacity: 0, duration: .8 }, "-=.5")
      .from(".hero-actions", { y: 24, opacity: 0, duration: .8 }, "-=.6")
      .from(".hero-cue", { opacity: 0, duration: .7 }, "-=.3");
    GS.from("#heroImg", { scale: 1.18, duration: 2.4, ease: "power2.out" });
    GS.to("#heroImg", { yPercent: 12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  }

  /* ---------- reveal on scroll (batched + staggered) ---------- */
  if (anim) {
    ST.batch(".reveal", {
      start: "top 88%",
      onEnter: function (els) {
        GS.to(els, { opacity: 1, y: 0, duration: 1.05, ease: "power3.out", stagger: 0.09, overwrite: true });
      }
    });
    // cinematic hero exit: text drifts up + fades as you leave
    GS.to(".hero-inner", { yPercent: -9, opacity: 0, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom 30%", scrub: true } });
  }

  /* ---------- vision statement: grey -> clear, word by word ---------- */
  var stateText = document.getElementById("stateText");
  if (stateText) {
    var parts = stateText.textContent.split(/(\s+)/);
    stateText.innerHTML = parts.map(function (w) {
      return /\S/.test(w) ? '<span class="w">' + w.replace(/[&<>]/g, "") + "</span>" : w;
    }).join("");
    if (anim) {
      GS.to(stateText.querySelectorAll(".w"), { opacity: 1, stagger: 0.08, ease: "none",
        scrollTrigger: { trigger: stateText, start: "top 78%", end: "bottom 58%", scrub: 0.6 } });
    }
  }

  /* ---------- gap bridge slides in from the sides ---------- */
  if (anim) {
    GS.fromTo(".gap-left", { xPercent: -28, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 1.3, ease: "power3.out",
      scrollTrigger: { trigger: "#gapStage", start: "top 82%" } });
    GS.fromTo(".gap-right", { xPercent: 28, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 1.3, ease: "power3.out",
      scrollTrigger: { trigger: "#gapStage", start: "top 82%" } });
    GS.from(".gap-amount", { scale: .55, opacity: 0, duration: .9, ease: "back.out(1.7)",
      scrollTrigger: { trigger: "#gapStage", start: "top 74%" } });
  }

  /* ---------- parallax photo bands ---------- */
  if (anim) {
    GS.utils.toArray("[data-parallax]").forEach(function (img) {
      GS.fromTo(img, { yPercent: -9 }, { yPercent: 9, ease: "none",
        scrollTrigger: { trigger: img.closest(".band") || img, start: "top bottom", end: "bottom top", scrub: true } });
    });
  }

  /* ---------- count-up ---------- */
  function countUp(el) {
    var raw = el.getAttribute("data-count"), target = parseFloat(raw);
    var dot = raw.indexOf("."), dec = dot > -1 ? raw.length - dot - 1 : 0;
    var pre = el.getAttribute("data-prefix") || "", suf = el.getAttribute("data-suffix") || "";
    if (reduce) { el.textContent = pre + target.toFixed(dec) + suf; return; }
    var dur = 1600, start = null;
    function step(t) {
      if (start === null) start = t;
      var p = Math.min(1, (t - start) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + (target * e).toFixed(dec) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var countObs = new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { countUp(en.target); countObs.unobserve(en.target); } });
  }, { threshold: .5 });
  document.querySelectorAll("[data-count]").forEach(function (el) { countObs.observe(el); });

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function imgSrc(v) { return /^(https?:|\.\.\/images\/|images\/)/.test(v) ? (v.indexOf("images/") === 0 ? "../" + v : v) : "../images/" + v; }
  function media(u, cls) {
    if (u.image) return '<div class="' + cls + '"><img src="' + esc(imgSrc(u.image)) + '" alt="" loading="lazy"></div>';
    return '<div class="' + cls + '"></div>';
  }
  function tags(u) {
    if (!u.tags || !u.tags.length) return "";
    return '<div class="tags">' + u.tags.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</div>";
  }

  /* ---------- updates ---------- */
  var featureCard = document.getElementById("featureCard"), archiveGrid = document.getElementById("archiveGrid"),
      modal = document.getElementById("modal"), modalBody = document.getElementById("modalBody");
  function renderFeature(u) {
    featureCard.innerHTML = media(u, "feature-media") +
      '<div class="feature-text"><h3>' + esc(u.title) + "</h3><p>" + esc(u.summary) + "</p>" + tags(u) + "</div>";
  }
  function renderArchive(list) {
    archiveGrid.innerHTML = "";
    list.forEach(function (u) {
      var c = document.createElement("button");
      c.className = "up-card";
      c.innerHTML = media(u, "up-thumb") + '<div class="up-meta"><h4>' + esc(u.title) + "</h4><p>" + esc(u.summary) + "</p></div>";
      c.addEventListener("click", function () { openModal(u); });
      archiveGrid.appendChild(c);
    });
  }
  function openModal(u) {
    var body = (u.body || u.summary || "").split("\n").filter(Boolean).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
    modalBody.innerHTML = media(u, "modal-media") + '<div class="modal-text"><h3>' + esc(u.title) + "</h3>" + body + tags(u) + "</div>";
    modal.classList.add("open"); modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden"; if (lenis) lenis.stop();
  }
  function closeModal() {
    modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = ""; if (lenis) lenis.start();
  }
  if (modal) {
    modal.querySelectorAll("[data-close]").forEach(function (el) { el.addEventListener("click", closeModal); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });
  }
  fetch("../data/updates.json?v=4").then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
    var list = (d && d.updates) || [];
    if (!list.length) return;
    list.sort(function (a, b) { var x = Date.parse(b.date), y = Date.parse(a.date); return (isNaN(x) ? 0 : x) - (isNaN(y) ? 0 : y); });
    renderFeature(list[0]);
    if (anim) GS.from("#featureCard .feature-media img", { scale: 1.14, duration: 1.5, ease: "power2.out", scrollTrigger: { trigger: "#featureCard", start: "top 82%" } });
    renderArchive(list.slice(1, 4));
    if (anim) GS.from(".archive .up-card", { opacity: 0, y: 30, duration: .9, stagger: .1, ease: "power3.out", scrollTrigger: { trigger: "#archiveGrid", start: "top 90%" } });
    if (anim && ST) ST.refresh();
  }).catch(function () {
    if (featureCard) featureCard.innerHTML = '<div class="feature-text"><span class="feature-date">Heads up</span><h3>Updates load on the live site</h3><p>The weekly updates load from data/updates.json — view this on the published URL.</p></div>';
  });

  /* ---------- video ---------- */
  var videoEmbed = document.getElementById("videoEmbed"), videoPlay = document.getElementById("videoPlay");
  if (videoPlay && videoEmbed) {
    var vid = videoEmbed.getAttribute("data-youtube");
    if (vid) { var th = new Image(); th.onload = function () { if (th.naturalWidth > 120) videoEmbed.style.backgroundImage = "url('" + th.src + "')"; }; th.src = "https://img.youtube.com/vi/" + vid + "/maxresdefault.jpg"; }
    videoPlay.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = "https://www.youtube.com/embed/" + vid + "?autoplay=1&rel=0";
      f.title = "Winthrop Riverwalk film"; f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"; f.allowFullscreen = true;
      videoEmbed.innerHTML = ""; videoEmbed.appendChild(f);
      videoEmbed.classList.add("is-playing");
    });
  }

  /* ---------- live figures + donate ---------- */
  var donateUrl = "", selAmount = "100";
  var IMPACT = {
    "25": "A gift of $25 plants native willow and dogwood to hold the riverbank.",
    "50": "A gift of $50 helps fund an interpretive sign along the trail.",
    "100": "A gift of $100 helps lay the hard-surface path along the water.",
    "250": "A gift of $250 sets a stretch of boardwalk railing.",
    "1000": "A gift of $1,000 funds a span of the trail's micro-pile support.",
    "": "Give what feels right — every dollar helps unlock the state grant."
  };
  function moneyWords(n) { if (n >= 1e6) { var m = n / 1e6; return "$" + (m % 1 ? +m.toFixed(2) : m) + " million"; } if (n >= 1e3) return "$" + Math.round(n / 1e3) + "K"; return "$" + Math.round(n); }
  function moneyShort(n) { if (n >= 1e6) { return "$" + (Math.round(n / 1e4) / 100) + "M"; } return "$" + Math.round(n / 1e3) + "K"; }
  function updateDonate() {
    document.querySelectorAll(".js-donate").forEach(function (a) {
      if (!donateUrl) return;
      var url = donateUrl;
      if (a.id === "donateBtn" && selAmount) url += (url.indexOf("?") > -1 ? "&" : "?") + "amount=" + selAmount;
      a.href = url; a.target = "_blank"; a.rel = "noopener";
    });
    var db = document.getElementById("donateBtn");
    if (db) db.textContent = selAmount ? "Donate $" + Number(selAmount).toLocaleString() : "Donate";
  }
  var tiers = document.getElementById("tiers");
  if (tiers) {
    var impactEl = document.getElementById("tierImpact");
    tiers.querySelectorAll(".tier").forEach(function (t) {
      t.addEventListener("click", function () {
        tiers.querySelectorAll(".tier").forEach(function (x) { x.classList.remove("is-on"); });
        t.classList.add("is-on");
        selAmount = t.getAttribute("data-amount") || "";
        if (impactEl) impactEl.textContent = IMPACT[selAmount] || IMPACT[""];
        updateDonate();
      });
    });
  }
  fetch("../data/site.json?v=3").then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
    try {
      var f = d.fundraising || {}, t = d.trail || {};
      var goal = +f.goal || 0, raised = +f.raised || 0, remaining = Math.max(0, goal - raised);
      var L = document.getElementById("statLen"); if (L && t.goalLengthFeet) L.setAttribute("data-count", String(t.goalLengthFeet));
      var G = document.getElementById("statGoal");
      if (G) {
        if (remaining >= 1e6) { G.setAttribute("data-count", String(Math.round(remaining / 1e4) / 100)); G.setAttribute("data-suffix", "M"); }
        else { G.setAttribute("data-count", String(Math.round(remaining / 1e3))); G.setAttribute("data-suffix", "K"); }
      }
      var gb = document.getElementById("gapBig"); if (gb) gb.textContent = moneyShort(remaining);
      var gg = document.getElementById("giveGoal"); if (gg) gg.textContent = moneyWords(goal);
      donateUrl = (d.links && d.links.donate) || "";
      updateDonate();
    } catch (e) {}
  }).catch(function () {});

  /* ---------- email signup ---------- */
  var form = document.getElementById("signupForm");
  if (form) {
    var input = document.getElementById("signupEmail"), msg = document.getElementById("signupMsg");
    input.addEventListener("input", function () { msg.className = "news-msg"; });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var val = (input.value || "").trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val)) { msg.textContent = "Please enter a valid email address."; msg.className = "news-msg show err"; input.focus(); return; }
      var endpoint = form.getAttribute("data-endpoint");
      function done() { form.reset(); msg.innerHTML = "🌲 You're on the list — see you on the river."; msg.className = "news-msg show"; }
      if (endpoint) fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ email: val }) }).then(done).catch(done);
      else done();
    });
  }

  /* refresh triggers once everything has laid out */
  function toTop() { window.scrollTo(0, 0); if (lenis) lenis.scrollTo(0, { immediate: true, force: true }); }
  window.addEventListener("load", function () {
    if (anim && ST) ST.refresh();   // recalc first, so it can't leave us mid-page
    toTop();
    requestAnimationFrame(toTop);
  });
  window.addEventListener("pageshow", function (e) { if (e.persisted) toTop(); });
})();
