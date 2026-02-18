import React from 'react'

import {type AppLanguage} from '#/locale/languages'
import * as persisted from '#/state/persisted'
import {AnalyticsContext, utils} from '#/analytics'

type SetStateCb = (
  s: persisted.Schema['languagePrefs'],
) => persisted.Schema['languagePrefs']
type StateContext = persisted.Schema['languagePrefs']
type ApiContext = {
  setPrimaryLanguage: (code2: string) => void
  setPostLanguage: (commaSeparatedLangCodes: string) => void
  setContentLanguages: (code2s: string[]) => void
  savePostLanguageToHistory: () => void
  setAppLanguage: (code2: AppLanguage) => void
}

const stateContext = React.createContext<StateContext>(
  persisted.defaults.languagePrefs,
)
stateContext.displayName = 'LanguagePrefsStateContext'
const apiContext = React.createContext<ApiContext>({
  setPrimaryLanguage: (_: string) => {},
  setPostLanguage: (_: string) => {},
  setContentLanguages: (_: string[]) => {},
  savePostLanguageToHistory: () => {},
  setAppLanguage: (_: AppLanguage) => {},
})
apiContext.displayName = 'LanguagePrefsApiContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(() => persisted.get('languagePrefs'))

  const setStateWrapped = React.useCallback(
    (fn: SetStateCb) => {
      const s = fn(persisted.get('languagePrefs'))
      setState(s)
      persisted.write('languagePrefs', s)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate('languagePrefs', nextLanguagePrefs => {
      setState(nextLanguagePrefs)
    })
  }, [setStateWrapped])

  const api = React.useMemo(
    () => ({
      setPrimaryLanguage(code2: string) {
        setStateWrapped(s => ({...s, primaryLanguage: code2}))
      },
      setPostLanguage(commaSeparatedLangCodes: string) {
        setStateWrapped(s => ({...s, postLanguage: commaSeparatedLangCodes}))
      },
      setContentLanguages(code2s: string[]) {
        setStateWrapped(s => ({...s, contentLanguages: code2s}))
      },
      /**
       * Saves whatever language codes are currently selected into a history array,
       * which is then used to populate the language selector menu.
       */
      savePostLanguageToHistory() {
        // filter out duplicate `this.postLanguage` if exists, and prepend
        // value to start of array
        setStateWrapped(s => ({
          ...s,
          postLanguageHistory: [s.postLanguage]
            .concat(
              s.postLanguageHistory.filter(
                commaSeparatedLangCodes =>
                  commaSeparatedLangCodes !== s.postLanguage,
              ),
            )
            .slice(0, 6),
        }))
      },
      setAppLanguage(code2: AppLanguage) {
        setStateWrapped(s => ({...s, appLanguage: code2}))
      },
    }),
    [setStateWrapped],
  )

  return (
    <stateContext.Provider value={state}>
      <apiContext.Provider value={api}>
        <AnalyticsContext
          metadata={utils.useMeta({
            preferences: {
              appLanguage: state.appLanguage,
              contentLanguages: state.contentLanguages,
            },
          })}>
          {children}
        </AnalyticsContext>
      </apiContext.Provider>
    </stateContext.Provider>
  )
}

export function useLanguagePrefs() {
  return React.useContext(stateContext)
}

export function useLanguagePrefsApi() {
  return React.useContext(apiContext)
}

export function getContentLanguages() {
  return persisted.get('languagePrefs').contentLanguages
}

/**
 * Be careful with this. It's used for the PWI home screen so that users can
 * select a UI language and have it apply to the fetched Discover feed.
 *
 * We only support BCP-47 two-letter codes here, hence the split.
 */
export function getAppLanguageAsContentLanguage() {
  return persisted.get('languagePrefs').appLanguage.split('-')[0]
}

export function toPostLanguages(postLanguage: string): string[] {
  // filter out empty strings if exist
  return postLanguage.split(',').filter(Boolean)
}

export function fromPostLanguages(languages: string[]): string {
  return languages.filter(Boolean).join(',')
}

export function hasPostLanguage(postLanguage: string, code2: string): boolean {
  return toPostLanguages(postLanguage).includes(code2)
}
