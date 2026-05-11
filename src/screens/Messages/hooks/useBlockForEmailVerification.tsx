import {useEffect} from 'react'
import {Trans} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {type NavigationProp} from '#/lib/routes/types'
import {useEmail} from '#/state/email-verification'
import {
  EmailDialogScreenID,
  useEmailDialogControl,
} from '#/components/dialogs/EmailDialog'

/**
 * On mount, opens the email-verification dialog if the user hasn't verified
 * their email yet. Closing without verifying pops back out of the conversation.
 */
export function useBlockForEmailVerification() {
  const navigation = useNavigation<NavigationProp>()
  const {needsEmailVerification} = useEmail()
  const emailDialogControl = useEmailDialogControl()

  /**
   * Must be non-reactive, otherwise the update to open the global dialog will
   * cause a re-render loop.
   */
  const maybeBlockForEmailVerification = useNonReactiveCallback(() => {
    if (!needsEmailVerification) return
    /*
     * HACKFIX
     *
     * Load bearing timeout, to bump this state update until the after the
     * `navigator.addListener('state')` handler closes elements from
     * `shell/index.*.tsx`  - sfn & esb
     */
    setTimeout(() =>
      emailDialogControl.open({
        id: EmailDialogScreenID.Verify,
        instructions: [
          <Trans key="pre-compose">
            Before you can message another user, you must first verify your
            email.
          </Trans>,
        ],
        onCloseWithoutVerifying: () => {
          if (navigation.canGoBack()) {
            navigation.goBack()
          } else {
            navigation.navigate('Messages', {animation: 'pop'})
          }
        },
      }),
    )
  })

  useEffect(() => {
    maybeBlockForEmailVerification()
  }, [maybeBlockForEmailVerification])
}
