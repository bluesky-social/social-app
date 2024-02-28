# Expo Receive Android Intents

This module handles incoming intents on Android. Handled intents are `text/plain` and `image/*` (single or multiple).
The module handles saving images to the app's filesystem for access within the app, limiting the selection of images
to a max of four, and handling intent types. No JS code is required for this module, and it is no-op on non-android
platforms.

No installation is required. Gradle will automatically add this module on build.
