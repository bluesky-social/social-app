# @bsky.app/sift@0.3.9.patch

## Web: leave keys that belong to an IME composition to the IME

While the popover is open, Sift's web keyboard handler takes Enter, Tab, the
arrow keys, Home, End and Escape from the input's `keydown`, without checking
whether the key is part of an IME composition. With a Japanese (or
Chinese/Korean) IME:

- The Enter that confirms a conversion also selects the active item. In the
  search screen and the desktop sidebar search, the item active by default is
  the first row, which searches for the typed text, so the search runs
  mid-conversion.
- The arrow keys that pick a conversion candidate also move the active item, so
  the next Enter can open a profile instead of running the search.
- On Safari, Escape while the candidate window is open also dismisses the
  popover.

Every Sift-based input shares the same handler.

This patch ignores `keydown` events that are part of a composition, using the
check recommended by MDN: `event.isComposing || event.keyCode === 229`. The
`keyCode` fallback covers Safari, which fires the confirming `keydown` after
`compositionend`, so `isComposing` is already `false`. See
https://github.com/bluesky-social/social-app/issues/11723, and
https://github.com/bluesky-social/social-app/issues/4178 for the same bug in the
DM composer.

**TODO: Remove once `@bsky.app/sift` ignores composition keys upstream.**
