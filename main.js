(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined";
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- Intro (once per day, ?intro=1 forces) ---------- */
  function initIntro(done) {
    var intro = document.querySelector("[data-intro]");
    var now = new Date();
    var today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
    var force = location.search.indexOf("intro=1") !== -1;
    if (!intro || (!force && store("nv_intro_seen") === today)) { done(); return; }
    store("nv_intro_seen", today);
    intro.removeAttribute("hidden");
    document.body.classList.add("nv-intro-active");
    var t = reduced ? [120, 220, 320, 340] : [1500, 3200, 4300, 4680];
    setTimeout(function () { intro.classList.add("is-step-two"); }, t[0]);
    setTimeout(function () { intro.classList.add("is-exiting"); }, t[1]);
    setTimeout(function () { intro.classList.add("is-complete"); document.body.classList.remove("nv-intro-active"); done(); }, t[2]);
    setTimeout(function () { intro.setAttribute("hidden", ""); }, t[3]);
  }

  /* ---------- Menu ---------- */
  function initMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var nav = document.querySelector("[data-nav]");
    if (!toggle || !nav) return;
    function set(open) {
      document.body.classList.toggle("nv-menu-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.querySelector("span").textContent = open ? "Close" : "Menu";
    }
    toggle.addEventListener("click", function () { set(!document.body.classList.contains("nv-menu-open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) set(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
  }

  /* ---------- Header hide/show ---------- */
  function initHeader() {
    var header = document.querySelector("[data-header]");
    var lastY = scrollY, ticking = false;
    function update() {
      var y = scrollY;
      header.classList.toggle("is-scrolled", y > 12);
      header.classList.toggle("is-hidden", y > lastY && y > 180 && !document.body.classList.contains("nv-menu-open"));
      if (y < innerHeight * 0.6) document.querySelectorAll(".nv-nav a.is-current").forEach(function (a) { a.classList.remove("is-current"); });
      lastY = y; ticking = false;
    }
    addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
    // current section in nav
    var links = Array.prototype.slice.call(document.querySelectorAll(".nv-nav a[href^='#']"));
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (a) { a.classList.toggle("is-current", a.getAttribute("href") === "#" + en.target.id); });
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      ["formats", "services", "packing", "studio", "contact"].forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
    }
  }

  /* ---------- Hero reels: 70ms flipbook on hover; slow crossfade on touch ---------- */
  function initReels() {
    var touch = matchMedia("(hover: none)").matches;
    document.querySelectorAll("[data-reel]").forEach(function (reel, ri) {
      var imgs = Array.prototype.slice.call(reel.querySelectorAll("img"));
      var i = 0, timer = null;
      imgs.forEach(function (im) { var p = new Image(); p.src = im.src; });
      function show(n) { i = (n + imgs.length) % imgs.length; imgs.forEach(function (im, k) { im.classList.toggle("is-active", k === i); }); }
      if (reduced) return;
      if (touch) { setTimeout(function () { setInterval(function () { show(i + 1); }, 2600); }, ri * 1300); return; }
      reel.addEventListener("pointerenter", function () {
        if (timer) return; reel.classList.add("is-hover-cycling"); show(i + 1);
        timer = setInterval(function () { show(i + 1); }, 70);
      });
      reel.addEventListener("pointerleave", function () {
        clearInterval(timer); timer = null; reel.classList.remove("is-hover-cycling"); show(0);
      });
    });
  }

  /* ---------- Services rail: endless auto-scroll ---------- */
  function initRail() {
    var rail = document.querySelector("[data-rail]");
    var track = rail && rail.querySelector("[data-rail-track]");
    if (!track) return;
    var items = Array.prototype.slice.call(track.children);
    items.forEach(function (it) { var c = it.cloneNode(true); c.setAttribute("aria-hidden", "true"); c.tabIndex = -1; track.appendChild(c); });
    if (reduced) return;
    var pos = 0, paused = false, last = performance.now();
    rail.addEventListener("pointerenter", function () { paused = true; });
    rail.addEventListener("pointerleave", function () { paused = false; });
    function frame(now) {
      var dt = Math.min(64, now - last); last = now;
      var vertical = getComputedStyle(track).flexDirection === "column";
      var half = vertical ? track.scrollHeight / 2 : track.scrollWidth / 2;
      if (!paused && half > 0) { pos += dt * 0.035; if (pos >= half) pos -= half; }
      track.style.transform = vertical ? "translate3d(0," + (-pos) + "px,0)" : "translate3d(" + (-pos) + "px,0,0)";
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Cursor preview for service list ---------- */
  function initPreview() {
    var img = document.querySelector("[data-cursor-preview]");
    if (!img || matchMedia("(hover: none)").matches) return;
    var x = 0, y = 0, cx = 0, cy = 0, on = false;
    document.querySelectorAll("[data-preview]").forEach(function (li) {
      li.addEventListener("pointerenter", function () { img.src = li.getAttribute("data-preview"); img.classList.add("is-on"); on = true; });
      li.addEventListener("pointerleave", function () { img.classList.remove("is-on"); on = false; });
    });
    addEventListener("pointermove", function (e) { x = e.clientX + 120; y = e.clientY; }, { passive: true });
    (function loop() { cx += (x - cx) * 0.16; cy += (y - cy) * 0.16; img.style.left = cx + "px"; img.style.top = cy + "px"; requestAnimationFrame(loop); })();
  }

  /* ---------- Archive: views + filter ---------- */
  function initArchive() {
    var grid = document.querySelector("[data-grid]");
    if (!grid) return;
    var views = document.querySelectorAll("[data-view]");
    views.forEach(function (b) {
      b.addEventListener("click", function () {
        views.forEach(function (o) { o.classList.toggle("is-active", o === b); });
        grid.classList.remove("is-small", "is-large", "is-list");
        grid.classList.add("is-" + b.getAttribute("data-view"));
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      });
    });
    var wrap = document.querySelector(".nv-archive__filter");
    var tog = document.querySelector("[data-filter-toggle]");
    tog.addEventListener("click", function () { var o = wrap.classList.toggle("is-open"); tog.setAttribute("aria-expanded", o ? "true" : "false"); });
    var fb = document.querySelectorAll("[data-filter]");
    function apply(cat) {
      fb.forEach(function (o) { o.classList.toggle("is-active", o.getAttribute("data-filter") === cat); });
      grid.querySelectorAll(".nv-card").forEach(function (c) {
        var show = cat === "all" || c.getAttribute("data-cat") === cat;
        c.classList.toggle("is-hidden", !show);
        if (show && hasGsap && !reduced) gsap.fromTo(c, { opacity: 0, y: 24, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: .7, ease: "power2.out", clearProps: "filter" });
      });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }
    fb.forEach(function (b) { b.addEventListener("click", function () { apply(b.getAttribute("data-filter")); }); });
    document.querySelectorAll("[data-filter-link]").forEach(function (a) {
      a.addEventListener("click", function () { wrap.classList.add("is-open"); apply(a.getAttribute("data-filter-link")); });
    });
  }

  /* ---------- Sticky split: image follows active paragraph ---------- */
  function initSplit() {
    var sec = document.querySelector("[data-split-section]");
    if (!sec) return;
    var imgs = sec.querySelectorAll("[data-split-image]");
    var steps = Array.prototype.slice.call(sec.querySelectorAll("[data-split-step]"));
    var ticking = false;
    function update() {
      ticking = false;
      var mid = innerHeight * 0.5, best = 0, bd = Infinity;
      steps.forEach(function (s, i) { var r = s.getBoundingClientRect(); var d = Math.abs(r.top + r.height / 2 - mid); if (d < bd) { bd = d; best = i; } });
      steps.forEach(function (s, i) { s.classList.toggle("is-active", i === best); });
      imgs.forEach(function (im, i) { im.classList.toggle("is-active", i === best); });
    }
    addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener("resize", update);
    update();
  }

  /* ---------- Modal: brief → mailto ---------- */
  function initModal() {
    var modal = document.getElementById("nv-modal");
    var form = modal.querySelector("[data-form]");
    var last = null;
    function open(need) {
      last = document.activeElement;
      modal.removeAttribute("hidden"); modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("nv-modal-open");
      if (need) { var sel = form.querySelector("select[name=needs]"); Array.prototype.forEach.call(sel.options, function (o) { if (o.text.toLowerCase() === need.toLowerCase() || (need.indexOf("Kitting") === 0 && o.text.indexOf("Kitting") === 0)) sel.value = o.value || o.text; }); }
      requestAnimationFrame(function () { modal.classList.add("is-open"); var f = form.querySelector("input"); if (f) f.focus({ preventScroll: true }); });
    }
    function close() {
      modal.classList.remove("is-open"); document.body.classList.remove("nv-modal-open");
      setTimeout(function () { modal.setAttribute("hidden", ""); modal.setAttribute("aria-hidden", "true"); }, 380);
      if (last) last.focus({ preventScroll: true });
    }
    document.querySelectorAll("[data-modal-open]").forEach(function (b) {
      b.addEventListener("click", function (e) { e.preventDefault(); open(b.getAttribute("data-need")); });
    });
    modal.querySelector("[data-modal-close]").addEventListener("click", close);
    modal.addEventListener("click", function (e) { if (e.target === modal) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) close(); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (f) { var bad = !f.value.trim() || (f.type === "email" && !/.+@.+\..+/.test(f.value)); f.classList.toggle("is-invalid", bad); if (bad) ok = false; });
      if (!ok) return;
      var d = new FormData(form);
      var body = ["Name: " + d.get("name"), "E-mail: " + d.get("email"), "Website: " + (d.get("website") || "-"), "Quantity: " + (d.get("qty") || "-"), "Needs: " + d.get("needs"), "Timing: " + (d.get("timing") || "-"), "", d.get("brief")].join("\n");
      location.href = "mailto:brian@nnovatestudios.com?subject=" + encodeURIComponent("New box project — " + d.get("needs")) + "&body=" + encodeURIComponent(body);
    });
  }

  /* ---------- Text split + reveals ---------- */
  function splitWords(el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", el.textContent.trim());
    el.innerHTML = words.map(function (w) { return '<span class="w" aria-hidden="true"><span>' + w + "</span></span>"; }).join(" ");
    return el.querySelectorAll(".w > span");
  }
  function initReveals() {
    var reveals = document.querySelectorAll("[data-reveal]");
    var splits = document.querySelectorAll("[data-split]");
    if (!hasGsap || reduced || !window.ScrollTrigger) { reveals.forEach(function (r) { r.style.opacity = 1; }); return; }
    splits.forEach(function (el) {
      var w = splitWords(el);
      gsap.from(w, { yPercent: 110, duration: 1.1, ease: "power3.out", stagger: 0.025, scrollTrigger: { trigger: el, start: "top 85%", once: true } });
    });
    reveals.forEach(function (el) {
      if (el.closest(".nv-hero")) return;
      gsap.fromTo(el, { opacity: 0, y: 40, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.1, ease: "power2.out", clearProps: "filter", scrollTrigger: { trigger: el, start: "top 90%", once: true } });
    });
    gsap.utils.toArray(".nv-card").forEach(function (c, i) {
      gsap.from(c, { opacity: 0, y: 50, duration: 1, ease: "power2.out", delay: (i % 3) * 0.08, scrollTrigger: { trigger: c, start: "top 92%", once: true } });
    });
    // subtle parallax on process images
    gsap.utils.toArray(".nv-process__steps img").forEach(function (im) {
      gsap.fromTo(im, { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.12, ease: "none", scrollTrigger: { trigger: im.parentNode, start: "top bottom", end: "bottom top", scrub: true } });
    });
  }

  function heroIn() {
    var copy = document.querySelector(".nv-hero__copy");
    var panels = document.querySelectorAll(".nv-hero__panel");
    var header = document.querySelector(".nv-header");
    if (!hasGsap || reduced) { copy.style.opacity = 1; return; }
    gsap.fromTo(panels, { opacity: 0, filter: "blur(18px)", scale: 1.05 }, { opacity: 1, filter: "blur(0px)", scale: 1, duration: 1.4, ease: "power2.out", stagger: 0.15, clearProps: "filter,transform" });
    gsap.fromTo(".nv-binder span", { opacity: 0, scaleX: 0.4 }, { opacity: 1, scaleX: 1, duration: 0.8, ease: "back.out(2)", stagger: 0.1, delay: 0.6 });
    gsap.fromTo(copy, { opacity: 0, y: 30, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.2, ease: "power2.out", delay: 0.35, clearProps: "filter" });
    gsap.fromTo([header, ".nv-footer"], { opacity: 0 }, { opacity: 1, duration: 0.9, ease: "power1.out", delay: 0.2 });
  }

  initMenu(); initHeader(); initReels(); initRail(); initPreview(); initArchive(); initSplit(); initModal(); initReveals();
  initIntro(heroIn);
})();
