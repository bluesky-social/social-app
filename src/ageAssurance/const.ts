import {
  ageAssuranceRuleIDs as ids,
  type AppBskyAgeassuranceDefs,
} from '@atproto/api'

import {AgeAssuranceAccess} from '#/ageAssurance/types'
import {ANDROID_API_LEVEL, IOS_MAJOR_VERSION, IS_ANDROID, IS_IOS} from '#/env'

/**
 * Minimum age required to access the app at all.
 */
export const MIN_ACCESS_AGE = 13

/**
 * Whether the current device can provide the native on-device age signals we
 * use for age assurance (via `expo-age-range`). We gate on OS version because
 * the underlying platform APIs are only available on:
 *
 * - iOS 26.0+ (Declared Age Range API)
 *   https://developer.apple.com/documentation/declaredagerange/
 * - Android 6.0 / API level 23+ (Play Age Signals API)
 *   https://developer.android.com/google/play/age-signals/use-age-signals-api
 *
 * On unsupported platforms/versions (including web) this is `false`, so we skip
 * the device flow and fall back to KWS.
 */
export const DEVICE_SIGNALS_SUPPORTED: boolean =
  (IS_IOS && IOS_MAJOR_VERSION >= 26) || (IS_ANDROID && ANDROID_API_LEVEL >= 23)

export const FALLBACK_REGION_CONFIG: AppBskyAgeassuranceDefs.ConfigRegion = {
  countryCode: '*',
  regionCode: undefined,
  minAccessAge: MIN_ACCESS_AGE,
  rules: [
    {
      $type: ids.IfDeclaredOverAge,
      age: MIN_ACCESS_AGE,
      access: AgeAssuranceAccess.Full,
    },
    {
      $type: ids.Default,
      access: AgeAssuranceAccess.None,
    },
  ],
}
