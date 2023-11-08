import React from 'react'
import * as persisted from '#/state/persisted'

type SetStateCb = (
  v: persisted.Schema['languagePrefs'],
) => persisted.Schema['languagePrefs']
type StateContext = persisted.Schema['languagePrefs']
type SetContext = (fn: SetStateCb) => void

const stateContext = React.createContext<StateContext>(
  persisted.defaults.languagePrefs,
)
const setContext = React.createContext<SetContext>((_: SetStateCb) => {})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(persisted.get('languagePrefs'))

  const setStateWrapped = React.useCallback(
    (fn: SetStateCb) => {
      const v = fn(persisted.get('languagePrefs'))
      setState(v)
      persisted.write('languagePrefs', v)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate(() => {
      setState(persisted.get('languagePrefs'))
    })
  }, [setStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useLanguagePrefs() {
  return React.useContext(stateContext)
}

export function useSetLanguagePrefs() {
  return React.useContext(setContext)
}

export function getContentLanguages() {
  return persisted.get('languagePrefs').contentLanguages
}

export function toggleContentLanguage(
  state: StateContext,
  setState: SetContext,
  code2: string,
) {
  if (state.contentLanguages.includes(code2)) {
    setState(v => ({
      ...v,
      contentLanguages: v.contentLanguages.filter(lang => lang !== code2),
    }))
  } else {
    setState(v => ({
      ...v,
      contentLanguages: v.contentLanguages.concat(code2),
    }))
  }
}

export function toPostLanguages(postLanguage: string): string[] {
  // filter out empty strings if exist
  return postLanguage.split(',').filter(Boolean)
}

export function hasPostLanguage(postLanguage: string, code2: string): boolean {
  return toPostLanguages(postLanguage).includes(code2)
}

export function togglePostLanguage(
  state: StateContext,
  setState: SetContext,
  code2: string,
) {
  if (hasPostLanguage(state.postLanguage, code2)) {
    setState(v => ({
      ...v,
      postLanguage: toPostLanguages(v.postLanguage)
        .filter(lang => lang !== code2)
        .join(','),
    }))
  } else {
    // sort alphabetically for deterministic comparison in context menu
    setState(v => ({
      ...v,
      postLanguage: toPostLanguages(v.postLanguage)
        .concat([code2])
        .sort((a, b) => a.localeCompare(b))
        .join(','),
    }))
  }
}

/**
 * Saves whatever language codes are currently selected into a history array,
 * which is then used to populate the language selector menu.
 */
export function savePostLanguageToHistory(setState: SetContext) {
  // filter out duplicate `this.postLanguage` if exists, and prepend
  // value to start of array
  setState(v => ({
    ...v,
    postLanguageHistory: [v.postLanguage]
      .concat(
        v.postLanguageHistory.filter(
          commaSeparatedLangCodes => commaSeparatedLangCodes !== v.postLanguage,
        ),
      )
      .slice(0, 6),
  }))
}
