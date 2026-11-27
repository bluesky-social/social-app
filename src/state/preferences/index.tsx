import {Provider as ExternalEmbedsProvider} from './external-embeds-prefs'
import {Provider as HiddenPostsProvider} from './hidden-posts'
import {Provider as KawaiiProvider} from './kawaii'
import {Provider as LanguagesProvider} from './languages'
import {Provider as SimplePrefsProvider} from './simple-prefs'
import {Provider as TrendingSettingsProvider} from './trending'

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
export {useHiddenPosts, useHiddenPostsApi} from './hidden-posts'
export {useLabelDefinitions} from './label-defs'
export {useLanguagePrefs, useLanguagePrefsApi} from './languages'
export {useSetSubtitlesEnabled, useSubtitlesEnabled} from './subtitles'

export function Provider({children}: React.PropsWithChildren<{}>) {
  return (
    <LanguagesProvider>
      <SimplePrefsProvider>
        <ExternalEmbedsProvider>
          <HiddenPostsProvider>
            <TrendingSettingsProvider>
              <KawaiiProvider>{children}</KawaiiProvider>
            </TrendingSettingsProvider>
          </HiddenPostsProvider>
        </ExternalEmbedsProvider>
      </SimplePrefsProvider>
    </LanguagesProvider>
  )
}
