// Background service worker: the message hub.
// Receives normalized rolls from the jolly-rogenerator content script and forwards
// them to the user's active Roll20 game tab. Analogous to Beyond20's
// src/extension/background.js (filterVTTTab + sendMessageToRoll20).

import { browserAPI, dlog, setDebug } from "../common/utils.js";
import { Action, ROLL20_EDITOR_MATCH } from "../common/constants.js";
import { getSettings, onSettingsChanged } from "../common/settings.js";

// Pick up the debug-logging preference (and follow changes to it).
getSettings().then((s) => setDebug(s.debug));
onSettingsChanged((s) => setDebug(s.debug));

const ROLL20_QUERY = "*://app.roll20.net/editor*";

// Remember the most recently focused Roll20 tab so multi-tab users get the right game.
let lastRoll20TabId = null;

function isRoll20Url(url) {
  return typeof url === "string" && url.includes(ROLL20_EDITOR_MATCH);
}

browserAPI.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await browserAPI.tabs.get(tabId);
    if (isRoll20Url(tab.url)) lastRoll20TabId = tabId;
  } catch {
    /* tab gone */
  }
});

browserAPI.tabs.onRemoved.addListener((tabId) => {
  if (tabId === lastRoll20TabId) lastRoll20TabId = null;
});

// Pick the best Roll20 editor tab to receive a roll.
async function findRoll20Tab() {
  let tabs = [];
  try {
    tabs = await browserAPI.tabs.query({ url: ROLL20_QUERY });
  } catch {
    // Fall back to scanning all tabs if the URL filter is unavailable.
    const all = await browserAPI.tabs.query({});
    tabs = all.filter((t) => isRoll20Url(t.url));
  }
  if (!tabs.length) return null;

  if (lastRoll20TabId) {
    const remembered = tabs.find((t) => t.id === lastRoll20TabId);
    if (remembered) return remembered;
  }
  const active = tabs.find((t) => t.active);
  if (active) return active;
  tabs.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
  return tabs[0];
}

async function forwardRoll(roll) {
  const tab = await findRoll20Tab();
  if (!tab) {
    console.warn("borg(bg): no Roll20 editor tab found");
    return { ok: false, error: "no-roll20-tab" };
  }
  try {
    await browserAPI.tabs.sendMessage(tab.id, { action: Action.ROLL, roll });
    dlog("borg(bg): forwarded roll to Roll20 tab", tab.id);
    return { ok: true, tabId: tab.id };
  } catch (e) {
    // Usually means the Roll20 content script isn't loaded in that tab yet.
    console.warn("borg(bg): sendMessage to Roll20 tab failed:", e?.message || e);
    return { ok: false, error: String(e?.message || e) };
  }
}

browserAPI.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg) return;
  if (msg.action === Action.PING) {
    sendResponse({ ok: true });
    return;
  }
  if (msg.action === Action.ROLL) {
    dlog("borg(bg): received roll from sheet:", msg.roll?.title);
    forwardRoll(msg.roll).then(sendResponse);
    return true; // keep the message channel open for the async response
  }
});

console.log("borg: background ready");
