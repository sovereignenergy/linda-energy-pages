/* Three original portraits of Linda, an AI spokesperson.
   glow: warm golden-hour light portrait
   neighbor: illustrated friend from down the street
   advisor: polished sit-down advisor
   None of these faces is a real person. */
(function () {
  "use strict";
  var IDS = ["glow", "neighbor", "advisor"];
  var META = {
    glow: {
      name: "Linda",
      version: "Golden",
      blurb: "Golden-hour light portrait · AI, not a person"
    },
    neighbor: {
      name: "Linda",
      version: "Neighbor",
      blurb: "Illustrated neighbor · AI, not a person"
    },
    advisor: {
      name: "Linda",
      version: "Advisor",
      blurb: "Polished advisor · AI, not a person"
    }
  };
  var current = "glow";

  function colors() {
    var c = (window.CLOSER_BRAND && window.CLOSER_BRAND.colors) || {};
    return {
      bg: c.bg || "#FBF5EC",
      sand: c.sand || "#F3E6D2",
      navy: c.navy || "#2F3A2A",
      cyan: c.cyan || "#B5542A",
      cyanDark: c.cyanDark || "#8F3F1D",
      amber: c.amber || "#F2A541",
      sage: c.sage || "#7E8F5A",
      text: c.text || "#2B2420",
      muted: c.muted || "#6B5D52"
    };
  }
  function rgba(hex, a) {
    var h = String(hex || "#000000").replace("#", "");
    var n = parseInt(h, 16);
    if (!isFinite(n)) n = 0;
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }
  function runtime() {
    var H = window.HELIOS || { state: "idle", level: 0, pulses: [] };
    return {
      state: H.state || "idle",
      level: Math.max(0, Math.min(1, H.level || 0)),
      pulses: H.pulses || []
    };
  }
  function valid(id) {
    return IDS.indexOf(String(id || "").toLowerCase()) >= 0;
  }
  function resolve() {
    var fromUrl = "";
    try { fromUrl = new URLSearchParams(location.search).get("avatar") || ""; } catch (e) {}
    if (valid(fromUrl)) return fromUrl.toLowerCase();
    var cfg = window.HELIOS_CONFIG && window.HELIOS_CONFIG.avatar;
    if (valid(cfg)) return String(cfg).toLowerCase();
    var brandDefault = window.CLOSER_BRAND && window.CLOSER_BRAND.defaultAvatar;
    if (valid(brandDefault)) return String(brandDefault).toLowerCase();
    return "glow";
  }
  function writeUrl(id) {
    try {
      var url = new URL(location.href);
      url.searchParams.set("avatar", id);
      history.replaceState(null, "", url.pathname + url.search + url.hash);
    } catch (e) {}
  }
  function paintChrome(id) {
    var meta = META[id];
    var bot = (window.CLOSER_BRAND && window.CLOSER_BRAND.botName) || "Linda";
    document.body.dataset.avatar = id;
    document.querySelectorAll("[data-avatar-pick]").forEach(function (btn) {
      var on = btn.getAttribute("data-avatar-pick") === id;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    document.querySelectorAll("[data-avatar-name]").forEach(function (el) {
      el.textContent = meta.name.toUpperCase();
    });
    document.querySelectorAll("[data-avatar-version]").forEach(function (el) {
      el.textContent = meta.version;
    });
    document.querySelectorAll("[data-avatar-blurb]").forEach(function (el) {
      el.textContent = meta.blurb;
    });
    document.querySelectorAll("[data-avatar-ai]").forEach(function (el) {
      el.textContent = meta.name + " is an AI, not a person. The " + meta.version.toLowerCase() + " portrait is original and is not a photo of anyone.";
    });
    document.querySelectorAll("canvas[data-avatar]").forEach(function (cv) {
      cv.setAttribute("aria-label", meta.name + ", " + meta.version.toLowerCase() + " portrait. An AI, not a person. This face is original and resembles no real individual.");
    });
    document.querySelectorAll("[data-console-title]").forEach(function (el) {
      el.textContent = bot.toUpperCase() + " · " + meta.version.toUpperCase() + " · AI";
    });
  }
  function use(id, opts) {
    id = valid(id) ? String(id).toLowerCase() : "glow";
    current = id;
    paintChrome(id);
    if (!opts || !opts.silent) writeUrl(id);
    return id;
  }

  function drawPulses(ctx, cx, cy, w, color) {
    var H = window.HELIOS;
    if (!H || !H.pulses) return;
    var now = performance.now();
    H.pulses.forEach(function (stamp) {
      var age = (now - stamp) / 900;
      if (age < 0 || age > 1) return;
      ctx.globalAlpha = (1 - age) * 0.55;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 10 + age * w * 0.22, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    H.pulses = H.pulses.filter(function (stamp) { return now - stamp < 900; });
  }

  function eyeOpen(t) {
    var cycle = 3400 + 400 * (0.5 + 0.5 * Math.sin(t * 0.00011));
    var phase = t % cycle;
    var at = cycle * 0.72;
    var dist = Math.abs(phase - at);
    if (dist >= 110) return 1;
    return Math.pow(dist / 110, 1.35);
  }

  function lipGap(state, level, t, scale) {
    var k = t * 0.001;
    if (state === "speaking") return scale * (0.35 + level * 1.15 * (0.45 + 0.55 * Math.abs(Math.sin(k * 16))));
    if (state === "listening") return scale * 0.22;
    if (state === "thinking") return scale * 0.08;
    return scale * 0.12;
  }

  function drawAiMark(ctx, w, h, C) {
    var label = "AI";
    ctx.save();
    ctx.font = "700 " + Math.max(11, h * 0.032) + "px Inter, system-ui, sans-serif";
    var tw = ctx.measureText(label).width;
    var padX = h * 0.018;
    var bw = tw + padX * 2;
    var bh = h * 0.048;
    var x = w * 0.08;
    var y = h * 0.08;
    ctx.fillStyle = rgba(C.cyan, 0.92);
    roundRect(ctx, x, y, bw, bh, bh / 2);
    ctx.fill();
    ctx.fillStyle = "#FFFDF9";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + padX, y + bh / 2 + 0.5);
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    var radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

function glowHalf(y, h) {
  var headY = h * 0.38;
  var headR = h * 0.14;
  if (y < headY - headR * 1.25) return 0;
  if (y < headY - headR * 0.2) {
    var hairU = (y - (headY - headR * 1.25)) / (headR * 1.05);
    return headR * (0.7 + 0.7 * Math.sin(Math.min(1, hairU) * Math.PI));
  }
  if (y < headY + headR) {
    var dy = (y - headY) / headR;
    if (Math.abs(dy) > 1) return 0;
    var cheek = Math.sqrt(Math.max(0, 1 - dy * dy));
    var jaw = dy > 0.55 ? 1 - (dy - 0.55) * 0.35 : 1;
    return cheek * headR * 0.72 * jaw;
  }
  if (y < h * 0.58) return headR * 0.26;
  var u = (y - h * 0.58) / (h * 0.24);
  if (u > 1) return 0;
  return headR * (0.32 + 2.1 * Math.pow(u, 0.65));
}

  function drawGlow(ctx, w, h, t, state, level) {
    var C = colors();
    var cx = w / 2;
    var k = t * 0.001;
    var breathe = Math.sin(k * 1.3) * (state === "idle" ? h * 0.008 : h * 0.003);
    var headY = h * 0.38 + breathe;

    var sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#FFF4DE");
    sky.addColorStop(0.5, "#F6D7A2");
    sky.addColorStop(1, "#E7C48A");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    var sun = ctx.createRadialGradient(cx, headY, 0, cx, headY, w * 0.46);
    sun.addColorStop(0, rgba("#FFF6D8", 0.95));
    sun.addColorStop(0.25, rgba(C.amber, 0.55 + level * 0.25));
    sun.addColorStop(0.6, rgba(C.cyan, 0.12));
    sun.addColorStop(1, "transparent");
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, headY);
    ctx.rotate(k * 0.05);
    ctx.strokeStyle = rgba(C.amber, 0.28);
    ctx.lineWidth = 1.4;
    for (var ray = 0; ray < 8; ray++) {
      ctx.rotate(Math.PI / 8);
      ctx.beginPath();
      ctx.moveTo(h * 0.2, 0);
      ctx.lineTo(h * 0.42, 0);
      ctx.stroke();
    }
    ctx.restore();

    var ground = ctx.createRadialGradient(cx, h * 0.88, 0, cx, h * 0.88, w * 0.32);
    ground.addColorStop(0, rgba(C.amber, 0.55));
    ground.addColorStop(1, "transparent");
    ctx.fillStyle = ground;
    ctx.beginPath();
    ctx.ellipse(cx, h * 0.88, w * 0.28, h * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();

    for (var y = h * 0.14; y < h * 0.82; y += 2.2) {
      var hw = glowHalf(y - breathe, h);
      if (!hw) continue;
      var flicker = 0.45 + 0.4 * Math.abs(Math.sin(y * 0.07 - k * 2));
      ctx.globalAlpha = Math.min(0.92, flicker + level * 0.25 + (state === "listening" ? 0.08 : 0));
      var inHair = y < h * 0.34;
      ctx.fillStyle = inHair ? (Math.floor(y) % 6 < 2 ? C.cyan : "#E8A04A") : (state === "thinking" ? "#E39A3C" : "#F2B15A");
      var j = Math.sin(y * 0.09 + k * 1.7) * (state === "speaking" ? 2 : 0.6);
      var extra = inHair ? hw * 0.22 : 0;
      ctx.fillRect(cx - hw - extra * 0.35 + j, y, hw * 2 + extra, 1.6);
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = rgba("#FFF8EA", 0.85);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(cx, headY, h * 0.1, h * 0.125, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx - h * 0.02, headY - h * 0.02, h * 0.13, Math.PI * 1.05, Math.PI * 1.7);
    ctx.stroke();

    var open = state === "listening" ? 1 : eyeOpen(t);
    var eyeY = headY - h * 0.015;
    var look = state === "thinking" ? -h * 0.01 : Math.sin(k * 0.4) * h * 0.003;
    [-1, 1].forEach(function (d) {
      var ex = cx + d * h * 0.04 + look;
      ctx.fillStyle = rgba("#FFFDF6", 0.95);
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, h * 0.026, Math.max(1.2, h * 0.014 * open), 0, 0, Math.PI * 2);
      ctx.fill();
      if (open > 0.25) {
        ctx.fillStyle = C.cyanDark;
        ctx.beginPath();
        ctx.arc(ex, eyeY, Math.max(1.4, h * 0.008 * open), 0, Math.PI * 2);
        ctx.fill();
      }
    });

    var mouthY = headY + h * 0.055;
    var gap = lipGap(state, level, t, h * 0.04);
    ctx.strokeStyle = rgba("#FFF6E4", 0.95);
    ctx.fillStyle = rgba(C.cyan, 0.85);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - h * 0.035, mouthY);
    ctx.quadraticCurveTo(cx, mouthY - h * 0.01, cx + h * 0.035, mouthY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - h * 0.032, mouthY + gap);
    ctx.quadraticCurveTo(cx, mouthY + gap + h * 0.016, cx + h * 0.032, mouthY + gap);
    ctx.stroke();
    if (gap > h * 0.01) {
      ctx.globalAlpha = 0.8;
      ctx.fillRect(cx - h * 0.02, mouthY + 1, h * 0.04, Math.max(1, gap - 1));
      ctx.globalAlpha = 1;
    }
    if (state === "speaking") {
      for (var b = 0; b < 5; b++) {
        var bh = 2 + level * (6 + 10 * Math.abs(Math.sin(k * 14 + b)));
        ctx.fillStyle = "#FFF6E0";
        ctx.fillRect(cx + (b - 2) * h * 0.012, mouthY + gap * 0.45 - bh / 2, 2, bh);
      }
    }

    var rings = state === "speaking" || state === "listening" ? 3 : 0;
    for (var r = 0; r < rings; r++) {
      var ph = (k * (state === "listening" ? -0.35 : 0.5) + r / rings) % 1;
      if (ph < 0) ph += 1;
      ctx.globalAlpha = (1 - ph) * (0.2 + level * 0.45);
      ctx.strokeStyle = state === "listening" ? C.sage : C.amber;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      var radius = state === "listening" ? h * 0.18 - ph * h * 0.08 : h * 0.04 + ph * h * (0.08 + level * 0.12);
      ctx.arc(cx, mouthY, Math.max(8, radius), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    if (state === "thinking") {
      for (var n = 0; n < 6; n++) {
        var a = k * 0.8 + n * 1.05;
        ctx.fillStyle = n % 2 ? C.amber : C.sage;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * h * 0.2, headY + Math.sin(a) * h * 0.08, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    drawPulses(ctx, cx, mouthY, w, C.amber);
    drawAiMark(ctx, w, h, C);
  }

  function drawNeighbor(ctx, w, h, t, state, level) {
    var C = colors();
    var k = t * 0.001;
    var sway = Math.sin(k * 1.1) * (state === "listening" ? 7 : 3);
    var bob = Math.sin(k * 1.45) * 2.5;
    var tilt = state === "listening" ? -0.07 : state === "thinking" ? 0.045 : Math.sin(k * 0.4) * 0.012;
    var open = state === "listening" ? 1 : eyeOpen(t);
    var lookX = state === "thinking" ? -5 : Math.sin(k * 0.32) * 1.4;
    var S = Math.min(w, h);

    var sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#FFF7EC");
    sky.addColorStop(0.62, "#F8D7A4");
    sky.addColorStop(1, "#E7C48A");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    var sun = ctx.createRadialGradient(w * 0.8, h * 0.18, 0, w * 0.8, h * 0.18, w * 0.22);
    sun.addColorStop(0, "#FFF6D2");
    sun.addColorStop(0.5, rgba(C.amber, 0.9));
    sun.addColorStop(1, "transparent");
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(w * 0.8, h * 0.18, w * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.sage;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.84);
    ctx.quadraticCurveTo(w * 0.4, h * 0.74, w, h * 0.86);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();

    ctx.save();
    ctx.translate(w / 2 + sway, h * 0.48 + bob);
    ctx.rotate(tilt);

    ctx.fillStyle = rgba(C.navy, 0.08);
    ctx.beginPath();
    ctx.ellipse(0, S * 0.42, S * 0.2, S * 0.025, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#6E8A55";
    roundRect(ctx, -S * 0.2, S * 0.1, S * 0.4, S * 0.32, S * 0.1);
    ctx.fill();
    ctx.fillStyle = "#F6E6D0";
    ctx.beginPath();
    ctx.moveTo(-S * 0.06, S * 0.12);
    ctx.lineTo(S * 0.06, S * 0.12);
    ctx.lineTo(S * 0.09, S * 0.32);
    ctx.lineTo(-S * 0.09, S * 0.32);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = C.amber;
    ctx.beginPath();
    ctx.arc(-S * 0.13, S * 0.24, S * 0.012, 0, Math.PI * 2);
    ctx.arc(S * 0.13, S * 0.24, S * 0.012, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#E8B48A";
    roundRect(ctx, -S * 0.04, S * 0.05, S * 0.08, S * 0.08, 6);
    ctx.fill();

    ctx.fillStyle = "#5C4033";
    ctx.beginPath();
    ctx.arc(-S * 0.01, -S * 0.02, S * 0.195, Math.PI * 0.85, Math.PI * 2.15);
    ctx.quadraticCurveTo(S * 0.2, S * 0.12, S * 0.12, S * 0.16);
    ctx.quadraticCurveTo(0, S * 0.05, -S * 0.14, S * 0.12);
    ctx.quadraticCurveTo(-S * 0.22, S * 0.02, -S * 0.16, -S * 0.08);
    ctx.fill();

    ctx.fillStyle = "#F0C3A4";
    ctx.beginPath();
    ctx.arc(0, 0, S * 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#5C4033";
    ctx.beginPath();
    ctx.ellipse(-S * 0.01, -S * 0.07, S * 0.145, S * 0.09, -0.05, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(S * 0.145, S * 0.04, S * 0.045, S * 0.09, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.amber;
    ctx.beginPath();
    ctx.arc(-S * 0.08, -S * 0.12, S * 0.016, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = C.cyan;
    ctx.beginPath();
    ctx.ellipse(0, S * 0.105, S * 0.09, S * 0.028, 0, 0, Math.PI * 2);
    ctx.fill();

    [-1, 1].forEach(function (d) {
      var ex = d * S * 0.055 + lookX;
      var ey = -S * 0.015;
      ctx.fillStyle = "#FFFDF9";
      ctx.beginPath();
      ctx.ellipse(ex, ey, S * 0.03, Math.max(1.5, S * 0.032 * open), 0, 0, Math.PI * 2);
      ctx.fill();
      if (open > 0.2) {
        ctx.fillStyle = "#3E4F34";
        ctx.beginPath();
        ctx.arc(ex, ey + S * 0.004, S * 0.014, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1B2416";
        ctx.beginPath();
        ctx.arc(ex, ey + S * 0.004, S * 0.007, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.fillRect(ex - S * 0.008, ey - S * 0.004, S * 0.006, S * 0.006);
      }
      ctx.strokeStyle = "#6B4B38";
      ctx.lineWidth = Math.max(1.6, S * 0.006);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(ex - S * 0.028, ey - S * 0.042);
      ctx.quadraticCurveTo(ex, ey - S * 0.055, ex + S * 0.028, ey - S * 0.038);
      ctx.stroke();
    });

    ctx.strokeStyle = rgba("#C98462", 0.65);
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(0, S * 0.02);
    ctx.quadraticCurveTo(S * 0.012, S * 0.045, 0, S * 0.055);
    ctx.stroke();

    [-1, 1].forEach(function (d) {
      ctx.fillStyle = rgba("#E38B6A", 0.28);
      ctx.beginPath();
      ctx.ellipse(d * S * 0.085, S * 0.035, S * 0.026, S * 0.014, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = rgba("#8A5A3A", 0.45);
    [[-0.07, 0.02], [-0.055, 0.032], [-0.04, 0.02]].forEach(function (p) {
      ctx.beginPath();
      ctx.arc(S * p[0], S * p[1], S * 0.004, 0, Math.PI * 2);
      ctx.fill();
    });

    var gap = lipGap(state, level, t, S * 0.04);
    var mouthY = S * 0.07;
    var mw = S * 0.05;
    ctx.fillStyle = "#C45348";
    ctx.beginPath();
    ctx.moveTo(-mw, mouthY);
    ctx.quadraticCurveTo(0, mouthY - S * 0.012, mw, mouthY);
    ctx.quadraticCurveTo(0, mouthY + gap + S * 0.022, -mw, mouthY);
    ctx.fill();
    if (gap > S * 0.01) {
      ctx.fillStyle = "#6A3034";
      ctx.beginPath();
      ctx.ellipse(0, mouthY + gap * 0.42, mw * 0.52, Math.max(1, gap * 0.36), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFF4E8";
      ctx.fillRect(-mw * 0.42, mouthY + 1, mw * 0.84, Math.max(1.2, gap * 0.16));
    }

    if (state === "listening") {
      ctx.strokeStyle = rgba(C.sage, 0.85);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-S * 0.02, -S * 0.02, S * 0.2, Math.PI * 0.15, Math.PI * 0.55);
      ctx.stroke();
    }
    if (state === "thinking") {
      [0, 1, 2].forEach(function (n) {
        ctx.fillStyle = C.navy;
        ctx.globalAlpha = 0.35 + 0.45 * Math.abs(Math.sin(k * 3 + n));
        ctx.beginPath();
        ctx.arc(S * 0.22 + n * S * 0.03, -S * 0.22 - n * S * 0.012, S * 0.01, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    drawPulses(ctx, w / 2, h * 0.62, w, C.amber);
    drawAiMark(ctx, w, h, C);
  }

  function drawAdvisor(ctx, w, h, t, state, level) {
    var C = colors();
    var k = t * 0.001;
    var breathe = Math.sin(k * 1.25) * 2;
    var nod = state === "listening" ? Math.sin(k * 1.7) * 3 : 0;
    var open = state === "listening" ? 1 : eyeOpen(t);
    var lookX = state === "thinking" ? 6 : Math.sin(k * 0.28) * 1.2;
    var S = Math.min(w, h);

    var studio = ctx.createLinearGradient(0, 0, 0, h);
    studio.addColorStop(0, "#FBF7F1");
    studio.addColorStop(1, "#E8D4BA");
    ctx.fillStyle = studio;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = rgba(C.cyan, 0.28);
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.46, S * 0.4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.translate(w / 2, h * 0.46 + breathe + nod);

    ctx.fillStyle = rgba(C.navy, 0.07);
    ctx.beginPath();
    ctx.ellipse(0, S * 0.42, S * 0.18, S * 0.02, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#243026";
    ctx.beginPath();
    ctx.moveTo(-S * 0.26, S * 0.44);
    ctx.quadraticCurveTo(-S * 0.24, S * 0.16, -S * 0.06, S * 0.1);
    ctx.lineTo(S * 0.06, S * 0.1);
    ctx.quadraticCurveTo(S * 0.24, S * 0.16, S * 0.26, S * 0.44);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba("#F4E7D6", 0.9);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-S * 0.05, S * 0.12);
    ctx.lineTo(0, S * 0.28);
    ctx.lineTo(S * 0.05, S * 0.12);
    ctx.stroke();
    ctx.fillStyle = "#F7F1E8";
    ctx.beginPath();
    ctx.moveTo(-S * 0.035, S * 0.11);
    ctx.lineTo(S * 0.035, S * 0.11);
    ctx.lineTo(S * 0.055, S * 0.28);
    ctx.lineTo(-S * 0.055, S * 0.28);
    ctx.fill();
    ctx.fillStyle = C.amber;
    ctx.beginPath();
    ctx.arc(S * 0.1, S * 0.2, S * 0.014, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#E4B08A";
    roundRect(ctx, -S * 0.028, S * 0.06, S * 0.056, S * 0.07, 4);
    ctx.fill();

    ctx.fillStyle = "#2A221E";
    ctx.beginPath();
    ctx.arc(S * 0.13, -S * 0.02, S * 0.055, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -S * 0.04, S * 0.13, S * 0.15, 0, Math.PI * 1.02, Math.PI * 1.98);
    ctx.quadraticCurveTo(S * 0.12, S * 0.02, S * 0.08, S * 0.08);
    ctx.quadraticCurveTo(0, -S * 0.02, -S * 0.09, S * 0.05);
    ctx.quadraticCurveTo(-S * 0.14, -S * 0.04, -S * 0.1, -S * 0.1);
    ctx.fill();

    var face = ctx.createRadialGradient(-S * 0.03, -S * 0.04, S * 0.02, 0, 0, S * 0.16);
    face.addColorStop(0, "#F6D0B2");
    face.addColorStop(0.72, "#E4B08A");
    face.addColorStop(1, "#D09970");
    ctx.fillStyle = face;
    ctx.beginPath();
    ctx.ellipse(0, 0, S * 0.1, S * 0.125, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#2A221E";
    ctx.beginPath();
    ctx.ellipse(0, -S * 0.055, S * 0.1, S * 0.07, 0, Math.PI, 0);
    ctx.fill();

    [-1, 1].forEach(function (d) {
      var ex = d * S * 0.04 + lookX;
      var ey = -S * 0.012;
      var eh = Math.max(1.3, S * 0.016 * open);
      ctx.fillStyle = "#FFFDF9";
      ctx.beginPath();
      ctx.ellipse(ex, ey, S * 0.024, eh, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#3A2C26";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      if (open > 0.22) {
        ctx.fillStyle = "#3A312C";
        ctx.beginPath();
        ctx.arc(ex + lookX * 0.15, ey, Math.max(1.5, eh * 0.62), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.fillRect(ex - eh * 0.25, ey - eh * 0.35, Math.max(1.2, eh * 0.3), Math.max(1.2, eh * 0.3));
      }
      ctx.strokeStyle = "#2A221E";
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      var lift = state === "thinking" && d > 0 ? -S * 0.01 : 0;
      ctx.moveTo(ex - S * 0.026, ey - S * 0.03 + lift);
      ctx.quadraticCurveTo(ex, ey - S * 0.042 + lift, ex + S * 0.028, ey - S * 0.028);
      ctx.stroke();
    });

    ctx.strokeStyle = rgba("#C48A68", 0.8);
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(0, S * 0.02);
    ctx.quadraticCurveTo(S * 0.01, S * 0.045, 0, S * 0.055);
    ctx.stroke();

    ctx.fillStyle = rgba("#E7A08A", 0.35);
    [-1, 1].forEach(function (d) {
      ctx.beginPath();
      ctx.ellipse(d * S * 0.065, S * 0.03, S * 0.02, S * 0.01, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    var gap = lipGap(state, level, t, S * 0.026);
    var mouthY = S * 0.07;
    var mw = S * 0.032;
    ctx.fillStyle = "#A85A56";
    ctx.beginPath();
    ctx.moveTo(-mw, mouthY);
    ctx.quadraticCurveTo(0, mouthY - S * 0.006, mw, mouthY);
    ctx.quadraticCurveTo(0, mouthY + gap + S * 0.01, -mw, mouthY);
    ctx.fill();
    if (gap > S * 0.008) {
      ctx.fillStyle = "#5C2E34";
      ctx.beginPath();
      ctx.ellipse(0, mouthY + gap * 0.4, mw * 0.45, Math.max(1, gap * 0.32), 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (state === "thinking") {
      ctx.strokeStyle = rgba(C.amber, 0.9);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(S * 0.18, -S * 0.12, S * 0.035, 0.3, 1.7);
      ctx.stroke();
    }
    if (state === "speaking") {
      ctx.globalAlpha = 0.3 + level * 0.5;
      ctx.strokeStyle = C.cyan;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, mouthY, S * (0.05 + level * 0.04), 0.2, Math.PI - 0.2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    drawPulses(ctx, w / 2, h * 0.55, w, C.cyan);
    drawAiMark(ctx, w, h, C);
  }


  var DRAW = { glow: drawGlow, neighbor: drawNeighbor, advisor: drawAdvisor };

  window.CloserAvatars = {
    ids: IDS.slice(),
    current: function () { return current; },
    label: function () { return META[current].name; },
    version: function () { return META[current].version; },
    use: use,
    draw: function (ctx, w, h, timeMs) {
      if (!ctx || !w || !h) return;
      var run = runtime();
      ctx.clearRect(0, 0, w, h);
      (DRAW[current] || drawGlow)(ctx, w, h, timeMs || 0, run.state, run.level);
    },
    bindSwitcher: function () {
      document.querySelectorAll("[data-avatar-pick]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          use(btn.getAttribute("data-avatar-pick"));
        });
      });
      var raw = "";
      try { raw = (new URLSearchParams(location.search).get("avatar") || "").toLowerCase(); } catch (e) {}
      var id = resolve();
      use(id, { silent: !raw || raw === id });
    }
  };
})();
