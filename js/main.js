/* ============================================================
   ORIGIN — a nine-tailed portfolio
   spirit ink foxes · a 3D forest you travel through · foxfire
   ============================================================ */

(function () {
  'use strict';

  var doc = document.documentElement;
  var reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var MOTION = hasGsap && !reducedQuery.matches;

  // device tiers — COARSE = any touch device, PHONE = small touch
  // screen (drops the widest bloom layer). The 3D world tiers itself
  // (world/src/tiers.ts).
  var COARSE = window.matchMedia('(pointer: coarse)').matches;
  var PHONE = COARSE && Math.min(window.screen.width, window.screen.height) < 820;

  if (!MOTION) doc.classList.add('reduced');

  /* ------------------------------------------------------------
     1 · spirit mounts — the ink foxes, made of moonlight
     Each mount gets three stacked copies: a wide soft bloom,
     a tight bloom, and the sharp ink lines. Black ink is
     inverted to translucent white by CSS filters.
     ------------------------------------------------------------ */

  // veil + hero art loads eagerly (and is counted by the gate below);
  // every below-fold fox lazy-loads on approach instead, so it never
  // steals bandwidth from the gated world during the veil
  var EAGER_FOX = { descending: 1, sitting: 1 };
  // The ink ships as lossless WebP rasters baked in Chrome from the
  // drawings (tools/bake-fox-rasters.mjs). The autotraced SVGs carry
  // 130k–500k path commands each, and the browser re-rasterized that
  // soup whenever a mount's layer changed — which the choreography does
  // on every scrolled frame: 20–100 ms main-thread stalls that landed as
  // dropped frames through works, the den and the tails. A raster costs
  // one decode, then rides the compositor.
  //   dims   — the drawing's viewBox. width/height attributes make the
  //            browser reserve the fox's exact box BEFORE a lazy file
  //            loads; without them an in-flow fox grew from zero height
  //            mid-scroll and stale-dated every ScrollTrigger pin below.
  //   widths — the baked candidates (assets/kitsune/<pose>-<w>.webp),
  //            each a 1:1 transcription at that pixel width. srcset lets
  //            every display take the smallest one that still lands one
  //            device pixel per baked pixel, so a 1x desktop never
  //            decodes a retina bake and a 3x phone never upscales one.
  // Each mount's data-fox-sizes (index.html) mirrors its CSS width rule
  // per tier (css/styles.css) — keep them in sync when a rule changes.
  var FOX = {
    bowing: { dims: [665, 592], widths: [580, 680, 1160, 1360] },
    descending: { dims: [232, 533], widths: [160, 320, 480] },
    diving: { dims: [399, 721], widths: [310, 620] },
    howling: { dims: [546, 569], widths: [520, 620, 1040, 1240] },
    sitting: { dims: [674, 502], widths: [620, 840, 1240, 1680] },
    standing: { dims: [450, 750], widths: [400, 800] },
    walking: { dims: [630, 404], widths: [480, 960] }
  };
  function foxFile(name, w) { return 'assets/kitsune/' + name + '-' + w + '.webp'; }
  // the candidate the browser's own srcset choice lands on for a mount
  // shown cssPx wide on this screen: the smallest that still covers one
  // device pixel per baked pixel, else the largest
  function foxPick(name, cssPx) {
    var need = cssPx * (window.devicePixelRatio || 1), ws = FOX[name].widths;
    for (var i = 0; i < ws.length; i++) if (ws[i] >= need) return foxFile(name, ws[i]);
    return foxFile(name, ws[ws.length - 1]);
  }
  document.querySelectorAll('[data-kfox]').forEach(function (el) {
    var name = el.getAttribute('data-kfox');
    var fox = FOX[name];
    // the glow layers are pre-baked WebPs too (invert+brightness+blur
    // rendered offline, tools/bake-blooms.js) — scrolling a fox into
    // view never builds a live Gaussian-blur surface
    var glow = 'assets/kitsune/' + name + '-bloom';
    var lazy = EAGER_FOX[name] ? '' : ' loading="lazy" decoding="async"';
    var size = ' width="' + fox.dims[0] + '" height="' + fox.dims[1] + '"';
    var srcset = fox.widths.map(function (w) { return foxFile(name, w) + ' ' + w + 'w'; }).join(', ');
    var sizes = el.getAttribute('data-fox-sizes') || '100vw';
    el.innerHTML =
      (PHONE ? '' : '<img class="bloom2" data-baked src="' + glow + '2.webp" alt="" aria-hidden="true" draggable="false"' + lazy + '>') +
      '<img class="bloom" data-baked src="' + glow + '.webp" alt="" aria-hidden="true" draggable="false"' + lazy + '>' +
      '<img class="sharp" src="' + foxFile(name, fox.widths[fox.widths.length - 1]) + '" srcset="' + srcset + '" sizes="' + sizes + '" alt="" draggable="false"' + lazy + size + '>';
  });

  /* ------------------------------------------------------------
     2 · the loading gate — the forest readies itself before entry
     The veil counts the world in as it builds, and only offers
     Enter once its first frame has been drawn.
     ------------------------------------------------------------ */

  var gate = (function () {
    var veilEl = document.getElementById('veil');
    var pctEl = document.getElementById('veilPct');
    var fillEl = document.getElementById('veilFill');
    var parts = { world: 0, foxes: 0, fonts: 0 };
    var weights = { world: 0.6, foxes: 0.25, fonts: 0.15 };
    var ready = false, readyAt = 0;
    function open() {
      if (ready) return;
      ready = true;
      readyAt = performance.now();
      if (veilEl) veilEl.classList.add('ready');
      // born disabled (index.html) so focus can only land on Enter once it can act
      var btn = document.getElementById('veilEnter');
      if (btn) btn.disabled = false;
    }
    function paint() {
      var p = 0, k;
      for (k in parts) p += parts[k] * weights[k];
      p = Math.max(0, Math.min(1, p));
      var pct = Math.round(p * 100);
      // hold the count at 99 until everything is truly in, then let
      // 100 land as its own settle beat as the gate opens
      if (pct > 99 && !ready) pct = 99;
      if (p >= 1 && !ready) { open(); pct = 100; }
      if (p >= 1 && slowBtn) {
        // the forest finished after a failsafe unlock — stop saying it
        // is still loading
        if (slowBtn.firstChild) slowBtn.firstChild.nodeValue = 'Enter';
        slowBtn = null;
      }
      if (pctEl) pctEl.textContent = (pct < 10 ? '0' : '') + pct;
      if (fillEl) fillEl.style.transform = 'scaleX(' + p + ')';
    }
    // never trap a visitor behind a stalled request — but never lie
    // either: unlock entry honestly (no fake 100; the count retires at
    // its true value and the button copy owns the wait)
    var slowBtn = null;
    setTimeout(function () {
      if (ready) return;
      var btn = document.getElementById('veilEnter');
      if (btn && btn.firstChild && btn.firstChild.nodeType === 3) {
        btn.firstChild.nodeValue = 'Enter while the forest loads';
        slowBtn = btn;
      }
      open();
    }, 12000);
    paint();
    return {
      set: function (key, val) {
        if (val > (parts[key] || 0)) { parts[key] = val; paint(); }
      },
      isReady: function () { return ready; },
      readySince: function () { return readyAt; }
    };
  })();

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { gate.set('fonts', 1); });
  } else {
    gate.set('fonts', 1);
  }

  // the first-seen artwork joins the gate: the veil fox and hero fox
  // sharp layers must be fetched and decoded before Enter, so no fox
  // can ever pop in after the veil lifts (a decoded bitmap paints in
  // the same frame it is asked for)
  (function gateFoxes() {
    var sharps = document.querySelectorAll('.veil-spirit img.sharp, .hero-spirit img.sharp');
    if (!sharps.length) { gate.set('foxes', 1); return; }
    var done = 0;
    Array.prototype.forEach.call(sharps, function (img) {
      var fin = function () { done += 1; gate.set('foxes', done / sharps.length); };
      if (img.decode) img.decode().then(fin, fin);
      else if (img.complete) fin();
      else { img.addEventListener('load', fin); img.addEventListener('error', fin); }
    });
  })();

  /* ------------------------------------------------------------
     3 · the world — a moonlit forest you travel through
     The 3D backdrop is its own small build (world/ → js/world/
     scene.js). This page stays the only owner of the scroll: every
     chapter writes its progress onto one plain object, and the world
     reads it and draws when the ticker at the end of §7 asks it to.
     ------------------------------------------------------------ */

  var world = window.__world = {
    // one 0..1 progress per story segment; the world's clock is their sum
    p: { hero: 0, origin: 0, hunt: 0, trail: 0, works: 0, den: 0, climb: 0, tails: 0, snow: 0 },
    gates: [],     // works progress at which each DOM gate passes through
    tails: 0,      // tails earned, 0..5
    vel: 0,        // damped scroll velocity, -1..1
    warm: 0,       // the den's warmth, 0..1
    intro: 0,      // 0 → 1 as the hero enters
    state: 'off',  // off → boot → ready → active, or failed
    report: null,  // (0..1) the world's honest build progress
    fail: null,    // the world could not run: fall back to the 2D ambience
    frame: null    // set by the world: draw one frame (ticker time, seconds)
  };

  // the 2D embers and snow are the fallback atmosphere — they run
  // exactly when the world can't
  function worldOwnsAmbience() { return world.state === 'ready' || world.state === 'active'; }
  function ambience() {
    if (worldOwnsAmbience()) { if (window.__foxfireStop) window.__foxfireStop(); }
    else if (entered && window.__foxfireStart) window.__foxfireStart();
    if (window.__snowSync) window.__snowSync();
  }
  // show the world: on Enter, or on arrival after a failsafe entry
  function wake() {
    if (world.state !== 'ready' || !entered) return;
    world.state = 'active';
    doc.classList.add('world-on');
  }

  world.report = function (p) {
    if (world.state !== 'boot') return;
    gate.set('world', p);
    if (p >= 1) {
      world.state = 'ready';
      ambience();
      wake();
    }
  };
  world.fail = function (why) {
    if (world.state === 'failed') return;
    world.state = 'failed';
    world.frame = null;
    doc.classList.remove('world-on');
    gate.set('world', 1); // the world is optional; entry is not
    ambience();
    if (why && window.console) console.warn('[world] off:', why);
  };

  // the head script already preloads the module (same URL, so this
  // reuses that download); append it now that the bus exists. Touch
  // devices wait for idle so the veil paints first.
  if (MOTION && window.__worldSrc) {
    world.state = 'boot';
    var loadWorld = function () {
      var s = document.createElement('script');
      s.type = 'module';
      s.src = window.__worldSrc;
      s.onerror = function () { world.fail('load'); };
      document.body.appendChild(s);
    };
    if (COARSE && window.requestIdleCallback) window.requestIdleCallback(loadWorld, { timeout: 1500 });
    else loadWorld();
  } else {
    gate.set('world', 1);
  }


  /* ------------------------------------------------------------
     4 · foxfire — drifting spirit lights
     ------------------------------------------------------------ */

  (function foxfire() {
    var canvas = document.getElementById('foxfire');
    if (!canvas || reducedQuery.matches) { if (canvas) canvas.remove(); return; }
    var ctx = canvas.getContext('2d');
    var dpr = COARSE ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
    var W = 0, H = 0, parts = [];
    var fireSection = document.getElementById('fire');
    var warmth = 0, targetWarm = 0, externalWarm = false;
    var energy = 0; // damped |scroll velocity| 0..1 — the embers quicken with travel

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

    var lastCW = 0;
    function resize() {
      // mobile URL-bar collapse fires height-only resizes mid-scroll —
      // a canvas realloc then is a visible hitch (same guard as measure())
      if (COARSE && window.innerWidth === lastCW && W > 0) return;
      lastCW = window.innerWidth;
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var target = Math.max(24, Math.min(54, Math.round(W * H / 46000)));
      while (parts.length < target) parts.push(spawn(true));
      parts.length = target;
    }

    var lastY = window.scrollY, drift = 0;

    function frame() {
      if (!started) return;
      var sy = window.scrollY;
      drift += (sy - lastY) * 0.03;
      drift *= 0.92;
      lastY = sy;

      if (!externalWarm && fireSection) {
        // no-GSAP fallback only: with motion on, a #fire trigger feeds
        // targetWarm instead — never read layout inside this loop
        var r = fireSection.getBoundingClientRect();
        var mid = r.top + r.height / 2;
        var d = Math.abs(mid - H / 2) / (r.height / 2 + H / 2);
        targetWarm = Math.max(0, 1 - d * 1.6);
      }
      warmth += (targetWarm - warmth) * 0.04;

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.sway += p.swaySpeed;
        p.pulse += 0.015 * (1 + energy * 0.8); // travel quickens the pulse
        p.y -= p.v + drift * 0.4 * p.v;
        p.x += Math.sin(p.sway) * 0.25;
        if (p.y < -30) { parts[i] = spawn(false); continue; }
        if (p.y > H + 40) { p.y = -20; p.x = Math.random() * W; }
        // clamp: globalAlpha silently IGNORES out-of-range assignments
        var alpha = Math.min(1, p.a * (0.6 + 0.4 * Math.sin(p.pulse)) * (1 + energy * 0.25));
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
      raf = requestAnimationFrame(frame);
    }

    var started = false, listening = false, raf = 0;
    // the embers are the 3D world's stand-in (§3 starts and stops them):
    // they only spend frames once the veil lifts, and only while the
    // world isn't running — never both lights at once
    window.__foxfireStart = function () {
      if (started) return;
      started = true;
      canvas.dataset.running = '1';
      lastY = window.scrollY;
      resize();
      if (!listening) { listening = true; window.addEventListener('resize', resize); }
      raf = requestAnimationFrame(frame);
    };
    window.__foxfireStop = function () {
      if (!started) return;
      started = false;
      canvas.dataset.running = '0';
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, W, H);
    };
    // the motion section swaps the warmth source to a #fire trigger
    window.__foxfireWarm = function (w) { externalWarm = true; targetWarm = w; };
    // ...and feeds the damped scroll energy in from its one shared value
    window.__foxfireEnergy = function (e) { energy = e; };
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
    var dpr = COARSE ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
    var W = 0, H = 0, flakes = [], visible = false;
    var mx = -9999, my = -9999;
    var pageLeft = 0, pageTop = 0, raf = 0, lastCW = 0;

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

    function resize(force) {
      // width-only guard: mobile URL-bar collapse fires height-only
      // resizes mid-scroll; the IO below force-resyncs on re-entry
      if (!force && COARSE && window.innerWidth === lastCW && H > 0) return;
      lastCW = window.innerWidth;
      var rect = canvas.getBoundingClientRect();
      // cache page-space offsets so the pointer handlers below never
      // read layout (the section is static-positioned, so these are
      // scroll-invariant; each IO re-entry recomputes them)
      pageLeft = rect.left + window.scrollX;
      pageTop = rect.top + window.scrollY;
      W = rect.width; H = rect.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var target = Math.max(50, Math.min(150, Math.round(W * H / 18000)));
      while (flakes.length < target) flakes.push(spawn(true));
      flakes.length = target;
    }

    section.addEventListener('mousemove', function (e) {
      mx = e.pageX - pageLeft; my = e.pageY - pageTop;
    });
    section.addEventListener('mouseleave', function () { mx = -9999; my = -9999; });
    // fingers stir the snow too — passive, so scrolling stays native
    section.addEventListener('touchmove', function (e) {
      var t = e.touches[0];
      if (!t) return;
      mx = t.pageX - pageLeft; my = t.pageY - pageTop;
    }, { passive: true });
    section.addEventListener('touchend', function () { mx = -9999; my = -9999; });

    function frame() {
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
      raf = requestAnimationFrame(frame);
    }

    // the loop only exists while the section is near the viewport —
    // no idle rAF spin for a snowfield nobody can see — and only while
    // the 3D world, which brings its own snow, isn't running
    var near = false;
    function sync() {
      var w = window.__world;
      var run = near && !(w && (w.state === 'ready' || w.state === 'active'));
      if (run && !visible) {
        visible = true;
        resize(true); // re-sync offsets/size skipped while away
        raf = requestAnimationFrame(frame);
      } else if (!run && visible) {
        visible = false;
        cancelAnimationFrame(raf);
        ctx.clearRect(0, 0, W, H);
      }
    }
    window.__snowSync = sync;
    var io = new IntersectionObserver(function (entries) {
      near = entries[0].isIntersecting;
      sync();
    }, { rootMargin: '100px' });
    io.observe(section);

    window.addEventListener('resize', function () { resize(false); });
    resize(true);
  })();

  /* ------------------------------------------------------------
     6 · veil — enter the dark
     ------------------------------------------------------------ */

  var veil = document.getElementById('veil');
  var entered = false;
  var lenis = null;

  // the veil is modal: while it is up nothing behind it may take focus,
  // pointer or a screen reader's cursor (inert is simply ignored where
  // unsupported, leaving the old behaviour)
  function setGated(on) {
    doc.classList.toggle('gated', on);
    document.querySelectorAll('main, .nav').forEach(function (el) { el.inert = on; });
  }

  function enter() {
    if (entered || !gate.isReady()) return; // the gate holds until the forest is loaded
    entered = true;
    setGated(false);
    window.scrollTo(0, 0); // the journey always begins at the first step
    // the pins were measured while html.gated hid the scrollbar — remeasure
    // now the gutter exists, or every pinned scene keeps a box one scrollbar
    // wider than the viewport (5px off-centre, right anchors 10px out)
    if (MOTION) ScrollTrigger.refresh();
    // reap the veil (and its decoded fox rasters) once its exit ends —
    // visibility:hidden alone pins that memory for the site's lifetime
    var reap = function () {
      if (veil && veil.parentNode) { veil.remove(); veil = null; }
    };
    if (veil) {
      veil.classList.add('gone');
      // transitionend bubbles — a child's transition (e.g. the Enter
      // button's 0.4s color fade) must not reap the veil mid-dissolve
      veil.addEventListener('transitionend', function (e) {
        if (e.target === e.currentTarget && e.propertyName === 'opacity') reap();
      });
      setTimeout(reap, 1600); // fallback if transitionend never fires
    }
    wake();     // the 3D world, if it is ready…
    ambience(); // …or the 2D embers in its place
    if (lenis) lenis.start();
    if (MOTION && window.__heroEntrance) window.__heroEntrance.play();
  }

  if (veil) {
    setGated(true); // scroll and focus are locked while the veil is up
    document.getElementById('veilEnter').addEventListener('click', enter);
    // scroll-to-enter stays, but leftover trackpad inertia from the
    // loading wait must not skip the 100% settle and Enter reveal —
    // require a fresh, deliberate push >400ms after the gate opens
    var wheelAccum = 0;
    window.addEventListener('wheel', function (e) {
      if (!gate.isReady() || performance.now() - gate.readySince() < 400) return;
      wheelAccum += Math.abs(e.deltaY);
      if (wheelAccum > 40) enter();
    }, { passive: true });
    window.addEventListener('touchmove', function () {
      if (gate.isReady() && performance.now() - gate.readySince() > 400) enter();
    }, { passive: true });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') enter();
    });
  } else {
    entered = true; // no veil to wait behind
    wake();
    ambience();
  }

  /* ------------------------------------------------------------
     7 · motion — the journey itself
     ------------------------------------------------------------ */

  if (!MOTION) {
    if (veil && reducedQuery.matches) {
      veil.classList.add('gone');
      // the veil dismisses itself here, so unlock scroll with it and
      // retire enter() — otherwise reduced-motion visitors sit behind
      // html.gated's overflow:hidden with no visible gate, and a later
      // stray enter() would scrollTo(0,0) out from under them
      setGated(false);
      entered = true;
      setTimeout(function () {
        if (veil && veil.parentNode) { veil.remove(); veil = null; }
      }, 1600);
    }
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  // the four pinned chapters register their scrubbed animation here, so
  // the world's clock (end of this section) can follow them exactly
  var pins = {};
  // touch-device stability: ignore the URL-bar's height-only resizes
  // and let ScrollTrigger drive touch scroll on the render tick so
  // pinned scenes stop jittering; both are no-ops with a mouse
  ScrollTrigger.config({ ignoreMobileResize: true });
  if (ScrollTrigger.isTouch === 1) ScrollTrigger.normalizeScroll(true);

  window.scrollTo(0, 0);

  // one scroll owner per input class: normalizeScroll(true) already
  // drives touch scroll above — layering Lenis on top gives two systems
  // fighting over intent (GSAP's docs warn against exactly this pairing)
  if (typeof window.Lenis === 'function' && ScrollTrigger.isTouch !== 1) {
    lenis = new Lenis({ duration: 1.25, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    // touch never reaches this block, so it keeps GSAP's default lag
    // smoothing (which absorbs GC pauses better than 0 there)
    gsap.ticker.lagSmoothing(0);
    lenis.stop(); // held until the veil lifts
  }

  // smooth anchor navigation (mouse only — on touch the native jump
  // is instant and always lands true through the pinned scenes)
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (COARSE) return;
      var target = document.querySelector(a.getAttribute('href'));
      if (!target || !lenis) return; // no Lenis: native anchor jump
      e.preventDefault();
      lenis.scrollTo(target, {
        duration: 1.6,
        // hand focus over where the glide lands, as the native jump would —
        // the next Tab continues inside the chapter, not along the header
        onComplete: function () {
          if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }
      });
    });
  });

  // ---- the world breathes with your scroll -----------------------
  // One damped velocity value (the ivress damp idiom); everything
  // below reads it. Magnitudes are deliberately sub-perceptual —
  // physics, not effects.
  (function velocity() {
    var VEL_LEAN = -14;  // px of fox lean at full normalized velocity
    var velRaw = 0, velNorm = 0, lastVelY = window.scrollY;
    if (lenis) lenis.on('scroll', function (e) { velRaw = e.velocity; });

    // the ambient foxes lean on an inner wrapper: the mounts' own y is
    // scrub-owned (parallax), and two writers on one transform fight.
    // NEVER wrap .tails-spirit (its rebake reads :scope > img) and the
    // pool fox is mid-plunge — lag would muddy a choreographed move.
    var lagSetters = [];
    ['.origin-fox', '.fire-fox'].forEach(function (sel) {
      var mount = document.querySelector(sel);
      if (!mount) return;
      var wrap = document.createElement('div');
      wrap.className = 'spirit-lag';
      while (mount.firstChild) wrap.appendChild(mount.firstChild);
      mount.appendChild(wrap);
      lagSetters.push(gsap.quickTo(wrap, 'y', { duration: 0.5, ease: 'power3' }));
    });

    gsap.ticker.add(function (t, dtMs) {
      if (!lenis) { // touch: normalizeScroll owns scroll — derive from position
        var y = window.scrollY;
        velRaw = velRaw * 0.8 + (y - lastVelY) * 0.2;
        lastVelY = y;
      }
      var norm = Math.max(-1, Math.min(1, (velRaw / window.innerHeight) * 2));
      velNorm += (norm - velNorm) * (1 - Math.pow(0.9, dtMs / 16.7));
      world.vel = velNorm;
      if (window.__foxfireEnergy) window.__foxfireEnergy(Math.abs(velNorm));
      for (var i = 0; i < lagSetters.length; i++) lagSetters[i](velNorm * VEL_LEAN);
    });
  })();

  // ---- spirit condensation: blooms first, then the ink ----------
  var LAYER_OPACITY = { bloom2: 0.38, bloom: 0.6, sharp: 0.95 };

  function condense(mount, opts) {
    opts = opts || {};
    var imgs = mount.querySelectorAll('img');
    // the rise rides the images, never the mount: the ambient mounts'
    // own y is scrub-owned (parallax) and the hunt mount's is the idle
    // breath — two writers on one transform fight (see velocity())
    gsap.set(imgs, { opacity: 0, y: opts.y === undefined ? 30 : opts.y });
    var tl = gsap.timeline({ paused: true });
    tl.to(imgs, { y: 0, duration: 2.2, ease: 'power4.out' }, 0);
    imgs.forEach(function (img, i) {
      var end = LAYER_OPACITY[img.className] || 1;
      tl.to(img, { opacity: end, duration: 1.6, ease: 'power4.out' }, i * 0.45);
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
      // 135, not 108: the mask slots clip 0.24em past the line box so
      // descenders survive — waiting lines must hide below that window
      { yPercent: 135 },
      {
        yPercent: 0, duration: 1.5, ease: 'expo.out', stagger: 0.14,
        scrollTrigger: { trigger: t, start: 'top 85%', once: true }
      });
  });

  // hairline rules draw themselves in
  gsap.utils.toArray('.ch-rule').forEach(function (r) {
    gsap.fromTo(r, { scaleX: 0 }, {
      scaleX: 1, duration: 1.4, ease: 'power2.inOut',
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
      y: 0, opacity: 1, duration: 1.3, ease: 'expo.out',
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
    ht.setAttribute('aria-label', ht.textContent.trim()); // AT reads the word, not the glyphs
    ht.innerHTML = Array.from(ht.textContent).map(function (c) {
      return '<span class="hc" aria-hidden="true">' + c + '</span>';
    }).join('');

    gsap.set('.hero-eyebrow, .hero-sub', { opacity: 0, y: 24 });
    gsap.set('.hero-title', { opacity: 0, filter: 'blur(16px)' });
    gsap.set('.hero-moon', { opacity: 0, scale: 0.85 });

    var entrance = gsap.timeline({ paused: true });
    entrance
      .to('.hero-moon', { opacity: 1, scale: 1, duration: 2.4, ease: 'power4.out' }, 0)
      .to('.hero-title', { opacity: 1, filter: 'blur(0px)', duration: 1.9, ease: 'expo.out' }, 0.2)
      .fromTo('.hero-title .hc',
        { yPercent: 46, opacity: 0 },
        { yPercent: 0, opacity: 1, stagger: 0.06, duration: 1.5, ease: 'expo.out' }, 0.25)
      .to('.hero-eyebrow', { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out' }, 0.8)
      .to('.hero-sub', { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out' }, 1.0)
      .add(condense(spirit, { y: 20 }).play(), 0.9)
      // the world's camera settles into its first frame with the title
      .fromTo(world, { intro: 0 }, { intro: 1, duration: 2.8, ease: 'expo.out' }, 0);
    window.__heroEntrance = entrance;

    pins.hero = gsap.timeline({
      scrollTrigger: {
        trigger: '.hero-pin',
        start: 'top top',
        end: '+=160%',
        pin: true,
        // pins refresh first — every reveal above was created before them
        // and must see their pinSpacing, or it fires a pin-length early
        refreshPriority: 1,
        scrub: 0.8,
        invalidateOnRefresh: true // the per-glyph spread below is font-size-relative
      }
    })
      // both push-ins span the timeline's full length (fade 0.45 + 0.5):
      // at GSAP's default 0.5 they halted at peak speed, still ~90% opaque
      .to(zoom, { scale: 1.55, ease: 'power1.in', duration: 0.95 }, 0)
      // the wordmark tracks apart via per-glyph transforms, NOT
      // letter-spacing: scrubbing letter-spacing reflows the char-split
      // title on every frame of the visit's first scroll gesture.
      // 0.17em spread = the old 0.22em target minus the 0.05em CSS base.
      .to('.hero-title .hc', {
        x: function (i, el, arr) {
          var mid = (arr.length - 1) / 2;
          var spread = 0.17 * parseFloat(getComputedStyle(ht).fontSize);
          return (i - mid) * spread;
        },
        ease: 'power1.in',
        duration: 0.95
      }, 0)
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
        refreshPriority: 1,
        scrub: 1,
        invalidateOnRefresh: true
      }
    });
    pins.hunt = horiz;

    var foxMount = document.querySelector('.hunt-fox');
    var foxTl = condense(foxMount, { y: 0 });
    ScrollTrigger.create({
      trigger: '.hunt-pin', start: 'top 70%', once: true,
      onEnter: function () { foxTl.play(); }
    });
    // partly through the edge — hindquarters and tails in frame,
    // and it slips a little further out as you follow. Travel is
    // relative to the fox's own width so the crop reads the same on
    // a 480px-capped fox at any viewport (vw-based travel walked it
    // fully off-screen on ultrawide).
    gsap.fromTo(foxMount, { xPercent: 16.5 }, {
      xPercent: 42,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hunt-pin', start: 'top top',
        end: function () { return '+=' + getDist(); },
        scrub: 1.4, invalidateOnRefresh: true
      }
    });
    // idle breath, not a gesture — the one deliberate exception to the
    // expo/power4 voice (a breath should be sinusoidal)
    gsap.to(foxMount, { y: -7, duration: 2.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });

    gsap.utils.toArray('.skill').forEach(function (el, idx) {
      // columns already inside the first frame (wide viewports) can't
      // reveal on the horizontal cue — the track's time is 0 until the
      // pin engages, so they'd all pop together at the lock. Those take
      // the vertical approach cue instead, cascading left to right.
      var inView = el.getBoundingClientRect().left < window.innerWidth * 0.88;
      gsap.fromTo(el, { opacity: 0, y: 70 }, {
        opacity: 1, y: 0, duration: 1, ease: 'expo.out',
        delay: inView ? idx * 0.12 : 0,
        scrollTrigger: inView
          ? { trigger: el, start: 'top 88%', once: true }
          : { trigger: el, containerAnimation: horiz, start: 'left 88%', once: true }
      });
      var hanzi = el.querySelector('.skill-hanzi');
      gsap.fromTo(hanzi, { y: 50 }, {
        y: -30, ease: 'none',
        scrollTrigger: {
          trigger: el, containerAnimation: horiz,
          start: 'left right', end: 'right left', scrub: true
        }
      });
    });
  })();

  // ---- 03 · the leap: a torii gate for every work ------------------
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
        // every gate keeps the scroll it had when there were three (400%)
        end: '+=' + (100 + 100 * gates.length) + '%',
        pin: true,
        refreshPriority: 1,
        scrub: 1,
        invalidateOnRefresh: true,
        // promote the gate layers only while the corridor is active —
        // held permanently (CSS will-change) they'd pin GPU texture
        // memory for the site's whole life. Toggled at the pin
        // boundary so promotion never churns mid-scrub.
        onToggle: function (self) {
          gsap.set([gates, foxMount, '.works-head'], {
            willChange: self.isActive ? 'transform, opacity' : 'auto'
          });
        }
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

    // autoAlpha (not opacity): an invisible gate's inner keeps
    // pointer-events:auto, and hit-testing ignores opacity — hidden
    // gates must also be visibility:hidden or their links capture the
    // cursor halo through the visible one
    gates.forEach(function (gate, i) {
      var at = 2 + i * STEP;
      // the walkthrough stops here: the gate fully open, its inscription
      // readable (in by at + 1.15, dissolving from at + STEP - 0.75)
      tl.addLabel('gate' + i, at + 1.5);
      var numEl = gate.querySelector('.wscene-num');
      var inner = gate.querySelector('.wgate-inner');
      var signal = gate.querySelector('.wgate-signal');
      var script = signal ? [inner, signal] : inner; // a gate's signal comes and goes with its words

      // the gate stands far down the path — approach it
      tl.fromTo(gate,
        { autoAlpha: 0, scale: 0.3, yPercent: 3 },
        { autoAlpha: 1, scale: 1, yPercent: 0, duration: 1.15, ease: 'power2.out' },
        at);
      // its inscription resolves a beat later
      tl.fromTo(script,
        { autoAlpha: 0, y: 44 },
        { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' },
        at + 0.45);
      // the ghost numeral drifts at its own depth
      tl.fromTo(numEl,
        { scale: 0.75, opacity: 0.5 },
        { scale: 1.4, opacity: 1, duration: STEP + 0.5, ease: 'none' },
        at);
      // step through: the inscription dissolves, the beams sweep past
      tl.to(script,
        { autoAlpha: 0, duration: 0.4, ease: 'none' },
        at + STEP - 0.75);
      tl.to(gate,
        { scale: 3.6, autoAlpha: 0, duration: 1.0, ease: 'power2.in' },
        at + STEP - 0.7);
    });
    tl.to({}, { duration: 0.6 });
    pins.works = tl;
    // each gate sweeps past the screen edges midway through its
    // pass-through tween — the world walks through its own torii there
    world.gates = gates.map(function (g, i) {
      return (2 + i * STEP + STEP - 0.7 + 0.5) / tl.duration();
    });
  })();

  // ---- 04 · foxfire: the world warms ------------------------------
  // warmth follows the chapter from here — for the 3D world's hearth
  // and for the 2D embers' fallback loop (identical curve: d = |1 - 2p|)
  ScrollTrigger.create({
    trigger: '#fire', start: 'top bottom', end: 'bottom top',
    onUpdate: function (self) {
      var w = Math.max(0, 1 - 1.6 * Math.abs(1 - 2 * self.progress));
      world.warm = w;
      if (window.__foxfireWarm) window.__foxfireWarm(w);
    }
  });
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
      world.tails = Math.max(0, Math.min(TAILS, n + 1)); // tails earned so far
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
          refreshPriority: 1,
          scrub: 1
        }
      });
      tl.eventCallback('onUpdate', function () {
        // each flip lands 0.2 into its piece's reveal (pieces start at
        // 1.0 + i*STEP), so the row and the drawn tail arrive together;
        // before the first, n is -1 — all rows unlit, the count reads 01
        var n = Math.floor((tl.time() - 1.2) / STEP);
        setCount(Math.min(TAILS - 1, n));
      });
      return tl;
    }

    // Five untouched copies of the drawing, each baked down to just one
    // tail at load time. The artwork's path data is never modified (its
    // traced layers rely on winding holes — splitting them destroys the
    // ink). Each copy is clipped to a hand-fitted soft wedge following
    // the gaps between the drawn tails, and the fox body + ground are
    // erased from every copy — so the fox appears once, and each earned
    // point can only ever add its own tail.
    //
    // The clipping is done in canvas with explicit alpha compositing
    // (destination-in keeps the wedge, destination-out erases the body)
    // and ships as plain bitmaps. CSS mask-image is not trustworthy
    // here: it treats an SVG source as an ALPHA mask, so a black
    // "subtract" polygon silently becomes a second reveal — which is
    // how every piece once showed the entire fox.
    var VB = { w: 674, h: 502 };
    var ORIGIN = { x: 368, y: 322 };
    // canvas units per viewBox unit — set once the drawing lands, so the
    // pieces are copied at the density this screen shows the scene (one
    // device pixel per canvas pixel), never a fixed 2x that a 1x desktop
    // downscales and a 3x phone upscales. The canvases take the raster's
    // own pixel grid (CW × CH), never VB × S truncated: 502·S is a
    // fraction, and an integer-floored height resampled every piece by
    // one row — the artefact tools/bake-fox-rasters.mjs snaps its
    // retina heights to avoid.
    var S = 1, CW = VB.w, CH = VB.h;

    // boundary rays between tails, degrees around the fan base
    // (90 = straight up); tuned against a rendered contact sheet of the
    // baked pieces — tune again if a stroke pops with its neighbour
    var RAYS = [158, 96, 60, 28, 2, -85];
    var REACH = 520; // past every canvas corner, so no tail tip is cut

    function ray(deg, r) {
      var a = deg * Math.PI / 180;
      return [
        Math.round(ORIGIN.x + r * Math.cos(a)),
        Math.round(ORIGIN.y - r * Math.sin(a))
      ];
    }

    function wedge(a0, a1) { // a0 > a1
      var pts = [[ORIGIN.x, ORIGIN.y]];
      for (var a = a0; a > a1; a -= 8) pts.push(ray(a, REACH));
      pts.push(ray(a1, REACH));
      return pts;
    }

    // the fox itself and the snow ground — visible from the start; the
    // outer points sit past the canvas edge so the feather never
    // softens the border of the drawing
    var BASE = [
      [-24, -24], [285, -24], [285, 118], [300, 130], [308, 235], [338, 298],
      [352, 318], [362, 362], [378, 452], [698, 452], [698, 526], [-24, 526]
    ];

    function shape(poly) {
      var c = document.createElement('canvas');
      c.width = CW;
      c.height = CH;
      var x = c.getContext('2d');
      if (typeof x.filter === 'string') x.filter = 'blur(' + 8 * S + 'px)'; // feather
      x.fillStyle = '#fff';
      x.beginPath();
      poly.forEach(function (p, i) {
        if (i) x.lineTo(p[0] * S, p[1] * S); else x.moveTo(p[0] * S, p[1] * S);
      });
      x.closePath();
      x.fill();
      return c;
    }

    function bake(art, keepPoly, erasePoly) {
      var c = document.createElement('canvas');
      c.width = CW;
      c.height = CH;
      var x = c.getContext('2d');
      x.drawImage(art, 0, 0, c.width, c.height);
      x.globalCompositeOperation = 'destination-in';
      x.drawImage(shape(keepPoly), 0, 0);
      if (erasePoly) {
        x.globalCompositeOperation = 'destination-out';
        x.drawImage(shape(erasePoly), 0, 0);
      }
      return c;
    }

    function blobURL(c) {
      return new Promise(function (resolve, reject) {
        c.toBlob(function (b) {
          if (b) resolve(URL.createObjectURL(b)); else reject(new Error('toBlob'));
        }, 'image/png');
      });
    }

    spirit.classList.add('tails-masked');

    // "no tail may glow before it is earned" must hold even if the
    // visitor anchor-jumps straight here while the bake below is still
    // deferred — hide the full drawing until the body-only bake lands
    // (the catch at the bottom restores it if baking ever fails)
    var baseImgs = Array.prototype.slice.call(spirit.querySelectorAll(':scope > img'));
    baseImgs.forEach(function (img) { img.style.visibility = 'hidden'; });

    // the wrappers (and the timeline below) exist immediately; the
    // baked bitmaps drop in a moment later, long before this chapter
    // scrolls into view
    var pieces = [];
    for (var w = 0; w < TAILS; w++) {
      var wrap = document.createElement('div');
      wrap.className = 'tail-piece';
      spirit.appendChild(wrap);
      pieces.push(wrap);
    }

    var art = new Image();
    var artLoaded = new Promise(function (resolve, reject) {
      art.onload = resolve;
      art.onerror = reject;
    });
    // the same candidate the scene's own <img> resolves (its sizes rule
    // mirrors this measurement), so the bake and the fallback drawing
    // share one download
    var sceneCss = spirit.getBoundingClientRect().width || 840;
    art.src = foxPick('sitting', sceneCss);
    artLoaded.then(function () {
      var need = sceneCss * (window.devicePixelRatio || 1);
      CW = need >= art.naturalWidth ? art.naturalWidth : Math.round(need);
      CH = Math.round(CW * art.naturalHeight / art.naturalWidth);
      S = CW / VB.w;
      // defer the six bakes off the startup path — they
      // cost one long main-thread task right around the visitor's
      // entrance; bake early only if the journey nears this chapter
      return new Promise(function (resolve) {
        var fired = false;
        function go() { if (!fired) { fired = true; resolve(); } }
        if (window.requestIdleCallback) requestIdleCallback(go, { timeout: 8000 });
        else setTimeout(go, 3500);
        // '#works' (two pinned chapters early) so even an anchor glide
        // toward #tails leaves the bake time to finish en route
        ScrollTrigger.create({ trigger: '#works', start: 'top bottom', once: true, onEnter: go });
      });
    }).then(function () {
      var baked = [bake(art, BASE, null)];
      for (var i = 0; i < TAILS; i++) {
        baked.push(bake(art, wedge(RAYS[i], RAYS[i + 1]), BASE));
      }
      return Promise.all(baked.map(blobURL));
    }).then(function (urls) {
      // the mount's own three layers (sharp + both blooms) become the
      // body + ground only — no tail may glow before it is earned.
      // These runtime-baked bitmaps are black ink again, so restore the
      // live invert/blur filters that the baked-glow WebPs opted out of
      baseImgs.forEach(function (img) {
        img.removeAttribute('data-baked');
        // the sharp copy carries a srcset: point it at the bake too (a
        // bare candidate is 1x), or the browser keeps the old selection's
        // density on this src — a still-lazy image never re-resolves it
        img.removeAttribute('sizes');
        img.srcset = urls[0];
        img.src = urls[0];
      });
      // reveal only once the body-only bitmap is decoded, so the old
      // five-tailed raster can never flash through the swap
      var show = function () {
        baseImgs.forEach(function (img) { img.style.visibility = ''; });
      };
      if (baseImgs[0] && baseImgs[0].decode) baseImgs[0].decode().then(show, show);
      else show();
      // each tail gets the same three-layer glow as every other spirit
      pieces.forEach(function (wrap, i) {
        wrap.innerHTML =
          (PHONE ? '' : '<img class="bloom2" src="' + urls[i + 1] + '" alt="" aria-hidden="true" draggable="false">') +
          '<img class="bloom" src="' + urls[i + 1] + '" alt="" aria-hidden="true" draggable="false">' +
          '<img class="sharp" src="' + urls[i + 1] + '" alt="" aria-hidden="true" draggable="false">';
      });
    }).catch(function () {
      // if baking ever fails, the untouched full drawing simply stays
      baseImgs.forEach(function (img) { img.style.visibility = ''; });
    });

    gsap.set(spirit, { opacity: 0, y: 26 });
    gsap.set(pieces, { opacity: 0, scale: 0.55, transformOrigin: '54.6% 64.1%' });

    var tl = makeTl();
    tl.to(spirit, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0);
    pieces.forEach(function (p, i) {
      tl.to(p, {
        opacity: 1, scale: 1, duration: 0.68, ease: 'power2.out'
      }, 1.0 + i * STEP);
    });
    // the walkthrough stops here: all five tails drawn, before the pin lets go
    tl.addLabel('earned', 1.0 + (TAILS - 1) * STEP + 0.9);
    tl.to({}, { duration: 0.8 });
    pins.tails = tl;
  })();

  // ---- 06 · the snowfield: the plunge -------------------------------
  // scrolling in drives the fox headfirst into the snowy hill
  gsap.fromTo('.pool-fox-wrap', { y: -170 }, {
    y: 0, ease: 'power1.in',
    scrollTrigger: { trigger: '#pool', start: 'top bottom', end: 'center 45%', scrub: 1 }
  });

  // ---- the world's clock ------------------------------------------
  // The pinned chapters hand the 3D world their own scrubbed progress,
  // so the forest moves in exact step with them; the stretches between
  // pins get scrubbed tweens of their own. The world's time is the sum.
  (function worldClock() {
    function between(key, trigger, start, end) {
      var from = {}, to = {
        ease: 'none', immediateRender: false,
        scrollTrigger: { trigger: trigger, start: start, end: end, scrub: 1, invalidateOnRefresh: true }
      };
      from[key] = 0;
      to[key] = 1;
      gsap.fromTo(world.p, from, to);
    }
    function edge(pin, which) { return function () { return pins[pin].scrollTrigger[which]; }; }
    between('origin', null, edge('hero', 'end'), edge('hunt', 'start'));
    between('trail', null, edge('hunt', 'end'), edge('works', 'start'));
    between('den', '#fire', edge('works', 'end'), 'center center');
    between('climb', '#fire', 'center center', edge('tails', 'start'));
    between('snow', null, edge('tails', 'end'), 'max');

    // The root timeline is the ticker's first listener, so by the time
    // this one runs every scrub tween and Lenis have moved for this
    // tick: copy the pins' progress and let the world draw — one loop
    // for page and world, with no frame of lag between them.
    gsap.ticker.add(function (time) {
      world.p.hero = pins.hero.progress();
      world.p.hunt = pins.hunt.progress();
      world.p.works = pins.works.progress();
      world.p.tails = pins.tails.progress();
      if (!world.frame) return;
      try { world.frame(time); } catch (e) { world.fail(e); }
    });
  })();

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
            var on = a.getAttribute('data-nav') === ch[2];
            a.classList.toggle('active', on);
            // the ARIA state mirrors the visual one
            if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
          });
        }
      });
    });

    // the halo is a mouse creature — no listener, no ticker on touch.
    // It speaks a small language: it grows over anything interactive,
    // and the key CTAs answer with a gentle magnetic lean. The ticker
    // below is the ONLY writer of halo.style.transform — never tween it.
    var halo = document.querySelector('.cursor-halo');
    if (halo && !COARSE) {
      var HALO_GROW = 2.2;    // scale over interactive targets
      var MAGNET_PULL = 0.15; // halo bias toward a magnetic center
      var MAGNET_SHIFT = 6;   // px cap for the element's own lean
      var hx = -100, hy = -100, tx = -100, ty = -100, shown = false, tracking = false;
      var hs = 1, hTarget = 1, hoverEl = null;
      var magnet = null, magnetRect = null, magnetX = null, magnetY = null;
      var magnetCache = typeof WeakMap === 'function' ? new WeakMap() : null;

      function releaseMagnet() {
        if (magnetX) { magnetX(0); magnetY(0); }
        magnet = null; magnetRect = null;
      }

      document.addEventListener('pointerover', function (e) {
        var t = e.target.closest && e.target.closest('a, button, [data-cursor]');
        if (!t) return;
        hoverEl = t;
        hTarget = HALO_GROW;
        // only generous targets magnetize — nav links are 26px tall
        // under a fixed header and would jitter
        if (t !== magnet && t.matches && t.matches('.veil-enter, .wscene-visit, .pool-mail')) {
          magnet = t;
          magnetRect = t.getBoundingClientRect(); // once, off the hot path
          var pair = magnetCache && magnetCache.get(t);
          if (!pair) {
            // one setter pair per element, forever — re-creating them on
            // every hover leaves the old return-to-zero tween writing
            // the same properties
            pair = {
              x: gsap.quickTo(t, 'x', { duration: 0.4, ease: 'power3' }),
              y: gsap.quickTo(t, 'y', { duration: 0.4, ease: 'power3' })
            };
            if (magnetCache) magnetCache.set(t, pair);
          }
          magnetX = pair.x; magnetY = pair.y;
        }
      });
      document.addEventListener('pointerout', function (e) {
        if (hoverEl && !hoverEl.contains(e.relatedTarget)) { hoverEl = null; hTarget = 1; }
        if (magnet && !magnet.contains(e.relatedTarget)) releaseMagnet();
      });
      // Safari/Firefox fire no boundary events when the page scrolls
      // under a stationary cursor — the cached rect (and the lean)
      // would go stale, pulling toward a point the element left.
      // Release on scroll; the next real pointer event re-establishes.
      window.addEventListener('scroll', function () {
        if (magnet) releaseMagnet();
        if (hoverEl) { hoverEl = null; hTarget = 1; }
      }, { passive: true });

      window.addEventListener('mousemove', function (e) {
        tx = e.clientX; ty = e.clientY;
        if (!shown) { shown = true; gsap.to(halo, { opacity: 1, duration: 0.6 }); }
        if (!tracking) { // the ticker only spends frames once a mouse exists
          tracking = true;
          gsap.ticker.add(function () {
            // the veil is removed from the DOM — its Enter button can
            // never fire pointerout, so drop stale targets here
            if (hoverEl && !hoverEl.isConnected) { hoverEl = null; hTarget = 1; magnet = null; }
            var ax = tx, ay = ty;
            if (magnet && magnetRect) {
              var cx = magnetRect.left + magnetRect.width / 2;
              var cy = magnetRect.top + magnetRect.height / 2;
              ax += (cx - tx) * MAGNET_PULL;
              ay += (cy - ty) * MAGNET_PULL;
              magnetX(Math.max(-MAGNET_SHIFT, Math.min(MAGNET_SHIFT, (tx - cx) * 0.12)));
              magnetY(Math.max(-MAGNET_SHIFT, Math.min(MAGNET_SHIFT, (ty - cy) * 0.12)));
            }
            hx += (ax - hx) * 0.14;
            hy += (ay - hy) * 0.14;
            hs += (hTarget - hs) * 0.12;
            halo.style.transform = 'translate(' + (hx - 17) + 'px,' + (hy - 17) + 'px) scale(' + hs.toFixed(3) + ')';
          });
        }
      });
    }
  })();

  // ---- the walkthrough: a faster way through ------------------------
  // For a visitor short of time the story can be stepped through, a beat
  // at a time: the hero's own Scroll cue is the first step, then a small
  // wisp at the foot of the screen (the cue's hairline and drip, made
  // small) glides on to the next — each chapter, the start and end of the
  // hunt, each project fully open, the tails all earned, the snowfield.
  // The arrow keys step too (→ on, ← back). Scrolling is untouched: the
  // wisp only shows while the page is still, and a hand on the wheel or
  // the screen takes over a glide. Stops are read from the live triggers
  // at every step — every refresh moves them.
  (function walkthrough() {
    var wisp = document.querySelector('.wisp');
    var cue = document.querySelector('.hero-cue');
    if (!wisp || !cue) return;
    var label = wisp.querySelector('.wisp-label');
    var say = document.getElementById('wispSay');
    var gates = gsap.utils.toArray('[data-wgate]');
    var cards = document.querySelectorAll('#huntTrack .skill');
    var fire = document.getElementById('fire');
    var origin = document.getElementById('origin');
    var TOL = 24;        // px either side of a stop that still counts as on it
    var CUE_GONE = 0.21; // the hero timeline's cue has faded by here
    var gliding = false, target = 0, tween = null, idle = null, hinted = false;

    function docTop(el) { return el.getBoundingClientRect().top + window.scrollY; }
    // where a pinned chapter's scrubbed timeline reaches `label`, in scroll px
    function at(tl, name) {
      var st = tl.scrollTrigger;
      return st.start + (tl.labels[name] / tl.duration()) * (st.end - st.start);
    }
    function stops() {
      var hunt = pins.hunt.scrollTrigger;
      var wide = window.innerWidth > 960;
      // cards a..b centred on screen, as far as the track can travel
      var centre = function (a, b) {
        var mid = (a.offsetLeft + b.offsetLeft + b.offsetWidth) / 2;
        return hunt.start + Math.max(0, Math.min(hunt.end - hunt.start, mid - window.innerWidth / 2));
      };
      // a wide screen holds three skills: the second centred shows the
      // first three, then the last two together; a narrow one holds one,
      // so the first, then the last
      var list = [
        { y: 0, name: 'Origin' },
        { y: docTop(origin), name: 'Awakening' },
        { y: wide ? centre(cards[1], cards[1]) : centre(cards[0], cards[0]), name: 'The Hunt' },
        { y: wide ? centre(cards[3], cards[4]) : centre(cards[4], cards[4]), name: 'More skills' }
      ];
      gates.forEach(function (g, i) {
        var title = g.querySelector('.wscene-title');
        list.push({ y: at(pins.works, 'gate' + i), name: title ? title.textContent : 'Works' });
      });
      // the den centred, where its fire burns warmest — but never so far
      // that its heading slips up under the header on a short screen
      var denCentre = docTop(fire) + fire.offsetHeight / 2 - window.innerHeight / 2;
      var denHead = docTop(fire.querySelector('.ch-head')) - 0.12 * window.innerHeight;
      list.push(
        { y: Math.min(denCentre, denHead), name: 'The Den' },
        { y: at(pins.tails, 'earned'), name: 'Tails' },
        { y: ScrollTrigger.maxScroll(window), name: 'Say hello' }
      );
      list.forEach(function (s) { s.y = Math.round(s.y); });
      return list;
    }
    // the next stop beyond `ref` (dir 1), or the last one before it (dir -1)
    function beyond(list, ref, dir) {
      var i;
      if (dir > 0) {
        for (i = 0; i < list.length; i++) if (list[i].y > ref + TOL) return list[i];
      } else {
        for (i = list.length - 1; i >= 0; i--) if (list[i].y < ref - TOL) return list[i];
      }
      return null;
    }
    function inOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

    function show(on) { wisp.classList.toggle('on', on); }
    // while the page is still: show the way on, or nothing past the last beat
    function update() {
      idle = null;
      if (!entered || gliding) { show(false); return; }
      // over the hero its own cue is the first step; the wisp waits
      if (pins.hero.progress() < CUE_GONE) { show(false); return; }
      var stop = beyond(stops(), window.scrollY, 1);
      if (!stop) { show(false); return; }
      var text = 'Next · ' + stop.name;
      if (label.textContent !== text) label.textContent = text;
      wisp.setAttribute('aria-label', 'Next: ' + stop.name);
      show(true);
      // the first time it appears it says what it is — though never over
      // the words of the page (a phone's paragraphs run under it): then it
      // waits for a clearer stop
      if (!hinted && !overText()) {
        hinted = true;
        wisp.classList.add('hint');
        setTimeout(function () { wisp.classList.remove('hint'); }, 2600);
      }
    }
    // is there text where the label would rise (a band above the wisp)?
    function overText() {
      var r = wisp.getBoundingClientRect();
      var y = r.top - 14;
      for (var dx = -120; dx <= 120; dx += 40) {
        var stack = document.elementsFromPoint(r.left + r.width / 2 + dx, y);
        for (var i = 0; i < stack.length; i++) {
          var el = stack[i];
          if (wisp.contains(el)) continue;
          if (el.closest('p, h1, h2, h3, li, dt, dd, blockquote')) return true;
        }
      }
      return false;
    }
    // any scroll hides it; it returns once the page has been still a moment
    // (without its first hint: that is over once the page moves, or it
    // could come back over words that have scrolled under it)
    function settle() {
      show(false);
      wisp.classList.remove('hint');
      if (idle) clearTimeout(idle);
      idle = setTimeout(update, 700);
    }

    function glide(stop) {
      var from = window.scrollY;
      var screens = Math.abs(stop.y - from) / window.innerHeight;
      var duration = Math.max(1, Math.min(2, 0.8 + 0.28 * screens));
      gliding = true;
      target = stop.y;
      show(false);
      var landed = function () {
        gliding = false;
        tween = null;
        say.textContent = stop.name;
        settle();
      };
      if (lenis) {
        lenis.scrollTo(stop.y, { duration: duration, easing: inOut, onComplete: landed });
      } else {
        // touch: normalizeScroll owns the input, so drive the window directly
        if (tween) tween.kill();
        var p = { y: from };
        tween = gsap.to(p, {
          y: stop.y, duration: duration, ease: 'power2.inOut',
          onUpdate: function () { window.scrollTo(0, p.y); },
          onComplete: landed
        });
      }
    }
    function step(dir) {
      if (!entered) return;
      // mid-glide, the next step counts on from where this glide lands
      var stop = beyond(stops(), gliding ? target : window.scrollY, dir);
      if (stop) glide(stop);
    }

    wisp.addEventListener('click', function () { step(1); });
    cue.addEventListener('click', function () {
      if (pins.hero.progress() < CUE_GONE) step(1); // only while it can be seen
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      if (!entered || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      var el = document.activeElement;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      e.preventDefault();
      step(e.key === 'ArrowRight' ? 1 : -1);
    });
    // a hand on the wheel or the screen takes the scroll back (Lenis drops
    // its own glide for the wheel; the touch glide is ours to stop)
    function takeOver() {
      if (!gliding) return;
      gliding = false;
      if (tween) { tween.kill(); tween = null; }
    }
    window.addEventListener('wheel', takeOver, { passive: true });
    window.addEventListener('touchstart', function (e) {
      if (!wisp.contains(e.target) && !cue.contains(e.target)) takeOver();
    }, { passive: true });

    if (lenis) lenis.on('scroll', settle);
    else window.addEventListener('scroll', settle, { passive: true });
    wisp.hidden = false;
    settle();
  })();

  // keep measurements honest once fonts and images arrive
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });

})();
