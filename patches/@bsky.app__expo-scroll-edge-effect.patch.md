# @bsky.app\_\_expo-scroll-edge-effect.patch

Fixes the iOS 26 scroll edge effect (the blur under the status bar) failing to
attach on the New Architecture (Fabric).

## Why

The native view resolves the target scroll view by React tag:
`scrollViewTag` (published from JS when the scroll view mounts) ->
`appContext.findView(withTag:)` -> attach a `UIScrollEdgeElementContainerInteraction`.

On Paper this resolved on the first try, because view-by-tag registration was
serialized through the single UIManager batch pipeline - by the time the tag
prop reached native, the scroll view was already in the registry.

On Fabric there is no synchronous tag->view registry. The scroll view's
`ComponentView` is registered when its mount transaction is applied, which is
deferred relative to the JS commit that set the tag. So the one-shot
`resolveScrollView` runs before the view is mounted and returns nil, the
interaction never attaches, and the blur is lost. (The un-gated case happened to
work only because the header's `didMoveToWindow` provided a late second attempt;
a list mounted later - e.g. behind an `isActive` gate - had no such retry.)

## What it does

Makes resolution event-driven and self-healing instead of one-shot:

- When `resolveScrollView` returns nil, it bumps a bounded counter and calls
  `setNeedsLayout()`; `layoutSubviews()` re-attempts as sibling views mount, so
  it retries exactly when the scroll view actually appears - no fixed timer.
- `isAttached` stops re-running once resolved (no teardown/re-attach churn).
- `resolveAttempts` / `maxResolveAttempts` bound the retries so a
  permanently-absent scroll view (list not rendered) cannot spin layout forever.
- The budget is reset on every "fresh" trigger (prop change, entering the
  window) via `scheduleResolve()`, so each new tag gets a full retry budget.

## Notes

- iOS only; gated behind `#available(iOS 26, *)`.
- This mirrors how `react-native-screens` handles the same effect on Fabric
  (resolve from the live view hierarchy and re-apply on mount/layout lifecycle
  rather than a single tag lookup). A cleaner long-term fix would move
  resolution to the scroll-view side, but this is the minimal change to the
  existing tag-based design.
