// Normalized roll model shared across the extension, plus Pirate Borg constructors.
//
// A Roll travels: source page -> content script -> background -> roll20 content script.
// It is intentionally close to Beyond20's request object so the Roll20 side stays familiar.

import { ABILITY_LABELS, DEFAULT_DR, Action } from "./constants.js";

/**
 * @typedef {Object} CapturedResult
 * @property {number}  total    Final total shown on the sheet.
 * @property {?number} natural  Natural d20 value (for crit/fumble), if known.
 * @property {{sides:number,value:number}[]} dice  Individual die results, if known.
 * @property {boolean} crit
 * @property {boolean} fumble
 */

/**
 * @typedef {Object} Roll
 * @property {string}  action     Always Action.ROLL.
 * @property {string}  source     "jolly-rogenerator".
 * @property {string}  kind       "ability" | "damage" | "attack" | "custom".
 * @property {string}  title      Display name, e.g. "Strength" or "Cutlass".
 * @property {string}  formula    Dice notation for Roll20 reroll mode, e.g. "1d20+2".
 * @property {?number} modifier
 * @property {?number} dr         Difficulty rating (ability tests).
 * @property {string}  advantage  "normal" | "advantage" | "disadvantage".
 * @property {{name:?string}} character
 * @property {?CapturedResult} result  Exact result captured from the sheet (mirror mode).
 */

const ADV = { NORMAL: "normal", ADVANTAGE: "advantage", DISADVANTAGE: "disadvantage" };
export { ADV };

function signedFormula(dice, modifier) {
  if (!modifier) return dice;
  return modifier > 0 ? `${dice}+${modifier}` : `${dice}${modifier}`;
}

// Fill defaults and derive crit/fumble from the natural d20 when not already set.
export function normalizeRoll(partial = {}) {
  const roll = {
    action: Action.ROLL,
    source: "jolly-rogenerator",
    kind: "custom",
    title: "Roll",
    formula: "1d20",
    modifier: null,
    dr: null,
    advantage: ADV.NORMAL,
    character: { name: null },
    result: null,
    outcome: null,
    damage: null,
    ...partial,
  };

  if (roll.result) {
    const r = roll.result;
    if (r.natural == null && Array.isArray(r.dice)) {
      const d20 = r.dice.find((d) => d.sides === 20);
      if (d20) r.natural = d20.value;
    }
    if (r.crit == null) r.crit = r.natural === 20;
    if (r.fumble == null) r.fumble = r.natural === 1;
  }
  return roll;
}

// Pirate Borg ability test: 1d20 + modifier vs a DR. Used by button mode.
export function abilityTest({ ability, modifier = 0, dr = DEFAULT_DR, advantage = ADV.NORMAL, character = {}, result = null }) {
  const label = ABILITY_LABELS[ability] || ability || "Ability";
  return normalizeRoll({
    kind: "ability",
    title: label,
    formula: signedFormula("1d20", modifier),
    modifier,
    dr,
    advantage,
    character,
    result,
  });
}

// A damage / generic dice roll, e.g. "1d6" for a cutlass.
export function damageRoll({ name = "Damage", formula, modifier = 0, character = {}, result = null }) {
  return normalizeRoll({
    kind: "damage",
    title: name,
    formula: modifier ? signedFormula(formula, modifier) : formula,
    modifier: modifier || null,
    dr: null,
    character,
    result,
  });
}
