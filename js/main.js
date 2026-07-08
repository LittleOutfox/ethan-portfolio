/* ============================================================
   ORIGIN — a nine-tailed portfolio
   spirit ink foxes · scroll-scrubbed forest journey · foxfire
   ============================================================ */

(function () {
  'use strict';

  var doc = document.documentElement;
  var reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var MOTION = hasGsap && !reducedQuery.matches;

  // device tiers — desktop behavior never changes; phones get a
  // lighter journey (COARSE = any touch device, PHONE = small touch
  // screen, LEAN = skip heavyweight assets entirely)
  var COARSE = window.matchMedia('(pointer: coarse)').matches;
  var PHONE = COARSE && Math.min(window.screen.width, window.screen.height) < 820;
  var conn = navigator.connection;
  var LEAN = PHONE || !!(conn && (conn.saveData || /(^|\b)[23]g\b/.test(conn.effectiveType || '')));

  if (!MOTION) doc.classList.add('reduced');

  /* ------------------------------------------------------------
     1 · spirit mounts — the ink foxes, made of moonlight
     Each mount gets three stacked copies: a wide soft bloom,
     a tight bloom, and the sharp ink lines. Black ink is
     inverted to translucent white by CSS filters.
     ------------------------------------------------------------ */

  // veil + hero art loads eagerly (and is counted by the gate below);
  // every below-fold fox lazy-loads on approach instead, so it never
  // steals bandwidth from the gated film during the veil
  var EAGER_FOX = { descending: 1, sitting: 1 };
  // intrinsic viewBox size of each pose: width/height attributes make
  // the browser reserve the fox's exact box BEFORE the lazy file loads.
  // Without them a late-loading in-flow fox (bowing, howling) grows from
  // zero height mid-scroll, shifting everything below it and stale-dating
  // every ScrollTrigger pin measured further down — a visible jump at
  // the tails pin. Keep in sync with the SVGs' viewBox values.
  var FOX_DIMS = {
    bowing: [665, 592], descending: [232, 533], diving: [399, 721],
    howling: [546, 569], sitting: [674, 502], standing: [450, 750],
    walking: [630, 404]
  };
  document.querySelectorAll('[data-kfox]').forEach(function (el) {
    var name = el.getAttribute('data-kfox');
    var src = 'assets/kitsune/' + name + '.svg';
    // the glow layers are pre-baked WebPs (invert+brightness+blur
    // rendered offline) — scrolling a fox into view never builds a
    // live Gaussian-blur surface over a megabyte SVG raster, which
    // was the mid-scroll hitch between chapters. Only the sharp ink
    // stays vector (its color-matrix filter is cheap).
    var glow = 'assets/kitsune/' + name + '-bloom';
    var lazy = EAGER_FOX[name] ? '' : ' loading="lazy" decoding="async"';
    var d = FOX_DIMS[name];
    var size = d ? ' width="' + d[0] + '" height="' + d[1] + '"' : '';
    el.innerHTML =
      (PHONE ? '' : '<img class="bloom2" data-baked src="' + glow + '2.webp" alt="" aria-hidden="true" draggable="false"' + lazy + '>') +
      '<img class="bloom" data-baked src="' + glow + '.webp" alt="" aria-hidden="true" draggable="false"' + lazy + '>' +
      '<img class="sharp" src="' + src + '" alt="" draggable="false"' + lazy + size + '>';
  });

  /* ------------------------------------------------------------
     2 · the loading gate — the forest readies itself before entry
     The veil counts the journey in as it streams, and only offers
     Enter once every frame can be summoned instantly.
     ------------------------------------------------------------ */

  var gate = (function () {
    var veilEl = document.getElementById('veil');
    var pctEl = document.getElementById('veilPct');
    var fillEl = document.getElementById('veilFill');
    var parts = { video: 0, foxes: 0, fonts: 0 };
    var weights = { video: 0.75, foxes: 0.15, fonts: 0.1 };
    var ready = false, readyAt = 0;
    function open() {
      if (ready) return;
      ready = true;
      readyAt = performance.now();
      if (veilEl) veilEl.classList.add('ready');
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
  // sharp layers must be fetched, decoded AND rasterized before Enter,
  // so no fox can ever pop in after the veil lifts
  (function gateFoxes() {
    var sharps = document.querySelectorAll('.veil-spirit img.sharp, .hero-spirit img.sharp');
    if (!sharps.length) { gate.set('foxes', 1); return; }
    var done = 0;
    function warm(img) {
      // draw once at layout size so the first real paint after Enter
      // finds a warm raster (SVG-as-img rasters are cached per size)
      try {
        var dprr = Math.min(window.devicePixelRatio || 1, 2);
        var w = Math.round((img.clientWidth || 600) * dprr);
        var h = Math.round((img.clientHeight || 600) * dprr);
        if (!w || !h) return;
        var c = document.createElement('canvas');
        c.width = Math.min(w, 2048); c.height = Math.min(h, 2048);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      } catch (e) { /* warming is best-effort */ }
    }
    Array.prototype.forEach.call(sharps, function (img) {
      var fin = function () { done += 1; gate.set('foxes', done / sharps.length); };
      if (img.decode) img.decode().then(function () { warm(img); fin(); }, fin);
      else if (img.complete) fin();
      else { img.addEventListener('load', fin); img.addEventListener('error', fin); }
    });
  })();

  /* ------------------------------------------------------------
     3 · the journey — a forest that moves as you scroll
     ------------------------------------------------------------ */

  (function journey() {
    var v = document.getElementById('journey');
    if (!v) { gate.set('video', 1); return; }
    if (reducedQuery.matches) { v.remove(); gate.set('video', 1); return; }
    // phones and data-saver connections skip the scrubbed film: the
    // ink, foxfire and snow carry the atmosphere, entry is instant,
    // and no megabytes are spent on a background whisper
    if (LEAN) { v.remove(); gate.set('video', 1); return; }
    // fetch as blob: object URLs are fully seekable even when the
    // server (e.g. python http.server) doesn't support range requests.
    // Streamed so the veil can count the download in.
    // ?v must stay in sync with the head's early-fetch (index.html),
    // which starts this download at HTML-parse time
    var SRC = 'assets/journey.mp4?v=10';
    (window.__journeyFetch || fetch(SRC))
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        var total = +r.headers.get('Content-Length') || 0;
        if (!r.body || !total) return r.blob();
        var reader = r.body.getReader(), chunks = [], got = 0;
        return new Promise(function (resolve, reject) {
          (function pump() {
            reader.read().then(function (res) {
              if (res.done) { resolve(new Blob(chunks, { type: 'video/mp4' })); return; }
              chunks.push(res.value);
              got += res.value.length;
              gate.set('video', Math.min(0.96, got / total)); // last 4% = first frame decoded
              pump();
            }).catch(reject);
          })();
        });
      })
      .then(function (b) {
        v.src = URL.createObjectURL(b);
        // late arrival after a failsafe entry: the gesture-time unlock
        // ran against a src-less video, so re-run the muted play()
        // trick or iPad scrubbing stays stuck on a blank frame
        if (entered && typeof v.play === 'function') {
          var pp = v.play();
          if (pp && pp.then) pp.then(function () { v.pause(); }).catch(function () {});
        }
      })
      .catch(function () { v.src = SRC; });
    var dur = 0, cur = 0, dead = false;

    v.addEventListener('loadedmetadata', function () {
      dur = v.duration || 0;
      // late arrival (honest-failsafe path): open on the scroll-mapped
      // frame — never visibly fast-forward from frame 0 to catch up
      if (maxScroll > 0 && window.scrollY > 0) {
        cur = (window.scrollY / maxScroll) * Math.max(0, dur - 0.08);
        try { v.currentTime = cur; } catch (e) { /* not seekable yet */ }
      }
      v.classList.add('ready');
    });
    v.addEventListener('loadeddata', function () { gate.set('video', 1); });
    // iOS often withholds loadeddata for never-played video — canplay
    // (or even metadata on stubborn builds) opens the gate instead;
    // gate.set is monotonic so duplicates are harmless
    v.addEventListener('canplay', function () { gate.set('video', 1); });
    v.addEventListener('error', function () {
      v.classList.remove('ready');
      v.remove();
      dead = true; // stop the scrub loop — its element is gone
      gate.set('video', 1); // the journey is optional; entry is not
    });

    // scrubbing rules: never read layout in the loop (cache the page
    // height), and never issue a seek while one is in flight — the
    // video is encoded all-intra (every frame a keyframe) so each
    // seek is a single-frame decode
    var maxScroll = 0, lastW = window.innerWidth;
    function measure() {
      // on touch devices the browser chrome collapsing fires
      // height-only resizes mid-scroll — remeasuring then would make
      // the film's scrub target jump visibly
      if (COARSE && window.innerWidth === lastW && maxScroll > 0) return;
      lastW = window.innerWidth;
      maxScroll = doc.scrollHeight - window.innerHeight;
    }
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    if (hasGsap) ScrollTrigger.addEventListener('refresh', measure);
    measure();

    var lastT = 0, lastSeek = 0;
    function tick(t) {
      if (dead) return;
      var dt = lastT ? Math.min((t - lastT) / 1000, 0.1) : 1 / 60;
      lastT = t;
      if (dur && maxScroll > 0 && !v.seeking) {
        var target = (window.scrollY / maxScroll) * Math.max(0, dur - 0.08);
        // frame-rate-independent damp: identical glide at 60Hz and 120Hz
        cur += (target - cur) * (1 - Math.pow(0.88, dt * 60));
        // seek in whole-frame steps (file is 24fps) at most ~30x/s —
        // fewer, frame-sized seeks present far smoother than the old
        // per-rAF micro-seeks, whose completion jitter read as stutter
        if (Math.abs(cur - v.currentTime) > 1 / 24 && t - lastSeek > 33) {
          lastSeek = t;
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
      requestAnimationFrame(frame);
    }

    var started = false;
    // the embers only spend frames once the veil lifts (enter() calls
    // this) — before that they'd paint at full tilt behind an opaque
    // screen, competing with the gated video download
    window.__foxfireStart = function () {
      if (started) return;
      started = true;
      resize();
      window.addEventListener('resize', resize);
      requestAnimationFrame(frame);
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
    // no idle rAF spin for a snowfield nobody can see
    var io = new IntersectionObserver(function (entries) {
      var vis = entries[0].isIntersecting;
      if (vis && !visible) {
        visible = true;
        resize(true); // re-sync offsets/size skipped while away
        raf = requestAnimationFrame(frame);
      } else if (!vis && visible) {
        visible = false;
        cancelAnimationFrame(raf);
      }
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

  function enter() {
    if (entered || !gate.isReady()) return; // the gate holds until the forest is loaded
    entered = true;
    doc.classList.remove('gated');
    window.scrollTo(0, 0); // the journey always begins at the first step
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
    if (window.__foxfireStart) window.__foxfireStart(); // embers wake with the world
    // a user gesture unlocks video decoding on iOS, so scrubbing renders
    var v = document.getElementById('journey');
    if (v && typeof v.play === 'function') {
      var p = v.play();
      if (p && p.then) p.then(function () { v.pause(); }).catch(function () {});
    }
    if (lenis) lenis.start();
    if (MOTION && window.__heroEntrance) window.__heroEntrance.play();
  }

  if (veil) {
    doc.classList.add('gated'); // scroll is locked while the veil is up
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
  } else if (window.__foxfireStart) {
    window.__foxfireStart(); // no veil to wait behind
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
      doc.classList.remove('gated');
      entered = true;
      setTimeout(function () {
        if (veil && veil.parentNode) { veil.remove(); veil = null; }
      }, 1600);
    }
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
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
      lenis.scrollTo(target, { duration: 1.6 });
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
      if (window.__foxfireEnergy) window.__foxfireEnergy(Math.abs(velNorm));
      for (var i = 0; i < lagSetters.length; i++) lagSetters[i](velNorm * VEL_LEAN);
    });
  })();

  // ---- spirit condensation: blooms first, then the ink ----------
  var LAYER_OPACITY = { bloom2: 0.38, bloom: 0.6, sharp: 0.95 };

  function condense(mount, opts) {
    opts = opts || {};
    var imgs = mount.querySelectorAll('img');
    gsap.set(imgs, { opacity: 0 });
    gsap.set(mount, { y: opts.y === undefined ? 30 : opts.y });
    var tl = gsap.timeline({ paused: true });
    tl.to(mount, { y: 0, duration: 2.2, ease: 'power4.out' }, 0);
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
    ht.innerHTML = Array.from(ht.textContent).map(function (c) {
      return '<span class="hc">' + c + '</span>';
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
      .add(condense(spirit, { y: 20 }).play(), 0.9);
    window.__heroEntrance = entrance;

    gsap.timeline({
      scrollTrigger: {
        trigger: '.hero-pin',
        start: 'top top',
        end: '+=160%',
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true // the per-glyph spread below is font-size-relative
      }
    })
      .to(zoom, { scale: 1.55, ease: 'power1.in' }, 0)
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
        ease: 'power1.in'
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
    // idle breath, not a gesture — the one deliberate exception to the
    // expo/power4 voice (a breath should be sinusoidal)
    gsap.to(foxMount, { y: -7, duration: 2.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });

    gsap.utils.toArray('.skill').forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, y: 70 }, {
        opacity: 1, y: 0, duration: 1, ease: 'expo.out',
        scrollTrigger: {
          trigger: el, containerAnimation: horiz,
          start: 'left 88%', once: true
        }
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
  // warmth follows the chapter from here — replaces the canvas loop's
  // per-frame getBoundingClientRect (identical curve: d = |1 - 2p|)
  if (window.__foxfireWarm) {
    ScrollTrigger.create({
      trigger: '#fire', start: 'top bottom', end: 'bottom top',
      onUpdate: function (self) {
        window.__foxfireWarm(Math.max(0, 1 - 1.6 * Math.abs(1 - 2 * self.progress)));
      }
    });
  }
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
    var S = PHONE ? 1 : 2; // supersample for retina; phones render the fox far smaller

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
      c.width = VB.w * S;
      c.height = VB.h * S;
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
      c.width = VB.w * S;
      c.height = VB.h * S;
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
    art.src = 'assets/kitsune/sitting.svg';
    artLoaded.then(function () {
      // defer the six supersampled bakes off the startup path — they
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
    tl.to({}, { duration: 0.8 });
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
          magnetX = gsap.quickTo(t, 'x', { duration: 0.4, ease: 'power3' });
          magnetY = gsap.quickTo(t, 'y', { duration: 0.4, ease: 'power3' });
        }
      });
      document.addEventListener('pointerout', function (e) {
        if (hoverEl && !hoverEl.contains(e.relatedTarget)) { hoverEl = null; hTarget = 1; }
        if (magnet && !magnet.contains(e.relatedTarget)) {
          if (magnetX) { magnetX(0); magnetY(0); }
          magnet = null; magnetRect = null;
        }
      });

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

  // keep measurements honest once fonts and images arrive
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });

})();
