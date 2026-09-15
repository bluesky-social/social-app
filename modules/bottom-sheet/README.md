# Bottom Sheet Expo Module

A custom Expo module that provides native bottom sheet functionality for iOS and Android, using platform-specific native bottom sheet implementations (UISheetPresentationController on iOS, Material BottomSheetDialog on Android).

## Overview

This module wraps native bottom sheet components to provide a React Native interface with cross-platform consistency. It uses native presentation APIs rather than JavaScript-based animations for better performance and native behavior.

Key features:
- Native bottom sheet presentation on iOS and Android
- Automatic content height detection (no JS bridge round-trip)
- Configurable snap points (hidden, partial, full)
- Drag-to-dismiss with prevention controls
- Portal-based rendering for proper z-index layering
- Edge-to-edge support on modern Android versions
- iOS 26+ zoom transition support

## Platform Support

- **iOS**: Uses `UISheetPresentationController` (iOS 15+)
- **Android**: Uses Material Design `BottomSheetDialog` with `BottomSheetBehavior`
- **Web**: Not supported (throws error)

## Architecture

### TypeScript Layer

The module exposes a React component that handles rendering and state management:

- **BottomSheet.tsx** (Native): Main component wrapping the native view
- **BottomSheet.web.tsx** (Web): Stub that throws an error
- **BottomSheetNativeComponent.tsx**: React wrapper with portal integration
- **BottomSheetPortal.tsx**: Portal system for rendering sheets above app content
- **Portal.tsx**: Generic portal implementation for managing component hierarchy

The component uses a class-based approach to expose imperative methods (`present()`, `dismiss()`, `dismissAll()`).

### Native Layer

#### iOS Implementation

- **BottomSheetModule.swift**: Expo module definition with event handlers and prop bindings
- **SheetView.swift**: Main view component that creates and manages `SheetViewController`
  - Observes content height via KVO (Key-Value Observing) on bounds
  - Manages sheet lifecycle and state transitions
  - Implements `UISheetPresentationControllerDelegate` for drag events
- **SheetViewController.swift**: UIViewController subclass with sheet presentation
  - Configures detents (snap points) based on content height
  - Handles iOS 26+ safe area adjustments for floating sheet style
  - Animates detent changes when content resizes
- **SheetManager.swift**: Singleton that tracks all active sheets with weak references
- **Util.swift**: Helper for calculating screen height minus safe area insets

#### Android Implementation

- **BottomSheetModule.kt**: Expo module definition mirroring iOS functionality
- **BottomSheetView.kt**: Main view component managing Material BottomSheetDialog
  - Uses `OnLayoutChangeListener` to observe content height natively
  - Configures `BottomSheetBehavior` for drag and snap behavior
  - Handles edge-to-edge display across Android versions (API 29-35+)
  - Preserves status/nav bar appearance from host activity
- **DialogRootViewGroup.kt**: Custom ViewGroup acting as RootView for the dialog
  - Forwards touch events to React Native event system
  - Reports its measured width to `BottomSheetView` so the content canvas can follow it
  - Also carries the legacy `UIManagerModule.updateNodeSize()` shadow node sizing, which only runs on the old architecture
  - Based on React Native's ReactModalHostView pattern
- **SheetManager.kt**: Singleton for tracking sheets (same pattern as iOS)

### Content Height Detection

Both platforms detect content height changes natively without JS bridge round-trips:

- **iOS**: KVO observation on the content view's `bounds` property
- **Android**: `OnLayoutChangeListener` on child views (catches React Native's direct `layout()` calls)

This eliminates layout jank when content changes (e.g., keyboard appearance, dynamic content loading).

### Content Canvas Sizing

The "canvas" is the size the sheet content is laid out on by Yoga. **On Android the native side owns it**; on iOS it is still sized from JS.

- **Android**: JS renders unsized `flex: 1` content and `BottomSheetView` pushes the canvas size into the Fabric shadow tree through `ExpoView`'s `setViewSize` state channel (`shadowNodeProxy.setViewSize()`). Only native knows the real sheet frame - Material caps the frame at 640dp on tablets and centers it, and it changes on rotation.
- **iOS**: `BottomSheetNativeComponent` sets `height: screenHeight - insets.top` and `width: '100%'` on the native view. Moving iOS onto the same state channel is deferred: it needs on-device iteration on iOS 26 sheet geometry (large-detent and floating-card metrics, where the visible sheet is shorter than the window minus the top inset).

How the Android path works:

- The JS style on the native view **must not set `width` or `height`** on Android. `ExpoViewComponentDescriptor::adopt()` only applies the state size on an axis where the style leaves that dimension undefined, so a style dimension would silently win.
- The two axes come from different places, and the distinction is load-bearing:
  - **Width** is authoritatively the dialog container's measured width, reported through `DialogRootViewGroup`'s size-change listener - that is the real sheet width, with the horizontal window insets and Material's 640dp cap already applied. It is seeded from `min(window width, material_bottom_sheet_max_width)` on the first `onLayout` so content has something to lay out in before the dialog exists.
  - **Height** is always computed natively as `screenHeight - statusBarHeight` (matching the behavior's `expandedOffset`) - the whole expanded frame, **never** the dialog's measured height. The canvas has to be room for the content to grow *into*, because the content's height is what drives the snap points. Sizing it from the dialog's own height is circular: `BottomSheetBehavior` measures the container against the sheet, so the canvas collapses onto the content height and the content is then pinned - extra `ScrollView` padding (the Android keyboard path) or a longer list becomes scroll extent instead of a height change, `OnLayoutChangeListener` never fires, and the sheet stops responding to its content.
- Seeding runs once per open cycle - re-seeding would fight the width the dialog reported and the two would push each other back and forth.
- Because the content measures 0x0 until that first state commit lands, `present()` bails out early when the content height is still zero. The commit resizes the native view, which re-fires `onLayout`, which re-enters `present()` - so presentation self-retries rather than needing an explicit callback. Full-height sheets skip the check, since they don't need a content measurement.
- Rotation is handled by the container push: the RN activity handles configuration changes itself, so the view is never recreated. `screenHeight` is read per access so the computed height follows the rotation, and the container reports the new width (plus a deferred `updateLayout()` to reposition the sheet).
- On the **old architecture** there is no state channel (`stateWrapper` is null, so `setViewSize` no-ops) and Android falls back to `DialogRootViewGroup`'s legacy `UIManagerModule.updateNodeSize()` path. The `present()` gate is skipped there for the same reason - nothing would ever resize the view.

## Props

```typescript
interface BottomSheetViewProps {
  children: React.ReactNode
  
  // Appearance
  cornerRadius?: number
  backgroundColor?: ColorValue
  containerBackgroundColor?: ColorValue
  
  // Behavior
  preventDismiss?: boolean          // Disable swipe-to-dismiss
  preventExpansion?: boolean        // Lock to initial height (no full-screen)
  disableDrag?: boolean             // Disable drag handle (Android only)
  fullHeight?: boolean              // Start at full screen height
  
  // Height constraints
  minHeight?: number                // Minimum height in dp
  maxHeight?: number                // Maximum height in dp
  
  // iOS 26+ transition
  sourceViewTag?: number            // View tag for zoom transition origin
  
  // Events
  onAttemptDismiss?: (event: BottomSheetAttemptDismissEvent) => void
  onSnapPointChange?: (event: BottomSheetSnapPointChangeEvent) => void
  onStateChange?: (event: BottomSheetStateChangeEvent) => void
}
```

## States and Snap Points

### States
- `closed`: Sheet is dismissed
- `closing`: Sheet is animating closed
- `open`: Sheet is fully visible
- `opening`: Sheet is animating open

### Snap Points
- `Hidden` (0): Dismissed
- `Partial` (1): Half-expanded / content height
- `Full` (2): Expanded to screen height

## Usage

### Basic Example

```tsx
import {BottomSheet, BottomSheetProvider, BottomSheetOutlet} from '@modules/bottom-sheet'

// In your app root:
function App() {
  return (
    <BottomSheetProvider>
      <YourApp />
      <BottomSheetOutlet />
    </BottomSheetProvider>
  )
}

// In a component:
function MyComponent() {
  const sheetRef = useRef<BottomSheet>(null)
  
  const openSheet = () => {
    sheetRef.current?.present()
  }
  
  const closeSheet = () => {
    sheetRef.current?.dismiss()
  }
  
  return (
    <>
      <Button onPress={openSheet} title="Open Sheet" />
      
      <BottomSheet
        ref={sheetRef}
        cornerRadius={16}
        backgroundColor="white"
        onStateChange={(e) => console.log(e.nativeEvent.state)}
      >
        <View style={{padding: 20}}>
          <Text>Sheet content</Text>
          <Button onPress={closeSheet} title="Close" />
        </View>
      </BottomSheet>
    </>
  )
}
```

### Nested Sheets

The module supports nesting sheets by using `BottomSheetPortalProvider` within sheet content:

```tsx
<BottomSheet ref={outerSheetRef}>
  <BottomSheetPortalProvider>
    <Button onPress={() => innerSheetRef.current?.present()} />
    <BottomSheet ref={innerSheetRef}>
      <Text>Inner sheet content</Text>
    </BottomSheet>
  </BottomSheetPortalProvider>
</BottomSheet>
```

### Dismiss All Sheets

```tsx
import {BottomSheetNativeComponent} from '@modules/bottom-sheet'

BottomSheetNativeComponent.dismissAll()
```

## Key Implementation Details

### iOS Specific

1. **iOS 15 Compatibility**: On iOS 15, custom detents are not available, so the module uses `.medium()` detent and applies extra styling to prevent visual issues.

2. **iOS 26+ Zoom Transitions**: When `sourceViewTag` is provided on iOS 26+, the sheet zooms from the specified view.

3. **Detent Selection**: The module automatically chooses between custom detents, `.medium()`, and `.large()` based on content height and screen size.

### Android Specific

1. **Edge-to-Edge**: The module handles edge-to-edge display correctly across API levels:
   - API 35+: Mandatory edge-to-edge
   - API 30-34: Uses `currentWindowMetrics`
   - API <30: Uses deprecated `getRealSize()`

2. **Status/Nav Bar Appearance**: Preserves light/dark appearance from the host activity and reapplies it to the sheet dialog.

3. **Drag Handling**: On full-height sheets with `preventDismiss`, dragging is disabled to prevent accidental dismissal (since there's no half-expanded snap point to land on).

4. **Layout Updates During Gestures**: Content height changes are deferred during drag gestures to prevent fighting the user's input.

5. **Tablet Width**: Material caps the sheet frame at 640dp (`material_bottom_sheet_max_width`, the `android:maxWidth` on `Widget.MaterialComponents.BottomSheet`) and centers it horizontally, so on tablets the sheet is narrower than the screen. `BottomSheetView` reads that cap from resources when seeding the canvas width, and the dialog container's measured width then corrects it - see [Content Canvas Sizing](#content-canvas-sizing).

6. **Rotation**: The RN activity handles configuration changes itself, so a rotation resizes the display without recreating `BottomSheetView`. Screen height is therefore read per access rather than cached, and `maxHeight` is stored unclamped and clamped against the current screen at use time.

### Platform Differences

- **cornerRadius**: Applied to sheet on iOS, to content wrapper on Android (Android clips with `overflow: hidden`)
- **disableDrag**: Android-only prop (iOS drag behavior is controlled via `preventDismiss` + `preventExpansion`)
- **sourceViewTag**: iOS 26+ only (ignored on Android)

## Files Reference

### TypeScript
- `index.ts` - Public API exports
- `src/BottomSheet.types.ts` - TypeScript type definitions
- `src/BottomSheet.tsx` - Native component (re-export)
- `src/BottomSheet.web.tsx` - Web stub
- `src/BottomSheetNativeComponent.tsx` - Native wrapper with portal integration
- `src/BottomSheetNativeComponent.web.tsx` - Web stub for native component
- `src/BottomSheetPortal.tsx` - Portal context and providers
- `src/lib/Portal.tsx` - Generic portal implementation

### iOS
- `ios/BottomSheetModule.swift` - Module definition
- `ios/SheetView.swift` - Main view implementation
- `ios/SheetViewController.swift` - View controller for sheet presentation
- `ios/SheetManager.swift` - Singleton for tracking active sheets
- `ios/Util.swift` - Screen height utility

### Android
- `android/src/main/java/expo/modules/bottomsheet/BottomSheetModule.kt` - Module definition
- `android/src/main/java/expo/modules/bottomsheet/BottomSheetView.kt` - Main view implementation
- `android/src/main/java/expo/modules/bottomsheet/DialogRootViewGroup.kt` - Dialog root view group
- `android/src/main/java/expo/modules/bottomsheet/SheetManager.kt` - Sheet tracking singleton

### Configuration
- `expo-module.config.json` - Expo module configuration
