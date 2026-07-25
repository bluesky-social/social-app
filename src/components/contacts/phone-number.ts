import {t} from '@lingui/core/macro'
import {
  isSupportedCountry,
  ParseError,
  parsePhoneNumber,
  parsePhoneNumberWithError,
  type PhoneNumber,
} from 'libphonenumber-js/max'

import {type CountryCode} from '#/lib/international-telephone-codes'

/**
 * Intended for after the user has finished inputting their phone number.
 */
export function processPhoneNumber(
  number: string,
  country: CountryCode,
):
  | {
      valid: true
      formatted: string
      countryCode: CountryCode
    }
  | {
      valid: false
      reason?: string
    } {
  try {
    const phoneNumber = parsePhoneNumberWithError(number, {
      defaultCountry: country,
    })
    if (!phoneNumber.isValid()) {
      return {valid: false, reason: t`Invalid phone number`}
    }
    const type = phoneNumber.getType()
    if (
      type !== 'MOBILE' &&
      type !== 'FIXED_LINE_OR_MOBILE' &&
      type !== 'PERSONAL_NUMBER'
    ) {
      return {
        valid: false,
        reason: t`Number should be a mobile number`,
      }
    }
    let countryCode = country
    if (phoneNumber.country && phoneNumber.country !== country) {
      if (phoneNumber.country === 'AC' || phoneNumber.country === 'TA') {
        countryCode = 'SH'
      } else {
        countryCode = phoneNumber.country
      }
    }
    return {
      valid: true,
      formatted: formatE164lWithoutCountryCode(phoneNumber),
      countryCode,
    }
  } catch (error) {
    if (error instanceof ParseError) {
      return {valid: false, reason: error.message}
    } else {
      return {valid: false}
    }
  }
}

/**
 * Format a phone number as the international format with the prefix
 * removed.
 */
function formatE164lWithoutCountryCode(phoneNumber: PhoneNumber) {
  const intl = phoneNumber.format('E.164')
  const prefix = '+' + phoneNumber.countryCallingCode
  return intl.replace(prefix, '').trim()
}

/**
 * Takes a country code and a prefix-less phone number and constructs a full phone number.
 *
 * Does not have nice error handling - if you're unsure if the number is valid, use
 * `processPhoneNumber` instead
 */
export function constructFullPhoneNumber(
  countryCode: CountryCode,
  phoneNumber: string,
) {
  const result = parsePhoneNumber(phoneNumber, {defaultCountry: countryCode})
  if (!result.isValid())
    throw new Error('Invalid phone number passed to constructFullPhoneNumber')
  return result.format('E.164')
}

/**
 * Takes a phone number and applies human-readable formatting. Do not sent to the API - they
 * expect E.164 format.
 */
export function prettyPhoneNumber(phoneNumber: string) {
  const result = parsePhoneNumber(phoneNumber)
  return result.formatNational()
}

/**
 * Attempts to parse a phone number from a string, and returns the country code
 * and the rest of the number if possible. If the number is invalid, returns undefined.
 */
export function getCountryCodeFromPastedNumber(
  text: string,
): {countryCode: CountryCode; rest: string} | undefined {
  try {
    const phoneNumber = parsePhoneNumber(text)
    if (!phoneNumber.isValid()) {
      return undefined
    }
    const countryCode = phoneNumber.country
    // we don't have AC and TA in our dropdown - see `#/lib/international-telephone-codes`
    if (countryCode && countryCode !== 'AC' && countryCode !== 'TA') {
      return {
        countryCode,
        rest: formatE164lWithoutCountryCode(phoneNumber),
      }
    } else {
      return undefined
    }
  } catch (error) {
    return undefined
  }
}

/**
 * Normalizes a phone number into E.164 format
 */
export function normalizePhoneNumber(
  rawNumber: string,
  countryCode: string | undefined,
  fallbackCountryCode: CountryCode,
): string | null {
  try {
    const result = parsePhoneNumber(rawNumber, {
      defaultCountry:
        countryCode && isSupportedCountry(countryCode)
          ? countryCode
          : fallbackCountryCode,
    })

    if (!result.isValid()) return null

    const type = result.getType()
    if (
      type !== 'MOBILE' &&
      type !== 'FIXED_LINE_OR_MOBILE' &&
      type !== 'PERSONAL_NUMBER'
    ) {
      return null
    }

    return result.format('E.164')
  } catch (error) {
    console.log('Failed to normalize phone number:', error)
    return null
  }
}
