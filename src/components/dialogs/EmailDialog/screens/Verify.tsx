import {useReducer} from 'react'
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
import {ResendEmailText} from '#/components/dialogs/EmailDialog/components/ResendEmailText'
import {
  isValidCode,
  TokenField,
} from '#/components/dialogs/EmailDialog/components/TokenField'
import {useConfirmEmail} from '#/components/dialogs/EmailDialog/data/useConfirmEmail'
import {useRequestEmailVerification} from '#/components/dialogs/EmailDialog/data/useRequestEmailVerification'
import {useOnEmailVerified} from '#/components/dialogs/EmailDialog/events'
import {
  ScreenID,
  type ScreenProps,
} from '#/components/dialogs/EmailDialog/types'
import {Divider} from '#/components/Divider'
import {CheckThick_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {Envelope_Stroke2_Corner0_Rounded as Envelope} from '#/components/icons/Envelope'
import {createStaticClick, InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Span, Text} from '#/components/Typography'

type State = {
  step: 'email' | 'token' | 'success'
  mutationStatus: 'pending' | 'success' | 'error' | 'default'
  error: string
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
      type: 'setToken'
      value: string
    }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'setStep': {
      return {
        ...state,
        error: '',
        mutationStatus: 'default',
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
    case 'setToken': {
      return {
        ...state,
        error: '',
        token: action.value,
      }
    }
  }
}

export function Verify({config, showScreen}: ScreenProps<ScreenID.Verify>) {
  const t = useTheme()
  const {_} = useLingui()
  const cleanError = useCleanError()
  const {currentAccount} = useSession()
  const [state, dispatch] = useReducer(reducer, {
    step: 'email',
    mutationStatus: 'default',
    error: '',
    token: '',
  })

  const {mutateAsync: requestEmailVerification} = useRequestEmailVerification()
  const {mutateAsync: confirmEmail} = useConfirmEmail()

  useOnEmailVerified(() => {
    if (config.onVerify) {
      config.onVerify()
    } else {
      dispatch({
        type: 'setStep',
        step: 'success',
      })
    }
  })

  const handleRequestEmailVerification = async () => {
    dispatch({
      type: 'setMutationStatus',
      status: 'pending',
    })

    try {
      await wait(1000, requestEmailVerification())
      dispatch({
        type: 'setMutationStatus',
        status: 'success',
      })
    } catch (e) {
      logger.error('EmailDialog: sending verification email failed', {
        safeMessage: e,
      })
      const {clean} = cleanError(e)
      dispatch({
        type: 'setError',
        error: clean || _(msg`Failed to send email, please try again.`),
      })
    }
  }

  const handleConfirmEmail = async () => {
    if (!isValidCode(state.token)) {
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

    try {
      await wait(1000, confirmEmail({token: state.token}))
      dispatch({
        type: 'setStep',
        step: 'success',
      })
    } catch (e) {
      logger.error('EmailDialog: confirming email failed', {
        safeMessage: e,
      })
      const {clean} = cleanError(e)
      dispatch({
        type: 'setError',
        error: clean || _(msg`Failed to verify email, please try again.`),
      })
    }
  }

  if (state.step === 'success') {
    return (
      <View style={[a.gap_lg]}>
        <View style={[a.gap_sm]}>
          <Text style={[a.text_xl, a.font_bold]}>
            <Span style={{top: 1}}>
              <Check size="sm" fill={t.palette.positive_600} />
            </Span>
            {'  '}
            <Trans>Email verification complete!</Trans>
          </Text>

          <Text
            style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
            <Trans>
              You have successfully verified your email address. You can close
              this dialog.
            </Trans>
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={[a.gap_lg]}>
      <View style={[a.gap_sm]}>
        <Text style={[a.text_xl, a.font_bold]}>
          {state.step === 'email' ? (
            state.mutationStatus === 'success' ? (
              <>
                <Span style={{top: 1}}>
                  <Check size="sm" fill={t.palette.positive_600} />
                </Span>
                {'  '}
                <Trans>Email sent!</Trans>
              </>
            ) : (
              <Trans>Verify your email</Trans>
            )
          ) : (
            <Trans comment="Dialog title when a user is verifying their email address by entering a code they have been sent">
              Verify email code
            </Trans>
          )}
        </Text>

        {state.step === 'email' && state.mutationStatus !== 'success' && (
          <>
            {config.instructions?.map((int, i) => (
              <Text
                key={i}
                style={[
                  a.italic,
                  a.text_sm,
                  a.leading_snug,
                  t.atoms.text_contrast_medium,
                ]}>
                {int}
              </Text>
            ))}
          </>
        )}

        <Text style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
          {state.step === 'email' ? (
            state.mutationStatus === 'success' ? (
              <Trans>
                We sent an email to{' '}
                <Span style={[a.font_semi_bold, t.atoms.text]}>
                  {currentAccount!.email}
                </Span>{' '}
                containing a link. Please click on it to complete the email
                verification process.
              </Trans>
            ) : (
              <Trans>
                We'll send an email to{' '}
                <Span style={[a.font_semi_bold, t.atoms.text]}>
                  {currentAccount!.email}
                </Span>{' '}
                containing a link. Please click on it to complete the email
                verification process.
              </Trans>
            )
          ) : (
            <Trans>
              Please enter the code we sent to{' '}
              <Span style={[a.font_semi_bold, t.atoms.text]}>
                {currentAccount!.email}
              </Span>{' '}
              below.
            </Trans>
          )}
        </Text>

        {state.step === 'email' && state.mutationStatus !== 'success' && (
          <Text
            style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
            <Trans>
              If you need to update your email,{' '}
              <InlineLinkText
                label={_(msg`Click here to update your email`)}
                {...createStaticClick(() => {
                  showScreen({id: ScreenID.Update})
                })}>
                click here
              </InlineLinkText>
              .
            </Trans>
          </Text>
        )}

        {state.step === 'email' && state.mutationStatus === 'success' && (
          <ResendEmailText onPress={requestEmailVerification} />
        )}
      </View>

      {state.step === 'email' && state.mutationStatus !== 'success' ? (
        <>
          {state.error && <Admonition type="error">{state.error}</Admonition>}
          <Button
            label={_(msg`Send verification email`)}
            size="large"
            variant="solid"
            color="primary"
            onPress={handleRequestEmailVerification}
            disabled={state.mutationStatus === 'pending'}>
            <ButtonText>
              <Trans>Send email</Trans>
            </ButtonText>
            <ButtonIcon
              icon={state.mutationStatus === 'pending' ? Loader : Envelope}
            />
          </Button>
        </>
      ) : null}

      {state.step === 'email' && (
        <>
          <Divider />

          <Text
            style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
            <Trans>
              Have a code?{' '}
              <InlineLinkText
                label={_(msg`Enter code`)}
                {...createStaticClick(() => {
                  dispatch({
                    type: 'setStep',
                    step: 'token',
                  })
                })}>
                Click here.
              </InlineLinkText>
            </Trans>
          </Text>
        </>
      )}

      {state.step === 'token' ? (
        <>
          <TokenField
            value={state.token}
            onChangeText={token => {
              dispatch({
                type: 'setToken',
                value: token,
              })
            }}
            onSubmitEditing={handleConfirmEmail}
          />

          {state.error && <Admonition type="error">{state.error}</Admonition>}

          <Button
            label={_(
              msg({
                message: `Verify code`,
                context: `action`,
                comment: `Button text and accessibility label for action to verify the user's email address using the code entered`,
              }),
            )}
            size="large"
            variant="solid"
            color="primary"
            onPress={handleConfirmEmail}
            disabled={
              !state.token ||
              state.token.length !== 11 ||
              state.mutationStatus === 'pending'
            }>
            <ButtonText>
              <Trans
                context="action"
                comment="Button text and accessibility label for action to verify the user's email address using the code entered">
                Verify code
              </Trans>
            </ButtonText>
            {state.mutationStatus === 'pending' && <ButtonIcon icon={Loader} />}
          </Button>

          <Divider />

          <Text
            style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
            <Trans>
              Don't have a code or need a new one?{' '}
              <InlineLinkText
                label={_(msg`Click here to restart the verification process.`)}
                {...createStaticClick(() => {
                  dispatch({
                    type: 'setStep',
                    step: 'email',
                  })
                })}>
                Click here.
              </InlineLinkText>
            </Trans>
          </Text>
        </>
      ) : null}
    </View>
  )
}
