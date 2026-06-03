// Cross-cutting helpers: browser API shim, browser detection, page-world script
// injection, and the page<->content message bridge.

import { BRIDGE_TAG } from "./constants.js";

// WebExtension API: Firefox exposes `browser`, Chrome exposes `chrome`.
export const browserAPI =
  typeof browser !== "undefined" && browser.runtime ? browser : chrome;

// "chrome" | "firefox" — set at build time by esbuild's `define`, with a runtime fallback.
export function getBrowser() {
  const compiled = typeof __BROWSER__ !== "undefined" ? __BROWSER__ : null;
  if (compiled) return compiled;
  return typeof browser !== "undefined" && browser.runtime ? "firefox" : "chrome";
}

// Inject a bundled script into the *page* world (not the isolated content-script
// world) by adding a <script src=...> pointing at a web_accessible_resource.
// Mirrors Beyond20's src/common/utils.js injectPageScript().
export function injectPageScript(fileName, onload = null) {
  const s = document.createElement("script");
  s.src = browserAPI.runtime.getURL(fileName);
  s.type = "text/javascript";
  s.onload = () => {
    s.remove();
    if (onload) onload();
  };
  (document.head || document.documentElement).appendChild(s);
  return s;
}

// --- page <-> content bridge (window.postMessage with a known tag) ---

// Called from the page world to hand data to the content script.
export function pageToContent(type, data = {}) {
  window.postMessage({ [BRIDGE_TAG]: true, from: "page", type, data }, window.location.origin);
}

// Called from the content script to listen for page-world messages.
export function onPageMessage(handler) {
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const msg = event.data;
    if (!msg || msg[BRIDGE_TAG] !== true || msg.from !== "page") return;
    handler(msg.type, msg.data);
  });
}

// Called from the content script to push data into the page world (e.g. settings).
export function contentToPage(type, data = {}) {
  window.postMessage({ [BRIDGE_TAG]: true, from: "content", type, data }, window.location.origin);
}

// Called from the page world to listen for content-script messages.
export function onContentMessage(handler) {
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const msg = event.data;
    if (!msg || msg[BRIDGE_TAG] !== true || msg.from !== "content") return;
    handler(msg.type, msg.data);
  });
}

// --- debug logging (gated by the `debug` setting; default off) ---
// One-time "ready" logs and warnings stay on always; the noisy per-roll hop logs
// go through dlog() so a normal user's console stays quiet.
let _debug = false;
export function setDebug(on) {
  _debug = !!on;
}
export function dlog(...args) {
  if (_debug) console.log(...args);
}

// Small debounce used to coalesce rapid DOM mutations.
export function debounce(fn, ms = 50) {
  let t = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
