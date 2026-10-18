/* Hyperrealistic portraits of Linda, an AI spokesperson.
   glow, neighbor, and advisor are photographs in assets/portraits/.
   The photo driver animates them in the browser: breath, idle sway,
   blinks, and a mouth that follows the voice level. Nothing is cut out.
   LindaTalkingHead can hand the frame to a HeyGen, D-ID, or Simli video later. */
(function () {
  "use strict";

  var IDS = ["glow", "neighbor", "advisor"];
  var META = {
    glow: {
      name: "Linda",
      version: "Golden",
      blurb: "Golden hour · AI, not a person",
      zoom: 1.07,
      noseAt: 0.4,
      /* YuNet landmarks, normalized to the 1280×720 master. */
      face: { x: 0.341, y: 0.124, w: 0.189, h: 0.466 },
      re: [0.384, 0.314],
      le: [0.477, 0.294],
      nose: [0.434, 0.388],
      mouth: [0.401, 0.461, 0.489, 0.443]
    },
    neighbor: {
      name: "Linda",
      version: "Neighbor",
      blurb: "Kitchen table · AI, not a person",
      zoom: 1.56,
      noseAt: 0.38,
      face: { x: 0.335, y: 0.103, w: 0.147, h: 0.333 },
      re: [0.368, 0.234],
      le: [0.440, 0.214],
      nose: [0.411, 0.291],
      mouth: [0.386, 0.348, 0.450, 0.329]
    },
    advisor: {
      name: "Linda",
      version: "Advisor",
      blurb: "Front porch · AI, not a person",
      zoom: 1.49,
      noseAt: 0.38,
      face: { x: 0.391, y: 0.094, w: 0.146, h: 0.349 },
      re: [0.424, 0.236],
      le: [0.497, 0.218],
      nose: [0.465, 0.298],
      mouth: [0.439, 0.353, 0.507, 0.336]
    }
  };

  var current = "glow";
  var images = {};
  var pose = null;
  var chosenDriver = "";
  var sharedVideo = null;
  var registry = {};
  var reducedMotion = document.documentElement.classList.contains("rm") || matchMedia("(prefers-reduced-motion: reduce)").matches;

  function portraitUrl(id) {
    try {
      return new URL("portraits/" + id + ".jpg", document.currentScript.src).href;
    } catch (e) {
      return "assets/portraits/" + id + ".jpg";
    }
  }

  function preload() {
    IDS.forEach(function (id) {
      var im = new Image();
      im.decoding = "async";
      im.alt = "";
      im.onload = paintStill;
      im.src = portraitUrl(id);
      images[id] = im;
    });
  }

  function paintStill() {
    document.querySelectorAll("canvas[data-avatar]").forEach(function (cv) {
      var ctx = cv.getContext("2d");
      if (!ctx || !cv.width) return;
      var tr = ctx.getTransform();
      var dpr = tr && tr.a ? tr.a : 1;
      var w = cv.width / dpr;
      var h = cv.height / dpr;
      if (w < 2 || h < 2) return;
      try { drawFrame(ctx, w, h, reducedMotion ? 0 : performance.now(), runtime()); } catch (e) {}
    });
  }

  function runtime() {
    var H = window.HELIOS || { state: "idle", level: 0, pulses: [] };
    return {
      state: pose && pose.state ? pose.state : (H.state || "idle"),
      level: pose && typeof pose.level === "number" ? pose.level : Math.max(0, Math.min(1, H.level || 0)),
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
      el.textContent = meta.name + " is an AI, not a person.";
    });
    document.querySelectorAll("canvas[data-avatar]").forEach(function (cv) {
      cv.setAttribute("aria-label", meta.name + ", " + meta.version.toLowerCase() + " portrait. An AI, not a person.");
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

  function seedOf(id) {
    return id === "neighbor" ? 0.72 : id === "advisor" ? 0.31 : 0.15;
  }

  function blinkClosed(t, seed) {
    if (pose && typeof pose.blink === "number") return Math.max(0, Math.min(1, pose.blink));
    if (reducedMotion) return 0;
    var cycle = 3400 + seed * 1600;
    var phase = (t + seed * 900) % cycle;
    var start = cycle * 0.58;
    var closeD = 78;
    var openD = 140;
    var local = phase - start;
    if (local < 0 || local > closeD + openD) {
      var again = phase - (start + 300);
      if (seed > 0.5 && again > 0 && again < closeD + openD) local = again;
      else return 0;
    }
    if (local < closeD) {
      var u = local / closeD;
      return u * u;
    }
    var v = (local - closeD) / openD;
    return Math.max(0, 1 - v * v);
  }

  function motionAt(t, state, seed) {
    if (reducedMotion || (pose && pose.still)) return { x: 0, y: 0, rot: 0, scale: 1.03 };
    var breathe = Math.sin(t * 0.00162 + seed * 4);
    var scale = 1.045 + breathe * 0.0055;
    var x = Math.sin(t * 0.00082 + seed) * 1.45;
    var y = Math.sin(t * 0.00108 + 1.2) * 1.05 + breathe * 0.35;
    var rot = Math.sin(t * 0.0005 + seed * 2) * 0.007;
    if (state === "speaking") {
      y += Math.sin(t * 0.0072) * 0.65;
      rot += Math.sin(t * 0.0055) * 0.0025;
    } else if (state === "listening") {
      x *= 0.55;
      y *= 0.7;
    } else if (state === "thinking") {
      rot += Math.sin(t * 0.0011) * 0.004;
      x += 0.6;
    }
    return { x: x, y: y, rot: rot, scale: scale };
  }

  function jawAmount(t, state, level, seed) {
    if (pose && typeof pose.level === "number") level = pose.level;
    if (reducedMotion) return 0;
    if (state === "speaking") {
      var syllable = Math.abs(Math.sin(t * 0.017 + seed * 5));
      var micro = 0.62 + 0.38 * Math.abs(Math.sin(t * 0.043 + 1.4));
      var energy = 0.42 + 0.58 * Math.max(0, Math.min(1, level));
      return (0.06 + 0.94 * syllable * micro) * energy;
    }
    if (state === "listening") return 0.04;
    return 0;
  }

  function cropFor(img, meta, w, h) {
    var iw = img.naturalWidth;
    var ih = img.naturalHeight;
    var zoom = meta.zoom;
    var sh = Math.min(ih, ih / zoom);
    var sw = sh * (w / Math.max(1, h));
    if (sw > iw) {
      sw = iw;
      sh = sw * (h / Math.max(1, w));
    }
    var noseX = meta.nose[0] * iw;
    var noseY = meta.nose[1] * ih;
    var sx = noseX - sw * 0.5;
    var sy = noseY - sh * meta.noseAt;
    if (sx < 0) sx = 0;
    if (sy < 0) sy = 0;
    if (sx + sw > iw) sx = iw - sw;
    if (sy + sh > ih) sy = ih - sh;
    return { sx: sx, sy: sy, sw: sw, sh: sh, iw: iw, ih: ih };
  }

  function toCanvas(nx, ny, crop, w, h) {
    return {
      x: ((nx * crop.iw) - crop.sx) / crop.sw * w,
      y: ((ny * crop.ih) - crop.sy) / crop.sh * h
    };
  }

  function moved(p, pivot, motion) {
    var x = p.x - pivot.x;
    var y = p.y - pivot.y;
    var c = Math.cos(motion.rot);
    var s = Math.sin(motion.rot);
    return {
      x: (x * c - y * s) * motion.scale + pivot.x + motion.x,
      y: (x * s + y * c) * motion.scale + pivot.y + motion.y
    };
  }

  function dprOf(ctx) {
    var tr = ctx.getTransform();
    return tr && tr.a ? tr.a : 1;
  }

  function bilinear(src, w, h, x, y) {
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x > w - 1.001) x = w - 1.001;
    if (y > h - 1.001) y = h - 1.001;
    var x0 = Math.floor(x);
    var y0 = Math.floor(y);
    var x1 = x0 + 1 < w ? x0 + 1 : x0;
    var y1 = y0 + 1 < h ? y0 + 1 : y0;
    var tx = x - x0;
    var ty = y - y0;
    var i00 = (y0 * w + x0) * 4;
    var i10 = (y0 * w + x1) * 4;
    var i01 = (y1 * w + x0) * 4;
    var i11 = (y1 * w + x1) * 4;
    var out = [0, 0, 0, 255];
    var k = 0;
    for (; k < 3; k++) {
      var a = src[i00 + k] + (src[i10 + k] - src[i00 + k]) * tx;
      var b = src[i01 + k] + (src[i11 + k] - src[i01 + k]) * tx;
      out[k] = a + (b - a) * ty;
    }
    return out;
  }

  function warp(ctx, cssX, cssY, cssW, cssH, sampleAt) {
    var dpr = dprOf(ctx);
    var x0 = Math.max(0, Math.floor(cssX * dpr));
    var y0 = Math.max(0, Math.floor(cssY * dpr));
    var x1 = Math.min(ctx.canvas.width, Math.ceil((cssX + cssW) * dpr));
    var y1 = Math.min(ctx.canvas.height, Math.ceil((cssY + cssH) * dpr));
    var rw = x1 - x0;
    var rh = y1 - y0;
    if (rw < 2 || rh < 2 || rw > 900 || rh > 900) return;
    var img = ctx.getImageData(x0, y0, rw, rh);
    var src = img.data;
    var bag = ctx.canvas.__lindaWarp || (ctx.canvas.__lindaWarp = {});
    var key = rw + "x" + rh;
    var out = bag[key];
    if (!out) {
      out = ctx.createImageData(rw, rh);
      bag[key] = out;
    }
    var dst = out.data;
    var j, i, o, s, m, k, p, cx, cy;
    for (j = 0; j < rh; j++) {
      cy = (y0 + j + 0.5) / dpr;
      for (i = 0; i < rw; i++) {
        cx = (x0 + i + 0.5) / dpr;
        o = (j * rw + i) * 4;
        s = sampleAt(cx, cy);
        if (!s || s.mix < 0.012) {
          dst[o] = src[o];
          dst[o + 1] = src[o + 1];
          dst[o + 2] = src[o + 2];
          dst[o + 3] = src[o + 3];
          continue;
        }
        p = bilinear(src, rw, rh, s.x * dpr - x0, s.y * dpr - y0);
        m = s.mix > 1 ? 1 : s.mix;
        k = 1 - m;
        dst[o] = p[0] * m + src[o] * k;
        dst[o + 1] = p[1] * m + src[o + 1] * k;
        dst[o + 2] = p[2] * m + src[o + 2] * k;
        dst[o + 3] = 255;
      }
    }
    ctx.putImageData(out, x0, y0);
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

  function drawAiMark(ctx, w, h) {
    var label = "AI";
    ctx.save();
    ctx.font = "700 " + Math.max(12, Math.round(h * 0.034)) + "px Inter, system-ui, sans-serif";
    var tw = ctx.measureText(label).width;
    var padX = Math.max(9, w * 0.03);
    var bw = tw + padX * 2;
    var bh = Math.max(20, h * 0.058);
    var x = w * 0.045;
    var y = h * 0.045;
    ctx.shadowColor = "rgba(43,36,32,0.18)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = "rgba(251,245,236,0.94)";
    roundRect(ctx, x, y, bw, bh, bh / 2);
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.fillStyle = "#8F3F1D";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + padX, y + bh / 2 + 0.5);
    ctx.restore();
  }

  function drawPhoto(ctx, w, h, t, run) {
    var meta = META[current] || META.glow;
    var img = images[current];
    ctx.clearRect(0, 0, w, h);
    if (!img || !img.complete || !img.naturalWidth) {
      ctx.fillStyle = "#F3E6D2";
      ctx.fillRect(0, 0, w, h);
      drawAiMark(ctx, w, h);
      return;
    }
    var crop = cropFor(img, meta, w, h);
    var seed = seedOf(current);
    var motion = motionAt(t, run.state, seed);
    var nose = toCanvas(meta.nose[0], meta.nose[1], crop, w, h);
    var chinRaw = toCanvas(meta.nose[0], meta.face.y + meta.face.h, crop, w, h);
    var pivot = { x: nose.x, y: nose.y + (chinRaw.y - nose.y) * 0.92 };
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.translate(pivot.x + motion.x, pivot.y + motion.y);
    ctx.rotate(motion.rot);
    ctx.scale(motion.scale, motion.scale);
    ctx.translate(-pivot.x, -pivot.y);
    ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, w, h);
    ctx.restore();

    if (!reducedMotion || (pose && (pose.blink || pose.level || pose.state))) {
      try {
        animateFace(ctx, w, h, t, run, meta, crop, pivot, motion, seed);
      } catch (e) {}
    }
    drawAiMark(ctx, w, h);
  }

  function animateFace(ctx, w, h, t, run, meta, crop, pivot, motion, seed) {
    var re = moved(toCanvas(meta.re[0], meta.re[1], crop, w, h), pivot, motion);
    var le = moved(toCanvas(meta.le[0], meta.le[1], crop, w, h), pivot, motion);
    var iod = Math.hypot(le.x - re.x, le.y - re.y);
    if (iod < 8) return;
    var angle = Math.atan2(le.y - re.y, le.x - re.x);
    var closed = blinkClosed(t, seed);
    if (closed > 0.02) {
      blinkEye(ctx, re, iod, angle, closed);
      blinkEye(ctx, le, iod, angle, closed);
    }
    var amount = jawAmount(t, run.state, run.level, seed);
    if (amount > 0.02) speakMouth(ctx, h, meta, crop, pivot, motion, amount);
  }

  function blinkEye(ctx, eye, iod, angle, closed) {
    var rx = iod * 0.2;
    var ry = iod * 0.125;
    var pad = Math.max(rx, ry) * 2.15;
    var cosA = Math.cos(angle);
    var sinA = Math.sin(angle);
    var cosB = Math.cos(-angle);
    var sinB = Math.sin(-angle);
    warp(ctx, eye.x - pad, eye.y - pad, pad * 2, pad * 2, function (px, py) {
      var dx = px - eye.x;
      var dy = py - eye.y;
      var lx = dx * cosB - dy * sinB;
      var ly = dx * sinB + dy * cosB;
      var nx = lx / rx;
      var ny = ly / ry;
      var r2 = nx * nx + ny * ny;
      if (r2 >= 1) return null;
      var edge = r2 <= 0.62 ? 1 : 1 - (r2 - 0.62) / 0.38;
      edge = edge * edge * (3 - 2 * edge);
      var sly = ly * (1 - closed * 0.86) - closed * 0.58 * ry;
      var mix = closed * edge;
      if (mix < 0.012) return null;
      return {
        x: eye.x + lx * cosA - sly * sinA,
        y: eye.y + lx * sinA + sly * cosA,
        mix: mix
      };
    });
  }

  function speakMouth(ctx, h, meta, crop, pivot, motion, amount) {
    var a = moved(toCanvas(meta.mouth[0], meta.mouth[1], crop, h, h), pivot, motion);
    var b = moved(toCanvas(meta.mouth[2], meta.mouth[3], crop, h, h), pivot, motion);
    var chin = moved(toCanvas(meta.nose[0], meta.face.y + meta.face.h, crop, h, h), pivot, motion);
    var mouthW = Math.hypot(b.x - a.x, b.y - a.y);
    if (mouthW < 6) return;
    var mx = (a.x + b.x) / 2;
    var upperY = (a.y + b.y) / 2 - mouthW * 0.1;
    var chinY = chin.y;
    var faceH = Math.max(24, chinY - moved(toCanvas(meta.nose[0], meta.face.y, crop, h, h), pivot, motion).y);
    var maxDrop = Math.max(8, Math.min(16, faceH * 0.09));
    var drop = maxDrop * amount;
    var sigma = mouthW * 0.72;
    var lipSpan = mouthW * 0.24;
    var neckEnd = chinY + faceH * 0.16;
    var rectX = mx - mouthW * 1.15;
    var rectY = upperY - 12;
    var rectH = neckEnd - rectY + 8;
    warp(ctx, rectX, rectY, mouthW * 2.3, rectH, function (px, py) {
      var dx = px - mx;
      var g = Math.exp(-(dx * dx) / (2 * sigma * sigma));
      var env = 0;
      if (py < upperY - 10) return null;
      if (py < upperY) env = ((py - (upperY - 10)) / 10) * 0.25;
      else if (py < upperY + lipSpan) {
        var u = (py - upperY) / lipSpan;
        env = u * u * (3 - 2 * u);
      } else if (py < chinY) env = 1;
      else if (py < neckEnd) {
        var v = (py - chinY) / (neckEnd - chinY);
        env = 1 - v * v;
      } else return null;
      var shift = drop * g * env;
      var mix = Math.min(1, shift / 0.75) * Math.min(1, g * 1.35);
      if (mix < 0.012 || shift < 0.2) return null;
      return { x: px, y: py - shift, mix: mix };
    });
  }

  function drawCover(ctx, source, w, h) {
    var sw = source.videoWidth || source.naturalWidth;
    var sh = source.videoHeight || source.naturalHeight;
    if (!sw || !sh) return;
    var scale = Math.max(w / sw, h / sh);
    var dw = sw * scale;
    var dh = sh * scale;
    ctx.drawImage(source, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }

  function sessionVideo(driver) {
    if (driver.video || driver._sessionTried) return driver.video;
    var session = window.HELIOS_CONFIG && window.HELIOS_CONFIG.talkingHeadSession;
    if (!session || typeof session !== "string") return null;
    if (!/^https?:|^blob:/.test(session)) return null;
    driver._sessionTried = session;
    var video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.autoplay = true;
    video.src = session;
    video.addEventListener("error", function () { driver.video = null; });
    video.play().catch(function () {});
    driver.video = video;
    return video;
  }

  function remoteDraw(driver, ctx, w, h, t, run) {
    var video = sharedVideo || sessionVideo(driver);
    if (video && video.readyState >= 2 && (video.videoWidth || video.naturalWidth)) {
      ctx.clearRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      drawCover(ctx, video, w, h);
      drawAiMark(ctx, w, h);
      return;
    }
    drawPhoto(ctx, w, h, t, run);
  }

  function makeRemote(id) {
    return {
      id: id,
      video: null,
      draw: function (ctx, w, h, t, run) { remoteDraw(this, ctx, w, h, t, run); }
    };
  }

  registry.photo = {
    id: "photo",
    draw: function (ctx, w, h, t, run) { drawPhoto(ctx, w, h, t, run); }
  };
  registry.heygen = makeRemote("heygen");
  registry.did = makeRemote("did");
  registry.simli = makeRemote("simli");

  function resolveDriver() {
    var id = chosenDriver || (window.HELIOS_CONFIG && window.HELIOS_CONFIG.talkingHead) || "photo";
    id = String(id).toLowerCase();
    return registry[id] || registry.photo;
  }

  function drawFrame(ctx, w, h, timeMs, run) {
    var driver = resolveDriver();
    driver.draw(ctx, w, h, timeMs || 0, run || runtime());
  }

  window.LindaTalkingHead = {
    drivers: function () { return Object.keys(registry); },
    current: function () { return resolveDriver().id; },
    /* use() overrides HELIOS_CONFIG.talkingHead until the page reloads. */
    use: function (id) {
      id = String(id || "photo").toLowerCase();
      if (!registry[id]) id = "photo";
      chosenDriver = id;
      return id;
    },
    /* Replace the built-in photo or vendor driver. */
    register: function (id, driver) {
      if (!id || !driver || typeof driver.draw !== "function") return false;
      registry[String(id).toLowerCase()] = driver;
      return true;
    },
    /* A playing video from HeyGen, D-ID, or Simli. The photo stays up until it can play. */
    attachVideo: function (videoEl) {
      sharedVideo = videoEl || null;
      return sharedVideo;
    },
    detachVideo: function () {
      sharedVideo = null;
    },
    /* Hold a pose for a still. Pass null to follow the voice again. */
    preview: function (next) { pose = next || null; },
    frame: function (ctx, w, h, timeMs, run) {
      drawFrame(ctx, w, h, timeMs, run);
    }
  };

  window.CloserAvatars = {
    ids: IDS.slice(),
    current: function () { return current; },
    label: function () { return META[current].name; },
    version: function () { return META[current].version; },
    use: use,
    draw: function (ctx, w, h, timeMs) {
      if (!ctx || !w || !h) return;
      drawFrame(ctx, w, h, timeMs || 0, runtime());
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

  preload();
})();
