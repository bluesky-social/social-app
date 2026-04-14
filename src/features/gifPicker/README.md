# GIF Picker

Feature module for the GIF selection dialog used by the composer.

## Structure

- `GifPickerDialog.tsx` — entry component. Wraps `Dialog.Outer` with an error
  boundary and exposes an imperative `open()` via `controlRef`.
- `components/GifPickerHeader.tsx` — sticky search row. Reserves a slot beneath
  the search input where future tab bars (Trending / Recents / Categories) will
  render.
- `components/GifPickerGrid.tsx` — column-distribution masonry grid built on
  `Dialog.InnerFlatList`. Uses each GIF's intrinsic width/height instead of
  forcing a square aspect ratio.
- `components/GifPickerItem.tsx` — single tile. Natural aspect ratio, press
  feedback, fires the `composer:gif:select` analytics event.
- `components/GifPickerPlaceholder.tsx` — loading / empty / error states.
- `components/GifPickerErrorBoundary.tsx` — fallback rendered when the data
  layer throws.
- `hooks/useGifPickerData.ts` — collapses the Klipy/Tenor provider flag and the
  search-vs-featured branching into one hook so the UI never sees both paths.

## Provider switching

Provider selection is gated by the `KlipyGifProviderEnable` analytics feature
flag. Both provider modules in `src/state/queries/{klipy,tenor}.ts` are live
until the Klipy rollout (and the tango backend-proxy PR) is complete. Do not
remove the Tenor path without first confirming Klipy is globally enabled.

## Out of scope (future tickets)

- Autocomplete / autosuggest
- Recents
- Trending tags / categories browsing
- Favorites
- Alt-text-at-pick flow (alt text is still added via a separate dialog after
  selection)
