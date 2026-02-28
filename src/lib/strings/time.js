import { msg } from '@lingui/core/macro';
export function niceDate(i18n, date, dateStyle) {
    if (dateStyle === void 0) { dateStyle = 'long'; }
    var d = new Date(date);
    if (dateStyle === 'dot separated') {
        return i18n._(msg({
            context: 'date and time formatted like this: [time] · [date]',
            message: "".concat(i18n.date(d, { timeStyle: 'short' }), " \u00B7 ").concat(i18n.date(d, { dateStyle: 'medium' })),
        }));
    }
    return i18n.date(d, {
        dateStyle: dateStyle,
        timeStyle: 'short',
    });
}
export function getAge(birthDate) {
    var today = new Date();
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}
/**
 * Get a Date object that is N years ago from now
 * @param years number of years
 * @returns Date object
 */
export function getDateAgo(years) {
    var date = new Date();
    date.setFullYear(date.getFullYear() - years);
    return date;
}
/**
 * Compares two dates by year, month, and day only
 */
export function simpleAreDatesEqual(a, b) {
    return (a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate());
}
