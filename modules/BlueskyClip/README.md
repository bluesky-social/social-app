# BlueskyClip

An iOS App Clip implementation for Bluesky starter packs. App Clips are lightweight app experiences that allow users to preview and join Bluesky through starter packs without installing the full app.

## What It Does

BlueskyClip provides a minimal, on-demand iOS app experience for viewing and joining Bluesky starter packs. When a user encounters a starter pack link (e.g., `bsky.app/start/...` or `go.bsky.app/...`), iOS can present the App Clip instead of requiring a full app install. The App Clip:

1. Loads the starter pack web page in a WKWebView
2. Allows users to browse the starter pack content
3. Presents the App Store overlay when the user decides to join
4. Passes the starter pack URI to the main app via shared UserDefaults

## Architecture

### Native iOS Implementation

The App Clip is a standalone iOS target with its own minimal Swift implementation:

- **AppDelegate.swift**: Standard app delegate that sets up the view controller and handles URL routing (both direct URL opens and universal links)
- **ViewController.swift**: Main view controller that manages the WKWebView, detects starter pack URLs, and communicates with the web layer

### Communication Flow

```
User taps starter pack link
        ↓
iOS presents BlueskyClip App Clip
        ↓
WKWebView loads bsky.app with ?clip=true parameter
        ↓
Web app detects clip mode and sends actions via postMessage
        ↓
ViewController receives messages and:
  - Presents App Store overlay (action: "present")
  - Stores starter pack URI in shared UserDefaults (action: "store")
        ↓
User downloads main app
        ↓
Main app reads starterPackUri from shared UserDefaults
        ↓
Main app displays starter pack onboarding flow
```

### Key Implementation Details

**URL Detection** (`isStarterPackUrl`):
- Matches `bsky.app/start/*` and `bsky.app/starter-pack/*` paths (4 path components)
- Matches short links `go.bsky.app/*` (2 path components)

**WebView Communication** (`WKScriptMessageHandler`):
- Listens for messages on the "onMessage" channel
- Handles two action types:
  - `present`: Shows the App Store overlay using `SKOverlay`
  - `store`: Writes JSON data to shared UserDefaults with the specified key

**Data Sharing**:
- Uses UserDefaults suite `group.app.bsky` (App Group)
- Primary key: `starterPackUri` - stores the starter pack URL
- The main app reads this value on launch via `SharedPrefs.getString('starterPackUri')` (see `src/components/hooks/useStarterPackEntry.native.ts`)

## Configuration

### Build Configuration

The App Clip target is automatically configured via Expo config plugins located in `/plugins/starterPackAppClipExtension/`:

- **withStarterPackAppClip.js**: Main plugin that orchestrates all configuration
- **withXcodeTarget.js**: Creates the App Clip target in Xcode with proper build settings
- **withAppEntitlements.js**: Configures main app entitlements for App Clip association
- **withClipEntitlements.js**: Sets up App Clip entitlements (App Groups, parent app identifier, associated domains)
- **withClipInfoPlist.js**: Generates the Info.plist for the App Clip target
- **withFiles.js**: Copies Swift source files and assets from `modules/BlueskyClip/` to the iOS build directory

### Entitlements

**Main App** (`app.entitlements`):
- `com.apple.security.application-groups`: `group.app.bsky`
- `com.apple.developer.associated-appclip-app-identifiers`: Links to the App Clip bundle ID

**App Clip** (`BlueskyClip.entitlements`):
- `com.apple.security.application-groups`: `group.app.bsky` (for data sharing)
- `com.apple.developer.parent-application-identifiers`: Links to the main app bundle ID
- `com.apple.developer.associated-domains`: Inherits from main app config (for universal links)

### Build Settings

- Deployment target: iOS 15.1+
- Bundle ID: `[main-app-bundle-id].AppClip`
- Product type: `com.apple.product-type.application.on-demand-install-capable`
- Development team: `B3LX46C5HS`
- Device family: iPhone only (1)

## Platform Support

- **iOS**: Full support via native App Clip
- **Android**: Not applicable (no App Clip equivalent)
- **Web**: Not applicable (web uses standard starter pack landing pages)

## Integration with Main App

The main app detects App Clip-originated starter packs through `useStarterPackEntry` hook:

**Native** (`src/components/hooks/useStarterPackEntry.native.ts`):
- Reads `starterPackUri` from `SharedPrefs` (App Group)
- Clears the value after reading to prevent re-use
- Sets active starter pack in app state

**Web** (`src/components/hooks/useStarterPackEntry.ts`):
- Detects `?clip=true` URL parameter
- Extracts starter pack URI from URL
- Sets active starter pack with `isClip: true` flag

## Files

```
modules/BlueskyClip/
├── AppDelegate.swift         # App lifecycle and URL handling
├── ViewController.swift      # WebView management and message handling
└── Images.xcassets/          # App Clip icon assets
    ├── AppIcon.appiconset/
    │   ├── App-Icon-1024x1024@1x.png
    │   └── Contents.json
    └── Contents.json
```

## Development Notes

- The App Clip is built as part of the main Xcode project when running `yarn prebuild`
- Source files are copied during the prebuild process, not directly referenced
- Changes to Swift files require running `yarn prebuild` to take effect
- The App Clip shares the same version number as the main app
- App Clips have a 15MB size limit (enforced by Apple)
- Users can convert an App Clip session into a full app install without losing data (via shared App Group)
