import {type CountryCode} from '#/lib/international-telephone-codes'
import {type app} from '#/lexicons'
import {type DeviceContact} from './device-contacts'
import {normalizePhoneNumber} from './phone-number'
import {type Match} from './state'

/**
 * Filters out contacts that do not have any associated phone numbers,
 * as well as businesses
 */
export function contactsWithPhoneNumbersOnly(contacts: DeviceContact[]) {
  return contacts.filter(
    contact =>
      contact.phones.length > 0 &&
      (!contact.company || contact.givenName || contact.familyName),
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
  contacts: DeviceContact[],
  countryCode: CountryCode,
  ownNumber: string,
): {
  phoneNumbers: string[]
  indexToContactId: Map<number, DeviceContact['id']>
} {
  const phoneNumbers: string[] = []
  const indexToContactId = new Map<number, DeviceContact['id']>()

  for (const contact of contacts) {
    for (const number of contact.phones) {
      if (!number.number) continue

      const normalized = normalizePhoneNumber(
        number.number,
        undefined,
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
  contacts: DeviceContact[],
  results: app.bsky.contact.defs.MatchAndContactIndex[],
  mapping: Map<number, DeviceContact['id']>,
) {
  const filteredIds = new Set<DeviceContact['id']>()

  for (const result of results) {
    const id = mapping.get(result.contactIndex)
    if (id !== undefined) {
      filteredIds.add(id)
    }
  }

  return contacts.filter(contact => !filteredIds.has(contact.id))
}

export function getMatchedContacts(
  contacts: DeviceContact[],
  results: app.bsky.contact.defs.MatchAndContactIndex[],
  mapping: Map<number, DeviceContact['id']>,
): Array<Match> {
  const contactsById = new Map(contacts.map(c => [c.id, c]))

  return results.map(result => {
    const id = mapping.get(result.contactIndex)
    const contact = id !== undefined ? contactsById.get(id) : undefined
    return {profile: result.match, contact}
  })
}
