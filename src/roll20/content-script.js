// Roll20 destination content script.
// Receives a normalized roll from the background SW and types it into the Roll20
// chat box, exactly like a user would. Ported from Beyond20's
// src/roll20/content-script.js postChatMessage().

import { browserAPI, dlog, setDebug } from "../common/utils.js";
import { Action } from "../common/constants.js";
import { getSettings, onSettingsChanged } from "../common/settings.js";
import { formatRoll } from "./templates.js";

getSettings().then((s) => setDebug(s.debug));
onSettingsChanged((s) => setDebug(s.debug));

// NOTE: these selectors match Roll20's classic editor chat box. Confirm against the
// live Roll20 DOM during discovery — Roll20 occasionally restructures the UI.
function postChatMessage(message, character = null) {
  const chat = document.getElementById("textchat-input");
  const txt = chat?.querySelector("textarea");
  const btn = chat?.querySelector("button");
  const speakingas = document.getElementById("speakingas");

  if (!chat || !txt || !btn) {
    console.warn("borg: could not find the Roll20 chat box (#textchat-input).");
    return false;
  }

  // Optionally select the "speaking as" character.
  let restoreAs = null;
  if (speakingas) {
    restoreAs = speakingas.value;
    let matched = false;
    if (character) {
      const want = character.toLowerCase().trim();
      for (const opt of speakingas.children) {
        if (opt.text.toLowerCase().trim() === want) {
          opt.selected = true;
          matched = true;
          break;
        }
      }
    }
    if (!matched && speakingas.children[0]) speakingas.children[0].selected = true;
  }

  const oldText = txt.value;
  txt.value = message;
  btn.click();
  // Restore prior chat input + speaker so we don't disturb the user's draft.
  txt.value = oldText;
  if (speakingas && restoreAs !== null) speakingas.value = restoreAs;
  return true;
}

browserAPI.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.action !== Action.ROLL) return;
  dlog("borg(roll20): received roll, posting to chat:", msg.roll?.title);
  getSettings().then((settings) => {
    try {
      const { message, speakingAs } = formatRoll(msg.roll, settings);
      const ok = postChatMessage(message, speakingAs);
      dlog("borg(roll20): postChatMessage returned", ok);
      sendResponse({ ok });
    } catch (e) {
      console.error("borg: failed to post roll to Roll20", e);
      sendResponse({ ok: false, error: String(e?.message || e) });
    }
  });
  return true; // async response
});

console.log("borg: Roll20 content script ready");
