import {DateTimeFormat} from '@formatjs/intl-datetimeformat'
import {I18n} from '@lingui/core'

/**
 * Formats the given date into a localized string.
 *
 * This function chooses different formatting approaches based on the platform:
 * - On Web, it uses the `i18n.date` method to format the date.
 * - On Native, it adjusts the time zone offset and uses `DateTimeFormat` for formatting.
 *
 */

export function niceDate(i18n: I18n, date: number | string | Date) {
  const d = new Date(date)

  const timeZoneOffsetInMinutes = new Date().getTimezoneOffset()
  d.setMinutes(d.getMinutes() - timeZoneOffsetInMinutes)

  const dateFormatter = new DateTimeFormat(i18n.locale, {
    dateStyle: 'long',
    timeStyle: 'short',
  })
  return dateFormatter.format(d)
}
