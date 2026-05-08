# Expo Paste Input Patch

`expo-paste-input` observes `UITextView.textDidChangeNotification` and treats any
`NSTextAttachment` in the text view's `attributedText` as a pasted image. When
it can't find a real image payload on an attachment, it falls back to
`image(forBounds:)` and, failing that, to a `drawHierarchy` screenshot of the
text view at the attachment's glyph rect.

iOS Dictation inserts its own `NSTextAttachment` (the shimmer/cursor indicator)
into the text view during dictation. Those attachments don't carry real image
data, so the fallbacks would fire — emitting a zoomed-in screenshot of the
composer as if the user had pasted an image at the end of dictation.

This patch:

- Removes the `image(forBounds:)` and `renderTextAttachment` fallbacks in
  `extractMediaPayload` so the library only accepts attachments carrying a real
  payload (`fileWrapper`, `contents`, or `image`).
- Only sanitizes (deletes) attachment ranges that produced a payload, and
  skips the "unsupported" toast when an attachment has no payload. Unknown
  system attachments like the dictation placeholder are left alone rather
  than being ripped out from under iOS.
