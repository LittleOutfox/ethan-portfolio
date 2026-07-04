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
     2 · extra tails — three ink petals that complete the nine
     Overlaid on the sitting fox in the transformation scene.
     ------------------------------------------------------------ */

  function tailPath(len, bend, w) {
    return 'M 0 0' +
      ' C ' + (-w) + ' ' + (-len * 0.30) + ' ' + (bend * 0.45 - w * 0.9) + ' ' + (-len * 0.78) + ' ' + bend + ' ' + (-len) +
      ' C ' + (bend * 0.45 + w * 0.8) + ' ' + (-len * 0.70) + ' ' + (w * 1.05) + ' ' + (-len * 0.26) + ' 0 0 Z';
  }

  var tailsExtra = document.getElementById('tailsExtra');
  if (tailsExtra) {
    // sitting.svg is 674x502; its tail fan grows from roughly (370, 310)
    var petals = [
      { x: 368, y: 306, ang: -6, len: 225, bend: 42, w: 26 },
      { x: 376, y: 310, ang: 24, len: 250, bend: 64, w: 30 },
      { x: 372, y: 314, ang: 48, len: 235, bend: 80, w: 27 }
    ];
    var svg = '<svg viewBox="0 0 674 502" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">';
    petals.forEach(function (p, i) {
      svg += '<g transform="translate(' + p.x + ' ' + p.y + ') rotate(' + p.ang + ')">' +
        '<g class="petal petal-' + i + '"><path d="' + tailPath(p.len, p.bend, p.w) + '"/></g></g>';
    });
    svg += '</svg>';
    tailsExtra.innerHTML = svg;
  }

  /* ------------------------------------------------------------
     3 · the journey — a forest that moves as you scroll
     ------------------------------------------------------------ */

  (function journey() {
    var v = document.getElementById('journey');
    if (!v) return;
    if (reducedQuery.matches) { v.remove(); return; }
    // fetch as blob: object URLs are fully seekable even when the
    // server (e.g. python http.server) doesn't support range requests
    var SRC = 'assets/journey.mp4?v=5';
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

  // ---- generic reveals (outside hero, titles handled above) ------
  gsap.utils.toArray('[data-reveal]').forEach(function (el) {
    if (el.closest('#hero') || el.classList.contains('ch-title')) return;
    gsap.fromTo(el, { y: 40, opacity: 0 }, {
      y: 0, opacity: 1, duration: 1.3, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 87%', once: true }
    });
  });

  // ---- continuity: each chapter drifts up as it hands over -------
  gsap.utils.toArray('.origin .ch-grid, .fire .ch-grid, .pool-content').forEach(function (el) {
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
    // it stays at the edge, always a little further gone
    gsap.fromTo(foxMount, { x: 0 }, {
      x: function () { return window.innerWidth * 0.09; },
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

  // ---- 03 · the leap: works corridor -----------------------------
  (function works() {
    var relics = gsap.utils.toArray('[data-relic]');
    var foxMount = document.querySelector('.works-fox');
    var foxImgs = foxMount.querySelectorAll('img');
    gsap.set(foxImgs, { opacity: 0 });

    var num = document.getElementById('relicNum');
    var offsets = [0.1, -0.08, 0.12, -0.05];

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.works-pin',
        start: 'top top',
        end: '+=340%',
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true
      }
    });
    // counter follows the timeline playhead, not raw scroll —
    // the scrub keeps easing after scrolling stops
    tl.eventCallback('onUpdate', function () {
      var idx = Math.max(1, Math.min(relics.length, Math.floor((tl.time() - 0.8) / 2)));
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

    relics.forEach(function (relic, i) {
      var at = 2 + i * 2;
      var off = offsets[i % offsets.length];
      tl.fromTo(relic,
        {
          xPercent: -50, yPercent: -50,
          x: function () { return window.innerWidth * off; },
          scale: 0.55, opacity: 0,
          rotationX: 14, rotationY: off * 60
        },
        { scale: 1, opacity: 1, rotationX: 0, rotationY: 0, duration: 0.85, ease: 'power1.inOut' },
        at);
      tl.to(relic,
        { scale: 1.45, opacity: 0, rotationX: -10, duration: 0.7, ease: 'power1.in' },
        at + 1.7);
    });
    tl.to({}, { duration: 0.4 });
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
    var spirit = document.querySelector('.tails-spirit');
    var spiritImgs = spirit.querySelectorAll('img');
    var petals = document.querySelectorAll('#tailsExtra .petal');
    var listItems = document.querySelectorAll('#tailsList li');
    var num = document.getElementById('tailNum');

    gsap.set(spiritImgs, { opacity: 0 });
    petals.forEach(function (g) {
      g.setAttribute('transform', 'scale(0.001)');
      g.style.opacity = '0';
    });

    var current = -1;
    function setCount(n) {
      if (n === current) return;
      current = n;
      num.textContent = '0' + Math.max(1, Math.min(9, n + 1));
      listItems.forEach(function (li, i) {
        li.classList.toggle('lit', i <= n);
      });
    }

    var wipe = { p: 55 };

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
      var p = Math.max(0, tl.progress() - 0.1) / 0.85;
      setCount(Math.max(0, Math.min(8, Math.floor(p * 9))));
    });

    // the fox condenses…
    spiritImgs.forEach(function (img, i) {
      var end = LAYER_OPACITY[img.className] || 1;
      tl.to(img, { opacity: end, duration: 0.5, ease: 'none' }, i * 0.12);
    });

    // …then the fan sweeps open across the drawn tails…
    tl.to(wipe, {
      p: 112, duration: 6.4, ease: 'none',
      onUpdate: function () {
        spirit.style.setProperty('--wipe', wipe.p + '%');
      }
    }, 0.9);

    // …and the last three tails unfurl beyond the ink
    petals.forEach(function (g, i) {
      var proxy = { v: 0.001 };
      tl.to(proxy, {
        v: 1, duration: 0.8, ease: 'power2.out',
        onUpdate: function () {
          g.setAttribute('transform', 'scale(' + proxy.v + ')');
          g.style.opacity = Math.min(1, proxy.v * 1.4);
        }
      }, 5.0 + i * 0.85);
    });

    tl.to({}, { duration: 0.5 });
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
