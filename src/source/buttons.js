// Active "button" mode: inject "send to Roll20" buttons next to ability stats so
// the user can roll via the extension. The extension computes the roll itself
// (Pirate Borg: 1d20 + ability modifier vs DR) in reroll mode.
//
// Requires siteConfig.abilitySelectors to be filled in (see site-config.js).

import { siteConfig } from "./site-config.js";
import { abilityTest } from "../common/roll.js";

function readModifier(el) {
  const text = (el.textContent || el.value || "").trim();
  const m = text.match(/[+-]?\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

function attachButton(statEl, ability, ctx) {
  if (statEl.dataset.borgButton) return;
  statEl.dataset.borgButton = "1";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "borg-roll-button";
  btn.textContent = "⚔";
  btn.title = `Roll ${ability} to Roll20`;
  btn.style.cssText =
    "margin-left:4px;cursor:pointer;border:1px solid currentColor;border-radius:3px;" +
    "background:transparent;color:inherit;font-size:0.9em;line-height:1;padding:1px 4px;";
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const modifier = readModifier(statEl);
    const roll = abilityTest({
      ability,
      modifier,
      dr: ctx.settings.defaultDR,
      character: {},
    });
    ctx.sendRoll(roll);
  });

  const anchor = siteConfig.buttonAnchor ? siteConfig.buttonAnchor(statEl) : statEl;
  anchor.appendChild(btn);
}

export function initButtons(ctx) {
  const entries = Object.entries(siteConfig.abilitySelectors || {});
  if (!entries.length) {
    console.info("borg: button mode on, but no abilitySelectors configured yet (site-config.js).");
    return;
  }
  const attachAll = () => {
    for (const [ability, selector] of entries) {
      document.querySelectorAll(selector).forEach((el) => attachButton(el, ability, ctx));
    }
  };
  attachAll();
  // The sheet is a SPA; re-attach as it re-renders.
  const obs = new MutationObserver(() => attachAll());
  obs.observe(document.body, { childList: true, subtree: true });
}
