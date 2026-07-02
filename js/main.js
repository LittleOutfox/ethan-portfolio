/* ============================================================
   KYŪBI — a nine-tailed portfolio
   fox renderer · scroll choreography · foxfire · moon pool
   ============================================================ */

(function () {
  'use strict';

  var doc = document.documentElement;
  var reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var MOTION = hasGsap && !reducedQuery.matches;

  if (!MOTION) doc.classList.add('reduced');

  /* ------------------------------------------------------------
     1 · fox renderer — one spirit, six poses
     ------------------------------------------------------------ */

  function foxHead(opts) {
    opts = opts || {};
    var eye = opts.eye === 'closed'
      ? '<path class="ln" d="M -38 -9 q 7 4 13 0"/>'
      : '<circle class="dot" cx="-33" cy="-11" r="2.6"/>';
    return '' +
      '<path class="ln" d="M 2 4 C -1 -8 -7 -17 -17 -22 C -31 -28 -46 -21 -60 -4"/>' +
      '<path class="ln" d="M -60 -4 C -50 3 -38 5 -28 4 C -18 3 -8 5 -2 12"/>' +
      '<path class="ln" d="M -8 -21 C -6 -32 -3 -42 1 -50 C 6 -38 9 -28 11 -17"/>' +
      '<path class="ln" d="M -27 -23 C -28 -34 -28 -45 -27 -55 C -20 -46 -14 -36 -11 -25"/>' +
      eye +
      '<circle class="dot" cx="-60" cy="-4" r="2.2"/>';
  }

  function tailPath(len, bend, w) {
    return 'M 0 0' +
      ' C ' + (-w) + ' ' + (-len * 0.30) + ' ' + (bend * 0.45 - w * 0.9) + ' ' + (-len * 0.78) + ' ' + bend + ' ' + (-len) +
      ' C ' + (bend * 0.45 + w * 0.8) + ' ' + (-len * 0.70) + ' ' + (w * 1.05) + ' ' + (-len * 0.26) + ' 0 0 Z';
  }

  function tailG(x, y, ang, len, bend, w, idx) {
    var cls = idx === undefined ? 'tail' : 'tail t' + idx;
    return '<g class="' + cls + '" transform="translate(' + x + ' ' + y + ') rotate(' + ang + ')">' +
      '<g class="tail-inner"><path class="tailfill" d="' + tailPath(len, bend, w) + '"/></g></g>';
  }

  function seatedBody() {
    return '' +
      '<path class="ln" d="M 268 292 C 288 238 266 184 226 170 C 213 165 206 157 202 147"/>' +
      '<g transform="translate(202 147) rotate(-6)">' + foxHead() + '</g>' +
      '<path class="ln" d="M 198 160 C 190 202 187 258 189 314"/>' +
      '<path class="ln" d="M 189 314 L 172 314"/>' +
      '<path class="ln" d="M 228 252 C 238 274 246 294 252 312"/>' +
      '<path class="ln" d="M 252 312 L 234 313"/>';
  }

  function fanBody() {
    return '' +
      '<path class="ln" d="M 252 268 C 272 220 252 172 214 160 C 202 156 196 148 192 138"/>' +
      '<g transform="translate(192 138) rotate(-6)">' + foxHead() + '</g>' +
      '<path class="ln" d="M 188 152 C 180 196 177 254 179 310"/>' +
      '<path class="ln" d="M 179 310 L 162 310"/>' +
      '<path class="ln" d="M 214 244 C 224 266 232 288 238 308"/>' +
      '<path class="ln" d="M 238 308 L 220 309"/>';
  }

  function nineTails() {
    var out = '';
    for (var i = 0; i < 9; i++) {
      var t = i / 8;
      var ang = -52 + t * 144;
      var len = 140 + Math.sin(t * Math.PI) * 75;
      var bend = (t - 0.4) * 85;
      var bx = 252 + (t - 0.5) * 26;
      var by = 268 - Math.sin(t * Math.PI) * 8;
      out += tailG(bx, by, ang, len, bend, 11 + Math.sin(t * Math.PI) * 4, i);
    }
    return out;
  }

  var POSES = {
    curl: {
      vb: '70 90 250 225',
      draw: function () {
        return tailG(240, 262, -115, 130, 60, 24) +
          '<path class="ln" d="M 252 150 C 224 122 180 116 146 136 C 108 158 96 208 116 244 C 134 276 180 292 220 276 C 230 272 236 268 240 262"/>' +
          '<g transform="translate(240 158) rotate(60) scale(-0.95,0.95)">' + foxHead({ eye: 'closed' }) + '</g>';
      }
    },
    seated: {
      vb: '120 70 285 265',
      draw: function () { return tailG(268, 292, 95, 118, -42, 24) + seatedBody(); }
    },
    stalk: {
      vb: '-75 120 490 200',
      draw: function () {
        return tailG(90, 232, -112, 150, 42, 20) +
          '<path class="ln" d="M 90 232 C 150 212 230 208 288 222 C 296 224 302 228 306 233"/>' +
          '<g transform="translate(306 233) rotate(-10) scale(-1,1)">' + foxHead() + '</g>' +
          '<path class="ln" d="M 272 240 C 272 264 272 284 274 304"/>' +
          '<path class="ln" d="M 274 304 L 290 304"/>' +
          '<path class="ln" d="M 128 240 C 122 264 122 286 124 306"/>' +
          '<path class="ln" d="M 124 306 L 140 306"/>';
      }
    },
    leap: {
      vb: '-20 125 440 190',
      draw: function () {
        return tailG(126, 268, -104, 122, 40, 20) +
          '<path class="ln" d="M 126 268 C 170 182 274 158 334 196"/>' +
          '<g transform="translate(338 199) rotate(14) scale(-1,1)">' + foxHead() + '</g>' +
          '<path class="ln" d="M 318 220 C 330 244 344 266 360 286"/>' +
          '<path class="ln" d="M 306 224 C 314 250 322 272 332 294"/>' +
          '<path class="ln" d="M 150 252 C 134 272 118 288 100 300"/>' +
          '<path class="ln" d="M 168 258 C 158 276 148 290 136 302"/>';
      }
    },
    gaze: {
      vb: '95 35 265 300',
      draw: function () {
        return tailG(268, 296, 93, 116, -40, 23) +
          '<path class="ln" d="M 268 296 C 288 242 266 190 226 176 C 213 171 206 163 203 153"/>' +
          '<g transform="translate(203 153) rotate(-38)">' + foxHead() + '</g>' +
          '<path class="ln" d="M 200 166 C 192 206 189 260 191 316"/>' +
          '<path class="ln" d="M 191 316 L 174 316"/>' +
          '<path class="ln" d="M 228 256 C 238 278 246 296 252 314"/>' +
          '<circle class="dot ember-dot" cx="150" cy="66" r="4.5"/>' +
          '<circle class="dot ember-dot" cx="126" cy="96" r="2"/>' +
          '<circle class="dot ember-dot" cx="170" cy="94" r="2.6"/>';
      }
    },
    fan: {
      vb: '25 20 395 330',
      draw: function () { return nineTails() + fanBody(); }
    },
    pool: {
      vb: '25 20 395 330',
      draw: function () { return nineTails() + fanBody(); }
    }
  };

  document.querySelectorAll('[data-fox]').forEach(function (el) {
    var pose = POSES[el.getAttribute('data-fox')];
    if (!pose) return;
    el.innerHTML = '<svg viewBox="' + pose.vb + '" xmlns="http://www.w3.org/2000/svg">' + pose.draw() + '</svg>';
  });

  /* ------------------------------------------------------------
     2 · foxfire — drifting spirit lights
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

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var target = Math.max(24, Math.min(54, Math.round(W * H / 46000)));
      while (parts.length < target) parts.push(spawn(true));
      parts.length = target;
    }

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

    var lastY = window.scrollY, drift = 0;

    function frame(t) {
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
     3 · moon pool — still water, easily disturbed
     ------------------------------------------------------------ */

  (function moonPool() {
    var canvas = document.getElementById('poolCanvas');
    var section = document.getElementById('pool');
    if (!canvas || !section) return;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var W = 0, H = 0, visible = false;
    var ripples = [];
    var reduced = reducedQuery.matches;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function addRipple(x, y, strength) {
      if (ripples.length > 26) ripples.shift();
      ripples.push({ x: x, y: y, r: 4, v: 0.9 + strength, a: 0.5 * (0.6 + strength) });
    }

    var lastMx = -999, lastMy = -999;
    section.addEventListener('mousemove', function (e) {
      var rect = canvas.getBoundingClientRect();
      var x = e.clientX - rect.left, y = e.clientY - rect.top;
      if (y < 0 || y > H) return;
      if (Math.hypot(x - lastMx, y - lastMy) > 30) {
        addRipple(x, y, 0.4);
        lastMx = x; lastMy = y;
      }
    });

    var autoTimer = 0;

    function frame(t) {
      if (!visible) { requestAnimationFrame(frame); return; }
      var time = t * 0.001;

      autoTimer -= 1;
      if (autoTimer <= 0 && !reduced) {
        addRipple(W * (0.15 + Math.random() * 0.7), H * (0.1 + Math.random() * 0.6), 0.15);
        autoTimer = 130 + Math.random() * 120;
      }

      ctx.clearRect(0, 0, W, H);

      // ripple rings — the pool image below carries the moonlight
      for (var j = ripples.length - 1; j >= 0; j--) {
        var r2 = ripples[j];
        r2.r += r2.v;
        r2.a *= 0.972;
        if (r2.a < 0.01) { ripples.splice(j, 1); continue; }
        ctx.strokeStyle = 'rgba(200,208,244,' + (r2.a * 0.55).toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(r2.x, r2.y, r2.r, r2.r * 0.32, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

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
     4 · veil — enter the dark
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
     5 · motion — the journey itself
     ------------------------------------------------------------ */

  if (!MOTION) {
    // No choreography: everything is visible, tails are grown, story intact.
    if (veil && reducedQuery.matches) veil.classList.add('gone');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
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

  // ---- stroke drawing helper ------------------------------------
  function prepareDraw(mount) {
    var paths = mount.querySelectorAll('.ln');
    paths.forEach(function (p) {
      var len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });
    return paths;
  }

  function drawTween(paths, opts) {
    return gsap.to(paths, Object.assign({
      strokeDashoffset: 0,
      duration: 1.8,
      ease: 'power2.inOut',
      stagger: 0.12
    }, opts || {}));
  }

  // draw-in for the ambient foxes (origin, fire, pool)
  ['.origin-fox', '.fire-fox', '.pool-fox-wrap'].forEach(function (sel) {
    var mount = document.querySelector(sel);
    if (!mount) return;
    var paths = prepareDraw(mount);
    var tails = mount.querySelectorAll('.tailfill');
    gsap.set(tails, { opacity: 0 });
    ScrollTrigger.create({
      trigger: mount,
      start: 'top 82%',
      once: true,
      onEnter: function () {
        drawTween(paths);
        gsap.to(tails, { opacity: 1, duration: 1.6, delay: 0.9, ease: 'power2.out' });
      }
    });
  });

  // ---- generic reveals (outside hero) ---------------------------
  gsap.utils.toArray('[data-reveal]').forEach(function (el) {
    if (el.closest('#hero')) return;
    gsap.fromTo(el, { y: 40, opacity: 0 }, {
      y: 0, opacity: 1, duration: 1.3, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 87%', once: true }
    });
  });

  // ---- 00 · hero: entrance + zoom-through -----------------------
  (function hero() {
    var zoom = document.querySelector('.hero-zoom');

    gsap.set('.hero-eyebrow, .hero-sub', { opacity: 0, y: 24 });
    gsap.set('.hero-title', { opacity: 0, scale: 0.965, filter: 'blur(16px)' });
    gsap.set('.hero-moon', { opacity: 0, scale: 0.85 });
    gsap.set('.hero-relic', { opacity: 0, y: 26, scale: 0.94 });

    var entrance = gsap.timeline({ paused: true });
    entrance
      .to('.hero-moon', { opacity: 1, scale: 1, duration: 2.4, ease: 'power2.out' }, 0)
      .to('.hero-title', { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.9, ease: 'expo.out' }, 0.2)
      .to('.hero-eyebrow', { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' }, 0.7)
      .to('.hero-sub', { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' }, 0.9)
      .to('.hero-relic', { opacity: 1, y: 0, scale: 1, duration: 2.4, ease: 'power2.out' }, 1.0);
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

    // fox stalks forward as the forest slides past
    var foxMount = document.querySelector('.hunt-fox');
    var paths = prepareDraw(foxMount);
    var tails = foxMount.querySelectorAll('.tailfill');
    gsap.set(tails, { opacity: 0 });
    ScrollTrigger.create({
      trigger: '.hunt-pin', start: 'top 70%', once: true,
      onEnter: function () {
        drawTween(paths);
        gsap.to(tails, { opacity: 1, duration: 1.4, delay: 0.8 });
      }
    });
    gsap.fromTo(foxMount, { x: 0 }, {
      x: function () { return window.innerWidth * 0.42; },
      ease: 'none',
      scrollTrigger: {
        trigger: '.hunt-pin', start: 'top top',
        end: function () { return '+=' + getDist(); },
        scrub: 1.4, invalidateOnRefresh: true
      }
    });
    // breathing
    gsap.to(foxMount, { y: -7, duration: 2.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });

    // skills surface as they enter from the right
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
    var paths = prepareDraw(foxMount);
    var tails = foxMount.querySelectorAll('.tailfill');
    gsap.set(tails, { opacity: 0 });
    ScrollTrigger.create({
      trigger: '.works-pin', start: 'top 60%', once: true,
      onEnter: function () {
        drawTween(paths, { duration: 1.4 });
        gsap.to(tails, { opacity: 1, duration: 1.2, delay: 0.6 });
      }
    });

    var num = document.getElementById('relicNum');
    var offsets = [0.1, -0.08, 0.12, -0.05]; // fraction of viewport width

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.works-pin',
        start: 'top top',
        end: '+=340%',
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: function () {
          // relic i occupies [2 + 2i, 2 + 2i + 2.4] on the timeline
          var idx = Math.max(1, Math.min(relics.length, Math.floor((tl.time() - 0.8) / 2)));
          var txt = '0' + idx;
          if (num.textContent !== txt) num.textContent = txt;
        }
      }
    });

    // the fox leaps across while the heading holds
    tl.fromTo(foxMount,
      { x: function () { return -window.innerWidth * 0.75; }, y: 40, opacity: 0 },
      { x: 0, opacity: 1, duration: 1.6, ease: 'none' }, 0);
    tl.to(foxMount, { y: -110, duration: 0.8, ease: 'power1.out' }, 0);
    tl.to(foxMount, { y: 30, duration: 0.8, ease: 'power1.in' }, 0.8);
    tl.to(foxMount, { opacity: 0, duration: 0.5, ease: 'none' }, 1.6);
    tl.to('.works-head', { opacity: 0, y: -60, duration: 0.7, ease: 'none' }, 1.3);

    // relics fly past the camera
    relics.forEach(function (relic, i) {
      var at = 2 + i * 2;
      var off = offsets[i % offsets.length];
      tl.fromTo(relic,
        {
          xPercent: -50, yPercent: -50,
          x: function () { return window.innerWidth * off; },
          scale: 0.55, opacity: 0
        },
        { scale: 1, opacity: 1, duration: 0.85, ease: 'power1.inOut' },
        at);
      tl.to(relic,
        { scale: 1.45, opacity: 0, duration: 0.7, ease: 'power1.in' },
        at + 1.7);
    });
    tl.to({}, { duration: 0.4 }); // breathing room at the end
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
  // embers above the gazing fox drift
  gsap.utils.toArray('.fire-fox .ember-dot').forEach(function (d, i) {
    gsap.to(d, {
      y: -12 - i * 4, duration: 2.4 + i * 0.7,
      yoyo: true, repeat: -1, ease: 'sine.inOut', delay: i * 0.5
    });
  });

  // ---- 05 · nine tails: transformation ----------------------------
  (function tails() {
    var scene = document.querySelector('.tails-scene');
    var paths = prepareDraw(scene);
    var tailGroups = scene.querySelectorAll('.tail-inner');
    var listItems = document.querySelectorAll('#tailsList li');
    var num = document.getElementById('tailNum');

    // tails start folded
    tailGroups.forEach(function (g) {
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

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.tails-pin',
        start: 'top top',
        end: '+=320%',
        pin: true,
        scrub: 1,
        onUpdate: function (self) {
          var p = Math.max(0, self.progress - 0.12) / 0.85;
          setCount(Math.max(0, Math.min(8, Math.floor(p * 9))));
        }
      }
    });

    // the fox draws itself first
    paths.forEach(function (p) {
      tl.to(p, { strokeDashoffset: 0, duration: 0.35, ease: 'none' }, 0);
    });

    // then each tail unfurls
    tailGroups.forEach(function (g, i) {
      var proxy = { v: 0.001 };
      tl.to(proxy, {
        v: 1, duration: 0.55, ease: 'power2.out',
        onUpdate: function () {
          g.setAttribute('transform', 'scale(' + proxy.v + ')');
          g.style.opacity = Math.min(1, proxy.v * 1.6);
        }
      }, 0.5 + i * 0.32);
    });

    tl.to({}, { duration: 0.4 });
  })();

  // ---- 06 · moon pool: arrival -------------------------------------
  gsap.fromTo('.pool-bg', { opacity: 0 }, {
    opacity: 1, ease: 'none',
    scrollTrigger: { trigger: '#pool', start: 'top 85%', end: 'top 25%', scrub: 1 }
  });
  gsap.fromTo('.pool-fox-wrap', { y: 50 }, {
    y: 0, ease: 'none',
    scrollTrigger: { trigger: '#pool', start: 'top bottom', end: 'center center', scrub: 1 }
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

    // cursor halo
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

  // keep measurements honest once fonts arrive
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });

})();
