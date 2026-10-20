/* Potential flow around an inverted wing profile (Joukowski transform).
   Streaks are coloured by the pressure coefficient: blue = pressure, red = suction.
   The wing is upside down, as on a racing car, so the suction side faces the ground. */
(function () {
  "use strict";
  var canvas = document.getElementById("flow");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Flow parameters (chord is about 4 world units)
  var U = 1, alpha = 7 * Math.PI / 180;
  var mux = -0.09, muy = 0.13;                       // circle centre, gives camber and thickness
  var R = Math.hypot(1 - mux, muy);
  var beta = Math.asin(muy / R);
  var gamma = 4 * Math.PI * U * R * Math.sin(alpha + beta);   // Kutta condition

  function cmul(a, b) { return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; }
  function cdiv(a, b) { var d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; }
  function csqrt(a) { var r = Math.hypot(a[0], a[1]); var re = Math.sqrt((r + a[0]) / 2); var im = Math.sqrt(Math.max(0, (r - a[0]) / 2)); return [re, a[1] < 0 ? -im : im]; }

  // zeta-plane point for a z-plane point (outer root of z = zeta + 1/zeta)
  function toZeta(x, y) {
    var s = csqrt([x * x - y * y - 4, 2 * x * y]);
    var a = [(x + s[0]) / 2, (y + s[1]) / 2], b = [(x - s[0]) / 2, (y - s[1]) / 2];
    return Math.hypot(a[0], a[1]) >= Math.hypot(b[0], b[1]) ? a : b;
  }
  // velocity (u, v) at a z-plane point, or null inside the body
  function velocity(x, y) {
    var zt = toZeta(x, y);
    var zp = [zt[0] - mux, zt[1] - muy];
    var rp = Math.hypot(zp[0], zp[1]);
    if (rp < R * 1.0005) return null;
    var ea = [Math.cos(alpha), Math.sin(alpha)], eam = [Math.cos(alpha), -Math.sin(alpha)];
    var zp2 = cmul(zp, zp);
    var t1 = cmul([R * R, 0], cdiv(ea, zp2));
    var dw = [U * (eam[0] - t1[0]), U * (eam[1] - t1[1])];
    var circ = cdiv([0, gamma / (2 * Math.PI)], zp);
    dw = [dw[0] + circ[0], dw[1] + circ[1]];
    var z2 = cmul(zt, zt);
    var dzdz = [1 - cdiv([1, 0], z2)[0], -cdiv([1, 0], z2)[1]];
    var q = cdiv(dw, dzdz);          // u - i v
    return [q[0], -q[1]];
  }

  // Colours
  var C = { bg: "#eef1f4", ink: "#11151a", blue: [31, 79, 216], grey: [150, 160, 170], red: [217, 72, 15] };
  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    function hex(name, fb) { var v = cs.getPropertyValue(name).trim(); return v || fb; }
    C.bg = hex("--paper", C.bg); C.ink = hex("--ink", C.ink);
    C.blue = parse(hex("--chart-a", "#1f4fd8")); C.red = parse(hex("--chart-b", "#d9480f"));
    C.grey = parse(hex("--muted", "#5d6873"));
  }
  function parse(h) { h = h.replace("#", ""); if (h.length === 3) h = h.replace(/(.)/g, "$1$1"); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function cpColor(speed) {
    var cp = 1 - speed * speed;       // pressure coefficient
    var c = cp >= 0 ? mix(C.grey, C.blue, Math.min(1, cp * 1.4)) : mix(C.grey, C.red, Math.min(1, -cp * 0.7));
    return "rgb(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + ")";
  }

  // Geometry and particles
  var W = 0, H = 0, dpr = 1, s = 60, ox = 0, oy = 0, xmin = -8, xmax = 8, ymin = -2, ymax = 2;
  var parts = [], N = 220, body = [];
  function resize() {
    var r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    s = Math.min(W * 0.07, H * 0.27);
    ox = W * (W < 640 ? 0.55 : 0.62); oy = H * 0.5;
    xmin = (0 - ox) / s; xmax = (W - ox) / s; ymin = (0 - oy) / s; ymax = (H - oy) / s;
    N = Math.round(Math.min(420, Math.max(90, W * H / 1100)));
    body = [];
    for (var i = 0; i <= 120; i++) {
      var th = i / 120 * 2 * Math.PI, zx = mux + R * Math.cos(th), zy = muy + R * Math.sin(th);
      var inv = cdiv([1, 0], [zx, zy]);
      body.push([zx + inv[0], zy + inv[1]]);
    }
    parts = []; for (var k = 0; k < N; k++) parts.push(spawn(true));
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  }
  function spawn(anywhere) {
    return { x: anywhere ? xmin + Math.random() * (xmax - xmin) : xmin - 0.3, y: ymin + Math.random() * (ymax - ymin), age: 0 };
  }
  function px(x) { return ox + x * s; }
  function py(y) { return oy + y * s; }     // positive y is down on screen, so the wing is inverted

  function step(p, dt) {
    var v1 = velocity(p.x, p.y);
    if (!v1) return false;
    var mx = p.x + v1[0] * dt * 0.5, my = p.y + v1[1] * dt * 0.5;
    var v2 = velocity(mx, my);
    if (!v2) return false;
    var nx = p.x + v2[0] * dt, ny = p.y + v2[1] * dt;
    p.px = p.x; p.py = p.y; p.x = nx; p.y = ny; p.sp = Math.hypot(v2[0], v2[1]); p.age++;
    return true;
  }

  function drawBody() {
    ctx.beginPath();
    for (var i = 0; i < body.length; i++) { var X = px(body[i][0]), Y = py(body[i][1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
    ctx.closePath(); ctx.fillStyle = C.ink; ctx.fill();
  }

  function frame(fade) {
    ctx.globalAlpha = fade; ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
    ctx.lineWidth = 1.6; ctx.lineCap = "round";
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      var ok = step(p, 0.05);
      if (!ok || p.x > xmax + 0.3 || p.y < ymin - 0.5 || p.y > ymax + 0.5 || p.age > 900) { parts[i] = spawn(false); continue; }
      if (p.px === undefined) continue;
      ctx.beginPath(); ctx.moveTo(px(p.px), py(p.py)); ctx.lineTo(px(p.x), py(p.y));
      ctx.strokeStyle = cpColor(p.sp); ctx.stroke();
    }
    drawBody();
  }

  var running = false, raf = 0;
  function loop() { if (!running) return; frame(0.045); raf = requestAnimationFrame(loop); }
  function start() { if (!running && !reduce) { running = true; loop(); } }
  function stop() { running = false; cancelAnimationFrame(raf); }

  function init() {
    readColors(); resize();
    for (var i = 0; i < (reduce ? 260 : 140); i++) frame(reduce ? 0.02 : 0.045);
    if (reduce) drawBody();
  }
  init();
  window.addEventListener("resize", function () { init(); });
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onChange = function () { init(); };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e) { e[0].isIntersecting ? start() : stop(); }, { threshold: 0.05 }).observe(canvas);
  } else { start(); }
  document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
})();
