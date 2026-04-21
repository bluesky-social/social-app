# Lightbox Refresh — Design Spec

**Ticket:** APP-2046
**Figma:** https://www.figma.com/design/TqFguaWhkvAPnCth5u7cvE/Everything?node-id=7221-2117
**Branch:** `app-2046`
**PR strategy:** one PR — migration + reskin together

## Summary

Refresh lightbox chrome and co-locate all lightbox code under `/features/lightbox/`.
Native gets a new visual treatment (translucent circular buttons, dots pagination,
menu-based Share/Save). Web gets a minimal reskin of buttons and menu, no layout
changes. All gestures, animations, pager mechanics, and the underlying image
viewer are preserved.

## Scope

### In scope
- Move every lightbox file into `/features/lightbox/` with a light reorg.
- Rebuild native chrome (header, footer, pager dots, image menu).
- Reskin web chrome buttons to match native's translucent treatment.
- Add `Share image` menu item on web (currently only `Download image`).
- Restyle alt-text strip on both platforms to match.

### Out of scope
- Reaction bar (labeled "Inactive" in Figma).
- Web layout changes — keep chevron navigation, keep alt-text expand behavior,
  keep keyboard shortcuts.
- Gesture code (pinch/pan/zoom/swipe-to-dismiss) — file moves only.
- Open/close spring animation and backdrop fade — file moves only.
- Alt-text interaction model — kept, just restyled.

## Target file structure

```
/src/features/lightbox/
├── index.tsx                       # re-exports Lightbox (platform split)
├── Lightbox.tsx                    # native shell (from view/com/lightbox/Lightbox.tsx)
├── Lightbox.web.tsx                # web impl (from view/com/lightbox/Lightbox.web.tsx)
├── state.tsx                       # from state/lightbox.tsx
├── types.ts                        # from ImageViewing/@types/index.ts
├── chrome/
│   ├── CircleChromeButton.tsx      # NEW — shared primitive for ••• and ✕
│   ├── Header.tsx                  # NEW — replaces ImageDefaultHeader
│   ├── Footer.tsx                  # NEW — replaces LightboxFooter
│   ├── PagerDots.tsx               # NEW — dots indicator (native only)
│   └── ImageMenu.tsx               # NEW — ContextMenu wrapper
└── pager/
    ├── ImagePager.tsx              # from ImageViewing/index.tsx
    ├── transforms.ts               # from ImageViewing/transforms.ts
    └── ImageItem/
        ├── ImageItem.tsx
        ├── ImageItem.ios.tsx
        └── ImageItem.android.tsx
```

### Source-to-destination map

| From | To |
|---|---|
| `src/state/lightbox.tsx` | `src/features/lightbox/state.tsx` |
| `src/view/com/lightbox/Lightbox.tsx` | `src/features/lightbox/Lightbox.tsx` |
| `src/view/com/lightbox/Lightbox.web.tsx` | `src/features/lightbox/Lightbox.web.tsx` |
| `src/view/com/lightbox/ImageViewing/index.tsx` | `src/features/lightbox/pager/ImagePager.tsx` |
| `src/view/com/lightbox/ImageViewing/transforms.ts` | `src/features/lightbox/pager/transforms.ts` |
| `src/view/com/lightbox/ImageViewing/@types/index.ts` | `src/features/lightbox/types.ts` |
| `src/view/com/lightbox/ImageViewing/components/ImageItem/*` | `src/features/lightbox/pager/ImageItem/*` |
| `src/view/com/lightbox/ImageViewing/components/ImageDefaultHeader.tsx` | *deleted — replaced by `chrome/Header.tsx`* |

### Consumer import updates

All the imports that must move from `#/state/lightbox` → `#/features/lightbox/state` or
`#/view/com/lightbox/Lightbox` → `#/features/lightbox`:

**State (`LightboxStateProvider`, `useLightbox`, `useLightboxControls`, type `Lightbox`):**

- `src/App.native.tsx`
- `src/App.web.tsx`
- `src/state/util.ts`
- `src/screens/Profile/Header/Shell.tsx`
- `src/components/Post/Embed/ImageEmbed.tsx`
- `src/view/com/profile/ProfileSubpageHeader.tsx`
- `src/view/com/util/List.tsx`

**Lightbox component itself:**

- `src/view/shell/index.tsx`
- `src/view/shell/index.web.tsx`

Internal imports within the lightbox files themselves will also update (e.g.,
`ImagePager.tsx` importing the type from sibling `state.tsx`).

## Native chrome design

### `chrome/CircleChromeButton.tsx`
- Shared primitive used by `•••` and `✕` triggers, and reused on web.
- 36 × 36 pressable circle.
- Background: `rgba(0, 0, 0, 0.45)` — fixed, not theme-driven, because it sits
  over arbitrary images.
- Icon: white, 20px.
- `hitSlop: 10`.

### `chrome/Header.tsx`
- Absolutely-positioned row, `top: insets.top`, `px_md`, `py_sm`.
- Left slot: `ImageMenu` trigger (`•••`).
- Right slot: `CircleChromeButton` with `XIcon`, closes lightbox.
- Show/hide driven by the existing `showControls` shared value in `ImagePager.tsx`
  (opacity + translateY). No new gesture logic.

### `chrome/ImageMenu.tsx`
- Wraps `ContextMenu.Outer` + `ContextMenu.Trigger`.
- Trigger child renders `CircleChromeButton` with `DotsHorizontal` icon.
- `onTap` handler calls `control.open('full')` so single tap opens — no press-and-hold.
- Two items:
  - `Share image` → `ShareIcon`, calls existing share util.
  - `Save image` → `Download`, calls existing save util.
- Menu card surface is theme-aware (white in light mode, dark in dark mode) —
  inherited from `ContextMenu`'s defaults.

### `chrome/Footer.tsx`
- Absolutely-positioned, `bottom: insets.bottom`, `px_md`, `pb_sm`.
- Renders `AltTextStrip` (if current image has alt text) above `PagerDots`.
- `AltTextStrip`:
  - Translucent dark surface: `rgba(0, 0, 0, 0.45)`.
  - White text, `text_sm`.
  - Tap expands/collapses (port the expand/collapse state logic from
    `Lightbox.web.tsx` lines 227-245).

### `chrome/PagerDots.tsx`
- Renders only when `images.length > 1`.
- Bottom-center row.
- Active dot: `6 × 6`, `bg: white`.
- Inactive dot: `6 × 6`, `bg: rgba(255,255,255,0.4)`.
- Gap: `4px`.
- Active index driven by the existing `imageIndex` shared value the pager exposes.

## Web chrome design

Changes in `Lightbox.web.tsx` are visual only:

- Replace the existing menu trigger button (lines 251-296) and close button
  (lines 297-312) with `CircleChromeButton` from the native chrome folder.
  (It's a plain styled Pressable — platform-agnostic.)
- Menu items:
  - Existing `Download image` stays.
  - NEW `Share image` — uses Web Share API when available, falls back to
    copy-link-to-clipboard.
- Restyle alt-text strip to match native's translucent treatment. Keep
  expand/collapse behavior.

### Web out of scope (confirmed)
- Left/right chevron navigation (lines 184-225).
- Screen-reader "Image N of M" announcement (line 246-250).
- Keyboard shortcut registration / hotkey scope management.
- No dots indicator on web (chevrons + "Image N of M" already serve this role).

## Preserved behaviors

Both platforms keep:

- Tap-to-toggle chrome visibility.
- Swipe-down-to-dismiss (native).
- Pinch/pan/double-tap zoom.
- Horizontal pager between images.
- Open/close spring from source thumbnail.
- `expo-screen-orientation` lock on open, unlock on close.
- Hotkey scope disable while lightbox is open.

## Boundaries

- `chrome/` depends only on `#/components` and the state module. It knows
  nothing about gestures or pager internals.
- `pager/` owns gestures, layout, animation. Chrome is rendered via props/slots.
- `state.tsx` exports are unchanged — pure move with updated import paths.
- `CircleChromeButton` is reused across native header and web chrome — one
  visual source of truth.

## Testing & verification

- Visual inspection on iOS simulator, Android emulator, web.
- Verify open/close animation unchanged from main.
- Verify tap-to-toggle chrome still works.
- Verify share and save still work end-to-end from the new menu.
- Verify alt text still displays and expands.
- Confirm no new TypeScript errors: `yarn typecheck`.
- Confirm no new lint errors: `yarn lint`.
- Confirm Jest still passes: `yarn test`.
