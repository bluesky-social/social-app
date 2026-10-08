# react-native-keyboard-controller+1.21.9.patch

All changes are in `KeyboardChatScrollView`, which the DM conversation screen
uses.

## Always defer the `extraContentPadding` scroll correction

When the message composer grows (e.g. typing a multi-line message near the
bottom of the chat), `useExtraContentPadding` scrolls the list to keep the
content in place. Upstream sets `contentOffsetY` via animated props on iOS
Fabric, in the same commit that changes `contentInset`. The native ScrollView
clamps the new offset against the *old* inset range, so the scroll falls
behind the growing input.

The patch drops the `contentOffsetY` path and always calls `scrollTo` from
`requestAnimationFrame`, on both iOS and Android, so the inset commit lands
first.

## Skip scrolling when the ScrollView ref is detached

The ScrollView can detach while a keyboard animation is running or between
scheduling the deferred `scrollTo` and the frame arriving (e.g. navigating
away, or the list re-creating its scroll component). The patch re-checks the
ref before scrolling:

- in the deferred `scrollTo` in `useExtraContentPadding`
- at the top of `onMove` in `useChatKeyboard`, after `currentHeight` is
  updated so the animated style keeps committing. Every branch below it
  eventually calls `scrollTo`.

These guards were originally added for an Android crash ("Value is null,
expected a number") from Reanimated's Paper `scrollTo`. The app is New
Architecture only now, where Reanimated's `dispatchCommand` already ignores a
null ref, but it logs an "uninitialized ref" warning on every frame, so the
guards are kept.

## Reanimated 4.7 animated ref shape

Since Reanimated 4.7, an animated ref captured by a worklet is serialized to
the UI runtime as a shareable holding the shadow node wrapper in `.value`,
not as a callable function. Calling `scrollViewRef()` inside a worklet throws
"Object is not a function" - in the DM conversation screen this fired as soon
as you typed into the composer. On web the ref is still a function.

The patch adds an `isAnimatedRefAttached` worklet helper to
`useChatKeyboard/helpers.ts` that handles both shapes, and uses it for both
guards above.

Upstream (1.22.6 and `main` as of 2026-10-01) still calls `scrollViewRef()`
in the Android branch of `useExtraContentPadding`, so bumping alone does not
fix this.
