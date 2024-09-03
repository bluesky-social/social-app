## uwu woad beawing, do not wemove

## `expo-video` Patch

This patch adds two props to `VideoView`: `onEnterFullscreen` and `onExitFullscreen` which do exactly what they say on
the tin.

This patch also removes the audio session management that Expo does on its own, as we handle audio session management
ourselves.
