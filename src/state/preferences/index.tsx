import React from 'react'
import {Provider as LanguagesProvider} from './languages'
import {Provider as AltTextRequiredProvider} from '../preferences/alt-text-required'

export {useLanguagePrefs, useSetLanguagePrefs} from './languages'
export {
  useRequireAltTextEnabled,
  useSetRequireAltTextEnabled,
} from './alt-text-required'

export function Provider({children}: React.PropsWithChildren<{}>) {
  return (
    <LanguagesProvider>
      <AltTextRequiredProvider>{children}</AltTextRequiredProvider>
    </LanguagesProvider>
  )
}
