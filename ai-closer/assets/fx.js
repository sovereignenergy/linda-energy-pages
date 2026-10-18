/* Golden-hour motion: sunlight, drifting pollen, and the avatar frame loop.
   The field paints on the first frame. */
(function () {
  "use strict";
  var RM = document.documentElement.classList.contains("rm") || matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(pointer: fine)").matches;
  var H = window.HELIOS = window.HELIOS || { state: "idle", level: 0, pulses: [] };
  var avatars = [];
  var bg = null;
  var scrollY = 0;
  var mx = 0;
  var my = 0;
  var running = false;
  var motes = null;
  var spot = null;

  function palette() {
    var c = (window.CLOSER_BRAND && window.CLOSER_BRAND.colors) || {};
    return {
      cream: c.bg || "#FBF5EC",
      sand: c.sand || "#F3E6D2",
      citrus: c.amber || "#F2A541",
      terra: c.cyan || "#B5542A",
      sage: c.sage || "#7E8F5A",
      olive: c.navy || "#2F3A2A"
    };
  }
  function rgba(hex, a) {
    var h = String(hex || "#000").replace("#", "");
    var n = parseInt(h, 16);
    if (!isFinite(n)) n = 0;
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }
  function dprCap() {
    return Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.25 : 1.7);
  }
  function fit(cv) {
    var d = dprCap();
    var r = cv.getBoundingClientRect();
    var w = Math.max(2, r.width);
    var h = Math.max(2, r.height);
    cv.width = Math.round(w * d);
    cv.height = Math.round(h * d);
    var x = cv.getContext("2d", { alpha: true, willReadFrequently: cv.hasAttribute("data-avatar") });
    x.setTransform(d, 0, 0, d, 0, 0);
    return { cv: cv, ctx: x, w: w, h: h, on: true };
  }
  function makeMotes() {
    var P = palette();
    var mobile = window.innerWidth < 760;
    var colors = [P.citrus, P.sand, "#FFF6E0", P.sage, P.terra];
    var a = [];
    var n = mobile ? 48 : 110;
    for (var i = 0; i < n; i++) {
      a.push({
        x: Math.random(),
        y: Math.random(),
        v: 0.006 + Math.random() * 0.016,
        drift: (Math.random() - 0.5) * 0.012,
        s: 1.1 + Math.random() * 2.4,
        tw: Math.random() * 6.28,
        c: colors[i % colors.length]
      });
    }
    return a;
  }
  function drawBg(t) {
    if (!bg) return;
    var x = bg.ctx, w = bg.w, h = bg.h;
    var P = palette();
    var k = RM ? 0 : t * 0.001;
    x.clearRect(0, 0, w, h);

    var wash = x.createLinearGradient(0, 0, 0, h);
    wash.addColorStop(0, rgba("#FFF8EE", 0.2));
    wash.addColorStop(1, "transparent");
    x.fillStyle = wash;
    x.fillRect(0, 0, w, h);

    var sunX = w * (0.78 + Math.sin(k * 0.08) * 0.02);
    var sunY = h * (0.16 + Math.cos(k * 0.06) * 0.015);
    var glow = x.createRadialGradient(sunX, sunY, 0, sunX, sunY, w * 0.42);
    glow.addColorStop(0, rgba("#FFF1C4", 0.9));
    glow.addColorStop(0.35, rgba(P.citrus, 0.38));
    glow.addColorStop(1, "transparent");
    x.fillStyle = glow;
    x.beginPath();
    x.arc(sunX, sunY, w * 0.42, 0, Math.PI * 2);
    x.fill();

    x.save();
    x.translate(sunX, sunY);
    x.rotate(k * 0.04);
    for (var ray = 0; ray < 9; ray++) {
      x.rotate(Math.PI / 9);
      x.fillStyle = rgba(P.citrus, 0.045);
      x.beginPath();
      x.moveTo(0, 0);
      x.lineTo(w * 0.55, -16);
      x.lineTo(w * 0.55, 16);
      x.fill();
    }
    x.restore();

    var orb = x.createRadialGradient(w * 0.12, h * 0.82, 0, w * 0.12, h * 0.82, w * 0.36);
    orb.addColorStop(0, rgba(P.sage, 0.22));
    orb.addColorStop(1, "transparent");
    x.fillStyle = orb;
    x.beginPath();
    x.arc(w * 0.12, h * 0.82, w * 0.36, 0, Math.PI * 2);
    x.fill();

    var hillShift = mx * 18 + Math.sin(k * 0.2) * 8;
    x.fillStyle = rgba("#E7C48A", 0.55);
    x.beginPath();
    x.moveTo(0, h * 0.86);
    x.quadraticCurveTo(w * 0.3 + hillShift, h * 0.74, w * 0.62, h * 0.84);
    x.lineTo(w, h * 0.78);
    x.lineTo(w, h);
    x.lineTo(0, h);
    x.fill();
    x.fillStyle = rgba(P.sage, 0.55);
    x.beginPath();
    x.moveTo(0, h * 0.92);
    x.quadraticCurveTo(w * 0.45 - hillShift * 0.4, h * 0.84, w, h * 0.94);
    x.lineTo(w, h);
    x.lineTo(0, h);
    x.fill();

    if (!motes) motes = makeMotes();
    motes.forEach(function (p) {
      if (!RM) {
        p.y -= p.v * 0.0018;
        p.x += p.drift * 0.0018;
      }
      if (p.y < -0.04) { p.y = 1.02; p.x = Math.random(); }
      if (p.x < -0.05) p.x = 1.02;
      if (p.x > 1.05) p.x = -0.02;
      var px = (p.x + mx * 0.02) * w;
      var py = ((p.y - scrollY * 0.00004) % 1) * h;
      var tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin((RM ? p.tw : t * 0.0016) + p.tw));
      x.fillStyle = p.c;
      x.globalAlpha = tw * 0.85;
      x.beginPath();
      x.arc(px, py, p.s, 0, Math.PI * 2);
      x.fill();
    });
    x.globalAlpha = 1;
  }

  function drawAvatar(av, t) {
    if (window.CloserAvatars) CloserAvatars.draw(av.ctx, av.w, av.h, t || 0);
  }

  function frame(t) {
    drawBg(t || 0);
    avatars.forEach(function (av) { if (av.on) drawAvatar(av, t || 0); });
    if (!RM) requestAnimationFrame(frame);
  }

  function mount(cv) {
    if (!cv) return null;
    var av = fit(cv);
    avatars.push(av);
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { av.on = e.isIntersecting; if (RM && av.on) drawAvatar(av, 0); });
      }, { threshold: 0.05 });
      io.observe(cv);
    }
    return av;
  }

  var labels = { idle: "Here with you", listening: "Listening", thinking: "Thinking", speaking: "Speaking" };

  window.HeliosFX = {
    start: function () {
      var cv = document.getElementById("starfield");
      if (cv) bg = fit(cv);
      document.querySelectorAll("canvas[data-avatar]").forEach(mount);
      spot = document.getElementById("spot");
      if (!running) {
        running = true;
        if (RM) frame(0);
        else requestAnimationFrame(frame);
      }
      addEventListener("resize", function () {
        motes = null;
        if (bg) bg = Object.assign(bg, fit(bg.cv));
        avatars.forEach(function (av, i) { avatars[i] = Object.assign(av, fit(av.cv)); });
        if (RM) frame(0);
      });
      addEventListener("scroll", function () { scrollY = window.scrollY || 0; }, { passive: true });
      if (fine && !RM) {
        addEventListener("pointermove", function (e) {
          mx = e.clientX / innerWidth - 0.5;
          my = e.clientY / innerHeight - 0.5;
          if (spot) {
            spot.style.transform = "translate(" + (e.clientX - spot.offsetWidth / 2) + "px," + (e.clientY - spot.offsetHeight / 2) + "px)";
          }
        }, { passive: true });
      }
      var readout = document.getElementById("hudReadout");
      function tickClock() {
        if (!readout) return;
        var pt = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" }).format(new Date());
        var company = (window.CLOSER_BRAND && CLOSER_BRAND.company) || "Linda Energy";
        readout.textContent = company + " · AI · " + pt + " PT";
      }
      tickClock();
      if (!RM) setInterval(tickClock, 10000);
      document.querySelectorAll(".reveal").forEach(function (el) {
        if (RM || !("IntersectionObserver" in window)) { el.classList.add("in"); return; }
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
        }, { threshold: 0.18 });
        io.observe(el);
      });
    },
    setState: function (state) {
      H.state = state;
      document.body.dataset.av = state;
      document.querySelectorAll("[data-av-state]").forEach(function (el) { el.textContent = labels[state] || state; });
      if (RM) avatars.forEach(function (av) { if (av.on) drawAvatar(av, 0); });
    },
    boot: function (done) {
      var boot = document.getElementById("boot");
      if (!boot) { done && done(); return; }
      if (RM) {
        boot.hidden = true;
        document.body.classList.add("ready");
        document.body.classList.remove("booting");
        done && done();
        return;
      }
      var log = document.getElementById("bootLog");
      var bar = document.getElementById("bootBar");
      var brand = window.CLOSER_BRAND || {};
      var lines = [
        "Late light over the Inland Empire",
        (brand.utility || "SCE") + " notes on the table",
        (brand.advisorName || "Binh Phan") + " reviews anything final",
        (window.CloserAvatars ? CloserAvatars.label() : "Linda") + " is an AI, not a person",
        "Voice stays quiet until you turn it on",
        (brand.company || "Linda Energy") + " · " + (brand.license || "CSLB #139345")
      ];
      var i = 0;
      var skipped = false;
      function finish() {
        if (skipped) return;
        skipped = true;
        document.body.classList.add("ready");
        document.body.classList.remove("booting");
        setTimeout(function () { boot.hidden = true; done && done(); }, 520);
      }
      var skip = document.getElementById("bootSkip");
      if (skip) skip.addEventListener("click", finish);
      (function step() {
        if (skipped) return;
        if (i < lines.length) {
          var li = document.createElement("li");
          li.textContent = lines[i];
          if (log) log.appendChild(li);
          i++;
          if (bar) bar.style.width = (i / lines.length * 100) + "%";
          setTimeout(step, 280);
        } else setTimeout(finish, 420);
      })();
    }
  };
})();
