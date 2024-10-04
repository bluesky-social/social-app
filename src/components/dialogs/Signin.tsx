import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isNative} from '#/platform/detection'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useCloseAllActiveElements} from '#/state/util'
import {Logo} from '#/view/icons/Logo'
import {Logotype} from '#/view/icons/Logotype'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {Text} from '#/components/Typography'

export function SigninDialog() {
  const {signinDialogControl: control} = useGlobalDialogsControlContext()
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <SigninDialogInner control={control} />
    </Dialog.Outer>
  )
}

function SigninDialogInner({}: {control: Dialog.DialogOuterProps['control']}) {
  const t = useTheme()
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const {requestSwitchToAccount} = useLoggedOutViewControls()
  const closeAllActiveElements = useCloseAllActiveElements()

  const showSignIn = React.useCallback(() => {
    closeAllActiveElements()
    requestSwitchToAccount({requestedAccount: 'none'})
  }, [requestSwitchToAccount, closeAllActiveElements])

  const showCreateAccount = React.useCallback(() => {
    closeAllActiveElements()
    requestSwitchToAccount({requestedAccount: 'new'})
  }, [requestSwitchToAccount, closeAllActiveElements])

  return (
    <Dialog.ScrollableInner
      label={_(msg`Sign into Bluesky or create a new account`)}
      style={[gtMobile ? {width: 'auto', maxWidth: 420} : a.w_full]}>
      <View style={[!isNative && a.p_2xl]}>
        <View
          style={[
            a.flex_row,
            a.align_center,
            a.justify_center,
            a.gap_sm,
            a.pb_lg,
          ]}>
          <Logo width={36} />
          <View style={{paddingTop: 6}}>
            <Logotype width={120} fill={t.atoms.text.color} />
          </View>
        </View>

        <Text
          style={[
            a.text_lg,
            a.text_center,
            t.atoms.text,
            a.pb_2xl,
            a.leading_snug,
            a.mx_auto,
            {
              maxWidth: 300,
            },
          ]}>
          <Trans>
            Sign in or create your account to join the conversation!
          </Trans>
        </Text>

        <View style={[a.flex_col, a.gap_md]}>
          <Button
            variant="solid"
            color="primary"
            size="large"
            onPress={showCreateAccount}
            label={_(msg`Create an account`)}>
            <ButtonText>
              <Trans>Create an account</Trans>
            </ButtonText>
          </Button>

          <Button
            variant="solid"
            color="secondary"
            size="large"
            onPress={showSignIn}
            label={_(msg`Sign in`)}>
            <ButtonText>
              <Trans>Sign in</Trans>
            </ButtonText>
          </Button>
        </View>

        {isNative && <View style={{height: 10}} />}
      </View>

      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
