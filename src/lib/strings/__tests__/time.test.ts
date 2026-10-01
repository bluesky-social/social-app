import {getCalendars} from 'expo-localization'
import {setupI18n} from '@lingui/core'

import {formatDateTime} from '../time'

const i18n = setupI18n()
i18n.loadAndActivate({locale: 'en-US', messages: {}})
const date = new Date('2026-05-29T14:54:00Z')
const options: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
}

describe('formatDateTime', () => {
  const getCalendarsMock = jest.mocked(getCalendars)

  it('uses 24-hour time when the device does', () => {
    getCalendarsMock.mockReturnValue([
      {uses24hourClock: true} as ReturnType<typeof getCalendars>[number],
    ])

    expect(formatDateTime(i18n, date, options)).toBe('14:54')
  })

  it('uses 12-hour time when the device does', () => {
    getCalendarsMock.mockReturnValue([
      {uses24hourClock: false} as ReturnType<typeof getCalendars>[number],
    ])

    const formatted = formatDateTime(i18n, date, options)
    expect(formatted).toContain('2:54')
    expect(formatted).toContain('PM')
  })

  it('falls back to the locale when the device preference is unavailable', () => {
    getCalendarsMock.mockReturnValue([
      {uses24hourClock: null} as ReturnType<typeof getCalendars>[number],
    ])

    expect(formatDateTime(i18n, date, options)).toContain('PM')
  })
})
