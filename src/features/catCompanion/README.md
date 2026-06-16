# Companion Cat

A small pixel-art cat that lives at the bottom of the screen (on top of the
bottom navbar on mobile). It wanders, sits, loafs, and sleeps on its own, and
plays a reaction when you pet it.

## Layout

- `index.tsx` - the `CatCompanion` overlay. Gated behind the `catCompanion`
  preference and an active session, so it cleanly unmounts when turned off.
  Owns the autonomous "director" (idle/chill/loaf/sleep + walking across the
  screen) and the tap-to-pet interaction.
- `CatSprite.tsx` - renders one cat. Clips a coat sheet inside a 64px cell and
  steps the frame on a timer. Handles looping vs one-shot states and facing.
- `catalog.ts` - sprite-sheet metadata (colors, states, per-state row/frames/
  fps), ported from the standalone `retro-cats` Pixi module.
- `assets.ts` - static `require()` map of the six coat PNGs in
  `assets/cats/`.

## Why not the original module?

The source `retro-cats/` module is built on Pixi.js (WebGL) and can't run in
React Native. The sheets are plain data, though: every coat is an identical
16x19 grid of 64x64 frames, each animation one row played from column 0. We
reuse the PNGs and the catalog and reimplement the tiny animator here with a
clipped `Image` plus a frame timer, which works on web and native.

## Petting

Tapping the upper half of the cat (head/back) plays the one-shot `Excited`
bounce; tapping the lower half (belly) plays the looping `Tickle`. Both
interrupt whatever the cat was doing and then hand control back to the
director.

## Settings

`Settings > Companion cat` (`/settings/cat-companion`) toggles it on/off and
picks the coat color. State is persisted via the `catCompanion` preference
(`src/state/preferences/cat-companion.tsx`). Default: off, orange.
