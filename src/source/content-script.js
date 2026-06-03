// jolly-rogenerator source content script (isolated world).
// Injects the page-world hook, receives raw captures, normalizes them to a Roll,
// and forwards to the background SW for delivery to Roll20.

import { browserAPI, injectPageScript, onPageMessage, dlog, setDebug } from "../common/utils.js";
import { Action } from "../common/constants.js";
import { getSettings, onSettingsChanged } from "../common/settings.js";
import { normalizeRoll } from "../common/roll.js";
import { rawToRoll, siteConfig } from "./site-config.js";
import { installMutation } from "./capture.js";
import { initButtons } from "./buttons.js";

let settings = null;

// Promise-based so it works on both Chrome (chrome.runtime.sendMessage returns a
// promise in MV3) and Firefox (native browser.* is promise-only and ignores
// callbacks — the original callback form silently failed there).
async function sendRoll(roll) {
  try {
    const resp = await browserAPI.runtime.sendMessage({ action: Action.ROLL, roll });
    if (!resp?.ok) console.warn("borg: roll not delivered to Roll20:", resp?.error);
    else dlog("borg: roll sent to Roll20 tab", resp.tabId);
  } catch (e) {
    console.warn("borg: sendMessage failed:", e?.message || e);
  }
}

function handleRaw(raw) {
  let roll = null;
  try {
    const mapped = rawToRoll(raw);
    roll = mapped ? normalizeRoll(mapped) : null;
  } catch (e) {
    console.error("borg: rawToRoll failed", e);
  }
  if (roll) {
    dlog("borg: captured roll:", roll.title, "=", roll.result?.total);
    sendRoll(roll);
  }
}

async function start() {
  settings = await getSettings();
  setDebug(settings.debug);
  if (!settings.enabled) {
    console.log("borg: disabled in settings; not hooking the sheet.");
    return;
  }

  if (siteConfig.strategy === "mutation") {
    // Pure DOM scraping — run it right here in the isolated world. No page-world
    // script injection, so no page-CSP conflicts (this is what broke on Firefox).
    installMutation(handleRaw);
  } else {
    // Page-world strategies (event bus / store hook) need a script injected into
    // the page; it posts captures back over the window.postMessage bridge.
    onPageMessage((type, data) => {
      if (type === "captured-roll") handleRaw(data.raw);
    });
    injectPageScript("source-page.js");
  }

  // Optional active mode: inject our own roll buttons next to stats.
  if (settings.mode === "buttons") {
    initButtons({ settings, sendRoll });
  }

  console.log(`borg: source content script ready (mode: ${settings.mode}).`);
}

// Re-evaluate enabled/mode if the user changes settings (cheap reload nudge).
onSettingsChanged((next) => {
  const wasEnabled = settings?.enabled;
  settings = next;
  setDebug(next.debug);
  if (next.enabled && !wasEnabled) location.reload();
});

start();
