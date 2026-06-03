// Shared constants for the borg extension.

// Host of the source character-sheet site.
export const SOURCE_HOST = "jolly-rogenerator.app";

// Roll20 game editor URL (where the chat box lives).
export const ROLL20_EDITOR_MATCH = "app.roll20.net/editor";

// window.postMessage tag used to bridge the page world (page-script) and the
// isolated content-script world. Beyond20 uses a Symbol.for(...) tag for the same
// reason — we use a string tag because postMessage cannot carry Symbols.
export const BRIDGE_TAG = "borg::bridge";

// Message "action" values passed over chrome.runtime / tabs messaging.
export const Action = {
  ROLL: "roll",
  PING: "ping",
};

// Pirate Borg ability scores (same four as MÖRK BORG). Used when the extension
// constructs rolls itself (button mode). Order matters for display only.
export const ABILITIES = ["strength", "agility", "presence", "toughness"];

// Short labels for chat display.
export const ABILITY_LABELS = {
  strength: "Strength",
  agility: "Agility",
  presence: "Presence",
  toughness: "Toughness",
};

// Default Pirate Borg difficulty rating for an unmodified test.
export const DEFAULT_DR = 12;
