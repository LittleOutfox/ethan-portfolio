/* ============================================================
   KYŪBI — a nine-tailed portfolio · v2
   spirit ink foxes · scroll-scrubbed forest journey · foxfire
   ============================================================ */

(function () {
  'use strict';

  var doc = document.documentElement;
  var reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var MOTION = hasGsap && !reducedQuery.matches;

  if (!MOTION) doc.classList.add('reduced');

  /* ------------------------------------------------------------
     1 · spirit mounts — the ink foxes, made of moonlight
     Each mount gets three stacked copies: a wide soft bloom,
     a tight bloom, and the sharp ink lines. Black ink is
     inverted to translucent white by CSS filters.
     ------------------------------------------------------------ */

  document.querySelectorAll('[data-kfox]').forEach(function (el) {
    var name = el.getAttribute('data-kfox');
    var src = 'assets/kitsune/' + name + '.svg';
    el.innerHTML =
      '<img class="bloom2" src="' + src + '" alt="" aria-hidden="true" draggable="false">' +
      '<img class="bloom" src="' + src + '" alt="" aria-hidden="true" draggable="false">' +
      '<img class="sharp" src="' + src + '" alt="" draggable="false">';
  });

  /* ------------------------------------------------------------
     2 · the journey — a forest that moves as you scroll
     ------------------------------------------------------------ */

  (function journey() {
    var v = document.getElementById('journey');
    if (!v) return;
    if (reducedQuery.matches) { v.remove(); return; }
    // fetch as blob: object URLs are fully seekable even when the
    // server (e.g. python http.server) doesn't support range requests
    var SRC = 'assets/journey.mp4?v=7';
    fetch(SRC)
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.blob(); })
      .then(function (b) { v.src = URL.createObjectURL(b); })
      .catch(function () { v.src = SRC; });
    var dur = 0, cur = 0;

    v.addEventListener('loadedmetadata', function () {
      dur = v.duration || 0;
      v.classList.add('ready');
    });
    v.addEventListener('error', function () {
      v.classList.remove('ready');
      v.remove();
    });

    function tick() {
      if (dur) {
        var max = doc.scrollHeight - window.innerHeight;
        var target = (max > 0 ? window.scrollY / max : 0) * Math.max(0, dur - 0.08);
        cur += (target - cur) * 0.045;
        if (Math.abs(cur - v.currentTime) > 0.033) {
          try { v.currentTime = cur; } catch (e) { /* not seekable yet */ }
        }
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  /* ------------------------------------------------------------
     4 · foxfire — drifting spirit lights
     ------------------------------------------------------------ */

  (function foxfire() {
    var canvas = document.getElementById('foxfire');
    if (!canvas || reducedQuery.matches) { if (canvas) canvas.remove(); return; }
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var W = 0, H = 0, parts = [];
    var fireSection = document.getElementById('fire');
    var warmth = 0;

    function sprite(r, g, b) {
      var s = document.createElement('canvas');
      s.width = s.height = 64;
      var c = s.getContext('2d');
      var grad = c.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',0.85)');
      grad.addColorStop(0.35, 'rgba(' + r + ',' + g + ',' + b + ',0.28)');
      grad.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
      c.fillStyle = grad;
      c.fillRect(0, 0, 64, 64);
      return s;
    }
    var cool = sprite(168, 180, 236);
    var warm = sprite(224, 160, 92);

    function spawn(anywhere) {
      return {
        x: Math.random() * W,
        y: anywhere ? Math.random() * H : H + 20,
        r: 0.8 + Math.random() * 2.6,
        v: 0.12 + Math.random() * 0.35,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.002 + Math.random() * 0.004,
        a: 0.12 + Math.random() * 0.34,
        pulse: Math.random() * Math.PI * 2
      };
    }

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var target = Math.max(24, Math.min(54, Math.round(W * H / 46000)));
      while (parts.length < target) parts.push(spawn(true));
      parts.length = target;
    }

    var lastY = window.scrollY, drift = 0;

    function frame() {
      var sy = window.scrollY;
      drift += (sy - lastY) * 0.03;
      drift *= 0.92;
      lastY = sy;

      if (fireSection) {
        var r = fireSection.getBoundingClientRect();
        var mid = r.top + r.height / 2;
        var d = Math.abs(mid - H / 2) / (r.height / 2 + H / 2);
        var targetWarm = Math.max(0, 1 - d * 1.6);
        warmth += (targetWarm - warmth) * 0.04;
      }

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.sway += p.swaySpeed;
        p.pulse += 0.015;
        p.y -= p.v + drift * 0.4 * p.v;
        p.x += Math.sin(p.sway) * 0.25;
        if (p.y < -30) { parts[i] = spawn(false); continue; }
        if (p.y > H + 40) { p.y = -20; p.x = Math.random() * W; }
        var alpha = p.a * (0.6 + 0.4 * Math.sin(p.pulse));
        var size = p.r * 9;
        if (warmth < 0.999) {
          ctx.globalAlpha = alpha * (1 - warmth);
          ctx.drawImage(cool, p.x - size / 2, p.y - size / 2, size, size);
        }
        if (warmth > 0.001) {
          ctx.globalAlpha = alpha * warmth;
          ctx.drawImage(warm, p.x - size / 2, p.y - size / 2, size, size);
        }
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(frame);
  })();

  /* ------------------------------------------------------------
     5 · the snowfield — quiet snow, stirred by your presence
     ------------------------------------------------------------ */

  (function snowfall() {
    var canvas = document.getElementById('poolCanvas');
    var section = document.getElementById('pool');
    if (!canvas || !section) return;
    if (reducedQuery.matches) { canvas.remove(); return; }
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var W = 0, H = 0, flakes = [], visible = false;
    var mx = -9999, my = -9999;

    function spawn(anywhere) {
      return {
        x: Math.random() * W,
        y: anywhere ? Math.random() * H : -6,
        r: 0.6 + Math.random() * 1.9,
        vy: 0.25 + Math.random() * 0.6,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.004 + Math.random() * 0.008,
        a: 0.2 + Math.random() * 0.5
      };
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var target = Math.max(50, Math.min(150, Math.round(W * H / 18000)));
      while (flakes.length < target) flakes.push(spawn(true));
      flakes.length = target;
    }

    section.addEventListener('mousemove', function (e) {
      var rect = canvas.getBoundingClientRect();
      mx = e.clientX - rect.left; my = e.clientY - rect.top;
    });
    section.addEventListener('mouseleave', function () { mx = -9999; my = -9999; });

    function frame() {
      if (!visible) { requestAnimationFrame(frame); return; }
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(236,238,248,1)';
      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        f.sway += f.swaySpeed;
        f.y += f.vy;
        f.x += Math.sin(f.sway) * 0.3;
        // a passing hand stirs the snow
        var dx = f.x - mx, dy = f.y - my;
        var d2 = dx * dx + dy * dy;
        if (d2 < 8100 && d2 > 1) {
          var d = Math.sqrt(d2);
          var push = (1 - d / 90) * 1.4;
          f.x += (dx / d) * push;
          f.y += (dy / d) * push * 0.5;
        }
        if (f.y > H + 8) { flakes[i] = spawn(false); continue; }
        if (f.x < -10) f.x = W + 8;
        if (f.x > W + 10) f.x = -8;
        ctx.globalAlpha = f.a;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }

    var io = new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) resize();
    }, { rootMargin: '100px' });
    io.observe(section);

    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(frame);
  })();

  /* ------------------------------------------------------------
     6 · veil — enter the dark
     ------------------------------------------------------------ */

  var veil = document.getElementById('veil');
  var entered = false;
  var lenis = null;

  function enter() {
    if (entered) return;
    entered = true;
    if (veil) veil.classList.add('gone');
    if (lenis) lenis.start();
    if (MOTION && window.__heroEntrance) window.__heroEntrance.play();
  }

  if (veil) {
    document.getElementById('veilEnter').addEventListener('click', enter);
    window.addEventListener('wheel', enter, { once: true, passive: true });
    window.addEventListener('touchmove', enter, { once: true, passive: true });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') enter();
    });
  }

  /* ------------------------------------------------------------
     7 · motion — the journey itself
     ------------------------------------------------------------ */

  if (!MOTION) {
    if (veil && reducedQuery.matches) veil.classList.add('gone');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  window.scrollTo(0, 0);

  if (typeof window.Lenis === 'function') {
    lenis = new Lenis({ duration: 1.25, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.stop(); // held until the veil lifts
  }

  // smooth anchor navigation
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = document.querySelector(a.getAttribute('href'));
      if (!target || !lenis) return; // no Lenis: native anchor jump
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.6 });
    });
  });

  // ---- spirit condensation: blooms first, then the ink ----------
  var LAYER_OPACITY = { bloom2: 0.38, bloom: 0.6, sharp: 0.95 };

  function condense(mount, opts) {
    opts = opts || {};
    var imgs = mount.querySelectorAll('img');
    gsap.set(imgs, { opacity: 0 });
    gsap.set(mount, { y: opts.y === undefined ? 30 : opts.y });
    var tl = gsap.timeline({ paused: true });
    tl.to(mount, { y: 0, duration: 2.2, ease: 'power2.out' }, 0);
    imgs.forEach(function (img, i) {
      var end = LAYER_OPACITY[img.className] || 1;
      tl.to(img, { opacity: end, duration: 1.6, ease: 'power2.out' }, i * 0.45);
    });
    return tl;
  }

  // ambient foxes materialize when their chapter nears
  ['.origin-fox', '.fire-fox', '.pool-fox-wrap'].forEach(function (sel) {
    var mount = document.querySelector(sel);
    if (!mount) return;
    var mounts = mount.classList.contains('spirit-mount') ? [mount]
      : Array.prototype.slice.call(mount.querySelectorAll('.spirit-mount'));
    var tls = mounts.map(function (m) { return condense(m); });
    ScrollTrigger.create({
      trigger: mount,
      start: 'top 82%',
      once: true,
      onEnter: function () { tls.forEach(function (t) { t.play(); }); }
    });
  });

  // ---- typographic choreography ----------------------------------
  // chapter titles rise line-by-line out of masked slots
  document.querySelectorAll('.ch-title').forEach(function (t) {
    var parts = t.innerHTML.split(/<br\s*\/?>/i);
    t.innerHTML = parts.map(function (p) {
      return '<span class="tl"><span class="tl-i">' + p + '</span></span>';
    }).join('');
    gsap.fromTo(t.querySelectorAll('.tl-i'),
      { yPercent: 108 },
      {
        yPercent: 0, duration: 1.5, ease: 'power4.out', stagger: 0.14,
        scrollTrigger: { trigger: t, start: 'top 85%', once: true }
      });
  });

  // hairline rules draw themselves in
  gsap.utils.toArray('.ch-rule').forEach(function (r) {
    gsap.fromTo(r, { scaleX: 0 }, {
      scaleX: 1, duration: 1.4, ease: 'power3.inOut',
      scrollTrigger: { trigger: r, start: 'top 88%', once: true }
    });
  });

  // chapter watermarks drift at their own pace — designed depth
  gsap.utils.toArray('.ch-watermark').forEach(function (w) {
    gsap.fromTo(w, { y: 70 }, {
      y: -70, ease: 'none',
      scrollTrigger: {
        trigger: w.closest('section') || w, start: 'top bottom', end: 'bottom top', scrub: 1.2
      }
    });
  });

  // ---- generic reveals (outside hero, titles handled above) ------
  gsap.utils.toArray('[data-reveal]').forEach(function (el) {
    if (el.closest('#hero') || el.classList.contains('ch-title')) return;
    gsap.fromTo(el, { y: 40, opacity: 0 }, {
      y: 0, opacity: 1, duration: 1.3, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 87%', once: true }
    });
  });

  // ---- continuity: each chapter drifts up as it hands over -------
  // (not the pool content — the site must END with it comfortably framed)
  gsap.utils.toArray('.origin .ch-grid, .fire .ch-grid').forEach(function (el) {
    gsap.to(el, {
      y: -50, ease: 'none',
      scrollTrigger: { trigger: el, start: 'bottom 45%', end: 'bottom -10%', scrub: 1 }
    });
  });

  // ---- 00 · hero: entrance + zoom-through -----------------------
  (function hero() {
    var zoom = document.querySelector('.hero-zoom');
    var spirit = document.querySelector('.hero-spirit');

    // the wordmark arrives letter by letter
    var ht = document.querySelector('.hero-title');
    ht.innerHTML = Array.from(ht.textContent).map(function (c) {
      return '<span class="hc">' + c + '</span>';
    }).join('');

    gsap.set('.hero-eyebrow, .hero-sub', { opacity: 0, y: 24 });
    gsap.set('.hero-title', { opacity: 0, filter: 'blur(16px)' });
    gsap.set('.hero-moon', { opacity: 0, scale: 0.85 });

    var entrance = gsap.timeline({ paused: true });
    entrance
      .to('.hero-moon', { opacity: 1, scale: 1, duration: 2.4, ease: 'power2.out' }, 0)
      .to('.hero-title', { opacity: 1, filter: 'blur(0px)', duration: 1.9, ease: 'expo.out' }, 0.2)
      .fromTo('.hero-title .hc',
        { yPercent: 46, opacity: 0 },
        { yPercent: 0, opacity: 1, stagger: 0.06, duration: 1.5, ease: 'expo.out' }, 0.25)
      .to('.hero-eyebrow', { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' }, 0.8)
      .to('.hero-sub', { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' }, 1.0)
      .add(condense(spirit, { y: 20 }).play(), 0.9);
    window.__heroEntrance = entrance;

    gsap.timeline({
      scrollTrigger: {
        trigger: '.hero-pin',
        start: 'top top',
        end: '+=160%',
        pin: true,
        scrub: 0.8
      }
    })
      .to(zoom, { scale: 1.55, ease: 'power1.in' }, 0)
      .to('.hero-title', { letterSpacing: '0.22em', ease: 'power1.in' }, 0)
      .to(zoom, { opacity: 0, ease: 'none' }, 0.45)
      .to('.hero-cue', { opacity: 0, ease: 'none', duration: 0.2 }, 0);
  })();

  // ---- origin fox: slow parallax --------------------------------
  gsap.to('.origin-fox', {
    y: -70, ease: 'none',
    scrollTrigger: { trigger: '#origin', start: 'top bottom', end: 'bottom top', scrub: 1 }
  });

  // ---- 02 · the hunt: horizontal travel --------------------------
  (function hunt() {
    var track = document.getElementById('huntTrack');
    var getDist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };

    var horiz = gsap.to(track, {
      x: function () { return -getDist(); },
      ease: 'none',
      scrollTrigger: {
        trigger: '.hunt-pin',
        start: 'top top',
        end: function () { return '+=' + getDist(); },
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true
      }
    });

    var foxMount = document.querySelector('.hunt-fox');
    var foxTl = condense(foxMount, { y: 0 });
    ScrollTrigger.create({
      trigger: '.hunt-pin', start: 'top 70%', once: true,
      onEnter: function () { foxTl.play(); }
    });
    // partly through the edge — hindquarters and tails in frame,
    // and it slips a little further out as you follow
    gsap.fromTo(foxMount, { x: function () { return window.innerWidth * 0.055; } }, {
      x: function () { return window.innerWidth * 0.14; },
      ease: 'none',
      scrollTrigger: {
        trigger: '.hunt-pin', start: 'top top',
        end: function () { return '+=' + getDist(); },
        scrub: 1.4, invalidateOnRefresh: true
      }
    });
    gsap.to(foxMount, { y: -7, duration: 2.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });

    gsap.utils.toArray('.skill').forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, y: 70 }, {
        opacity: 1, y: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: {
          trigger: el, containerAnimation: horiz,
          start: 'left 88%', once: true
        }
      });
      var kanji = el.querySelector('.skill-kanji');
      gsap.fromTo(kanji, { y: 50 }, {
        y: -30, ease: 'none',
        scrollTrigger: {
          trigger: el, containerAnimation: horiz,
          start: 'left right', end: 'right left', scrub: true
        }
      });
    });
  })();

  // ---- 03 · the leap: three torii gates -----------------------------
  // each work is a gate deep in the forest — approach it, read it,
  // then pass through as its beams sweep past the edges of the screen
  (function works() {
    var gates = gsap.utils.toArray('[data-wgate]');
    var foxMount = document.querySelector('.works-fox');
    var foxImgs = foxMount.querySelectorAll('img');
    gsap.set(foxImgs, { opacity: 0 });

    var num = document.getElementById('relicNum');
    var STEP = 2.6;

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.works-pin',
        start: 'top top',
        end: '+=400%',
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true
      }
    });
    // counter follows the timeline playhead, not raw scroll —
    // the scrub keeps easing after scrolling stops
    tl.eventCallback('onUpdate', function () {
      // gate i owns [2 + i*STEP, 2 + (i+1)*STEP); count from just before its arrival
      var idx = Math.max(1, Math.min(gates.length, Math.floor((tl.time() - 1.7) / STEP) + 1));
      var txt = '0' + idx;
      if (num.textContent !== txt) num.textContent = txt;
    });

    // the fox dives down past the heading
    tl.fromTo(foxMount,
      { y: function () { return -window.innerHeight * 0.7; } },
      { y: function () { return window.innerHeight * 0.15; }, duration: 1.8, ease: 'none' }, 0);
    foxImgs.forEach(function (img) {
      var end = LAYER_OPACITY[img.className] || 1;
      tl.to(img, { opacity: end, duration: 0.5, ease: 'none' }, 0.2);
      tl.to(img, { opacity: 0, duration: 0.4, ease: 'none' }, 1.5);
    });
    tl.to('.works-head', { opacity: 0, y: -60, duration: 0.7, ease: 'none' }, 1.3);

    gates.forEach(function (gate, i) {
      var at = 2 + i * STEP;
      var numEl = gate.querySelector('.wscene-num');
      var inner = gate.querySelector('.wgate-inner');

      // the gate stands far down the path — approach it
      tl.fromTo(gate,
        { opacity: 0, scale: 0.3, yPercent: 3 },
        { opacity: 1, scale: 1, yPercent: 0, duration: 1.15, ease: 'power2.out' },
        at);
      // its inscription resolves a beat later
      tl.fromTo(inner,
        { opacity: 0, y: 44 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' },
        at + 0.45);
      // the ghost numeral drifts at its own depth
      tl.fromTo(numEl,
        { scale: 0.75, opacity: 0.5 },
        { scale: 1.4, opacity: 1, duration: STEP + 0.5, ease: 'none' },
        at);
      // step through: the inscription dissolves, the beams sweep past
      tl.to(inner,
        { opacity: 0, duration: 0.4, ease: 'none' },
        at + STEP - 0.75);
      tl.to(gate,
        { scale: 3.6, opacity: 0, duration: 1.0, ease: 'power2.in' },
        at + STEP - 0.7);
    });
    tl.to({}, { duration: 0.6 });
  })();

  // ---- 04 · foxfire: the world warms ------------------------------
  gsap.fromTo('.tint', { opacity: 0 }, {
    opacity: 1, ease: 'none',
    scrollTrigger: { trigger: '#fire', start: 'top 75%', end: 'top 15%', scrub: true }
  });
  gsap.fromTo('.tint', { opacity: 1 }, {
    opacity: 0, ease: 'none', immediateRender: false,
    scrollTrigger: { trigger: '#fire', start: 'bottom 85%', end: 'bottom 25%', scrub: true }
  });
  gsap.to('.fire-fox', {
    y: -50, ease: 'none',
    scrollTrigger: { trigger: '#fire', start: 'top bottom', end: 'bottom top', scrub: 1 }
  });

  // ---- 05 · nine tails: transformation ----------------------------
  (function tails() {
    var TAILS = 5; // the sitting fox carries five drawn tails
    var STEP = 1.15;
    var spirit = document.querySelector('.tails-spirit');
    var listItems = document.querySelectorAll('#tailsList li');
    var num = document.getElementById('tailNum');

    var current = -1;
    function setCount(n) {
      if (n === current) return;
      current = n;
      num.textContent = '0' + Math.max(1, Math.min(TAILS, n + 1));
      listItems.forEach(function (li, i) {
        li.classList.toggle('lit', i <= n);
      });
    }

    function makeTl() {
      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: '.tails-pin',
          start: 'top top',
          end: '+=320%',
          pin: true,
          scrub: 1
        }
      });
      tl.eventCallback('onUpdate', function () {
        var n = Math.floor((tl.time() - 0.75) / STEP);
        setCount(Math.max(0, Math.min(TAILS - 1, n)));
      });
      return tl;
    }

    // split the drawing into its five real tails. The traced SVG's paths
    // are full-canvas layers, so we go one level deeper: every path is
    // broken into its subpaths (individual ink contours, converted to
    // absolute coords), each contour is classified by its angle around
    // the fan base, and contours are re-merged into per-tail paths that
    // unfurl from the base as their mark is earned.
    var ORIGIN = { x: 368, y: 322 };      // fan base in sitting.svg viewBox units

    function splitSubpaths(d) {
      var tokens = d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?(?:\d*\.\d+|\d+\.?\d*)/g) || [];
      var i = 0, cmd = null;
      var cx = 0, cy = 0, sx = 0, sy = 0;
      var subs = [], cur = null;
      function num() { return parseFloat(tokens[i++]); }
      function startSub(x, y) {
        cur = { d: 'M' + x + ' ' + y, minX: x, minY: y, maxX: x, maxY: y };
        subs.push(cur);
      }
      function pt(x, y) {
        if (x < cur.minX) cur.minX = x; if (x > cur.maxX) cur.maxX = x;
        if (y < cur.minY) cur.minY = y; if (y > cur.maxY) cur.maxY = y;
      }
      while (i < tokens.length) {
        var t = tokens[i];
        if (/^[A-Za-z]$/.test(t)) {
          cmd = t; i++;
          if (cmd === 'Z' || cmd === 'z') {
            if (cur) cur.d += 'Z';
            cx = sx; cy = sy; cur = null;
            continue;
          }
        }
        if (!cmd) { i++; continue; }
        var rel = cmd === cmd.toLowerCase();
        var C = cmd.toUpperCase();
        var x, y, x1, y1, x2, y2;
        if (!cur && C !== 'M') startSub(cx, cy);
        switch (C) {
          case 'M':
            x = num(); y = num();
            if (rel) { x += cx; y += cy; }
            cx = x; cy = y; sx = x; sy = y;
            startSub(x, y);
            cmd = rel ? 'l' : 'L';
            break;
          case 'L':
            x = num(); y = num();
            if (rel) { x += cx; y += cy; }
            cur.d += 'L' + x + ' ' + y; pt(x, y); cx = x; cy = y;
            break;
          case 'H':
            x = num(); if (rel) x += cx;
            cur.d += 'L' + x + ' ' + cy; pt(x, cy); cx = x;
            break;
          case 'V':
            y = num(); if (rel) y += cy;
            cur.d += 'L' + cx + ' ' + y; pt(cx, y); cy = y;
            break;
          case 'C':
            x1 = num(); y1 = num(); x2 = num(); y2 = num(); x = num(); y = num();
            if (rel) { x1 += cx; y1 += cy; x2 += cx; y2 += cy; x += cx; y += cy; }
            cur.d += 'C' + x1 + ' ' + y1 + ' ' + x2 + ' ' + y2 + ' ' + x + ' ' + y;
            pt(x1, y1); pt(x2, y2); pt(x, y); cx = x; cy = y;
            break;
          case 'S':
            x2 = num(); y2 = num(); x = num(); y = num();
            if (rel) { x2 += cx; y2 += cy; x += cx; y += cy; }
            cur.d += 'S' + x2 + ' ' + y2 + ' ' + x + ' ' + y;
            pt(x2, y2); pt(x, y); cx = x; cy = y;
            break;
          case 'Q':
            x1 = num(); y1 = num(); x = num(); y = num();
            if (rel) { x1 += cx; y1 += cy; x += cx; y += cy; }
            cur.d += 'Q' + x1 + ' ' + y1 + ' ' + x + ' ' + y;
            pt(x1, y1); pt(x, y); cx = x; cy = y;
            break;
          case 'T':
            x = num(); y = num();
            if (rel) { x += cx; y += cy; }
            cur.d += 'T' + x + ' ' + y; pt(x, y); cx = x; cy = y;
            break;
          case 'A':
            var rx = num(), ry = num(), rot = num(), laf = num(), sf = num();
            x = num(); y = num();
            if (rel) { x += cx; y += cy; }
            cur.d += 'A' + rx + ' ' + ry + ' ' + rot + ' ' + laf + ' ' + sf + ' ' + x + ' ' + y;
            pt(x, y); cx = x; cy = y;
            break;
          default:
            i++;
        }
      }
      return subs;
    }

    function classify(cx, cy) {
      if (cy > 418) return 'keep';                 // snow ground
      if (cx < 310) return 'keep';                 // head, chest, forelegs
      if (cx < 352 && cy > 298) return 'keep';     // rump and hind leg
      var dx = cx - ORIGIN.x, dy = ORIGIN.y - cy;
      if (Math.sqrt(dx * dx + dy * dy) < 26) return 'keep'; // fan knot
      var deg = Math.atan2(dy, dx) * 180 / Math.PI;
      if (deg > 97) return 0;
      if (deg > 72) return 1;
      if (deg > 47) return 2;
      if (deg > 15) return 3;
      return 4;
    }

    fetch('assets/kitsune/sitting.svg')
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (text) {
        var parsed = new DOMParser().parseFromString(text, 'image/svg+xml').documentElement;
        if (!parsed || parsed.nodeName.toLowerCase() !== 'svg') throw new Error('bad svg');
        spirit.innerHTML = '';
        spirit.appendChild(document.importNode(parsed, true));
        spirit.classList.add('tails-inline');
        var inline = spirit.querySelector('svg');
        var SVGNS = 'http://www.w3.org/2000/svg';

        var buckets = [[], [], [], [], []];
        Array.prototype.slice.call(inline.querySelectorAll('path')).forEach(function (p) {
          var subs = splitSubpaths(p.getAttribute('d') || '');
          if (!subs.length) return;
          var groups = { keep: '' , 0: '', 1: '', 2: '', 3: '', 4: '' };
          subs.forEach(function (s) {
            var g = classify((s.minX + s.maxX) / 2, (s.minY + s.maxY) / 2);
            groups[g] += s.d;
          });
          var parent = p.parentNode;
          ['keep', 0, 1, 2, 3, 4].forEach(function (g) {
            if (!groups[g]) return;
            var el = document.createElementNS(SVGNS, 'path');
            el.setAttribute('d', groups[g]);
            parent.insertBefore(el, p);
            if (g !== 'keep') buckets[g].push(el);
          });
          parent.removeChild(p);
        });

        var allTail = buckets.reduce(function (a, b) { return a.concat(b); }, []);
        allTail.forEach(function (p) {
          p.style.transformBox = 'view-box';
          p.style.transformOrigin = ORIGIN.x + 'px ' + ORIGIN.y + 'px';
        });
        gsap.set(spirit, { opacity: 0, y: 26 });
        gsap.set(allTail, { opacity: 0, scale: 0.55 });

        var tl = makeTl();
        tl.to(spirit, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0);
        buckets.forEach(function (bk, i) {
          if (!bk.length) return;
          tl.to(bk, {
            opacity: 1, scale: 1, duration: 0.68,
            ease: 'power2.out', stagger: 0.01
          }, 1.0 + i * STEP);
        });
        tl.to({}, { duration: 0.8 });
        ScrollTrigger.refresh();
      })
      .catch(function () {
        // fall back to the stepped mask wipe over the layered images
        var spiritImgs = spirit.querySelectorAll('img');
        gsap.set(spiritImgs, { opacity: 0 });
        var wipe = { p: 55 };
        var applyWipe = function () {
          spirit.style.setProperty('--wipe', wipe.p + '%');
        };
        var tl = makeTl();
        spiritImgs.forEach(function (img, i) {
          var end = LAYER_OPACITY[img.className] || 1;
          tl.to(img, { opacity: end, duration: 0.5, ease: 'none' }, i * 0.12);
        });
        var SPAN = (112 - 55) / TAILS;
        for (var i = 0; i < TAILS; i++) {
          tl.to(wipe, {
            p: 55 + SPAN * (i + 1),
            duration: 0.62, ease: 'power2.inOut',
            onUpdate: applyWipe
          }, 1.0 + i * STEP);
        }
        tl.to({}, { duration: 0.8 });
        ScrollTrigger.refresh();
      });
  })();

  // ---- 06 · the snowfield: the plunge -------------------------------
  // scrolling in drives the fox headfirst into the snowy hill
  gsap.fromTo('.pool-fox-wrap', { y: -170 }, {
    y: 0, ease: 'power1.in',
    scrollTrigger: { trigger: '#pool', start: 'top bottom', end: 'center 45%', scrub: 1 }
  });

  // ---- chrome: rail, nav state, cursor ------------------------------
  (function chrome() {
    var fill = document.getElementById('railFill');
    var count = document.getElementById('railCount');
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (self) {
        fill.style.transform = 'scaleY(' + self.progress + ')';
      }
    });

    var chapters = [
      ['#hero', '00', null],
      ['#origin', '01', 'origin'],
      ['#hunt', '02', 'hunt'],
      ['#works', '03', 'works'],
      ['#fire', '04', 'fire'],
      ['#tails', '05', 'tails'],
      ['#pool', '06', 'pool']
    ];
    chapters.forEach(function (ch) {
      ScrollTrigger.create({
        trigger: ch[0],
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: function (self) {
          if (!self.isActive) return;
          count.textContent = ch[1];
          document.querySelectorAll('.nav-links a').forEach(function (a) {
            a.classList.toggle('active', a.getAttribute('data-nav') === ch[2]);
          });
        }
      });
    });

    var halo = document.querySelector('.cursor-halo');
    var hx = -100, hy = -100, tx = -100, ty = -100, shown = false;
    window.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!shown) { shown = true; gsap.to(halo, { opacity: 1, duration: 0.6 }); }
    });
    gsap.ticker.add(function () {
      hx += (tx - hx) * 0.14;
      hy += (ty - hy) * 0.14;
      halo.style.transform = 'translate(' + (hx - 17) + 'px,' + (hy - 17) + 'px)';
    });
  })();

  // keep measurements honest once fonts and images arrive
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });

})();
