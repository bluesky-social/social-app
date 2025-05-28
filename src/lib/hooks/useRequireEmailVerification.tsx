import {useCallback} from 'react'
import {Keyboard} from 'react-native'

import {useEmail} from '#/lib/hooks/useEmail'
import {useRequireAuth, useSession} from '#/state/session'
import {useCloseAllActiveElements} from '#/state/util'
import {
  EmailDialogScreenID,
  type Screen,
  useEmailDialogControl,
} from '#/components/dialogs/EmailDialog'

export function useRequireEmailVerification() {
  const {currentAccount} = useSession()
  const {needsEmailVerification} = useEmail()
  const requireAuth = useRequireAuth()
  const emailDialogControl = useEmailDialogControl()
  const closeAll = useCloseAllActiveElements()

  return useCallback(
    <T extends (...args: any[]) => any>(
      cb: T,
      config: Omit<
        Extract<Screen, {id: EmailDialogScreenID.Verify}>,
        'id'
      > = {},
    ): ((...args: Parameters<T>) => ReturnType<T>) => {
      return (...args: Parameters<T>): ReturnType<T> => {
        if (!currentAccount) {
          return requireAuth(() => cb(...args)) as ReturnType<T>
        }
        if (needsEmailVerification) {
          Keyboard.dismiss()
          closeAll()
          emailDialogControl.open({
            id: EmailDialogScreenID.Verify,
            ...config,
          })
          return undefined as ReturnType<T>
        } else {
          return cb(...args)
        }
      }
    },
    [
      needsEmailVerification,
      currentAccount,
      emailDialogControl,
      closeAll,
      requireAuth,
    ],
  )
}
