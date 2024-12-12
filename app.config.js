const pkg = require('./package.json')

const DARK_SPLASH_ANDROID_BACKGROUND = '#0f141b'

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

  const ASSOCIATED_DOMAINS = [
    'applinks:bsky.app',
    'applinks:staging.bsky.app',
    'appclips:bsky.app',
    'appclips:go.bsky.app', // Allows App Clip to work when scanning QR codes
    // When testing local services, enter an ngrok (et al) domain here. It must use a standard HTTP/HTTPS port.
    ...(IS_DEV || IS_TESTFLIGHT ? [] : []),
  ]

  const UPDATES_CHANNEL = IS_TESTFLIGHT
    ? 'testflight'
    : IS_PRODUCTION
    ? 'production'
    : undefined
  const UPDATES_ENABLED = !!UPDATES_CHANNEL

  const USE_SENTRY = Boolean(process.env.SENTRY_AUTH_TOKEN)
  const SENTRY_DIST = `${PLATFORM}.${VERSION}.${IS_TESTFLIGHT ? 'tf' : ''}${
    IS_DEV ? 'dev' : ''
  }`

  return {
    expo: {
      version: VERSION,
      name: 'Bluesky',
      slug: 'bluesky',
      scheme: 'bluesky',
      owner: 'blueskysocial',
      runtimeVersion: {
        policy: 'appVersion',
      },
      orientation: 'portrait',
      icon: './assets/app-icons/ios_icon_default_light.png',
      userInterfaceStyle: 'automatic',
      primaryColor: '#1083fe',
      ios: {
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
          CFBundleSpokenName: 'Blue Sky',
          CFBundleLocalizations: [
            'en',
            'an',
            'ast',
            'ca',
            'de',
            'es',
            'fi',
            'fr',
            'ga',
            'gl',
            'hi',
            'hu',
            'id',
            'it',
            'ja',
            'ko',
            'nl',
            'pl',
            'pt-BR',
            'ru',
            'th',
            'tr',
            'uk',
            'vi',
            'yue-Hant',
            'zh-Hans',
            'zh-Hant',
          ],
        },
        associatedDomains: ASSOCIATED_DOMAINS,
        entitlements: {
          'com.apple.developer.kernel.increased-memory-limit': true,
          'com.apple.developer.kernel.extended-virtual-addressing': true,
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
        backgroundColor: DARK_SPLASH_ANDROID_BACKGROUND,
      },
      android: {
        icon: './assets/app-icons/android_icon_default_light.png',
        adaptiveIcon: {
          foregroundImage: './assets/icon-android-foreground.png',
          monochromeImage: './assets/icon-android-foreground.png',
          backgroundImage: './assets/icon-android-background.png',
          backgroundColor: '#1185FE',
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
              IS_DEV && {
                scheme: 'http',
                host: 'localhost:19006',
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
        USE_SENTRY && [
          '@sentry/react-native/expo',
          {
            organization: 'blueskyweb',
            project: 'react-native',
            release: VERSION,
            dist: SENTRY_DIST,
          },
        ],
        [
          'expo-build-properties',
          {
            ios: {
              deploymentTarget: '15.1',
              newArchEnabled: false,
            },
            android: {
              compileSdkVersion: 35,
              targetSdkVersion: 35,
              buildToolsVersion: '35.0.0',
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
        'react-native-compressor',
        './plugins/starterPackAppClipExtension/withStarterPackAppClip.js',
        './plugins/withAndroidManifestPlugin.js',
        './plugins/withAndroidManifestFCMIconPlugin.js',
        './plugins/withAndroidStylesAccentColorPlugin.js',
        './plugins/withAndroidSplashScreenStatusBarTranslucentPlugin.js',
        './plugins/shareExtension/withShareExtensions.js',
        './plugins/notificationsExtension/withNotificationsExtension.js',
        './plugins/withAppDelegateReferrer.js',
        [
          'expo-font',
          {
            fonts: [
              './assets/fonts/inter/InterVariable.woff2',
              './assets/fonts/inter/InterVariable-Italic.woff2',
              // Android only
              './assets/fonts/inter/Inter-Regular.otf',
              './assets/fonts/inter/Inter-Italic.otf',
              './assets/fonts/inter/Inter-SemiBold.otf',
              './assets/fonts/inter/Inter-SemiBoldItalic.otf',
              './assets/fonts/inter/Inter-ExtraBold.otf',
              './assets/fonts/inter/Inter-ExtraBoldItalic.otf',
            ],
          },
        ],
        [
          'expo-splash-screen',
          {
            ios: {
              enableFullScreenImage_legacy: true,
              backgroundColor: '#ffffff',
              image: './assets/splash.png',
              resizeMode: 'cover',
              dark: {
                enableFullScreenImage_legacy: true,
                backgroundColor: '#001429',
                image: './assets/splash-dark.png',
                resizeMode: 'cover',
              },
            },
            android: {
              backgroundColor: '#0c7cff',
              image: './assets/splash-android-icon.png',
              imageWidth: 150,
              dark: {
                backgroundColor: '#0c2a49',
                image: './assets/splash-android-icon-dark.png',
                imageWidth: 150,
              },
            },
          },
        ],
        [
          '@mozzius/expo-dynamic-app-icon',
          {
            /**
             * Default set
             */
            default_light: {
              ios: './assets/app-icons/ios_icon_default_light.png',
              android: './assets/app-icons/android_icon_default_light.png',
              prerendered: true,
            },
            default_dark: {
              ios: './assets/app-icons/ios_icon_default_dark.png',
              android: './assets/app-icons/android_icon_default_dark.png',
              prerendered: true,
            },

            /**
             * Bluesky+ core set
             */
            core_aurora: {
              ios: './assets/app-icons/ios_icon_core_aurora.png',
              android: './assets/app-icons/android_icon_core_aurora.png',
              prerendered: true,
            },
            core_bonfire: {
              ios: './assets/app-icons/ios_icon_core_bonfire.png',
              android: './assets/app-icons/android_icon_core_bonfire.png',
              prerendered: true,
            },
            core_sunrise: {
              ios: './assets/app-icons/ios_icon_core_sunrise.png',
              android: './assets/app-icons/android_icon_core_sunrise.png',
              prerendered: true,
            },
            core_sunset: {
              ios: './assets/app-icons/ios_icon_core_sunset.png',
              android: './assets/app-icons/android_icon_core_sunset.png',
              prerendered: true,
            },
            core_midnight: {
              ios: './assets/app-icons/ios_icon_core_midnight.png',
              android: './assets/app-icons/android_icon_core_midnight.png',
              prerendered: true,
            },
            core_flat_blue: {
              ios: './assets/app-icons/ios_icon_core_flat_blue.png',
              android: './assets/app-icons/android_icon_core_flat_blue.png',
              prerendered: true,
            },
            core_flat_white: {
              ios: './assets/app-icons/ios_icon_core_flat_white.png',
              android: './assets/app-icons/android_icon_core_flat_white.png',
              prerendered: true,
            },
            core_flat_black: {
              ios: './assets/app-icons/ios_icon_core_flat_black.png',
              android: './assets/app-icons/android_icon_core_flat_black.png',
              prerendered: true,
            },
            core_classic: {
              ios: './assets/app-icons/ios_icon_core_classic.png',
              android: './assets/app-icons/android_icon_core_classic.png',
              prerendered: true,
            },
          },
        ],
      ].filter(Boolean),
      extra: {
        eas: {
          build: {
            experimental: {
              ios: {
                appExtensions: [
                  {
                    targetName: 'Share-with-Bluesky',
                    bundleIdentifier: 'xyz.blueskyweb.app.Share-with-Bluesky',
                    entitlements: {
                      'com.apple.security.application-groups': [
                        'group.app.bsky',
                      ],
                    },
                  },
                  {
                    targetName: 'BlueskyNSE',
                    bundleIdentifier: 'xyz.blueskyweb.app.BlueskyNSE',
                    entitlements: {
                      'com.apple.security.application-groups': [
                        'group.app.bsky',
                      ],
                    },
                  },
                  {
                    targetName: 'BlueskyClip',
                    bundleIdentifier: 'xyz.blueskyweb.app.AppClip',
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
            file: './postHooks/uploadSentrySourcemapsPostHook',
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
