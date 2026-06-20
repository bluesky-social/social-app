import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type ProviderStateContext = persisted.Schema['translationProvider']
type SetProviderContext = (v: persisted.Schema['translationProvider']) => void
type InstanceStateContext = persisted.Schema['libreTranslateInstance']
type SetInstanceContext = (
  v: persisted.Schema['libreTranslateInstance'],
) => void

const providerStateContext = createContext<ProviderStateContext>(
  persisted.defaults.translationProvider,
)
const setProviderContext = createContext<SetProviderContext>(
  (_: persisted.Schema['translationProvider']) => {},
)
const instanceStateContext = createContext<InstanceStateContext>(
  persisted.defaults.libreTranslateInstance,
)
const setInstanceContext = createContext<SetInstanceContext>(
  (_: persisted.Schema['libreTranslateInstance']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [provider, setProvider] = useState(persisted.get('translationProvider'))
  const [instance, setInstance] = useState(
    persisted.get('libreTranslateInstance'),
  )

  const setProviderWrapped = useCallback(
    (value: persisted.Schema['translationProvider']) => {
      setProvider(value)
      void persisted.write('translationProvider', value)
    },
    [setProvider],
  )

  const setInstanceWrapped = useCallback(
    (value: persisted.Schema['libreTranslateInstance']) => {
      setInstance(value)
      void persisted.write('libreTranslateInstance', value)
    },
    [setInstance],
  )

  useEffect(() => {
    return persisted.onUpdate('translationProvider', next => {
      setProvider(next)
    })
  }, [setProviderWrapped])

  useEffect(() => {
    return persisted.onUpdate('libreTranslateInstance', next => {
      setInstance(next)
    })
  }, [setInstanceWrapped])

  return (
    <providerStateContext.Provider value={provider}>
      <setProviderContext.Provider value={setProviderWrapped}>
        <instanceStateContext.Provider value={instance}>
          <setInstanceContext.Provider value={setInstanceWrapped}>
            {children}
          </setInstanceContext.Provider>
        </instanceStateContext.Provider>
      </setProviderContext.Provider>
    </providerStateContext.Provider>
  )
}

export function useTranslationProvider() {
  return (
    useContext(providerStateContext) ?? persisted.defaults.translationProvider!
  )
}

export function useSetTranslationProvider() {
  return useContext(setProviderContext)
}

export function useLibreTranslateInstance() {
  return (
    useContext(instanceStateContext) ??
    persisted.defaults.libreTranslateInstance!
  )
}

export function useSetLibreTranslateInstance() {
  return useContext(setInstanceContext)
}
