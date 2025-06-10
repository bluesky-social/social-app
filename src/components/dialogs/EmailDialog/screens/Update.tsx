import {useReducer} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {validate as validateEmail} from 'email-validator'

import {wait} from '#/lib/async/wait'
import {useCleanError} from '#/lib/hooks/useCleanError'
import {logger} from '#/logger'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ResendEmailText} from '#/components/dialogs/EmailDialog/components/ResendEmailText'
import {
  isValidCode,
  TokenField,
} from '#/components/dialogs/EmailDialog/components/TokenField'
import {useRequestEmailUpdate} from '#/components/dialogs/EmailDialog/data/useRequestEmailUpdate'
import {useRequestEmailVerification} from '#/components/dialogs/EmailDialog/data/useRequestEmailVerification'
import {useUpdateEmail} from '#/components/dialogs/EmailDialog/data/useUpdateEmail'
import {
  type ScreenID,
  type ScreenProps,
} from '#/components/dialogs/EmailDialog/types'
import {Divider} from '#/components/Divider'
import * as TextField from '#/components/forms/TextField'
import {CheckThick_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {Envelope_Stroke2_Corner0_Rounded as Envelope} from '#/components/icons/Envelope'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

type State = {
  step: 'email' | 'token'
  mutationStatus: 'pending' | 'success' | 'error' | 'default'
  error: string
  emailValid: boolean
  email: string
  token: string
}

type Action =
  | {
      type: 'setStep'
      step: State['step']
    }
  | {
      type: 'setError'
      error: string
    }
  | {
      type: 'setMutationStatus'
      status: State['mutationStatus']
    }
  | {
      type: 'setEmail'
      value: string
    }
  | {
      type: 'setToken'
      value: string
    }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'setStep': {
      return {
        ...state,
        step: action.step,
      }
    }
    case 'setError': {
      return {
        ...state,
        error: action.error,
        mutationStatus: 'error',
      }
    }
    case 'setMutationStatus': {
      return {
        ...state,
        error: '',
        mutationStatus: action.status,
      }
    }
    case 'setEmail': {
      const emailValid = validateEmail(action.value)
      return {
        ...state,
        step: 'email',
        token: '',
        email: action.value,
        emailValid,
      }
    }
    case 'setToken': {
      return {
        ...state,
        error: '',
        token: action.value,
      }
    }
  }
}

export function Update(_props: ScreenProps<ScreenID.Update>) {
  const t = useTheme()
  const {_} = useLingui()
  const cleanError = useCleanError()
  const {currentAccount} = useSession()
  const [state, dispatch] = useReducer(reducer, {
    step: 'email',
    mutationStatus: 'default',
    error: '',
    email: '',
    emailValid: true,
    token: '',
  })

  const {mutateAsync: updateEmail} = useUpdateEmail()
  const {mutateAsync: requestEmailUpdate} = useRequestEmailUpdate()
  const {mutateAsync: requestEmailVerification} = useRequestEmailVerification()

  const handleEmailChange = (email: string) => {
    dispatch({
      type: 'setEmail',
      value: email,
    })
  }

  const handleUpdateEmail = async () => {
    if (state.step === 'token' && !isValidCode(state.token)) {
      dispatch({
        type: 'setError',
        error: _(msg`Please enter a valid code.`),
      })
      return
    }

    dispatch({
      type: 'setMutationStatus',
      status: 'pending',
    })

    if (state.emailValid === false) {
      dispatch({
        type: 'setError',
        error: _(msg`Please enter a valid email address.`),
      })
      return
    }

    if (state.email === currentAccount!.email) {
      dispatch({
        type: 'setError',
        error: _(msg`This email is already associated with your account.`),
      })
      return
    }

    try {
      const {status} = await wait(
        1000,
        updateEmail({
          email: state.email,
          token: state.token,
        }),
      )

      if (status === 'tokenRequired') {
        dispatch({
          type: 'setStep',
          step: 'token',
        })
        dispatch({
          type: 'setMutationStatus',
          status: 'default',
        })
      } else if (status === 'success') {
        dispatch({
          type: 'setMutationStatus',
          status: 'success',
        })

        try {
          // fire off a confirmation email immediately
          await requestEmailVerification()
        } catch {}
      }
    } catch (e) {
      logger.error('EmailDialog: update email failed', {safeMessage: e})
      const {clean} = cleanError(e)
      dispatch({
        type: 'setError',
        error: clean || _(msg`Failed to update email, please try again.`),
      })
    }
  }

  return (
    <View style={[a.gap_lg]}>
      <Text style={[a.text_xl, a.font_heavy]}>
        <Trans>Update your email</Trans>
      </Text>

      {currentAccount?.emailAuthFactor && (
        <Admonition type="warning">
          <Trans>
            If you update your email address, email 2FA will be disabled.
          </Trans>
        </Admonition>
      )}

      <View style={[a.gap_md]}>
        <View>
          <Text style={[a.pb_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
            <Trans>Please enter your new email address.</Trans>
          </Text>
          <TextField.Root>
            <TextField.Icon icon={Envelope} />
            <TextField.Input
              label={_(msg`New email address`)}
              placeholder={_(msg`alice@example.com`)}
              defaultValue={state.email}
              onChangeText={
                state.mutationStatus === 'success'
                  ? undefined
                  : handleEmailChange
              }
              keyboardType="email-address"
              autoComplete="email"
              autoCapitalize="none"
              onSubmitEditing={handleUpdateEmail}
            />
          </TextField.Root>
        </View>

        {state.step === 'token' && (
          <>
            <Divider />
            <View>
              <Text style={[a.text_md, a.pb_sm, a.font_bold]}>
                <Trans>Security step required</Trans>
              </Text>
              <Text
                style={[a.pb_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
                <Trans>
                  Please enter the security code we sent to your previous email
                  address.
                </Trans>
              </Text>
              <TokenField
                value={state.token}
                onChangeText={
                  state.mutationStatus === 'success'
                    ? undefined
                    : token => {
                        dispatch({
                          type: 'setToken',
                          value: token,
                        })
                      }
                }
                onSubmitEditing={handleUpdateEmail}
              />
              {state.mutationStatus !== 'success' && (
                <ResendEmailText
                  onPress={requestEmailUpdate}
                  style={[a.pt_sm]}
                />
              )}
            </View>
          </>
        )}

        {state.error && <Admonition type="error">{state.error}</Admonition>}
      </View>

      {state.mutationStatus === 'success' ? (
        <>
          <Divider />
          <View style={[a.gap_sm]}>
            <View style={[a.flex_row, a.gap_sm, a.align_center]}>
              <Check fill={t.palette.positive_600} size="xs" />
              <Text style={[a.text_md, a.font_heavy]}>
                <Trans>Success!</Trans>
              </Text>
            </View>
            <Text style={[a.leading_snug]}>
              <Trans>
                Please click on the link in the email we just sent you to verify
                your new email address. This is an important step to allow you
                to continue enjoying all the features of Bluesky.
              </Trans>
            </Text>
          </View>
        </>
      ) : (
        <Button
          label={_(msg`Update email`)}
          size="large"
          variant="solid"
          color="primary"
          onPress={handleUpdateEmail}
          disabled={
            !state.email ||
            (state.step === 'token' &&
              (!state.token || state.token.length !== 11)) ||
            state.mutationStatus === 'pending'
          }>
          <ButtonText>
            <Trans>Update email</Trans>
          </ButtonText>
          {state.mutationStatus === 'pending' && <ButtonIcon icon={Loader} />}
        </Button>
      )}
    </View>
  )
}
