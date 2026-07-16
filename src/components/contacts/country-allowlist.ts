import {type CountryCode} from '#/lib/international-telephone-codes'
import {IS_DEV} from '#/env'

const FIND_CONTACTS_FEATURE_COUNTRY_ALLOWLIST = [
  'US',
  'GB',
  'JP',
  'CA',
  'DE',
  'FR',
  'ES',
  'BR',
  'KR',
  'NL',
  'AU',
  'SE',
  'IT',
] satisfies CountryCode[] as string[]

export function isFindContactsFeatureEnabled(countryCode?: string): boolean {
  if (IS_DEV) return true

  /*
   * This should never happen unless geolocation fails entirely. In that
   * case, let the user try, since it should work as long as they have a
   * phone number from one of the allow-listed countries.
   */
  if (!countryCode) return true

  return FIND_CONTACTS_FEATURE_COUNTRY_ALLOWLIST.includes(
    countryCode.toUpperCase(),
  )
}

export function useIsFindContactsFeatureEnabledBasedOnGeolocation() {
  // Blacksky: the Find Contacts feature is disabled (made unreachable). This
  // hook gates every entry point (Settings row, onboarding step, followers
  // promo) and the two deep-linkable screens redirect Home when it is false.
  // The underlying flow/screen/service code is intentionally left in place;
  // to re-enable, restore `return isFindContactsFeatureEnabled(undefined)`.
  // See Design/social-app-bluesky-debranding-audit.md.
  return false
}
