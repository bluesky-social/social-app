import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {BackgroundNotificationHandlerPreferences} from './ExpoBackgroundNotificationHandler.types'
import {BackgroundNotificationHandler} from './ExpoBackgroundNotificationHandlerModule'

interface BackgroundNotificationPreferencesContext {
  preferences: BackgroundNotificationHandlerPreferences
  setPref: <Key extends keyof BackgroundNotificationHandlerPreferences>(
    key: Key,
    value: BackgroundNotificationHandlerPreferences[Key],
  ) => void
}

const Context = createContext<BackgroundNotificationPreferencesContext>(
  {} as BackgroundNotificationPreferencesContext,
)
export const useBackgroundNotificationPreferences = () => useContext(Context)

export function BackgroundNotificationPreferencesProvider({
  children,
}: {
  children: ReactNode
}) {
  const [preferences, setPreferences] =
    useState<BackgroundNotificationHandlerPreferences>({
      playSoundChat: true,
    })

  useEffect(() => {
    ;(async () => {
      const prefs = await BackgroundNotificationHandler.getAllPrefsAsync()
      setPreferences(prefs)
    })()
  }, [])

  const value = useMemo(
    () => ({
      preferences,
      setPref: async <
        Key extends keyof BackgroundNotificationHandlerPreferences,
      >(
        k: Key,
        v: BackgroundNotificationHandlerPreferences[Key],
      ) => {
        switch (typeof v) {
          case 'boolean': {
            await BackgroundNotificationHandler.setBoolAsync(k, v)
            break
          }
          case 'string': {
            await BackgroundNotificationHandler.setStringAsync(k, v)
            break
          }
          default: {
            throw new Error(`Invalid type for value: ${typeof v}`)
          }
        }

        setPreferences(prev => ({
          ...prev,
          [k]: v,
        }))
      },
    }),
    [preferences],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}
