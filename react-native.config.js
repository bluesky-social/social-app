module.exports = {
  dependencies: {
    // `react-native-mmkv` is a resolutions alias of `@bsky.app/react-native-mmkv`
    // (needed so @atproto/oauth-client-expo's JS import resolves to the fork).
    // Both copies compile the same com.reactnativemmkv classes, so the aliased
    // copy must not autolink natively — the fork's project provides the module.
    'react-native-mmkv': {
      platforms: {
        android: null,
      },
    },
  },
}
