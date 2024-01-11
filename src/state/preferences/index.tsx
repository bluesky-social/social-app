import React from 'react'
import {Provider as LanguagesProvider} from './languages'
import {Provider as AltTextRequiredProvider} from '../preferences/alt-text-required'
import {Provider as HiddenPostsProvider} from '../preferences/hidden-posts'
import {Provider as ExternalEmbedsProvider} from './external-embeds-prefs'

export {useLanguagePrefs, useLanguagePrefsApi} from './languages'
export {
  useRequireAltTextEnabled,
  useSetRequireAltTextEnabled,
} from './alt-text-required'
export {
  useExternalEmbedsPrefs,
  useSetExternalEmbedPref,
} from './external-embeds-prefs'
export * from './hidden-posts'

export function Provider({children}: React.PropsWithChildren<{}>) {
  return (
    <LanguagesProvider>
      <AltTextRequiredProvider>
        <ExternalEmbedsProvider>
          <HiddenPostsProvider>{children}</HiddenPostsProvider>
        </ExternalEmbedsProvider>
      </AltTextRequiredProvider>
    </LanguagesProvider>
  )
}
