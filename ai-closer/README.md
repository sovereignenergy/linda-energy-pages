# Linda, AI closer

Static page for Linda Energy. From the repo root:

```bash
python3 -m http.server 8765
```

Then open `http://localhost:8765/ai-closer/`.

Linda stays with the homeowner for the whole conversation. Binh’s queue is `review/`. Approve, edit, decline, and take-over update that queue, and the homeowner chat polls it. Lead rows post through the shared Apps Script endpoint in `config.js` at the repo root.

GitHub Pages: `https://sovereignenergy.github.io/linda-energy-pages/ai-closer/`

## Portraits

Golden, Neighbor, and Advisor are hyperrealistic photographs of Linda, the AI spokesperson. The files are `assets/portraits/glow.jpg`, `neighbor.jpg`, and `advisor.jpg`. They share the script, the voice bus, and the approval gate. Pick one with `?avatar=glow`, `?avatar=neighbor`, or `?avatar=advisor`. The buttons on the page write that param without a reload.

If the URL has no `avatar` value, `assets/config.js` uses `avatar`. If that is empty, `assets/brand.js` uses `defaultAvatar`. Anything else falls back to Golden.

The browser animates the whole photograph. She breathes, her head drifts a little, she blinks, and her mouth follows the voice level. The background stays in the frame, so she is not a cutout. Every portrait says she is an AI.

## Talking-head adapter

`LindaTalkingHead` draws each frame. `HELIOS_CONFIG.talkingHead` defaults to `"photo"`. Set it to `"heygen"`, `"did"`, or `"simli"` when a vendor session should replace that animation. Call `LindaTalkingHead.attachVideo(video)` with a playing video element, or set `talkingHeadSession` to an `http(s)` or `blob:` media URL. Until that video can play, the photo stays on screen. `register(id, driver)` can swap in a vendor SDK. No vendor key is shipped in the page.

## Voice

Spoken replies go through `HeliosVoice.speak()`. The mic uses the browser speech recognizer when it exists, and typing always works. Voice starts muted. The header toggle is what turns it on.

`assets/config.js` defaults to `voiceProvider: "webspeech"`. Force a visit with `?voice=webspeech` or `?voice=elevenlabs`.

ElevenLabs needs a proxy URL and no API key in the page:

```js
window.HELIOS_CONFIG = {
  voiceProvider: "elevenlabs",
  elevenLabsProxy: "https://your-proxy.example/v1/tts",
  elevenVoiceId: ""
};
```

The browser POSTs `{ "text", "voiceId" }`. The proxy streams audio bytes. If the proxy is missing or errors, Linda falls back to the browser voice.

## What stays in the engine

`closer.js`, `voice.js`, `queue.js`, and `fx.js` are the v4 engine, restyled for this brand. `avatars.js` keeps the same switcher and draw loop, and `LindaTalkingHead` is the portrait driver. `brand.js` holds the company, the bot name, Binh’s name, the license, the address, and the colors.
