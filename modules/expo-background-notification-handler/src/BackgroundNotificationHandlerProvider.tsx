import React from 'react'

import {BackgroundNotificationHandlerPreferences} from './ExpoBackgroundNotificationHandler.types'
import {BackgroundNotificationHandler} from './ExpoBackgroundNotificationHandlerModule'

interface BackgroundNotificationPreferencesContext {
  preferences: BackgroundNotificationHandlerPreferences
  setPref: (
    key: keyof BackgroundNotificationHandlerPreferences,
    value: string | boolean,
  ) => void
}

const Context =
  React.createContext<BackgroundNotificationPreferencesContext | null>(null)
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
      playSoundOther: false,
    })

  const value = React.useMemo(
    () => ({
      preferences,
      setPref: async (k: string, v: string | boolean) => {
        setPreferences(prev => ({
          ...prev,
          [k]: v,
        }))

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
      },
    }),
    [preferences],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}
