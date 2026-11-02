# react-native-keyboard-controller@1.22.7.patch

## Stop the KeyboardAvoidingView initial state from clobbering keyboard events

Upstream PR: https://github.com/kirillzyusko/react-native-keyboard-controller/pull/1685
(this patch is the same change, minus its unit test). Remove this patch once a
release includes it.

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

- Seed inside `runOnUI`, reading the provider's values on the UI thread, and
  skip the seed if this hook has already handled a keyboard event
  (`hasReceivedEvent`). This covers both orderings.
- Also refresh `heightWhenOpened` from an `onEnd` where the keyboard ended fully
  open (`height > 0 && progress === 1`), in case `onStart` fired before the
  handler was registered.
- Same guard for the `padding` seed in `useTranslateAnimation` (only affects
  `behavior="translate-with-padding"`, which we don't use).

### Validation

Pixel 8 emulator (API 34), Reanimated 4.7.1, composer opens checked via the
accessibility tree: footer above the keyboard on open, back at the bottom after
Back, above the keyboard again after refocusing.

Deterministic orderings (seed deferred to run right after the first
`onStart`/`onEnd`), 10 opens each:

| `hooks.ts`              | ordering | open  | dismiss | refocus |
| ----------------------- | -------- | ----- | ------- | ------- |
| stock                   | 1        | 0/10  | 10/10   | 10/10   |
| stock                   | 2        | 10/10 | 0/10    | 10/10   |
| `onEnd` repair only[^1] | 1        | 10/10 | 10/10   | 10/10   |
| `onEnd` repair only[^1] | 2        | 10/10 | 0/10    | 10/10   |
| this patch              | 1        | 10/10 | 10/10   | 10/10   |
| this patch              | 2        | 10/10 | 10/10   | 10/10   |

[^1]: The approach in https://github.com/bluesky-social/social-app/pull/12029.

Natural timing (no forced delays, 40 opens each): stock 39/40 passed, with the
one failure being the one open where the seed landed after `onStart`. This
patch passed 40/40, including 3 opens where the seed landed after `onStart` and
was skipped. The natural rate depends heavily on load, so the deterministic
table is the real evidence.

Not tested on device: iOS (the simulator wasn't available) and
`translate-with-padding`. Both are covered by the upstream unit test.

Only `src/` is patched. Metro resolves the package's `react-native` entry
(`src/index`); Jest would use `lib/commonjs`, but no tests exercise this hook.
The login, signup and phone input screens use the same `KeyboardAvoidingView`
but don't auto-focus on mount.
