# expo-scroll-forwarder

An Expo native module that forwards scroll gestures from a UIView to a UIScrollView on iOS. This enables custom scroll behaviors by allowing a non-scrollable view to control a scrollable view's scroll position.

## What It Does

This module solves a specific interaction problem: allowing a fixed header or overlay view to respond to scroll gestures and forward them to an underlying scroll view. The primary use case in the Bluesky app is the profile screen, where the profile header sits above a scrollable content area and can be dragged to scroll the content below it.

Key behaviors:
- Captures pan gestures on a wrapper view and translates them to scroll offsets on a target scroll view
- Implements physics-based deceleration animations that match native scroll behavior
- Supports pull-to-refresh interactions with haptic feedback
- Prevents gesture conflicts with iOS swipe-back navigation by only activating on vertical pans
- Provides rubber-band damping when scrolling past content bounds

## Architecture

The module consists of three main parts:

### 1. Native iOS Implementation (Swift)

**ExpoScrollForwarderView.swift** - The core native view component that:
- Attaches a UIPanGestureRecognizer to intercept scroll gestures
- Finds and references the target RCTScrollView using its React Native tag
- Implements custom scroll physics including velocity-based decay animation
- Manages gesture recognizer delegation to prevent conflicts with system gestures
- Handles pull-to-refresh activation at -130pt scroll offset with haptic feedback

**ExpoScrollForwarderModule.swift** - The Expo module definition that:
- Registers the view component with Expo
- Exposes the `scrollViewTag` prop to specify which scroll view to control

### 2. TypeScript Interface

**ExpoScrollForwarderView.tsx** - Platform-specific implementations:
- **iOS (.ios.tsx)**: Wraps the native view manager from expo-modules-core
- **Default (.tsx)**: No-op wrapper that just renders children (for Android/Web compatibility)

**ExpoScrollForwarder.types.ts** - TypeScript type definitions:
- `scrollViewTag`: The React Native tag of the scroll view to control
- `children`: The content to render (typically a header component)

### 3. Module Configuration

**expo-module.config.json** - Declares iOS-only platform support

**ExpoScrollForwarder.podspec** - CocoaPods specification for iOS dependency management

## Usage

```tsx
import {ExpoScrollForwarderView} from 'expo-scroll-forwarder'

function ProfileScreen() {
  const scrollViewTag = useRef(null)
  
  return (
    <View>
      <ExpoScrollForwarderView scrollViewTag={scrollViewTag.current}>
        <ProfileHeader />
      </ExpoScrollForwarderView>
      
      <ScrollView ref={scrollViewTag}>
        {/* Scrollable content */}
      </ScrollView>
    </View>
  )
}
```

The `scrollViewTag` prop must be the React Native tag (numeric identifier) of the target scroll view. The module uses this to locate the native UIScrollView instance.

## Platform Support

- **iOS**: Full native implementation with custom scroll physics
- **Android**: No-op wrapper (renders children without scroll forwarding)
- **Web**: No-op wrapper (renders children without scroll forwarding)

The module is designed to enhance iOS UX while gracefully degrading on other platforms.

## Key Implementation Details

### Gesture Recognition
- Only activates when pan velocity is more vertical than horizontal (`abs(velocity.y) > abs(velocity.x)`)
- Delegates to UIGestureRecognizerDelegate to prevent simultaneous recognition with navigation swipe-back
- Adds tap/long-press recognizers to the scroll view to cancel ongoing animations

### Scroll Physics
- Implements custom decay animation at 120fps using a Timer
- Velocity decay factor: 0.9875 per frame
- Velocity clamped to +/- 5000 points/second
- Rubber-band damping: offsets below 0 are reduced by 55%
- Animation stops when velocity drops below 5 points/second

### Pull-to-Refresh
- Triggers at -130pt scroll offset
- Provides haptic feedback (UIImpactFeedbackGenerator, light style)
- Calls refresh control via `RCTRefreshControl.forwarderBeginRefreshing()`

### Scroll View Management
- Dynamically finds scroll view using `AppContext.findView(withTag:ofType:)`
- Properly cleans up gesture recognizers when switching between scroll views
- Maintains references to both the scroll view and its refresh control

## Files Overview

| File | Purpose |
|------|---------|
| `ios/ExpoScrollForwarderView.swift` | Native iOS view implementation with gesture handling and scroll physics |
| `ios/ExpoScrollForwarderModule.swift` | Expo module registration and prop definitions |
| `ios/ExpoScrollForwarder.podspec` | CocoaPods dependency specification |
| `src/ExpoScrollForwarderView.ios.tsx` | TypeScript wrapper for iOS native view |
| `src/ExpoScrollForwarderView.tsx` | Default no-op implementation for other platforms |
| `src/ExpoScrollForwarder.types.ts` | TypeScript type definitions |
| `index.ts` | Module entry point |
| `expo-module.config.json` | Expo module configuration |
