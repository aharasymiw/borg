// Runs in the PAGE world (injected via web_accessible_resources). Hooks the
// jolly-rogenerator sheet and forwards raw roll payloads to the isolated content
// script via window.postMessage.
//
// IMPORTANT: page world has no chrome.* access. Only import page-safe modules
// (constants.js, site-config.js + its transitive page-safe deps). Do NOT import
// utils.js (it references chrome at module load).

import { BRIDGE_TAG } from "../common/constants.js";
import { siteConfig } from "./site-config.js";
import { installMutation } from "./capture.js";

function emitRaw(raw, via) {
  if (!raw) return;
  if (siteConfig.discovery) console.log("[borg] captured roll via", via, raw);
  window.postMessage(
    { [BRIDGE_TAG]: true, from: "page", type: "captured-roll", data: { raw, via } },
    window.location.origin
  );
}

function safe(fn) {
  try {
    return fn();
  } catch (e) {
    console.error("[borg] hook error:", e);
    return null;
  }
}

// ── other strategies (unused here, kept generic) ────────────────────────────
function installEvents() {
  const off = [];
  for (const name of siteConfig.rollEventNames) {
    const handler = (event) => {
      const raw = safe(() => siteConfig.parseRollEvent(event));
      if (raw) emitRaw(raw, `event:${name}`);
    };
    document.addEventListener(name, handler, true);
    off.push(() => document.removeEventListener(name, handler, true));
  }
  return () => off.forEach((fn) => fn());
}

function installStore() {
  return safe(() => siteConfig.installStoreHook((raw) => emitRaw(raw, "store"))) || (() => {});
}

const STRATEGIES = {
  // Shared with the content world (see capture.js); page-world only injects this
  // script for the event/store strategies below.
  mutation: () => installMutation((raw) => emitRaw(raw, "mutation")),
  events: installEvents,
  store: installStore,
};

// ── discovery helper (off unless siteConfig.discovery) ──────────────────────
function installDiscoveryLogger() {
  const pathOf = (el) => {
    const parts = [];
    let n = el;
    for (let i = 0; n && n.nodeType === 1 && i < 4; i++, n = n.parentElement) {
      let p = n.tagName.toLowerCase();
      if (n.id) p += `#${n.id}`;
      if (n.className && typeof n.className === "string")
        p += "." + n.className.trim().split(/\s+/).slice(0, 2).join(".");
      parts.unshift(p);
    }
    return parts.join(" > ");
  };
  const onClick = (e) => console.log("[borg:discovery] click:", pathOf(e.target));
  document.addEventListener("click", onClick, true);
  return () => document.removeEventListener("click", onClick, true);
}

// ── boot ────────────────────────────────────────────────────────────────────
(function boot() {
  const install = STRATEGIES[siteConfig.strategy] || installMutation;
  install();
  if (siteConfig.discovery) {
    installDiscoveryLogger();
    console.log(`[borg] page hook active (strategy: ${siteConfig.strategy}); discovery on.`);
  }

  // Manual end-to-end test from the page console:
  //   __borgEmitTestRoll()  -> pushes a sample roll all the way to Roll20.
  window.__borgEmitTestRoll = (overrides = {}) =>
    emitRaw(
      {
        __borgTest: true,
        kind: "ability",
        title: "Strength",
        formula: "1d20+2",
        modifier: 2,
        dr: 12,
        outcome: "Success",
        character: { name: "Test Pirate" },
        result: { total: 15, natural: 13, dice: [{ sides: 20, value: 13 }] },
      },
      "test"
    );
})();
