## expo-modules-core Patch

This patch fixes crashes seen in some Android clients when using intents to open the app. See https://github.com/expo/expo/pull/29513.

This patch also fixes an issue where bitdrift's API stream gets blocked by the Expo interceptor used to power the devtools

Do not remove this patch until that PR lands in Expo and is released.
