import React from 'react'

import {useLanguagePrefs} from '#/state/preferences/languages'
import {useServiceConfigQuery} from '#/state/queries/service-config'

type Context = {
  enabled: boolean
}

const Context = React.createContext<Context>({
  enabled: false,
})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const langPrefs = useLanguagePrefs()
  const {data: config} = useServiceConfigQuery()
  const ctx = React.useMemo<Context>(() => {
    // TODO maybe default to true
    const serviceEnabled = Boolean(config?.trendingTopicsEnabled)
    const languageIsSupported = langPrefs.contentLanguages.some(lang => {
      return (config?.trendingTopicsLangs ?? []).includes(lang)
    })
    return {
      enabled: serviceEnabled && languageIsSupported,
    }
  }, [config, langPrefs])
  return <Context.Provider value={ctx}>{children}</Context.Provider>
}

export function useTrendingConfig() {
  return React.useContext(Context)
}
