# react-native-keyboard-controller@1.22.7.patch

## Repair the opened keyboard height at animation end

Candidate correction for APP-3472: the Android composer's media toolbar
intermittently stays behind the keyboard when the composer mounts with an
autofocus input.

On a Nothing A063 running Android 14, the keyboard animation hook could finish
with `height` at 336 dp and `progress` at 1, but `heightWhenOpened` still at 0.
`KeyboardAvoidingView` uses the latter to calculate its size, so it kept its
full-screen height. Dismissing and reopening the keyboard repaired the cache.
Updating only the cached height in the debugger also immediately restored the
toolbar without cycling the keyboard.

The patch updates `heightWhenOpened` from a positive-height `onEnd` event. This
repairs a stale cache if that event arrives after a missed opening `onStart` or
stale initialization. The exact event ordering behind the observed failure has
not been established. Zero-height end events leave the cache intact for
dismissal interpolation.

The hook tests simulate missed-start and overwritten-initialization sequences;
they do not reproduce native event registration or cross-thread scheduling.
The patch also affects login, signup, and contact phone input keyboard avoidance
on both native platforms. Validation below covers the composer, not those other
consumers.

Only the source entry used by Metro is patched; no native rebuild is needed.
Regression coverage lives in `__tests__/lib/keyboard-avoiding-view.test.ts`.
Remove this patch once the dependency includes the equivalent fix.

### Validation

- With the original hook restored, three of five hook tests failed. On the
  physical Android phone, the second fresh composer opening reproduced the
  stale-zero cache and failed the initial-entry screenshot check (0.43% mismatch).
- With the patch restored, the unchanged initial-entry flow passed ten
  consecutive times, with screenshot mismatch at or below 0.02%. No keyboard
  toggle occurs before that check.
- A live Android geometry check placed all three media controls' bottoms at
  574.10 dp, above the keyboard top at 577.90 dp. In the unpatched failure,
  their bottoms were at 886.48 dp while the keyboard top remained 577.90 dp.
- A separate Android keyboard-dismiss/refocus flow passed twice. Dismissal
  preserved the opened-height cache while live height and progress became zero.
- On an iPhone 17 Pro Max simulator running iOS 26.4, the open, background,
  foreground, refocus, and cancel flow passed twice. Live measurements before
  backgrounding and after refocus placed the controls above the keyboard;
  dismissal preserved the 345 dp opened-height cache.
- All five focused hook tests passed with the patch restored.

These are development-build checks, not release-build or all-device coverage.
The saved Android screenshot baseline still needs human review before commit.
Flow prerequisites, commands, and readiness warnings are documented in
`.argent/README.md`.
