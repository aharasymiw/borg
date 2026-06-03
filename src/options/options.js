// Options page logic: load settings into the form and persist on change.

import { getSettings, setSettings } from "../common/settings.js";

const FIELDS = {
  enabled: "checkbox",
  mode: "value",
  resultMode: "value",
  whisperToGM: "checkbox",
  speakingAs: "value",
  defaultDR: "number",
  debug: "checkbox",
};

function el(id) {
  return document.getElementById(id);
}

function flashSaved() {
  const s = el("saved");
  if (!s) return;
  s.hidden = false;
  clearTimeout(flashSaved._t);
  flashSaved._t = setTimeout(() => (s.hidden = true), 1200);
}

async function load() {
  const settings = await getSettings();
  for (const [id, kind] of Object.entries(FIELDS)) {
    const node = el(id);
    if (!node) continue;
    if (kind === "checkbox") node.checked = !!settings[id];
    else node.value = settings[id];
  }
}

function readValue(id, kind) {
  const node = el(id);
  if (kind === "checkbox") return node.checked;
  if (kind === "number") return parseInt(node.value, 10) || undefined;
  return node.value;
}

function wire() {
  for (const [id, kind] of Object.entries(FIELDS)) {
    const node = el(id);
    if (!node) continue;
    const evt = kind === "value" || kind === "number" ? "change" : "change";
    node.addEventListener(evt, async () => {
      const value = readValue(id, kind);
      if (value === undefined) return;
      await setSettings({ [id]: value });
      flashSaved();
    });
  }
}

load().then(wire);
