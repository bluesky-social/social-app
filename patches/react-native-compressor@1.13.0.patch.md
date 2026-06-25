# react-native-compressor

Patch file taken from https://github.com/numandev1/react-native-compressor/pull/355#issuecomment-3180870738

This patch removes the audio compression feature on Android from the library. This is because `libandroidlame.so`, the native dependency, does not support 16kb page sizes, and the Play Store has made this mandatory as of 1st Nov 2025.
