import React from 'react'
import {Provider as LanguagesProvider} from './languages'
import {Provider as AltTextRequiredProvider} from '../preferences/alt-text-required'
import {Provider as HiddenPostsProvider} from '../preferences/hidden-posts'

export {useLanguagePrefs, useLanguagePrefsApi} from './languages'
export {
  useRequireAltTextEnabled,
  useSetRequireAltTextEnabled,
} from './alt-text-required'
export * from './hidden-posts'

export function Provider({children}: React.PropsWithChildren<{}>) {
  return (
    <LanguagesProvider>
      <AltTextRequiredProvider>
        <HiddenPostsProvider>{children}</HiddenPostsProvider>
      </AltTextRequiredProvider>
    </LanguagesProvider>
  )
}
