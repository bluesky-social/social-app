# Share-with-Bluesky

iOS Share Extension for the Bluesky Social app that enables users to share content from other apps directly to Bluesky.

## Overview

This module implements an iOS Share Extension (Action Extension) that appears in the system share sheet when users tap the share button in other iOS apps. It allows sharing text, URLs, images, and videos to create a new Bluesky post.

## Features

- Share plain text
- Share URLs (web links)
- Share images (up to 4 images, supports PNG, JPG, JPEG, GIF, HEIC)
- Share videos (single video, supports MOV, MP4, M4V)
- Automatic image dimension extraction
- Automatic video dimension extraction
- App group file sharing for media access

## Architecture

### iOS Share Extension

The extension is implemented as a native iOS Share Extension using Swift. When a user shares content:

1. The `ShareViewController` receives the shared content from the extension context
2. Content is processed based on its type (text, URL, image, or video)
3. Media files are copied to a shared App Group container (`group.app.bsky`) for access by the main app
4. Image and video dimensions are extracted and encoded into the URI
5. The extension constructs a deep link URL with the content encoded in query parameters
6. The main Bluesky app is opened with the deep link
7. The extension completes and dismisses

### Deep Link Format

The extension communicates with the main app using deep links with the `bluesky://` scheme:

```
bluesky://intent/compose?text=<encoded-text>
bluesky://intent/compose?imageUris=<uri1>|<width>|<height>,<uri2>|<width>|<height>
bluesky://intent/compose?videoUri=<uri>|<width>|<height>
```

The scheme can be customized by setting the `MainAppScheme` key in `Info.plist` to support forks.

### Main App Integration

The main app handles these deep links in `src/lib/hooks/useIntentHandler.ts`:

- Parses the deep link parameters
- Validates image/video URIs for security (filters out external URLs)
- Opens the composer with the pre-populated content
- Supports up to 4 images or 1 video per share

## Key Files

### Module Files

- `ShareViewController.swift` - Main view controller that handles share requests and processes content
- `Info.plist` - Extension configuration (activation rules, supported content types)
- `Share-with-Bluesky.entitlements` - App group entitlements for shared file access

### App Integration

- `src/lib/hooks/useIntentHandler.ts` - Main app hook that handles incoming deep links
- `android/app/src/main/AndroidManifest.xml` - Android share intent configuration (lines 57-76)

## Configuration

### Supported Content Types

Defined in `Info.plist` under `NSExtensionActivationRule`:

- Text: Plain text strings
- Web URLs: Up to 1 URL
- Images: Up to 10 images
- Videos: Up to 1 video

### App Group

The extension uses the `group.app.bsky` App Group identifier to share files with the main app. This is configured in:

- `Share-with-Bluesky.entitlements`
- Main app's entitlements file

### Custom Scheme

The `MainAppScheme` in `Info.plist` defaults to `bluesky` but can be changed for forks to use a custom URL scheme.

## Platform Support

- iOS: Native Share Extension (this module)
- Android: Native share intents handled via MainActivity intent filters in AndroidManifest.xml
- Web: Not applicable (browser share APIs use different mechanisms)

## Implementation Details

### Image Processing

When images are shared:

1. Images are loaded from the extension's temporary directory or as UIImage objects
2. Images are converted to JPEG format at maximum quality
3. Dimensions are extracted from the UIImage
4. Files are saved to the App Group container with unique names
5. URIs are formatted as `<file-url>|<width>|<height>`

### Video Processing

When videos are shared:

1. Videos are copied from the source URL to the App Group container
2. AVURLAsset is used to extract video track dimensions
3. Track dimensions are adjusted for video rotation using preferredTransform
4. URI is formatted as `<file-url>|<width>|<height>`

### Security

- External URLs in image URIs are filtered out in the main app to prevent potential security issues
- Only file:// URLs from the App Group container are accepted
- URI format is validated with a regex pattern before processing

## Development

This module is built as part of the main Xcode project. The extension target is included in the iOS build configuration.

To modify the extension:

1. Open the Xcode project in `/ios`
2. Navigate to the Share-with-Bluesky target
3. Edit `ShareViewController.swift` for logic changes
4. Edit `Info.plist` for configuration changes
5. Rebuild the iOS app

## Limitations

- Images: Maximum of 4 images per share (limited in main app handler)
- Videos: Only 1 video per share
- Mixed media: Cannot share images and videos together
- File size: No explicit limits, but large files may cause issues
- Formats: Only supports common image/video formats listed in constants
