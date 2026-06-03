// Format a normalized Roll into a Roll20 chat message.
// Uses the built-in `default` roll template, which is available on free Roll20
// accounts (no character sheet or Mod/Player API required).

import { ADV } from "../common/roll.js";

function applyAdvantage(formula, advantage) {
  if (advantage === ADV.ADVANTAGE) return formula.replace("1d20", "2d20kh1");
  if (advantage === ADV.DISADVANTAGE) return formula.replace("1d20", "2d20kl1");
  return formula;
}

function diceBreakdown(result) {
  if (!result || !Array.isArray(result.dice) || !result.dice.length) return null;
  return result.dice.map((d) => `d${d.sides}: ${d.value}`).join(", ");
}

function signed(n) {
  return n >= 0 ? `+${n}` : `${n}`;
}

// Roll20 chokes on a literal "}}" inside a template value; keep values clean.
function sanitize(value) {
  return String(value).replace(/}}/g, "} }").trim();
}

function rows(obj) {
  return Object.entries(obj)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `{{${k}=${sanitize(v)}}}`)
    .join(" ");
}

/**
 * @param {import("../common/roll.js").Roll} roll
 * @param {object} settings
 * @returns {{message: string, speakingAs: ?string}}
 */
export function formatRoll(roll, settings) {
  const whisper = settings.whisperToGM ? "/w gm " : "";
  const speakingAs = settings.speakingAs || roll.character?.name || null;

  const nameParts = [roll.title];
  if (roll.dr != null) nameParts.push(`(DR ${roll.dr})`);

  // name must come first so it renders as the template header.
  const props = { name: nameParts.join(" ") };

  const mirror = settings.resultMode === "mirror" && roll.result;
  if (mirror) {
    const r = roll.result;
    // Inline roll of a constant shows the exact captured total as a result bubble,
    // without Roll20 re-rolling the dice.
    props.Result = `[[${r.total}]]`;
    const bd = diceBreakdown(r);
    if (bd) props.Dice = roll.modifier ? `${bd}, mod ${signed(roll.modifier)}` : bd;
    if (roll.outcome) props.Outcome = roll.outcome;
    else if (r.crit) props.Outcome = "Critical!";
    else if (r.fumble) props.Outcome = "Fumble!";
  } else {
    // Reroll mode: let Roll20 roll the dice natively.
    const formula = applyAdvantage(roll.formula, roll.advantage);
    const label = roll.kind === "damage" ? "Damage" : "Roll";
    props[label] = `[[${formula}]]`;
    if (roll.advantage === ADV.ADVANTAGE) props.Mode = "Advantage";
    else if (roll.advantage === ADV.DISADVANTAGE) props.Mode = "Disadvantage";
  }

  // On-hit weapon damage: Roll20 rolls the formula (jolly never produces a total).
  if (roll.damage) props.Damage = `[[${roll.damage}]]`;

  const message = `${whisper}&{template:default} ${rows(props)}`.trim();
  return { message, speakingAs };
}
