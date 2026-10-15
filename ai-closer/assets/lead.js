/* Lead POST for the closer. Same sheet endpoint as the other Linda Energy pages. */
(function () {
  "use strict";
  var C = window.LP_CONFIG || {};
  var S = window.SE = window.SE || {};
  S.CONSENT = "By checking this box, I agree that Linda Energy and its representatives may contact me at the number and email provided, including by calls and texts that use automated technology, AI-generated or prerecorded voices, about solar and energy services. Consent is not a condition of purchase. Message and data rates may apply. Message frequency varies. Reply STOP to opt out. See our Privacy Policy and Terms.";
  S.utm = function () {
    var p = new URLSearchParams(location.search), o = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"].forEach(function (k) {
      if (p.get(k)) o[k] = p.get(k);
    });
    return o;
  };
  S.post = async function (data) {
    var payload = Object.assign({
      brand: C.BRAND || "Linda",
      page_url: location.href.split("?")[0],
      referrer: document.referrer || "",
      user_agent: navigator.userAgent,
      submitted_at: new Date().toISOString()
    }, data);
    if (!C.ENDPOINT) {
      console.warn("[ai closer] demo mode", payload);
      return true;
    }
    var r = await fetch(C.ENDPOINT, {
      method: "POST",
      mode: C.NO_CORS === false ? "cors" : "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    if (r.type !== "opaque" && !r.ok) throw new Error("HTTP " + r.status);
    return true;
  };
})();
