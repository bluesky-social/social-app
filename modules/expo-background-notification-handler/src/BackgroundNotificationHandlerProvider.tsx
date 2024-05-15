import React from 'react'

import {BackgroundNotificationHandlerPreferences} from './ExpoBackgroundNotificationHandler.types'
import {BackgroundNotificationHandler} from './ExpoBackgroundNotificationHandlerModule'

interface BackgroundNotificationPreferencesContext {
  preferences: BackgroundNotificationHandlerPreferences
  setPref: <Key extends keyof BackgroundNotificationHandlerPreferences>(
    key: Key,
    value: BackgroundNotificationHandlerPreferences[Key],
  ) => void
}

const Context = React.createContext<BackgroundNotificationPreferencesContext>(
  {} as BackgroundNotificationPreferencesContext,
)
export const useBackgroundNotificationPreferences = () =>
  React.useContext(Context)

export function BackgroundNotificationPreferencesProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [preferences, setPreferences] =
    React.useState<BackgroundNotificationHandlerPreferences>({
      playSoundChat: true,
    })

  React.useEffect(() => {
    ;(async () => {
      const prefs = await BackgroundNotificationHandler.getAllPrefsAsync()
      setPreferences(prefs)
    })()
  }, [])

  const value = React.useMemo(
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
