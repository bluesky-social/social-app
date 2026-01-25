import { normalizePhoneNumber } from './phone-number';
/**
 * Filters out contacts that do not have any associated phone numbers,
 * as well as businesses
 */
export function contactsWithPhoneNumbersOnly(contacts) {
    return contacts.filter(function (contact) {
        return contact.phoneNumbers &&
            contact.phoneNumbers.length > 0 &&
            contact.contactType !== 'company';
    });
}
/**
 * Takes the raw contact book and returns a plain list of numbers in E.164 format, along
 * with a mapping to retrieve the contact ID when we get the results back.
 *
 * `countryCode` is used as a fallback for local numbers that don't have a country code associated with them.
 * I'm making the assumption that most local numbers in someone's phone book will be the same as theirs.
 */
export function normalizeContactBook(contacts, countryCode, ownNumber) {
    var _a;
    var phoneNumbers = [];
    var indexToContactId = new Map();
    for (var _i = 0, contacts_1 = contacts; _i < contacts_1.length; _i++) {
        var contact = contacts_1[_i];
        for (var _b = 0, _c = (_a = contact.phoneNumbers) !== null && _a !== void 0 ? _a : []; _b < _c.length; _b++) {
            var number = _c[_b];
            var rawNumber = void 0;
            if (number.number) {
                rawNumber = number.number;
            }
            else if (number.digits) {
                rawNumber = number.digits;
            }
            else {
                continue;
            }
            var normalized = normalizePhoneNumber(rawNumber, number.countryCode, countryCode);
            if (normalized === null)
                continue;
            // skip if it's your own number
            if (normalized === ownNumber)
                continue;
            phoneNumbers.push(normalized);
            indexToContactId.set(phoneNumbers.length - 1, contact.id);
        }
    }
    return {
        phoneNumbers: phoneNumbers,
        indexToContactId: indexToContactId,
    };
}
export function filterMatchedNumbers(contacts, results, mapping) {
    var filteredIds = new Set();
    for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
        var result = results_1[_i];
        var id = mapping.get(result.contactIndex);
        if (id !== undefined) {
            filteredIds.add(id);
        }
    }
    return contacts.filter(function (contact) { return !filteredIds.has(contact.id); });
}
export function getMatchedContacts(contacts, results, mapping) {
    var contactsById = new Map(contacts.map(function (c) { return [c.id, c]; }));
    return results.map(function (result) {
        var id = mapping.get(result.contactIndex);
        var contact = id !== undefined ? contactsById.get(id) : undefined;
        return { profile: result.match, contact: contact };
    });
}
