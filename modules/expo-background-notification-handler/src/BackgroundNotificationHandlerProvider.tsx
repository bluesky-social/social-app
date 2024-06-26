import React from 'react'

import {SharedPrefs} from '../../expo-bluesky-swiss-army'
import {BackgroundNotifications} from '../index'
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
      const prefs = await BackgroundNotifications.getPrefsAsync()
      if (prefs) {
        setPreferences(prefs)
      }
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
        SharedPrefs.setValueAsync(k, v)
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
