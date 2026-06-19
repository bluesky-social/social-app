# `expo-privacy-sensitive` patch

Makes the native iOS view compatible with the React Native new architecture (Fabric).

## Problem

`ExpoPrivacySensitiveView` hides its content from screenshots by reparenting its
children into a secure `UITextField` container view. It did this by overriding
`addSubview`/`insertSubview`.

On the new architecture, `ExpoView` is an `RCTViewComponentView` subclass, and
Fabric mounts/unmounts React children by calling `mountChildComponentView` /
`unmountChildComponentView` directly on the component view. The mount path went
through the overridden `insertSubview` and reparented the child into the secure
container, but `RCTViewComponentView.unmountChildComponentView` asserts that the
child is a direct subview of `self`. That assertion failed, crashing the app:

```
NSInternalInconsistencyException: Attempt to unmount a view which is mounted
inside different view. (parent: ExpoPrivacySensitive.ExpoPrivacySensitiveView,
child: RCTViewComponentView, index: 0)
```

It reproduced reliably when navigating back from the post thread screen (the
`GrowthHack` component is the only consumer).

## Fix

Two parts, mirroring how `expo-splash-screen` supports both architectures:

1. `ExpoPrivacySensitive.podspec` now adds `-DRCT_NEW_ARCH_ENABLED` to
   `OTHER_SWIFT_FLAGS` when `ENV['RCT_NEW_ARCH_ENABLED'] == '1'`. Without this,
   the flag is never defined for this pod's Swift, so the `#if` below would
   always be false.
2. `ExpoPrivacySensitiveView.swift` gates its implementation on
   `#if RCT_NEW_ARCH_ENABLED`: on the new architecture it overrides
   `mountChildComponentView` / `unmountChildComponentView` (reparenting on mount,
   plain removal on unmount to avoid the superview assertion); the old
   `addSubview`/`insertSubview` overrides are kept for the old architecture.

## Important: requires `RCT_NEW_ARCH_ENABLED=1` at install

The podspec opt-in is gated on `ENV['RCT_NEW_ARCH_ENABLED'] == '1'` at
`pod install` time (same as `expo-splash-screen` and `ExpoModulesCore`).

Should be upstreamed to https://github.com/mozzius/expo-privacy-sensitive.
