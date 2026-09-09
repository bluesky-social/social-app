// @ts-check
const pkg = require('./package.json')

/**
 * @param {import('@expo/config-types').ExpoConfig} _config
 * @returns {{ expo: import('@expo/config-types').ExpoConfig }}
 */
module.exports = function (_config) {
  /**
   * App version number. Should be incremented as part of a release cycle.
   */
  const VERSION = pkg.version

  /**
   * Uses built-in Expo env vars
   *
   * @see https://docs.expo.dev/build-reference/variables/#built-in-environment-variables
   */
  const PLATFORM = process.env.EAS_BUILD_PLATFORM ?? 'web'

  const IS_TESTFLIGHT = process.env.EXPO_PUBLIC_ENV === 'testflight'
  const IS_PRODUCTION = process.env.EXPO_PUBLIC_ENV === 'production'
  const IS_E2E = process.env.EXPO_PUBLIC_ENV === 'e2e'
  const IS_DEV = !IS_TESTFLIGHT && !IS_PRODUCTION

  const ASSOCIATED_DOMAINS = [
    'applinks:bsky.app',
    'applinks:staging.bsky.app',
    'appclips:bsky.app',
    'appclips:go.bsky.app', // Allows App Clip to work when scanning QR codes
    // When testing local services, enter an ngrok (et al) domain here. It must use a standard HTTP/HTTPS port.
    ...(IS_DEV || IS_TESTFLIGHT ? [] : []),
  ]

  const UPDATES_ENABLED = IS_TESTFLIGHT || IS_PRODUCTION

  const USE_SENTRY = Boolean(process.env.SENTRY_AUTH_TOKEN)

  /**
   * u&u Lab rebrand: flat PNG works for icon/ios.icon/android.icon alike,
   * so the old .icon-bundle/testflight/web split isn't needed here.
   */
  const IOS_ICON_FILE = './assets/app-icons/uu_icon.png'

  return {
    expo: {
      version: VERSION,
      name: 'u&u Lab',
      slug: 'uu-lab',
      scheme: 'uulab',
      runtimeVersion: {
        policy: 'appVersion',
      },
      icon: './assets/app-icons/uu_icon.png',
      userInterfaceStyle: 'automatic',
      primaryColor: '#4A7AB8',
      ios: {
        supportsTablet: false,
        bundleIdentifier: 'com.br.ucorvoulobo.lab',
        appleTeamId: process.env.EXPO_APPLE_TEAM_ID,
        config: {
          usesNonExemptEncryption: false,
        },
        icon: IOS_ICON_FILE,
        infoPlist: {
          CADisableMinimumFrameDurationOnPhone: true,
          UIBackgroundModes: ['remote-notification'],
          NSUserActivityTypes: ['INSendMessageIntent'],
          NSCameraUsageDescription:
            'Used for profile pictures, posts, and other kinds of content.',
          NSMicrophoneUsageDescription:
            'Used for posts and other kinds of content.',
          NSPhotoLibraryAddUsageDescription:
            'Used to save images to your library.',
          NSPhotoLibraryUsageDescription:
            'Used for profile pictures, posts, and other kinds of content',
          CFBundleSpokenName: 'u e u',
          CFBundleLocalizations: [
            'en',
            'an',
            'ast',
            'ca',
            'cs',
            'cy',
            'da',
            'de',
            'el',
            'eo',
            'es',
            'eu',
            'fi',
            'fr',
            'fy',
            'ga',
            'gd',
            'gl',
            'hi',
            'hu',
            'ia',
            'id',
            'it',
            'ja',
            'km',
            'ko',
            'ne',
            'nl',
            'pl',
            'pt-BR',
            'pt-PT',
            'ro',
            'ru',
            'sv',
            'th',
            'tr',
            'uk',
            'vi',
            'yue',
            'zh-Hans',
            'zh-Hant',
          ],
        },
        associatedDomains: ASSOCIATED_DOMAINS,
        entitlements: {
          'com.apple.developer.kernel.increased-memory-limit': true,
          'com.apple.developer.kernel.extended-virtual-addressing': true,
          'com.apple.security.application-groups': 'group.app.bsky',
          'com.apple.developer.usernotifications.communication': true,
          // 'com.apple.developer.device-information.user-assigned-device-name': true,
          'com.apple.developer.declared-age-range': true,
        },
        privacyManifests: {
          NSPrivacyCollectedDataTypes: [
            {
              NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeCrashData',
              NSPrivacyCollectedDataTypeLinked: false,
              NSPrivacyCollectedDataTypeTracking: false,
              NSPrivacyCollectedDataTypePurposes: [
                'NSPrivacyCollectedDataTypePurposeAppFunctionality',
              ],
            },
            {
              NSPrivacyCollectedDataType:
                'NSPrivacyCollectedDataTypePerformanceData',
              NSPrivacyCollectedDataTypeLinked: false,
              NSPrivacyCollectedDataTypeTracking: false,
              NSPrivacyCollectedDataTypePurposes: [
                'NSPrivacyCollectedDataTypePurposeAppFunctionality',
              ],
            },
            {
              NSPrivacyCollectedDataType:
                'NSPrivacyCollectedDataTypeOtherDiagnosticData',
              NSPrivacyCollectedDataTypeLinked: false,
              NSPrivacyCollectedDataTypeTracking: false,
              NSPrivacyCollectedDataTypePurposes: [
                'NSPrivacyCollectedDataTypePurposeAppFunctionality',
              ],
            },
          ],
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
      },
      android: {
        icon: './assets/app-icons/uu_icon.png',
        adaptiveIcon: {
          // TODO: swap for a proper cutout/silhouette pair once we commit to this icon
          foregroundImage: './assets/app-icons/uu_icon.png',
          monochromeImage: './assets/app-icons/uu_icon.png',
          backgroundColor: '#4A7AB8',
        },
        package: 'com.br.ucorvoulobo.lab',
        intentFilters: [
          {
            action: 'VIEW',
            autoVerify: true,
            data: [
              {
                scheme: 'https',
                host: 'bsky.app',
              },
              ...(IS_DEV
                ? [
                    {
                      scheme: 'http',
                      host: 'localhost:19006',
                    },
                  ]
                : []),
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
      },
      plugins: [
        [
          'expo-dev-client',
          {
            toolsButton: false,
            ...(IS_E2E
              ? {
                  launchMode: 'most-recent',
                  skipOnboarding: true,
                  showMenuAtLaunch: false,
                  ios: {
                    defaultLaunchURL: 'http://localhost:8081',
                  },
                  android: {
                    defaultLaunchURL: 'http://10.0.2.2:8081',
                  },
                }
              : {}),
          },
        ],
        'expo-video',
        'expo-localization',
        'expo-web-browser',
        [
          'react-native-edge-to-edge',
          {android: {enforceNavigationBarContrast: false}},
        ],
        ...(USE_SENTRY
          ? [
              /** @type {[string, any]} */ ([
                '@sentry/react-native/expo',
                {
                  organization: 'blueskyweb',
                  project: 'app',
                  url: 'https://sentry.io',
                },
              ]),
            ]
          : []),
        [
          'expo-build-properties',
          {
            ios: {
              deploymentTarget: '16.4',
              buildReactNativeFromSource: true,
              ccacheEnabled: IS_DEV,
              cxxLanguageStandard: 'c++23',
              extraPods: [
                {
                  name: 'MCEmojiPicker',
                  git: 'https://github.com/bluesky-social/MCEmojiPicker.git',
                  branch: 'main',
                },
              ],
            },
            android: {
              compileSdkVersion: 36,
              targetSdkVersion: 36,
              buildToolsVersion: '36.0.0',
              buildReactNativeFromSource: IS_PRODUCTION,
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
        [
          '@bitdrift/react-native',
          {
            networkInstrumentation: true,
          },
        ],
        './plugins/starterPackAppClipExtension/withStarterPackAppClip.js',
        './plugins/withGradleJVMHeapSizeIncrease.js',
        './plugins/withAndroidManifestLargeHeapPlugin.js',
        './plugins/withAndroidManifestFCMIconPlugin.js',
        './plugins/withAndroidManifestIntentQueriesPlugin.js',
        './plugins/withAndroidStylesAccentColorPlugin.js',
        './plugins/withAndroidNoJitpackPlugin.js',
        './plugins/shareExtension/withShareExtensions.js',
        './plugins/notificationsExtension/withNotificationsExtension.js',
        [
          'expo-font',
          {
            fonts: [
              './assets/fonts/inter/InterVariable.woff2',
              './assets/fonts/inter/InterVariable-Italic.woff2',
              // Android only
              './assets/fonts/inter/Inter-Regular.otf',
              './assets/fonts/inter/Inter-Italic.otf',
              './assets/fonts/inter/Inter-Medium.otf',
              './assets/fonts/inter/Inter-MediumItalic.otf',
              './assets/fonts/inter/Inter-SemiBold.otf',
              './assets/fonts/inter/Inter-SemiBoldItalic.otf',
              './assets/fonts/inter/Inter-Bold.otf',
              './assets/fonts/inter/Inter-BoldItalic.otf',
            ],
          },
        ],
        [
          'expo-splash-screen',
          {
            // u&u Lab rebrand: reusing u&u's own full-bleed splash treatment;
            // no dark-mode variant exists yet, so light/dark share one image.
            ios: {
              enableFullScreenImage_legacy: true, // iOS only
              backgroundColor: '#F5EFE2',
              image: './assets/splash/uu-splash.png',
              resizeMode: 'cover',
              dark: {
                enableFullScreenImage_legacy: true, // iOS only
                backgroundColor: '#F5EFE2',
                image: './assets/splash/uu-splash.png',
                resizeMode: 'cover',
              },
            },
            android: {
              // Android's native splash API has no full-bleed mode (iOS-only,
              // hence "_legacy" above) - it always centers a fixed-size image
              // on a flat background, so this uses the app icon, not the
              // full splash composition used for iOS.
              backgroundColor: '#F5EFE2',
              image: './assets/app-icons/uu_icon.png',
              imageWidth: 172,
              dark: {
                backgroundColor: '#F5EFE2',
                image: './assets/app-icons/uu_icon.png',
                imageWidth: 172,
              },
            },
          },
        ],
        [
          '@bsky.app/expo-dynamic-app-icon',
          {
            /**
             * Default set
             */
            default_light: {
              ios: './assets/app-icons/ios_icon_legacy_light.png',
              android: './assets/app-icons/android_icon_legacy_light.png',
              prerendered: true,
            },
            default_dark: {
              ios: './assets/app-icons/ios_icon_legacy_dark.png',
              android: './assets/app-icons/android_icon_legacy_dark.png',
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
        ['expo-screen-orientation', {initialOrientation: 'PORTRAIT_UP'}],
        ['expo-location'],
        [
          'expo-contacts',
          {
            contactsPermission:
              'I agree to allow Bluesky to use my contacts for friend discovery until I opt out.',
          },
        ],
      ],
      extra: {
        eas: {
          build: {
            experimental: {
              ios: {
                appExtensions: [
                  {
                    targetName: 'Share-with-Bluesky',
                    bundleIdentifier: 'com.br.ucorvoulobo.lab.Share-with-Bluesky',
                    entitlements: {
                      'com.apple.security.application-groups': [
                        'group.com.br.ucorvoulobo.lab',
                      ],
                    },
                  },
                  {
                    targetName: 'BlueskyNSE',
                    bundleIdentifier: 'com.br.ucorvoulobo.lab.BlueskyNSE',
                    entitlements: {
                      'com.apple.security.application-groups': [
                        'group.com.br.ucorvoulobo.lab',
                      ],
                    },
                  },
                  {
                    targetName: 'BlueskyClip',
                    bundleIdentifier: 'com.br.ucorvoulobo.lab.AppClip',
                  },
                ],
              },
            },
          },
          // Assigned by `eas init` under your own Expo account - the old
          // value pointed at Bluesky's own EAS project.
          projectId: 'd8bffd3c-a711-4d07-9d5f-046084281b3a',

        },
      },
    },
  }
}
