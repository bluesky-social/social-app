## uwu woad beawing, do not wemove

## `expo-video` Patch

### `onEnterFullScreen`/`onExitFullScreen`
Adds two props to `VideoView`: `onEnterFullscreen` and `onExitFullscreen` which do exactly what they say on
the tin.

### Removing audio session management

This patch also removes the audio session management that Expo does on its own, as we handle audio session management
ourselves.

### Pausing/playing on background/foreground

Instead of handling the pausing/playing of videos in React, we'll handle them here. There's some logic that we do not
need (around PIP mode) that we can remove, and just pause any playing players on background and then resume them on
foreground.
