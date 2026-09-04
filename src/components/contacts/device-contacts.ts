import * as Contacts from 'expo-contacts'

const CONTACT_FIELDS = [
  Contacts.ContactField.FULL_NAME,
  Contacts.ContactField.GIVEN_NAME,
  Contacts.ContactField.FAMILY_NAME,
  Contacts.ContactField.COMPANY,
  Contacts.ContactField.PHONES,
  Contacts.ContactField.IMAGE,
] as const

export type DeviceContact = Contacts.PartialContactDetails<
  typeof CONTACT_FIELDS
>

export function getDeviceContacts() {
  return Contacts.Contact.getAllDetails(CONTACT_FIELDS)
}
