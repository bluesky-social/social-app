# react-native-keyboard-controller@1.22.7.patch

## Stop the KeyboardAvoidingView initial state from clobbering keyboard events

Upstream PR: https://github.com/kirillzyusko/react-native-keyboard-controller/pull/1802
(this patch is its `src/` changes at `b6274e485`, minus the unit test and docs).
It supersedes our earlier upstream PR
https://github.com/kirillzyusko/react-native-keyboard-controller/pull/1685,
which this patch used to carry. Remove this patch once a release includes #1802.

Fixes APP-3472: on Android, the composer's footer (media buttons, language,
character counter) intermittently stays behind the keyboard after the composer
opens.

### Cause

`useKeyboardAnimation` (`src/components/KeyboardAvoidingView/hooks.ts`) seeds
its shared values in a `useLayoutEffect` on the JS thread:

```ts
heightWhenOpened.value = -reanimated.height.value
height.value = ...
progress.value = initialProgress
isClosed.value = initialProgress === 0
```

In Reanimated 4, a `.value =` write from the JS thread is
`scheduleOnUI(() => (mutable.value = newValue))`. It's applied whenever the UI
thread gets to the queued job. The composer's text input has `autoFocus`, so the
keyboard starts opening as the view mounts, and its `onStart`/`onEnd` worklets
run on the UI thread too. When the UI thread is busy (the composer slide-in
plus the keyboard animation), the queued writes can land after those events
and reset the state to "closed, height 0":

1. Writes land between `onStart` and `onEnd`: `onEnd` restores `isClosed` and
   `progress`, but `heightWhenOpened` stays 0, so the relative keyboard height
   is 0 and the view doesn't avoid the keyboard. This is the bug we see.
2. Writes land after `onEnd`: `isClosed` is back to `true` with the keyboard
   open. With `behavior="height"` the style worklet then returns `{}`, and
   Reanimated keeps the last applied height, so the open looks fine but the
   view stays shrunk after the keyboard is dismissed (until it opens again).

### Fix

- `useKeyboardHandler` gets a new `onSync` callback (`src/hooks/index.ts`),
  called from a `runOnUI` job when the handler is attached. It reads the
  provider's current height and progress on the UI thread when the job runs,
  not as a JS snapshot taken at mount, so a late job reports the keyboard's
  real state instead of a stale "closed".
- `useKeyboardAnimation` and `useTranslateAnimation` seed from `onSync`
  instead of the `useLayoutEffect`.
- `onEnd` also refreshes `heightWhenOpened` when the keyboard ended open
  (`height > 0`). This covers a sync that lands between `onStart` and `onEnd`
  (it reads a mid-animation height, which is 0 on Android because the provider
  only updates on move), and an `onStart` dispatched before the handler was
  attached.

### Validation

Pixel 8 emulator (API 34), composer opens, footer position checked from
screenshots: above the keyboard on open, back at the bottom after Back, above
the keyboard again after refocusing.

Deterministic orderings (seed / `onSync` deferred to run right after the first
`onStart` or `onEnd`), 10 opens each:

| `hooks.ts`    | ordering         | open  | dismiss | refocus |
| ------------- | ---------------- | ----- | ------- | ------- |
| stock         | after `onStart`  | 0/10  | 10/10   | 10/10   |
| stock         | after `onEnd`    | 10/10 | 0/10    | 10/10   |
| stock         | natural          | 10/10 | 10/10   | 10/10   |
| this patch    | after `onStart`  | 10/10 | 10/10   | 10/10   |
| this patch    | after `onEnd`    | 10/10 | 10/10   | 10/10   |
| this patch    | natural          | 10/10 | 10/10   | 10/10   |

Not tested: iOS, `behavior` values other than `height`, and whether the view
tracks the keyboard or snaps at the end when the sync lands mid-animation (the
end state is correct either way).
