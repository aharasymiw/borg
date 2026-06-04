# Store submission reference

Copy-paste answers for the Chrome Web Store and Firefox AMO submission forms.
Privacy policy URL (host PRIVACY.md): `https://github.com/aharasymiw/borg/blob/main/PRIVACY.md`

## ⏸ Resume here (paused 2026-06-03, v0.2.0)

Everything below is prepared. What's left, in order:

1. **Screenshots (blocker).** Capture two native shots (⌘⇧4): the jolly **Attack** modal showing
   the green **HIT!** banner (roll twice — first roll doesn't render, known bug), and the **Roll20
   chat** with borg cards. Drop them in `assets/screenshots/`. Then I crop/pad to exactly
   **1280×800** and commit. (The browser tool's auto-saved shots land host-side and aren't readable
   from the build sandbox, so we capture natively.)
2. **Chrome Web Store** — upload `dist/borg-chrome-0.2.0.zip`, paste the copy + justifications
   below, set the privacy-policy URL, add screenshots, submit. (User: $5 one-time fee.)
3. **Firefox AMO** — upload `dist/borg-firefox-0.2.0.zip`, pick **MIT** license, add screenshots +
   privacy-policy URL, submit. (User: Mozilla account.)

State: committed + pushed to github.com/aharasymiw/borg (HEAD has v0.2.0). Zips built in `dist/`.
Both browsers validated end-to-end. Re-package anytime with `npm run package`.

---

## Single purpose (Chrome requires one sentence)

> borg mirrors dice-roll results from a jolly-rogenerator.app Pirate Borg character
> sheet into the user's Roll20 game chat.

## Permission justifications (Chrome "Privacy practices" tab)

**`storage`**
> Saves the user's own settings (enabled, capture mode, result mode, whisper-to-GM,
> speaking-as name, default DR, debug logging). No browsing or personal data is stored.

**`tabs`**
> Used only to locate the user's open Roll20 game tab (app.roll20.net/editor) so a
> captured roll can be delivered to it. borg reads tab URLs to find that one tab; it
> does not record or transmit browsing history.

**Host permission — `*://*.jolly-rogenerator.app/*`**
> Reads the roll result shown on the user's Pirate Borg character sheet (die value,
> modifier, total, DR, outcome, ability/weapon name) so it can be reproduced in Roll20.

**Host permission — `*://app.roll20.net/*`**
> Types the formatted roll into the user's Roll20 chat box, the same way the user
> would type it.

**Remote code:** No. All code is bundled in the package; nothing is fetched or `eval`'d at runtime.

## Data usage disclosures (Chrome checkboxes)

Answer the "What user data do you collect?" section as follows:

- Personally identifiable information — **No**
- Health information — **No**
- Financial and payment information — **No**
- Authentication information — **No**
- Personal communications — **No**
- Location — **No**
- Web history — **No**
- User activity — **No**
- Website content — **No** (borg reads the roll result and writes to chat in-page,
  but does not collect or transmit any website content off the device)

Certify all three:
- [x] I do not sell or transfer user data to third parties, outside of the approved use cases
- [x] I do not use or transfer user data for purposes unrelated to my item's single purpose
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes

## Firefox AMO notes

- AMO does not require per-permission justifications, but the listing should explain
  what the extension does and link the privacy policy.
- Source-code submission: borg is built with esbuild (bundled, **not** minified). AMO treats
  bundled output as machine-generated, so expect to provide source + build steps. Point reviewers
  at the GitHub repo (https://github.com/aharasymiw/borg) with:
  `npm install && npm run build:firefox` → output in `build/firefox`.
  Built with Node v24.15.0 / npm 11.12.1 on macOS (any recent Node 18+ works).
- License: AMO requires a license for listed add-ons. The repo ships an MIT `LICENSE`; select
  **MIT** in the AMO form.

---

## Listing copy (both stores)

**Name**
> borg — Pirate Borg → Roll20

**Short summary** (Chrome ≤132 chars)
> Mirror your jolly-rogenerator Pirate Borg character-sheet dice rolls straight into your Roll20 game chat.

**Category**
> Chrome: Workflow & Planning (a.k.a. Productivity). Firefox AMO: Games / Other.

**Detailed description**
> Roll on your sheet, see it in your game.
>
> borg bridges your Pirate Borg character sheet on jolly-rogenerator.app and your
> Roll20 game. Click Attack, Defend, or an Ability Test on the sheet and the exact
> result — the d20, your modifier, the total, the difficulty rating, and the
> outcome — appears in your Roll20 chat as a clean roll-template card. On a hit, the
> weapon's damage is rolled in Roll20 too.
>
> It's built for the way most people actually play: a free Roll20 account. borg types
> the roll into the chat box just like you would, so there's no Pro account, no API
> script, and no game setup required.
>
> Features
> • Mirrors Attack / Defend / Ability Test rolls from the sheet into Roll20 chat
> • Shows the exact result you rolled (no re-rolling), or optionally lets Roll20 roll
> • Rolls on-hit weapon damage in Roll20
> • Optional whisper-to-GM and a "speaking as" character name
> • Works on free Roll20 accounts — chat injection only, no Pro/API needed
> • No accounts, no servers, no tracking. Your settings stay on your device.
>
> How to use
> 1. Open your character sheet on jolly-rogenerator.app.
> 2. Open your game on Roll20 (app.roll20.net/editor) in another tab.
> 3. Roll on the sheet — it shows up in Roll20.
>
> Unofficial and fan-made. Not affiliated with, authorized, or endorsed by Roll20,
> Limithron (Pirate Borg), or jolly-rogenerator. "Pirate Borg" and "Roll20" are
> trademarks of their respective owners.

**Screenshots needed** (capture from a live session)
> 1. The jolly-rogenerator Combat Actions modal mid-roll (the result line visible).
> 2. The matching roll-template card in Roll20 chat.
> 3. (optional) The borg options page.
>
> Chrome requires at least one 1280×800 or 640×400 screenshot. AMO accepts screenshots
> of any reasonable size. A simple before/after pair (sheet → Roll20) tells the whole story.
