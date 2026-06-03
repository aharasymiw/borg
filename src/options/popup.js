// Popup: quick toggles + a link to the full options page.

import { browserAPI } from "../common/utils.js";
import { getSettings, setSettings } from "../common/settings.js";

function el(id) {
  return document.getElementById(id);
}

async function load() {
  const settings = await getSettings();
  el("enabled").checked = !!settings.enabled;
  el("mode").value = settings.mode;
}

function wire() {
  el("enabled").addEventListener("change", (e) => setSettings({ enabled: e.target.checked }));
  el("mode").addEventListener("change", (e) => setSettings({ mode: e.target.value }));
  el("open-options").addEventListener("click", () => {
    if (browserAPI.runtime.openOptionsPage) browserAPI.runtime.openOptionsPage();
    else window.open(browserAPI.runtime.getURL("options.html"));
  });
}

load().then(wire);
