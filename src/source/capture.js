// Shared DOM-mutation capture for the jolly-rogenerator sheet.
//
// Page-safe (no chrome.*): this runs in the ISOLATED content-script world for the
// "mutation" strategy (the one this site uses), and is also importable by the
// page-world script for the event/store strategies. Capturing the roll is pure
// DOM scraping (read the result dialog's text), which works identically in the
// content world — so we avoid injecting a script into the page and the page-CSP
// fights that come with it (notably Firefox blocking moz-extension:// scripts).

import { siteConfig } from "./site-config.js";

function debounce(fn, ms) {
  let t = null;
  return () => {
    if (t) clearTimeout(t);
    t = setTimeout(fn, ms);
  };
}

// Observe the result dialog; on changes, scan() for the roll line and emit raw
// payloads via onRaw. Deduped by a signature, reset when the line clears so a
// re-roll of identical numbers (the line briefly disappears during the dice
// animation) still emits. Returns a disconnect function.
export function installMutation(onRaw) {
  let lastSig = null;
  const run = () => {
    let raw = null;
    try {
      raw = siteConfig.scan ? siteConfig.scan() : null;
    } catch (e) {
      console.error("[borg] scan error:", e);
    }
    if (!raw) {
      lastSig = null;
      return;
    }
    const sig = [raw.natural, raw.modifier, raw.total, raw.dr, raw.label].join("|");
    if (sig === lastSig) return;
    lastSig = sig;
    onRaw(raw);
  };
  const root = siteConfig.resultContainerSelector
    ? document.querySelector(siteConfig.resultContainerSelector) || document.body
    : document.body;
  const obs = new MutationObserver(debounce(run, 120));
  obs.observe(root, { childList: true, subtree: true, characterData: true });
  return () => obs.disconnect();
}
