const pkg = require('./package.json')

const SPLASH_CONFIG = {
  backgroundColor: '#ffffff',
  image: './assets/splash.png',
  resizeMode: 'cover',
}
const DARK_SPLASH_CONFIG = {
  backgroundColor: '#001429',
  image: './assets/splash-dark.png',
  resizeMode: 'cover',
}

const SPLASH_CONFIG_ANDROID = {
  backgroundColor: '#0c7cff',
  image: './assets/splash.png',
  resizeMode: 'cover',
}
const DARK_SPLASH_CONFIG_ANDROID = {
  backgroundColor: '#0f141b',
  image: './assets/splash-dark.png',
  resizeMode: 'cover',
}

module.exports = function (config) {
  /**
   * App version number. Should be incremented as part of a release cycle.
   */
  const VERSION = pkg.version

  /**
   * Uses built-in Expo env vars
   *
   * @see https://docs.expo.dev/build-reference/variables/#built-in-environment-variables
   */
  const PLATFORM = process.env.EAS_BUILD_PLATFORM

  const IS_DEV = process.env.EXPO_PUBLIC_ENV === 'development'
  const IS_TESTFLIGHT = process.env.EXPO_PUBLIC_ENV === 'testflight'
  const IS_PRODUCTION = process.env.EXPO_PUBLIC_ENV === 'production'

  const UPDATES_CHANNEL = IS_TESTFLIGHT
    ? 'testflight'
    : IS_PRODUCTION
    ? 'production'
    : undefined
  const UPDATES_ENABLED = !!UPDATES_CHANNEL

  const SENTRY_DIST = `${PLATFORM}.${VERSION}.${IS_TESTFLIGHT ? 'tf' : ''}${
    IS_DEV ? 'dev' : ''
  }`

  return {
    expo: {
      version: VERSION,
      name: IS_DEV ? 'Bluesky Dev' : 'Bluesky',
      slug: 'bluesky',
      scheme: 'bluesky',
      owner: 'blueskysocial',
      runtimeVersion: {
        policy: 'appVersion',
      },
      orientation: 'portrait',
      icon: './assets/icon.png',
      userInterfaceStyle: 'automatic',
      splash: SPLASH_CONFIG,
      // hsl(211, 99%, 53%), same as palette.default.brandText
      primaryColor: '#1083fe',
      ios: {
        supportsTablet: false,
        bundleIdentifier: IS_DEV
          ? 'dev.xyz.blueskyweb.app'
          : 'xyz.blueskyweb.app',
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
        splash: {
          ...SPLASH_CONFIG,
          dark: DARK_SPLASH_CONFIG,
        },
        entitlements: {
          'com.apple.security.application-groups': 'group.app.bsky',
        },
        privacyManifests: {
          NSPrivacyAccessedAPITypes: [
            {
              NSPrivacyAccessedAPIType:
                'NSPrivacyAccessedAPICategoryFileTimestamp',
              NSPrivacyAccessedAPITypeReasons: ['C617.1', '3B52.1', '0A2A.1'],
            },
            {
              NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace',
              NSPrivacyAccessedAPITypeReasons: ['E174.1', '85F4.1'],
            },
            {
              NSPrivacyAccessedAPIType:
                'NSPrivacyAccessedAPICategorySystemBootTime',
              NSPrivacyAccessedAPITypeReasons: ['35F9.1'],
            },
            {
              NSPrivacyAccessedAPIType:
                'NSPrivacyAccessedAPICategoryUserDefaults',
              NSPrivacyAccessedAPITypeReasons: ['CA92.1', '1C8F.1'],
            },
          ],
        },
      },
      androidStatusBar: {
        barStyle: 'light-content',
        backgroundColor: '#00000000',
      },
      // Dark nav bar in light mode is better than light nav bar in dark mode
      androidNavigationBar: {
        barStyle: 'light-content',
        backgroundColor: DARK_SPLASH_CONFIG_ANDROID.backgroundColor,
      },
      android: {
        icon: './assets/icon.png',
        adaptiveIcon: {
          foregroundImage: './assets/icon-android-foreground.png',
          monochromeImage: './assets/icon-android-foreground.png',
          backgroundImage: './assets/icon-android-background.png',
          backgroundColor: '#1185FE',
        },
        googleServicesFile: IS_DEV
          ? './google-services-dev.json'
          : './google-services.json',
        package: IS_DEV ? 'dev.xyz.blueskyweb.app' : 'xyz.blueskyweb.app',
        intentFilters: [
          {
            action: 'VIEW',
            autoVerify: true,
            data: [
              {
                scheme: 'https',
                host: 'bsky.app',
              },
              IS_DEV && {
                scheme: 'http',
                host: 'localhost:19006',
              },
            ],
            category: ['BROWSABLE', 'DEFAULT'],
          },
        ],
        splash: {
          ...SPLASH_CONFIG_ANDROID,
          dark: DARK_SPLASH_CONFIG_ANDROID,
        },
      },
      web: {
        favicon: './assets/favicon.png',
      },
      updates: {
        url: 'https://updates.bsky.app/manifest',
        enabled: UPDATES_ENABLED,
        fallbackToCacheTimeout: 30000,
        codeSigningCertificate: UPDATES_ENABLED
          ? './code-signing/certificate.pem'
          : undefined,
        codeSigningMetadata: UPDATES_ENABLED
          ? {
              keyid: 'main',
              alg: 'rsa-v1_5-sha256',
            }
          : undefined,
        checkAutomatically: 'NEVER',
        channel: UPDATES_CHANNEL,
      },
      plugins: [
        'expo-localization',
        Boolean(process.env.SENTRY_AUTH_TOKEN) && 'sentry-expo',
        [
          'expo-build-properties',
          {
            ios: {
              deploymentTarget: '14.0',
              newArchEnabled: false,
            },
            android: {
              compileSdkVersion: 34,
              targetSdkVersion: 34,
              buildToolsVersion: '34.0.0',
              kotlinVersion: '1.8.0',
              newArchEnabled: false,
            },
          },
        ],
        [
          'expo-notifications',
          {
            icon: './assets/icon-android-notification.png',
            color: '#1185fe',
            sounds: PLATFORM === 'ios' ? ['assets/dm.aiff'] : ['assets/dm.mp3'],
          },
        ],
        './plugins/withAndroidManifestPlugin.js',
        './plugins/withAndroidManifestFCMIconPlugin.js',
        './plugins/withAndroidManifestLaunchModePlugin.js',
        './plugins/withAndroidStylesWindowBackgroundPlugin.js',
        './plugins/withAndroidStylesAccentColorPlugin.js',
        './plugins/withAndroidSplashScreenStatusBarTranslucentPlugin.js',
        './plugins/shareExtension/withShareExtensions.js',
        './plugins/notificationsExtension/withNotificationsExtension.js',
      ].filter(Boolean),
      extra: {
        eas: {
          build: {
            experimental: {
              ios: {
                appExtensions: [
                  {
                    targetName: IS_DEV
                      ? 'Share-with-Bluesky-Dev'
                      : 'Share-with-Bluesky',
                    bundleIdentifier: IS_DEV
                      ? 'dev.xyz.blueskyweb.app.Share-with-Bluesky'
                      : 'xyz.blueskyweb.app.Share-with-Bluesky',
                    entitlements: {
                      'com.apple.security.application-groups': [
                        'group.app.bsky',
                      ],
                    },
                  },
                  {
                    targetName: 'BlueskyNSE-Dev',
                    bundleIdentifier: IS_DEV
                      ? 'dev.xyz.blueskyweb.app.BlueskyNSE'
                      : 'xyz.blueskyweb.app.BlueskyNSE',
                    entitlements: {
                      'com.apple.security.application-groups': [
                        'group.app.bsky',
                      ],
                    },
                  },
                ],
              },
            },
          },
          projectId: '55bd077a-d905-4184-9c7f-94789ba0f302',
        },
      },
      hooks: {
        postPublish: [
          /*
           * @see https://docs.expo.dev/guides/using-sentry/#app-configuration
           */
          {
            file: 'sentry-expo/upload-sourcemaps',
            config: {
              organization: 'blueskyweb',
              project: 'react-native',
              release: VERSION,
              dist: SENTRY_DIST,
            },
          },
        ],
      },
    },
  }
}
