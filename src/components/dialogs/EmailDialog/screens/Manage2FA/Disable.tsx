import {useReducer, useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {wait} from '#/lib/async/wait'
import {useCleanError} from '#/lib/hooks/useCleanError'
import {logger} from '#/logger'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogContext} from '#/components/Dialog'
import {ResendEmailText} from '#/components/dialogs/EmailDialog/components/ResendEmailText'
import {
  isValidCode,
  TokenField,
} from '#/components/dialogs/EmailDialog/components/TokenField'
import {useManageEmail2FA} from '#/components/dialogs/EmailDialog/data/useManageEmail2FA'
import {useRequestEmailUpdate} from '#/components/dialogs/EmailDialog/data/useRequestEmailUpdate'
import {Divider} from '#/components/Divider'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {Envelope_Stroke2_Corner0_Rounded as Envelope} from '#/components/icons/Envelope'
import {createStaticClick, InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Span, Text} from '#/components/Typography'

type State = {
  error: string
  step: 'email' | 'token'
  emailStatus: 'pending' | 'success' | 'error' | 'default'
  tokenStatus: 'pending' | 'success' | 'error' | 'default'
}

type Action =
  | {
      type: 'setError'
      error: string
    }
  | {
      type: 'setStep'
      step: 'email' | 'token'
    }
  | {
      type: 'setEmailStatus'
      status: State['emailStatus']
    }
  | {
      type: 'setTokenStatus'
      status: State['tokenStatus']
    }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'setError': {
      return {
        ...state,
        error: action.error,
        emailStatus: 'error',
        tokenStatus: 'error',
      }
    }
    case 'setStep': {
      return {
        ...state,
        error: '',
        step: action.step,
      }
    }
    case 'setEmailStatus': {
      return {
        ...state,
        error: '',
        emailStatus: action.status,
      }
    }
    case 'setTokenStatus': {
      return {
        ...state,
        error: '',
        tokenStatus: action.status,
      }
    }
    default: {
      return state
    }
  }
}

export function Disable() {
  const t = useTheme()
  const {_} = useLingui()
  const cleanError = useCleanError()
  const {currentAccount} = useSession()
  const {mutateAsync: requestEmailUpdate} = useRequestEmailUpdate()
  const {mutateAsync: manageEmail2FA} = useManageEmail2FA()
  const control = useDialogContext()

  const [token, setToken] = useState('')
  const [state, dispatch] = useReducer(reducer, {
    error: '',
    step: 'email',
    emailStatus: 'default',
    tokenStatus: 'default',
  })

  const handleSendEmail = async () => {
    dispatch({type: 'setEmailStatus', status: 'pending'})
    try {
      await wait(1000, requestEmailUpdate())
      dispatch({type: 'setEmailStatus', status: 'success'})
      setTimeout(() => {
        dispatch({type: 'setStep', step: 'token'})
      }, 1000)
    } catch (e) {
      logger.error('Manage2FA: email update code request failed', {
        safeMessage: e,
      })
      const {clean} = cleanError(e)
      dispatch({
        type: 'setError',
        error: clean || _(msg`Failed to send email, please try again.`),
      })
    }
  }

  const handleManageEmail2FA = async () => {
    if (!isValidCode(token)) {
      dispatch({
        type: 'setError',
        error: _(msg`Please enter a valid code.`),
      })
      return
    }

    dispatch({type: 'setTokenStatus', status: 'pending'})

    try {
      await wait(1000, manageEmail2FA({enabled: false, token}))
      dispatch({type: 'setTokenStatus', status: 'success'})
      setTimeout(() => {
        control.close()
      }, 1000)
    } catch (e) {
      logger.error('Manage2FA: disable email 2FA failed', {safeMessage: e})
      const {clean} = cleanError(e)
      dispatch({
        type: 'setError',
        error: clean || _(msg`Failed to update email 2FA settings`),
      })
    }
  }

  return (
    <View style={[a.gap_sm]}>
      <Text style={[a.text_xl, a.font_heavy, a.leading_snug]}>
        <Trans>Disable email 2FA</Trans>
      </Text>

      {state.step === 'email' ? (
        <>
          <Text
            style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
            <Trans>
              To disable your email 2FA method, please verify your access to{' '}
              <Span style={[a.font_bold]}>{currentAccount?.email}</Span>
            </Trans>
          </Text>

          <View style={[a.gap_lg, a.pt_sm]}>
            {state.error && <Admonition type="error">{state.error}</Admonition>}

            <Button
              label={_(msg`Send email`)}
              size="large"
              variant="solid"
              color="primary"
              onPress={handleSendEmail}
              disabled={state.emailStatus === 'pending'}>
              <ButtonText>
                <Trans>Send email</Trans>
              </ButtonText>
              <ButtonIcon
                icon={
                  state.emailStatus === 'pending'
                    ? Loader
                    : state.emailStatus === 'success'
                    ? Check
                    : Envelope
                }
              />
            </Button>

            <Divider />

            <Text
              style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
              <Trans>
                Have a code?{' '}
                <InlineLinkText
                  label={_(msg`Enter code`)}
                  {...createStaticClick(() => {
                    dispatch({type: 'setStep', step: 'token'})
                  })}>
                  Click here.
                </InlineLinkText>
              </Trans>
            </Text>
          </View>
        </>
      ) : (
        <>
          <Text
            style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
            <Trans>
              To disable your email 2FA method, please verify your access to{' '}
              <Span style={[a.font_bold]}>{currentAccount?.email}</Span>
            </Trans>
          </Text>

          <View style={[a.gap_sm, a.py_sm]}>
            <TokenField
              value={token}
              onChangeText={setToken}
              onSubmitEditing={handleManageEmail2FA}
            />
            <ResendEmailText onPress={handleSendEmail} />
          </View>

          {state.error && <Admonition type="error">{state.error}</Admonition>}

          <Button
            label={_(msg`Disable 2FA`)}
            size="large"
            variant="solid"
            color="primary"
            onPress={handleManageEmail2FA}
            disabled={
              !token || token.length !== 11 || state.tokenStatus === 'pending'
            }>
            <ButtonText>
              <Trans>Disable 2FA</Trans>
            </ButtonText>
            {state.tokenStatus === 'pending' ? (
              <ButtonIcon icon={Loader} />
            ) : state.tokenStatus === 'success' ? (
              <ButtonIcon icon={Check} />
            ) : null}
          </Button>
        </>
      )}
    </View>
  )
}
