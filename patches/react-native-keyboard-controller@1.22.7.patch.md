# react-native-keyboard-controller+1.22.7.patch

Carries one Android fix. It touches the decorator view
(`android/src/main/java/com/reactnativekeyboardcontroller/views/ClippingScrollViewDecoratorView.kt`),
both of its view managers (fabric and paper), its codegen spec, and the JS
that feeds it (`ScrollViewWithBottomPadding`, `KeyboardChatScrollView`).
Drop it once a release contains an equivalent fix.

## Keep the chat list pinned to the end when the composer grows

In the DM screen, `KeyboardChatScrollView` adds the composer height to the
list's bottom inset through `extraContentPadding`. When the composer grows
(typing a newline), `useExtraContentPadding` updates the inset via animated
props (`contentInsetBottom`, applied as bottom padding on the native
ScrollView) and then calls `scrollTo(scroll + delta)` one frame later.

On Android Fabric the inset change goes through a shadow-tree commit and a
mount, and `MountItemDispatcher` dispatches view commands (`scrollTo`) before
the prop updates of the same batch. The scroll was clamped to the old range,
so the list stopped short by the inset delta. The last message ended up
touching the composer, and a small manual scroll revealed the missing gap.
Only the first newline loses its delta, because that loss leaves room for the
later ones, so the deficit stays. On Paper (1.128.0) props were applied
synchronously and the deferred `scrollTo` was enough.

The fix:

- A new decorator prop, `contentInsetBottomExtra`, carries the share of the
  bottom inset that comes from `extraContentPadding`. It is sent in the same
  animated props as `contentInsetBottom`.
- The decorator's setters only store values. The view applies them once per
  prop transaction (`onAfterUpdateTransaction`), so the "at end" check sees
  the old range whatever order the setters run in.
- When the extra share changes and the list was at the end of the old range,
  the decorator scrolls by that change after updating the padding. The list
  stays pinned to the end in the same mount that applies the padding, so the
  fix does not depend on frame timing. It is idempotent with the library's
  absolute `scrollTo(target)`, whichever of the two runs first.

Keyboard-driven inset changes do not trigger the pin. On open, the keyboard
handler sets the full keyboard padding in `onStart` and then animates the
scroll position frame by frame. A first version pinned on every bottom inset
change: it jumped the list up by the whole keyboard height and the
per-frame scrolls pulled it back, which made the keyboard animation janky.

A list scrolled away from the end is left to the JS logic.
