import {type AppBskyContactDefs} from '@atproto/api'

import {type CountryCode} from '#/lib/international-telephone-codes'
import {normalizePhoneNumber} from './phone-number'
import {type Contact, type Match} from './state'

/**
 * Filters out contacts that do not have any associated phone numbers,
 * as well as businesses
 */
export function contactsWithPhoneNumbersOnly(contacts: Contact[]) {
  return contacts.filter(
    contact =>
      contact.phoneNumbers &&
      contact.phoneNumbers.length > 0 &&
      contact.contactType !== 'company',
  )
}

/**
 * Takes the raw contact book and returns a plain list of numbers in E.164 format, along
 * with a mapping to retrieve the contact ID when we get the results back.
 *
 * `countryCode` is used as a fallback for local numbers that don't have a country code associated with them.
 * I'm making the assumption that most local numbers in someone's phone book will be the same as theirs.
 */
export function normalizeContactBook(
  contacts: Contact[],
  countryCode: CountryCode,
  ownNumber: string,
): {
  phoneNumbers: string[]
  indexToContactId: Map<number, Contact['id']>
} {
  const phoneNumbers: string[] = []
  const indexToContactId = new Map<number, Contact['id']>()

  for (const contact of contacts) {
    for (const number of contact.phoneNumbers ?? []) {
      let rawNumber: string

      if (number.number) {
        rawNumber = number.number
      } else if (number.digits) {
        rawNumber = number.digits
      } else {
        continue
      }

      const normalized = normalizePhoneNumber(
        rawNumber,
        number.countryCode,
        countryCode,
      )
      if (normalized === null) continue

      // skip if it's your own number
      if (normalized === ownNumber) continue

      phoneNumbers.push(normalized)
      indexToContactId.set(phoneNumbers.length - 1, contact.id)
    }
  }

  return {
    phoneNumbers,
    indexToContactId,
  }
}

export function filterMatchedNumbers(
  contacts: Contact[],
  results: AppBskyContactDefs.MatchAndContactIndex[],
  mapping: Map<number, Contact['id']>,
) {
  const filteredIds = new Set<Contact['id']>()

  for (const result of results) {
    const id = mapping.get(result.contactIndex)
    if (id !== undefined) {
      filteredIds.add(id)
    }
  }

  return contacts.filter(contact => !filteredIds.has(contact.id))
}

export function getMatchedContacts(
  contacts: Contact[],
  results: AppBskyContactDefs.MatchAndContactIndex[],
  mapping: Map<number, Contact['id']>,
): Array<Match> {
  const contactsById = new Map(contacts.map(c => [c.id, c]))

  return results.map(result => {
    const id = mapping.get(result.contactIndex)
    const contact = id !== undefined ? contactsById.get(id) : undefined
    return {profile: result.match, contact}
  })
}
