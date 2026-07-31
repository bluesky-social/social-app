# expo-emoji-picker

A native emoji picker module for React Native applications built with Expo. This module provides platform-specific emoji selection interfaces using native system components.

Based on [react-native-emoji-popup](https://github.com/okwasniewski/react-native-emoji-popup) and [expo-emoji-picker](https://github.com/alanjhughes/expo-emoji-picker).

## What It Does

The module exposes a React component that presents native emoji picker UI on iOS and Android. When a user selects an emoji, it fires a callback with the selected emoji string.

## Platform Support

- **iOS**: Uses [MCEmojiPicker](https://github.com/izyumkin/MCEmojiPicker) presented as a modal picker
- **Android**: Uses the system `androidx.emoji2.emojipicker.EmojiPickerView` component
- **Web**: Not supported (native platforms only)

## How It Works

### Architecture

The module follows Expo's module architecture with three layers:

1. **JavaScript/TypeScript Layer** (`src/`): React components and type definitions
2. **Native iOS Layer** (`ios/`): Swift implementation using MCEmojiPicker
3. **Native Android Layer** (`android/`): Kotlin implementation using AndroidX emoji picker

### iOS Implementation

On iOS, the module creates an invisible tap target view. When tapped, it presents MCEmojiPicker as a modal view controller:

- `EmojiPickerView.swift`: Custom view that handles tap gestures and presents the picker
- `EmojiPickerModule.swift`: Module definition that registers the view with Expo
- Uses MCEmojiPicker dependency for the native picker UI

The picker is presented from the current React view controller and returns the selected emoji via an event dispatcher.

### Android Implementation

On Android, the module embeds the AndroidX EmojiPickerView directly as a full-screen component:

- `EmojiPickerModuleView.kt`: Wraps the system EmojiPickerView in an ExpoView
- `EmojiPickerModule.kt`: Module definition that registers the view with Expo
- Handles configuration changes (dark mode, orientation) by recreating the view

The AndroidX emoji picker provides a grid-based interface with category tabs and search.

### Platform-Specific React Components

The module uses platform-specific file extensions for different behaviors:

- `EmojiPicker.tsx` (iOS): Renders an invisible tap target that accepts children
- `EmojiPicker.android.tsx` (Android): Renders the full emoji picker view with flex: 1 layout

Both components normalize the native event structure to provide a consistent `onEmojiSelected` callback.

## Key Files

### Configuration
- `expo-module.config.json`: Defines the module name and native class mappings for iOS and Android

### TypeScript/React
- `index.ts`: Public exports for the module
- `src/EmojiPickerModule.ts`: Native module registration
- `src/EmojiPickerModule.types.ts`: TypeScript type definitions
- `src/EmojiPickerView.tsx`: Base native view component
- `src/EmojiPicker.tsx`: iOS-specific implementation
- `src/EmojiPicker.android.tsx`: Android-specific implementation

### iOS (Swift)
- `ios/EmojiPickerModule.swift`: Module definition (11 lines)
- `ios/EmojiPickerView.swift`: View implementation with tap handling and picker presentation
- `ios/EmojiPickerModule.podspec`: CocoaPods specification with MCEmojiPicker dependency

### Android (Kotlin)
- `android/src/main/java/expo/community/modules/emojipicker/EmojiPickerModule.kt`: Module definition
- `android/src/main/java/expo/community/modules/emojipicker/EmojiPickerModuleView.kt`: View implementation
- `android/build.gradle`: Gradle configuration with androidx.emoji2:emoji2-emojipicker dependency

## Usage

```tsx
import { EmojiPicker } from 'expo-emoji-picker'

function MyComponent() {
  const handleEmojiSelected = (emoji: string) => {
    console.log('Selected emoji:', emoji)
  }

  return (
    <EmojiPicker onEmojiSelected={handleEmojiSelected}>
      {/* On iOS, children render as the tap target */}
      {/* On Android, children are ignored - picker is shown directly */}
    </EmojiPicker>
  )
}
```

## Dependencies

### iOS
- ExpoModulesCore
- MCEmojiPicker (external CocoaPods dependency)
- Minimum iOS version: 15.1

### Android
- expo-modules-core
- androidx.emoji2:emoji2-emojipicker:1.5.0
- Minimum SDK: 21
- Target SDK: 34

## Configuration

No additional configuration is required. The module is automatically linked through Expo's autolinking system when the app is built.

The module definition in `expo-module.config.json` specifies the native class names for each platform, which Expo uses to register the module at runtime.
