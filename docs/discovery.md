# Discovery: jolly-rogenerator → Roll20 (COMPLETE)

Finalized from live inspection of a logged-in character sheet and a live Roll20 game on
2026-06-03. The findings below are already wired into `src/source/site-config.js` and verified
end-to-end (a real jolly roll rendered correctly in a real Roll20 game).

## Source: jolly-rogenerator.app

- **Stack:** Next.js / React + Chakra UI + Emotion (hashed `css-*` class names — do NOT rely on
  class names for selectors). No useful global store.
- **3D dice:** rolls animate via `@3d-dice/dice-box` on `canvas.dice-box-canvas` (mounted at
  `<body>`). The numeric result is therefore **not** in the canvas; it's written to the modal DOM.
- **Manual Dice Roller:** currently **broken** (its "Roll Dice" button stays `disabled`). **Ignored.**
- **Working rolls** = the modal flows:
  - Combat Actions: **Attack**, **Defend**, **Ability Test**
  - Quick Actions: **Attack**, **Defend**
- **Abilities (5):** Strength, Agility, Presence, Toughness, **Spirit**.
- **DR selector** in modals: 6 / 8 / 10 / 12 / 14 / 16 / 18, default **12**.
- **Result line** (rendered in the open `[role=dialog]` after a roll):
  - Ability test: `FAILED! Rolled: 3 + 3 = 6 vs DR 12`
  - Attack:       `Hit! Flintlock pistol: 17 + 3 = 20 vs DR 12`
  - Shape: `<OUTCOME>! <label>: <d20> + <modifier> = <total> vs DR <dr>`
    - `label` is `Rolled` for ability tests, the **weapon name** for attacks.
    - outcome keyword (`HIT|MISS|SUCCESS|FAILED|CRITICAL|FUMBLE`) sits in a sibling/parent and
      always carries a trailing `!` (the description text "On hit, roll…" lacks the `!`, so the
      `!` disambiguates).
- **Capture strategy:** `strategy: "mutation"` — a `MutationObserver` on `<body>` (childList +
  characterData) calls `siteConfig.scan()`, which finds the tightest dialog node matching
  `\d+ + -?\d+ = \d+ vs DR \d+`, then parses natural/mod/total/dr + outcome + label + title +
  character (`document.title` before " - "). De-dup by signature, reset when the line clears so a
  re-roll of identical numbers still emits. See `src/source/site-config.js`.

### Regexes (in site-config.js)
- `ROLL_RE  = /(\d+)\s*\+\s*(-?\d+)\s*=\s*(\d+)\s*vs\s*DR\s*(\d+)/i`
- `OUTCOME_RE = /\b(CRITICAL|FUMBLE|SUCCESS|FAILED|HIT|MISS)\s*!/i`

## Destination: Roll20

- Beyond20's selectors are **current** (verified live): `#textchat-input` has a child `<textarea>`
  and a `<button>` (label "Send"); `#speakingas` is the character `<select>`.
- The built-in **`&{template:default}`** renders fine on a **free** account. Example produced and
  verified in-game:
  `&{template:default} {{name=Toughness Test (DR 12)}} {{Result=[[14]]}} {{Dice=d20: 15, mod -1}} {{Outcome=Success}}`
  → renders as a roll-template card: *Toughness Test (DR 12) · Result 14 · Dice d20: 15, mod -1 · Outcome Success*.
- `[[total]]` (constant inline roll) shows the exact captured total without Roll20 re-rolling.

## Verified end-to-end (2026-06-03)
Rolled Toughness on the live jolly sheet (nat 15, mod -1 = 14, Success) → captured via `scan()` →
formatted → injected into the live Roll20 game "Friends with Bennies: Shadowdark" → appeared in
chat as the rendered template. Roll20 injection used the exact `postChatMessage()` from
`src/roll20/content-script.js`.

## Damage handling (implemented + verified 2026-06-03)
jolly's Attack modal never rolls or displays damage — the DAMAGE DIE row only edits the
instructional text ("On hit, roll 2d4 damage"). So there is no damage *total* to mirror. Instead,
`scan()` parses the damage **formula** from `/roll (\d+d\d+([+-]\d+)?) damage/i`, and `rawToRoll`
attaches it as `damage` only when the attack outcome is HIT/CRITICAL. `templates.js` then appends
`{{Damage=[[<formula>]]}}`, so **Roll20 rolls the damage** in the same card. Verified live:
`Flintlock pistol (DR 6) · Result 17 · Dice d20: 14, mod +3 · Outcome Hit · Damage 5` (Roll20
rolled 2d4 → 5).

## Known gaps / follow-ups
- **Crit damage:** on a CRITICAL outcome we currently send the base damage formula (no
  doubling/max). Pirate Borg crit rules could be applied in `rawToRoll` if desired.
- **Defend** modal not separately exercised, but it presents the same DR/result shape and should
  parse via the same `scan()`. Confirm when convenient.
- **Speaking-as:** jolly character names won't match Roll20 character names, so rolls post as the
  default speaker. Set a matching name in the options "Speaking as" field to attribute them.
- **Validated as a loaded extension on both browsers (2026-06-03):** loaded unpacked in Chrome
  and as a temporary add-on in Firefox; real rolls on the live sheet posted to a live Roll20 game
  end-to-end in both.
- **Capture runs in the isolated content world, not the page world.** The roll line is plain DOM,
  so `installMutation` (see `src/source/capture.js`) runs in the content script — no
  `web_accessible_resources` page-script injection, which avoids Firefox's page-CSP fights. The
  page-world script remains only for the (unused-here) event/store strategies.
- **Firefox gotcha:** MV3 host permissions are optional and are dropped when a temporary add-on is
  reloaded, which silently stops the Roll20 content script from injecting. Re-grant `roll20.net`
  in `about:addons` → Permissions and reload the Roll20 tab. (Goes away once signed/installed.)
- Messaging must be promise-based (`await runtime.sendMessage`), not callback-style — Firefox's
  native `browser.*` ignores the callback form, which silently dropped responses.
