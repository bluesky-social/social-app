## RCTTextLayoutManager.mm / TextLayoutManager / ParagraphShadowNode.cpp Patch - text laid out on the main thread when first drawn

The first time a text view draws, `drawAttributedString:` runs on the main
thread and lays the text out from scratch: it rebuilds the attributed string
(font lookups), attaches a new layout manager (font fixing, glyph generation)
and lays out every line. Measurement already did the same work off the main
thread, but throws it away. Painting the glyphs is only a small part of the
cost. While scrolling the feed this was the largest single main-thread cost
when new posts appear. React Native's `enablePreparedTextLayout` flag solves
this only on Android.

- After layout, `ParagraphShadowNode::layout` calls the new
  `TextLayoutManager::prepareForDrawing` whenever a text view's attributed
  string changes, which is when the view redraws. It passes the content frame
  size the view will draw into. This only compiles on Apple platforms.
- `prepareAttributedStringForDrawing:` makes the layout the draw would make
  for that size, on the calling thread (usually the JS thread). If measuring
  already laid the text out at the same width (within 0.5pt of pixel
  rounding), and the frame is tall enough for every measured line, it reuses
  that layout. Measurement uses unlimited height, so the result is the same.
  Otherwise it lays the text out at exactly that size.
- `drawAttributedString:` takes the prepared layout for its exact frame size.
  If there is none (for example, the frame changed without new text), it lays
  the text out as before.
- Layouts are handed out once, so only one thread uses a text storage at a
  time. Unused ones (text that is never drawn) are evicted oldest-first, with
  at most 512 texts kept per kind.
- Measured layouts are never reused for `adjustsFontSizeToFit`, whose font size
  depends on the final frame.

Measured on an iPhone 16 Pro Max (Release build, 30s fling through the feed):
main-thread time in `drawAttributedString:` went from about 570ms to 160ms, all
draws on launch used a prepared layout, and the JS thread spent about 300ms
preparing text. About half of the prepared layouts are never drawn (text in
views that are offscreen or replaced before mounting).

React Native 0.88 adds `drawingFrameForAttributedString:`, which can hand the
draw a taller frame than the content frame. It only runs behind
`enableIOSCompressedTextFrameAdjustment`, which is off in the stable release
level. If that flag is ever turned on, prepared layouts for affected text would
no longer match the draw's frame size, and those draws would fall back to the
default path.

**TODO: Re-evaluate on React Native upgrades.** Not an upstream backport.
