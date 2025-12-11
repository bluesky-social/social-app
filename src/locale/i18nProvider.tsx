import {createContext, useContext} from 'react'
import {i18n} from '@lingui/core'
import {I18nProvider as DefaultI18nProvider} from '@lingui/react'
import {type Locale} from 'date-fns'
import type React from 'react'

import {useLocaleLanguage} from './i18n'

const DateLocaleContext = createContext<Locale | undefined>(undefined)
DateLocaleContext.displayName = 'DateLocaleContext'

export default function I18nProvider({children}: {children: React.ReactNode}) {
  const dateLocale = useLocaleLanguage()
  return (
    <DateLocaleContext value={dateLocale}>
      <DefaultI18nProvider i18n={i18n}>{children}</DefaultI18nProvider>
    </DateLocaleContext>
  )
}

/**
 * Returns a `date-fns` locale corresponding to the current app language
 */
export function useDateLocale() {
  const ctx = useContext(DateLocaleContext)

  if (!ctx) {
    throw new Error('useDateLocale must be used within an I18nProvider')
  }

  return ctx
}
