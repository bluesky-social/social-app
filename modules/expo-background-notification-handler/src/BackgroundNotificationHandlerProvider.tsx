import React from 'react'

import {useSession} from 'state/session'
import {BackgroundNotificationHandlerPreferences} from './ExpoBackgroundNotificationHandler.types'
import {BackgroundNotificationHandler} from './ExpoBackgroundNotificationHandlerModule'

interface BackgroundNotificationPreferencesContext {
  preferences: BackgroundNotificationHandlerPreferences
  setPref: <Key extends keyof BackgroundNotificationHandlerPreferences>(
    key: Key,
    value: BackgroundNotificationHandlerPreferences[Key],
  ) => Promise<void>
  addToStringStore: (
    key: keyof BackgroundNotificationHandlerPreferences,
    value: string,
  ) => Promise<void>
  removeFromStringStore: (
    key: keyof BackgroundNotificationHandlerPreferences,
    value: string,
  ) => Promise<void>
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
  const {currentAccount, accounts} = useSession()
  const prevAccounts = React.useRef(accounts)

  const [preferences, setPreferences] =
    React.useState<BackgroundNotificationHandlerPreferences>({
      playSoundChat: true,
      disabledDids: {},
    })

  const setPref = React.useCallback(
    async <Key extends keyof BackgroundNotificationHandlerPreferences>(
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
    [],
  )

  const addToStringStore = React.useCallback(
    async (k: keyof BackgroundNotificationHandlerPreferences, v: string) => {
      setPreferences(prev => {
        const prevObj = prev[k]
        if (typeof prevObj !== 'object') return prev

        return {
          ...prev,
          [k]: {...prevObj, [v]: true},
        }
      })
      await BackgroundNotificationHandler.addToStringStoreAsync(k, v)
    },
    [],
  )

  const removeFromStringStore = React.useCallback(
    async (k: keyof BackgroundNotificationHandlerPreferences, v: string) => {
      setPreferences(prev => {
        const prevObj = prev[k]
        if (typeof prevObj !== 'object') return prev

        return {
          ...prev,
          [k]: {...prevObj, [v]: false},
        }
      })
      await BackgroundNotificationHandler.removeFromStringStoreAsync(k, v)
    },
    [],
  )

  React.useEffect(() => {
    ;(async () => {
      // Always handle updates from session changes first
      if (
        currentAccount &&
        !prevAccounts.current.find(
          a => a.did === currentAccount.did && !a.refreshJwt,
        )
      ) {
        await removeFromStringStore('disabledDids', currentAccount.did)
        prevAccounts.current = accounts
      }

      // Then get all of the preferences
      const prefs = await BackgroundNotificationHandler.getAllPrefsAsync()
      setPreferences(prefs)
    })()
  }, [currentAccount, accounts, removeFromStringStore])

  const value = React.useMemo(
    () => ({
      preferences,
      setPref,
      addToStringStore,
      removeFromStringStore,
    }),
    [preferences, setPref, addToStringStore, removeFromStringStore],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}
