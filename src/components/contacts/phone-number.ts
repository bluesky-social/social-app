import {t} from '@lingui/macro'
import {
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
    if (phoneNumber.country !== country) {
      return {
        valid: false,
        reason: t`Country code does not match`,
      }
    }
    return {
      valid: true,
      formatted: formatInternationalWithoutCountryCode(phoneNumber),
    }
  } catch (error) {
    console.log(error)
    if (error instanceof ParseError) {
      return {valid: false, reason: error.message}
    } else {
      return {valid: false}
    }
  }
}

function formatInternationalWithoutCountryCode(phoneNumber: PhoneNumber) {
  const intl = phoneNumber.formatInternational()
  const prefix = '+' + phoneNumber.countryCallingCode
  return intl.replace(prefix, '').trim()
}

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
        rest: formatInternationalWithoutCountryCode(phoneNumber),
      }
    } else {
      return undefined
    }
  } catch (error) {
    return undefined
  }
}
