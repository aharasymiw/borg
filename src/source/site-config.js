// ──────────────────────────────────────────────────────────────────────────
// Site-specific adapter for jolly-rogenerator.app (Pirate Borg).
//
// Finalized from live inspection of a logged-in character sheet (see
// docs/discovery.md). The sheet's "Manual Dice Roller" is a broken 3D dice-box
// canvas and is ignored. The working rolls are the Combat-Action modals
// (Attack / Defend / Ability Test), which render a parseable result line in the
// dialog DOM, e.g.:
//     Ability test:  "FAILED! Rolled: 3 + 3 = 6 vs DR 12"
//     Attack:        "Hit! Flintlock pistol: 17 + 3 = 20 vs DR 12"
// Shape: <outcome>! <label>: <d20> + <modifier> = <total> vs DR <dr>
//
// Capture = observe the dialog DOM, scan() the result line. Page-safe (no chrome.*).
// ──────────────────────────────────────────────────────────────────────────

import { ADV } from "../common/roll.js";

const ROLL_RE = /(\d+)\s*\+\s*(-?\d+)\s*=\s*(\d+)\s*vs\s*DR\s*(\d+)/i;
const OUTCOME_RE = /\b(CRITICAL|FUMBLE|SUCCESS|FAILED|HIT|MISS)\s*!/i;

function dialog() {
  return document.querySelector('[role="dialog"], [role="alertdialog"]');
}

function dialogTitle() {
  const d = dialog();
  if (!d) return null;
  const h = d.querySelector("h1,h2,h3,[role=heading]");
  let t = ((h && h.textContent) || "").trim();
  if (!t) t = ((d.innerText || "").trim().split("\n")[0] || "");
  return t.replace(/\s+/g, " ").slice(0, 40);
}

// Outcome (Hit!/FAILED!/...) lives in a sibling/parent of the result line; the
// bare word "hit" also appears in the modal description ("On hit, roll..."), so
// require a trailing "!" and search a few ancestors.
function outcomeNear(node) {
  let e = node;
  for (let i = 0; i < 5 && e; i++) {
    const m = (e.textContent || "").match(OUTCOME_RE);
    if (m) return m[1].toUpperCase();
    e = e.parentElement;
  }
  return null;
}

function characterName() {
  return (document.title.split(" - ")[0] || "").trim() || null;
}

export const siteConfig = {
  strategy: "mutation",
  // Verbose console logging of capture signals. Off for normal use.
  discovery: false,
  // Observe the whole body (the roll dialog is portaled under <body>).
  resultContainerSelector: null,

  // Inspect the open roll dialog; return a raw roll payload or null.
  scan() {
    const d = dialog();
    if (!d) return null;
    let node = null;
    for (const e of d.querySelectorAll("*")) {
      const t = e.textContent || "";
      if (ROLL_RE.test(t) && t.length < 120) node = e; // tightest match
    }
    if (!node) return null;
    const text = (node.textContent || "").replace(/\s+/g, " ").trim();
    const m = text.match(ROLL_RE);
    if (!m) return null;
    let label = null;
    const before = text.slice(0, m.index).trim();
    const lm = before.match(/([^:!]+):\s*$/);
    if (lm) label = lm[1].trim();
    // Attacks describe an on-hit damage die ("…roll 2d4 damage"). jolly never
    // rolls it, so we capture the formula and let Roll20 roll it on a hit.
    const dmgM = (d.innerText || "").match(/roll\s+(\d+d\d+(?:\s*[+-]\s*\d+)?)\s+damage/i);
    const damage = dmgM ? dmgM[1].replace(/\s+/g, "") : null;
    return {
      natural: +m[1],
      modifier: +m[2],
      total: +m[3],
      dr: +m[4],
      outcome: outcomeNear(node),
      label,
      damage,
      title: dialogTitle(),
      character: characterName(),
    };
  },

  // Other strategies are unused for this site but kept for generality.
  rollEventNames: [],
  parseRollEvent: () => null,
  rollUrlIncludes: [],
  parseRollResponse: () => null,
  installStoreHook: () => () => {},
  abilitySelectors: {},
  buttonAnchor: (s) => s,
};

function titleCase(s) {
  return String(s || "").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
function signedFormula(dice, mod) {
  if (!mod) return dice;
  return mod > 0 ? `${dice}+${mod}` : `${dice}${mod}`;
}
const OUTCOME_LABEL = {
  HIT: "Hit",
  MISS: "Miss",
  SUCCESS: "Success",
  FAILED: "Failed",
  CRITICAL: "Critical!",
  FUMBLE: "Fumble!",
};

// Map a raw scan() payload to the normalized roll shape (see common/roll.js).
export function rawToRoll(raw) {
  if (raw && raw.__borgTest) {
    const { __borgTest, ...roll } = raw;
    return roll;
  }
  if (raw && typeof raw.total === "number" && typeof raw.natural === "number") {
    // Ability tests use the generic label "Rolled"; attacks use the weapon name.
    const isAttack = raw.label && !/^rolled$/i.test(raw.label);
    const title = isAttack ? raw.label : raw.title ? titleCase(raw.title) : "Roll";
    return {
      kind: isAttack ? "attack" : "ability",
      title,
      formula: signedFormula("1d20", raw.modifier || 0),
      modifier: raw.modifier,
      dr: raw.dr,
      outcome: raw.outcome ? OUTCOME_LABEL[raw.outcome] || raw.outcome : null,
      // On a hit, append the weapon's damage formula for Roll20 to roll.
      damage: isAttack && /^(HIT|CRITICAL)$/i.test(raw.outcome || "") ? raw.damage || null : null,
      character: { name: raw.character || null },
      result: { total: raw.total, natural: raw.natural, dice: [{ sides: 20, value: raw.natural }] },
    };
  }
  return null;
}

export { ADV };
