# borg

**Roll on your sheet, see it in your game.**

borg is a browser extension (Chrome + Firefox) that mirrors dice rolls from your
[jolly-rogenerator.app](https://jolly-rogenerator.app) Pirate Borg character sheet into your
[Roll20](https://roll20.net) game — click Attack, Defend, or an Ability Test on the sheet and
the exact result lands in your Roll20 chat as a clean roll-template card.

It's a from-scratch reimplementation of the architecture used by
[Beyond20](https://github.com/kakaroto/Beyond20) (which does the same for D&D Beyond → Roll20),
adapted for the Pirate Borg toolset and a **free** Roll20 account.

## Features

- Mirrors **Attack / Defend / Ability Test** rolls from the sheet into Roll20 chat.
- Shows the **exact** result you rolled (no re-rolling), or optionally lets Roll20 roll the dice.
- Rolls **on-hit weapon damage** in Roll20.
- Optional **whisper-to-GM** and a **"speaking as"** character name.
- Works on **free** Roll20 accounts — chat injection only, no Pro account or API script needed.
- No accounts, no servers, no tracking. See [PRIVACY.md](PRIVACY.md).

## Install

- **Chrome Web Store:** _(pending review — link here once live)_
- **Firefox Add-ons:** _(pending review — link here once live)_

Or load it unpacked from a build (see below).

## Usage

1. Open your character sheet on jolly-rogenerator.app.
2. Open your game on Roll20 (`app.roll20.net/editor`) in another tab.
3. Roll on the sheet — it shows up in Roll20.

Settings (capture mode, mirror vs. reroll, whisper-to-GM, speaking-as name, default DR, and
debug logging) are in the extension's options/popup.

## How it works

```
jolly-rogenerator tab                 background SW            roll20 tab
  content script (isolated world)  msg   normalize &     msg   roll20 content script
  observes the roll dialog and   ──────▶ route roll to ──────▶ inject into #textchat-input
  scrapes the result line                the active Roll20 tab  as [[..]] / &{template:default}
```

- **Source (jolly-rogenerator):** jolly-rogenerator's public API exposes no roll data and its
  dice render on a 3D canvas, so borg captures rolls by observing the result dialog's DOM
  (`MutationObserver` + a parser) directly in the content-script world. All site-specifics live
  in `src/source/site-config.js`; capture details are in `docs/discovery.md`.
- **Background:** normalizes the roll and forwards it to your open Roll20 game tab.
- **Destination (Roll20):** a content script types the roll into the Roll20 chat box, exactly
  like a user would — using native inline rolls `[[1d20+2]]` and the built-in `&{template:default}`
  (no Roll20 Pro / Mod API required).

## Build from source

```sh
npm install
npm run build            # both browsers → build/chrome and build/firefox
npm run build:chrome
npm run build:firefox
npm run package          # zips for store upload → dist/borg-<target>-<version>.zip
```

### Load unpacked

- **Chrome:** `chrome://extensions` → enable Developer mode → *Load unpacked* → select `build/chrome`.
- **Firefox:** `about:debugging#/runtime/this-firefox` → *Load Temporary Add-on* → select
  `build/firefox/manifest.json`.
  - Firefox MV3 treats host permissions as optional and **drops them when a temporary add-on is
    reloaded.** If rolls stop reaching Roll20 after a reload, re-grant access for `roll20.net` in
    `about:addons` → borg → Permissions, then reload the Roll20 tab.

## Disclaimer

Unofficial and fan-made. Not affiliated with, authorized, or endorsed by Roll20, Limithron
(Pirate Borg), or jolly-rogenerator. "Pirate Borg" and "Roll20" are trademarks of their
respective owners.

## License

[MIT](LICENSE) © Andrew Harasymiw
