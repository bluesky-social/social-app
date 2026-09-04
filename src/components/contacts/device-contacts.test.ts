import {Contact} from 'expo-contacts'
import {describe, expect, it, jest} from '@jest/globals'

import {contactsWithPhoneNumbersOnly, normalizeContactBook} from './contacts'
import {type DeviceContact, getDeviceContacts} from './device-contacts'

jest.mock('expo-contacts', () => ({
  Contact: {
    getAllDetails: jest.fn(),
  },
  ContactField: {
    FULL_NAME: 'fullName',
    GIVEN_NAME: 'givenName',
    FAMILY_NAME: 'familyName',
    COMPANY: 'company',
    PHONES: 'phones',
    IMAGE: 'image',
  },
}))

describe('getDeviceContacts', () => {
  it('gets the contact fields needed for imports using the class API', async () => {
    const contact = {
      id: 'contact-1',
      fullName: 'Alice Example',
      givenName: 'Alice',
      familyName: 'Example',
      company: null,
      phones: [{id: 'phone-1', number: '+1 234 567 890'}],
      image: 'file:///contact.jpg',
    } satisfies DeviceContact
    jest.mocked(Contact.getAllDetails).mockResolvedValue([contact])

    await expect(getDeviceContacts()).resolves.toEqual([contact])
    expect(Contact.getAllDetails).toHaveBeenCalledWith([
      'fullName',
      'givenName',
      'familyName',
      'company',
      'phones',
      'image',
    ])
  })
})

describe('new contact shape', () => {
  it('keeps people with phone numbers and filters empty and business contacts', () => {
    const person = createContact({
      id: 'person',
      givenName: 'Alice',
      company: 'Bluesky',
    })

    expect(
      contactsWithPhoneNumbersOnly([
        createContact({id: 'no-phone', phones: []}),
        createContact({
          id: 'business',
          fullName: 'Business Inc.',
          company: 'Business Inc.',
        }),
        person,
      ]),
    ).toEqual([person])
  })

  it('normalizes phone numbers from the new phones field', () => {
    const {phoneNumbers, indexToContactId} = normalizeContactBook(
      [createContact({id: 'person'})],
      'US',
      '+14155550000',
    )

    expect(phoneNumbers).toEqual(['+14155552671'])
    expect(indexToContactId.get(0)).toBe('person')
  })
})

function createContact(overrides: Partial<DeviceContact> = {}): DeviceContact {
  return {
    id: 'contact-1',
    fullName: null,
    givenName: null,
    familyName: null,
    company: null,
    phones: [{id: 'phone-1', number: '+1 415 555 2671'}],
    image: null,
    ...overrides,
  }
}
