module.exports = function () {
  const hasSentryToken = !!process.env.SENTRY_AUTH_TOKEN
  return {
    expo: {
      name: 'Bluesky',
      slug: 'bluesky',
      scheme: 'bluesky',
      owner: 'blueskysocial',
      version: '1.51.0',
      runtimeVersion: {
        policy: 'appVersion',
      },
      orientation: 'portrait',
      icon: './assets/icon.png',
      userInterfaceStyle: 'automatic',
      splash: {
        image: './assets/cloud-splash.png',
        resizeMode: 'cover',
        backgroundColor: '#ffffff',
      },
      ios: {
        buildNumber: '5',
        supportsTablet: false,
        bundleIdentifier: 'xyz.blueskyweb.app',
        config: {
          usesNonExemptEncryption: false,
        },
        infoPlist: {
          UIBackgroundModes: ['remote-notification'],
          NSCameraUsageDescription:
            'Used for profile pictures, posts, and other kinds of content.',
          NSMicrophoneUsageDescription:
            'Used for posts and other kinds of content.',
          NSPhotoLibraryAddUsageDescription:
            'Used to save images to your library.',
          NSPhotoLibraryUsageDescription:
            'Used for profile pictures, posts, and other kinds of content',
        },
        associatedDomains: ['applinks:bsky.app', 'applinks:staging.bsky.app'],
      },
      androidStatusBar: {
        barStyle: 'dark-content',
        backgroundColor: '#ffffff',
      },
      android: {
        versionCode: 38,
        adaptiveIcon: {
          foregroundImage: './assets/adaptive-icon.png',
          backgroundColor: '#ffffff',
        },
        googleServicesFile: './google-services.json',
        package: 'xyz.blueskyweb.app',
        intentFilters: [
          {
            action: 'VIEW',
            autoVerify: true,
            data: [
              {
                scheme: 'https',
                host: 'bsky.app',
              },
            ],
            category: ['BROWSABLE', 'DEFAULT'],
          },
        ],
      },
      web: {
        favicon: './assets/favicon.png',
      },
      updates: {
        enabled: true,
        fallbackToCacheTimeout: 1000,
        url: 'https://u.expo.dev/55bd077a-d905-4184-9c7f-94789ba0f302',
      },
      plugins: [
        'expo-localization',
        hasSentryToken && 'sentry-expo',
        [
          'expo-build-properties',
          {
            android: {
              compileSdkVersion: 34,
              targetSdkVersion: 34,
              buildToolsVersion: '34.0.0',
              kotlinVersion: '1.8.0',
            },
          },
        ],
        [
          'expo-updates',
          {
            username: 'blueskysocial',
          },
        ],
      ].filter(Boolean),
      extra: {
        eas: {
          projectId: '55bd077a-d905-4184-9c7f-94789ba0f302',
        },
      },
      hooks: {
        postPublish: [
          {
            file: 'sentry-expo/upload-sourcemaps',
            config: {
              organization: 'blueskyweb',
              project: 'react-native',
            },
          },
        ],
      },
    },
  }
}
