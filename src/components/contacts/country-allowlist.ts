import {type CountryCode} from '#/lib/international-telephone-codes'
import {IS_DEV} from '#/env'
import {useGeolocation} from '#/geolocation'

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

export function isFindContactsFeatureEnabled(countryCode: string): boolean {
  return FIND_CONTACTS_FEATURE_COUNTRY_ALLOWLIST.includes(
    countryCode.toUpperCase(),
  )
}

export function useIsFindContactsFeatureEnabledBasedOnGeolocation() {
  const location = useGeolocation()

  if (IS_DEV) return true

  // they can try, by they'll need a phone number
  // from one of the allowlisted countries
  if (!location.countryCode) return true

  return isFindContactsFeatureEnabled(location.countryCode)
}
