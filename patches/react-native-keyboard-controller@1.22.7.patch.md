# react-native-keyboard-controller@1.22.7.patch

## Stop the KeyboardAvoidingView initial state from clobbering keyboard events

Fixes APP-3472: on Android, the composer's footer (media buttons, language,
character counter) intermittently stays behind the keyboard after the composer
opens. The `KeyboardAvoidingView` never shrinks.

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

- Writes land between `onStart` and `onEnd`: `onEnd` restores `isClosed` and
  `progress`, but `heightWhenOpened` stays 0, so the relative keyboard height is
  0 and the view keeps its full height.
- Writes land after `onEnd`: `isClosed` is back to `true` and nothing repairs it
  until the keyboard next moves.

Instrumented on a Pixel 8 (API 34) emulator: across 30 composer opens, the two
failures were exactly the two opens where the seed writes landed after
`onStart` (one of each ordering above). In the 28 good opens they landed
before, often by only 0.15-0.4s. Delaying the seed writes artificially failed
every time.

### Fix

- Seed the state inside `runOnUI`, reading the provider's values on the UI
  thread, and skip it if this hook has already handled a keyboard event
  (`hasReceivedEvent`). This covers both orderings.
- Also refresh `heightWhenOpened` from any positive-height `onEnd`, in case
  `onStart` fired before the handler was registered. This is the same repair
  as #12029, which on its own only covers the first ordering.

Zero-height `onEnd` events leave `heightWhenOpened` alone, so the dismissal
interpolation is unchanged.

`useTranslateAnimation` seeds `padding` the same way, but that only affects
`behavior="translate-with-padding"`, which we don't use.

### Notes

- Only `src/` is patched. Metro resolves the package's `react-native` entry
  (`src/index`); Jest would use `lib/commonjs`, but no tests exercise this hook.
- Also affects the login, signup and phone input `KeyboardAvoidingView`s. They
  don't auto-focus on mount, so they were less exposed to the race.
- Still present on upstream main. Remove this patch once the dependency
  includes an equivalent fix.
