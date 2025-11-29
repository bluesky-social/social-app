import React from 'react'

import {type AppLanguage} from '#/locale/languages'
import * as persisted from '#/state/persisted'

type SetStateCb = (
  s: persisted.Schema['languagePrefs'],
) => persisted.Schema['languagePrefs']
type StateContext = persisted.Schema['languagePrefs']
type ApiContext = {
  setPrimaryLanguage: (code2: string) => void
  setPostLanguage: (commaSeparatedLangCodes: string) => void
  setContentLanguage: (code2: string) => void
  toggleContentLanguage: (code2: string) => void
  togglePostLanguage: (code2: string) => void
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
  setContentLanguage: (_: string) => {},
  toggleContentLanguage: (_: string) => {},
  togglePostLanguage: (_: string) => {},
  savePostLanguageToHistory: () => {},
  setAppLanguage: (_: AppLanguage) => {},
})
apiContext.displayName = 'LanguagePrefsApiContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(persisted.get('languagePrefs'))

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
      setContentLanguage(code2: string) {
        setStateWrapped(s => ({...s, contentLanguages: [code2]}))
      },
      toggleContentLanguage(code2: string) {
        setStateWrapped(s => {
          const exists = s.contentLanguages.includes(code2)
          const next = exists
            ? s.contentLanguages.filter(lang => lang !== code2)
            : s.contentLanguages.concat(code2)
          return {
            ...s,
            contentLanguages: next,
          }
        })
      },
      togglePostLanguage(code2: string) {
        setStateWrapped(s => {
          const exists = hasPostLanguage(state.postLanguage, code2)
          let next = s.postLanguage

          if (exists) {
            next = toPostLanguages(s.postLanguage)
              .filter(lang => lang !== code2)
              .join(',')
          } else {
            // sort alphabetically for deterministic comparison in context menu
            next = toPostLanguages(s.postLanguage)
              .concat([code2])
              .sort((a, b) => a.localeCompare(b))
              .join(',')
          }

          return {
            ...s,
            postLanguage: next,
          }
        })
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
    [state, setStateWrapped],
  )

  return (
    <stateContext.Provider value={state}>
      <apiContext.Provider value={api}>{children}</apiContext.Provider>
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
