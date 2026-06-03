// User settings, persisted in chrome.storage.sync.

import { browserAPI } from "./utils.js";
import { DEFAULT_DR } from "./constants.js";

export const DEFAULTS = {
  // Master on/off.
  enabled: true,
  // How rolls are captured on jolly-rogenerator:
  //   "passive" — listen for the sheet's own dice and mirror them.
  //   "buttons" — inject our own "send to Roll20" buttons next to stats.
  mode: "passive",
  // What lands in Roll20:
  //   "mirror"  — show the exact result captured from the sheet (no re-roll).
  //   "reroll"  — send a native Roll20 roll ([[1d20+mod]]) and let Roll20 roll.
  resultMode: "mirror",
  // Whisper every roll to the GM (/w gm).
  whisperToGM: false,
  // Roll20 "speaking as" character name to select before posting (optional).
  speakingAs: "",
  // Default difficulty rating used when the sheet doesn't specify one.
  defaultDR: DEFAULT_DR,
  // Verbose per-roll console logging across all contexts. Off for normal use.
  debug: false,
};

const KEY = "borg_settings";

export async function getSettings() {
  const stored = await browserAPI.storage.sync.get(KEY);
  return { ...DEFAULTS, ...(stored?.[KEY] || {}) };
}

export async function setSettings(patch) {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await browserAPI.storage.sync.set({ [KEY]: next });
  return next;
}

export function onSettingsChanged(callback) {
  browserAPI.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes[KEY]) {
      callback({ ...DEFAULTS, ...(changes[KEY].newValue || {}) });
    }
  });
}
