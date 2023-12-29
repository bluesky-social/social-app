import React from 'react'
import {Provider as LanguagesProvider} from './languages'
import {Provider as AltTextRequiredProvider} from '../preferences/alt-text-required'
import {Provider as HiddenPostsProvider} from '../preferences/hidden-posts'
import {Provider as ExternalSourcesProvider} from '../preferences/external-sources'

export {useLanguagePrefs, useLanguagePrefsApi} from './languages'
export {
  useRequireAltTextEnabled,
  useSetRequireAltTextEnabled,
} from './alt-text-required'
export {useExternalSources, useSetExternalSource} from './external-sources'
export * from './hidden-posts'

export function Provider({children}: React.PropsWithChildren<{}>) {
  return (
    <LanguagesProvider>
      <AltTextRequiredProvider>
        <ExternalSourcesProvider>
          <HiddenPostsProvider>{children}</HiddenPostsProvider>
        </ExternalSourcesProvider>
      </AltTextRequiredProvider>
    </LanguagesProvider>
  )
}
