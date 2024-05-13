import React from 'react'

import {DmServiceUrlProvider} from '#/screens/Messages/Temp/useDmServiceUrlStorage'
import {Provider as AltTextRequiredProvider} from './alt-text-required'
import {Provider as AutoplayProvider} from './autoplay'
import {Provider as DisableHapticsProvider} from './disable-haptics'
import {Provider as ExternalEmbedsProvider} from './external-embeds-prefs'
import {Provider as HiddenPostsProvider} from './hidden-posts'
import {Provider as InAppBrowserProvider} from './in-app-browser'
import {Provider as KawaiiProvider} from './kawaii'
import {Provider as LanguagesProvider} from './languages'

export {
  useRequireAltTextEnabled,
  useSetRequireAltTextEnabled,
} from './alt-text-required'
export {useAutoplayDisabled, useSetAutoplayDisabled} from './autoplay'
export {useHapticsDisabled, useSetHapticsDisabled} from './disable-haptics'
export {
  useExternalEmbedsPrefs,
  useSetExternalEmbedPref,
} from './external-embeds-prefs'
export * from './hidden-posts'
export {useLabelDefinitions} from './label-defs'
export {useLanguagePrefs, useLanguagePrefsApi} from './languages'

export function Provider({children}: React.PropsWithChildren<{}>) {
  return (
    <LanguagesProvider>
      <AltTextRequiredProvider>
        <ExternalEmbedsProvider>
          <HiddenPostsProvider>
            <InAppBrowserProvider>
              <DisableHapticsProvider>
                <AutoplayProvider>
                  <DmServiceUrlProvider>
                    <KawaiiProvider>{children}</KawaiiProvider>
                  </DmServiceUrlProvider>
                </AutoplayProvider>
              </DisableHapticsProvider>
            </InAppBrowserProvider>
          </HiddenPostsProvider>
        </ExternalEmbedsProvider>
      </AltTextRequiredProvider>
    </LanguagesProvider>
  )
}
