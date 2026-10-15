/* Identity for this install. The closer engine reads this file and nothing else for brand copy. */
(function () {
  "use strict";
  window.CLOSER_BRAND = {
    company: "Linda Energy",
    botName: "Linda",
    advisorName: "Binh Phan",
    advisorShort: "Binh",
    license: "CSLB #139345",
    address: "41653 Margarita Rd #101, Temecula, CA",
    region: "Inland Empire",
    utility: "SCE",
    handle: "@golindaenergy",
    defaultAvatar: "glow",
    colors: {
      bg: "#FBF5EC",
      cream: "#FBF5EC",
      sand: "#F3E6D2",
      navy: "#2F3A2A",
      cyan: "#B5542A",
      cyanDark: "#8F3F1D",
      amber: "#F2A541",
      sage: "#7E8F5A",
      text: "#2B2420",
      muted: "#6B5D52"
    }
  };

  function rgba(hex, a) {
    var h = String(hex || "").replace("#", "");
    if (h.length !== 6) return "transparent";
    var n = parseInt(h, 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }

  var c = window.CLOSER_BRAND.colors;
  var root = document.documentElement;
  root.style.setProperty("--bg", c.bg);
  root.style.setProperty("--cream", c.cream);
  root.style.setProperty("--sand", c.sand);
  root.style.setProperty("--navy", c.navy);
  root.style.setProperty("--olive", c.navy);
  root.style.setProperty("--ink", c.text);
  root.style.setProperty("--muted", c.muted);
  root.style.setProperty("--cyan", c.cyan);
  root.style.setProperty("--terra", c.cyan);
  root.style.setProperty("--cyan-dark", c.cyanDark);
  root.style.setProperty("--terra-d", c.cyanDark);
  root.style.setProperty("--amber", c.amber);
  root.style.setProperty("--citrus", c.amber);
  root.style.setProperty("--sage", c.sage);
  root.style.setProperty("--line", rgba(c.cyan, 0.22));
  root.style.setProperty("--panel", "rgba(255,253,249,.92)");

  document.querySelectorAll("[data-brand-license]").forEach(function (el) {
    el.textContent = window.CLOSER_BRAND.license;
  });
  document.querySelectorAll("[data-brand-company]").forEach(function (el) {
    el.textContent = window.CLOSER_BRAND.company;
  });
  document.querySelectorAll("[data-brand-address]").forEach(function (el) {
    el.textContent = window.CLOSER_BRAND.address;
  });
})();
