# borg — Privacy Policy

_Last updated: 2026-06-03_

**borg** is a browser extension that mirrors dice-roll results from your
[jolly-rogenerator.app](https://jolly-rogenerator.app) Pirate Borg character
sheet into your [Roll20](https://roll20.net) game chat.

## Summary

borg does **not** collect, transmit, sell, or share any personal data. It has no
servers, no analytics, and no third-party tracking. Everything it does happens
locally in your browser, between the two tabs you already have open.

## What borg accesses

- **Roll results on your jolly-rogenerator.app character sheet.** When you make a
  roll, borg reads the result text from the page (die value, modifier, total,
  difficulty rating, outcome, and the ability or weapon name) so it can reproduce
  that exact result in Roll20.
- **Your Roll20 game tab.** borg types the formatted roll into the Roll20 chat
  box, exactly as if you had typed it yourself.
- **Browser tab information.** borg uses the browser's `tabs` API solely to locate
  your open Roll20 game tab (`app.roll20.net/editor`) so it knows where to deliver
  the roll. It does not read, store, or transmit your browsing history.

## What borg stores

- **Your settings only.** Your preferences (enabled on/off, capture mode, result
  mode, whisper-to-GM, "speaking as" name, default difficulty rating, and debug
  logging) are saved using the browser's built-in extension storage. If your
  browser is configured to sync extension data across your own devices, these
  preferences may sync along with it. They contain only settings — **no roll
  history and no personal data.** borg stores nothing else.

## What borg does NOT do

- No data is ever sent to the author or any third party.
- No analytics, telemetry, advertising, or fingerprinting.
- No roll history, character data, or chat content is recorded or retained.
- No access to any website other than `jolly-rogenerator.app` and `app.roll20.net`.

## Permissions

| Permission | Why borg needs it |
|---|---|
| `storage` | Save your settings locally (and let them sync across your own devices if your browser does that). |
| `tabs` | Find your open Roll20 game tab so the roll is delivered to the right place. |
| Access to `jolly-rogenerator.app` | Read your roll result from the character sheet. |
| Access to `app.roll20.net` | Post the roll into your Roll20 game chat. |

## Changes

If this policy changes, the updated version will be posted at this page with a new
"Last updated" date.

## Contact

Questions or concerns? Please open an issue at
<https://github.com/aharasymiw/borg/issues>.
