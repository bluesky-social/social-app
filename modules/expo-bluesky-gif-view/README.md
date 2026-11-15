# expo-bluesky-gif-view

An Expo module for displaying animated GIFs and WebP images with optimized performance and playback controls.

## Overview

This module provides a custom view component for rendering animated GIFs with support for:

- Autoplay control
- Placeholder images while loading
- Programmatic playback control (play/pause/toggle)
- Image prefetching
- Efficient memory management
- Player state change events

## Platform Support

- iOS (13.4+)
- Android (API 21+)
- Web

## Architecture

The module uses native platform libraries for optimal GIF rendering performance:

### iOS Implementation

- **Library**: SDWebImage with SDWebImageWebPCoder
- **Key Files**:
  - `ios/GifView.swift` - Main view implementation using `SDAnimatedImageView`
  - `ios/ExpoBlueskyGifViewModule.swift` - Module definition and prop bindings
  - `ios/Util.swift` - Cache configuration utilities

**Approach**: Uses `SDAnimatedImageView` for hardware-accelerated GIF rendering. Images are cached to disk only (not memory) to avoid performance issues with `SDAnimatedImage` when loaded from memory. The view automatically cancels pending requests when scrolled off-screen and resumes loading when visible.

### Android Implementation

- **Library**: Glide
- **Key Files**:
  - `android/src/main/java/expo/modules/blueskygifview/GifView.kt` - Main view implementation
  - `android/src/main/java/expo/modules/blueskygifview/ExpoBlueskyGifViewModule.kt` - Module definition
  - `android/src/main/java/expo/modules/blueskygifview/AppCompatImageViewExtended.kt` - Custom ImageView with playback control

**Approach**: Uses Glide's disk cache strategy for loading animated GIFs. Placeholders are loaded with `skipMemoryCache(true)` to avoid cache bloat. The custom `AppCompatImageViewExtended` detects when animations are loaded via `onDraw` and manages the `Animatable` drawable lifecycle.

### Web Implementation

- **Library**: Native HTML5 `<video>` element
- **Key File**: `src/GifView.web.tsx`

**Approach**: Uses a looping, muted video element to display GIFs. This provides better performance than image-based approaches on the web. The implementation tracks load state to fire the `onPlayerStateChange` event only once (since `onCanPlay` fires on every loop).

## Usage

```tsx
import {GifView} from 'expo-bluesky-gif-view'

function MyComponent() {
  const gifRef = React.useRef<GifView>(null)

  return (
    <GifView
      source="https://example.com/animated.gif"
      placeholderSource="https://example.com/thumbnail.jpg"
      autoplay={true}
      onPlayerStateChange={(event) => {
        console.log('Playing:', event.nativeEvent.isPlaying)
        console.log('Loaded:', event.nativeEvent.isLoaded)
      }}
      ref={gifRef}
    />
  )
}
```

## API

### Props

- `source?: string` - URL of the animated GIF/WebP
- `placeholderSource?: string` - URL of a static placeholder image to show while loading
- `autoplay?: boolean` - Whether to start playing automatically (default: true)
- `onPlayerStateChange?: (event: GifViewStateChangeEvent) => void` - Callback fired when playback state changes

### Methods

All methods are async and return a Promise:

```tsx
await gifRef.current?.playAsync()
await gifRef.current?.pauseAsync()
await gifRef.current?.toggleAsync()
```

### Static Methods

```tsx
// Prefetch GIFs into the cache (not supported on web)
await GifView.prefetchAsync([
  'https://example.com/gif1.gif',
  'https://example.com/gif2.gif'
])
```

## Configuration

### iOS Dependencies

The module requires SDWebImage and SDWebImageWebPCoder:

```ruby
# ios/ExpoBlueskyGifView.podspec
s.dependency 'SDWebImage', '~> 5.21.0'
s.dependency 'SDWebImageWebPCoder', '~> 0.14.6'
```

### Android Dependencies

The module uses Glide, kept in sync with expo-image version:

```gradle
# android/build.gradle
implementation 'com.github.bumptech.glide:glide:4.13.2'
```

## Key Implementation Details

### Lifecycle Management

- **iOS**: Cancels pending requests in `willMove(toWindow:)` when scrolled off-screen
- **Android**: Pauses playback in `onDetachedFromWindow()`, resumes in `onAttachedToWindow()`
- **Web**: Uses React lifecycle methods to manage video element state

### Cache Strategy

- **iOS**: Disk-only caching to work around `SDAnimatedImage` memory issues
- **Android**: DATA disk cache for main images, skips memory cache for placeholders
- **Web**: Relies on browser cache

### Animation Control

- **iOS**: `SDAnimatedImageView.autoPlayAnimatedImage` is explicitly set to false to prevent automatic animation on viewport entry
- **Android**: Custom `AppCompatImageViewExtended` manages `Animatable` drawable state
- **Web**: Uses HTMLMediaElement play/pause APIs

## Files Overview

```
expo-bluesky-gif-view/
├── index.ts                              # Module entry point
├── expo-module.config.json               # Expo module configuration
├── src/
│   ├── GifView.types.ts                  # TypeScript type definitions
│   ├── GifView.tsx                       # Native implementation (iOS/Android)
│   └── GifView.web.tsx                   # Web implementation
├── ios/
│   ├── ExpoBlueskyGifView.podspec        # CocoaPods spec
│   ├── ExpoBlueskyGifViewModule.swift    # Module and prop definitions
│   ├── GifView.swift                     # iOS view implementation
│   └── Util.swift                        # Cache configuration
└── android/
    ├── build.gradle                      # Gradle build configuration
    └── src/main/java/expo/modules/blueskygifview/
        ├── ExpoBlueskyGifViewModule.kt   # Module and prop definitions
        ├── GifView.kt                    # Android view implementation
        └── AppCompatImageViewExtended.kt # Custom ImageView for playback
```
