import React from 'react'

import {SharedPrefs} from '../../expo-bluesky-swiss-army'
import {BackgroundNotificationHandlerPreferences} from './types'

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
      const prefs: BackgroundNotificationHandlerPreferences = {
        playSoundChat: SharedPrefs.getBool('playSoundChat') ?? true,
      }
      if (prefs) {
        setPreferences(prefs)
      }
    })()
  }, [])

  const value = {
    preferences,
    setPref: <Key extends keyof BackgroundNotificationHandlerPreferences>(
      k: Key,
      v: BackgroundNotificationHandlerPreferences[Key],
    ) => {
      SharedPrefs.setValue(k, v)
      setPreferences(prev => ({...prev, [k]: v}))
    },
  }

  return <Context.Provider value={value}>{children}</Context.Provider>
}
