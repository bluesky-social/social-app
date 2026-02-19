import {useEffect, useMemo, useState} from 'react'
import {Text as NestedText, View} from 'react-native'
import {
  AppBskyContactStartPhoneVerification,
  AppBskyContactVerifyPhone,
} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useMutation} from '@tanstack/react-query'

import {clamp} from '#/lib/numbers'
import {cleanError, isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useAgent} from '#/state/session'
import {OnboardingPosition} from '#/screens/Onboarding/Layout'
import {atoms as a, useGutters, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as RetryIcon} from '#/components/icons/ArrowRotate'
import {CircleCheck_Stroke2_Corner0_Rounded as CircleCheckIcon} from '#/components/icons/CircleCheck'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {OTPInput} from '../components/OTPInput'
import {constructFullPhoneNumber, prettyPhoneNumber} from '../phone-number'
import {type Action, type State, useOnPressBackButton} from '../state'

export function VerifyNumber({
  state,
  dispatch,
  context,
  onSkip,
}: {
  state: Extract<State, {step: '2: verify number'}>
  dispatch: React.ActionDispatch<[Action]>
  context: 'Onboarding' | 'Standalone'
  onSkip: () => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const ax = useAnalytics()
  const agent = useAgent()
  const gutters = useGutters([0, 'wide'])

  const [otpCode, setOtpCode] = useState('')
  const [error, setError] = useState<{
    retryable: boolean
    isResendError: boolean
    message: string
  } | null>(null)

  const [prevOtpCode, setPrevOtpCode] = useState(otpCode)
  if (otpCode !== prevOtpCode) {
    setPrevOtpCode(otpCode)
    setError(null)
  }

  const phone = useMemo(
    () => constructFullPhoneNumber(state.phoneCountryCode, state.phoneNumber),
    [state.phoneCountryCode, state.phoneNumber],
  )

  const prettyNumber = useMemo(() => prettyPhoneNumber(phone), [phone])

  const {
    mutate: verifyNumber,
    isPending,
    isSuccess,
  } = useMutation({
    mutationFn: async (code: string) => {
      const res = await agent.app.bsky.contact.verifyPhone({code, phone})
      return res.data.token
    },
    onSuccess: async token => {
      // let the success state show for a moment
      setTimeout(() => {
        dispatch({
          type: 'VERIFY_PHONE_NUMBER_SUCCESS',
          payload: {
            token,
          },
        })
      }, 1000)

      ax.metric('contacts:phone:phoneVerified', {entryPoint: context})
    },
    onMutate: () => setError(null),
    onError: err => {
      setOtpCode('')
      if (isNetworkError(err)) {
        setError({
          retryable: true,
          isResendError: false,
          message: _(
            msg`A network error occurred. Please check your internet connection.`,
          ),
        })
      } else if (err instanceof AppBskyContactVerifyPhone.InvalidCodeError) {
        setError({
          retryable: true,
          isResendError: true,
          message: _(msg`This code is invalid. Resend to get a new code.`),
        })
      } else if (err instanceof AppBskyContactVerifyPhone.InvalidPhoneError) {
        setError({
          retryable: false,
          isResendError: false,
          message: _(
            msg`The verification provider was unable to send a code to your phone number. Please check your phone number and try again.`,
          ),
        })
      } else if (
        err instanceof AppBskyContactVerifyPhone.RateLimitExceededError
      ) {
        setError({
          retryable: true,
          isResendError: false,
          message: _(
            msg`Too many attempts. Please wait a few minutes and try again.`,
          ),
        })
      } else {
        logger.error('Verify phone number failed', {safeMessage: err})
        setError({
          retryable: true,
          isResendError: false,
          message: _(msg`An error occurred. ${cleanError(err)}`),
        })
      }
    },
  })

  const {mutate: resendCode, isPending: isResendingCode} = useMutation({
    mutationFn: async () => {
      await agent.app.bsky.contact.startPhoneVerification({phone: phone})
    },
    onSuccess: () => {
      dispatch({type: 'RESEND_VERIFICATION_CODE'})
      Toast.show(_(msg`A new code has been sent`))
    },
    onMutate: () => {
      setOtpCode('')
      setError(null)
    },
    onError: err => {
      if (isNetworkError(err)) {
        setError({
          retryable: true,
          isResendError: true,
          message: _(
            msg`A network error occurred. Please check your internet connection.`,
          ),
        })
      } else if (
        err instanceof AppBskyContactStartPhoneVerification.InvalidPhoneError
      ) {
        setError({
          retryable: false,
          isResendError: true,
          message: _(
            msg`The verification provider was unable to send a code to your phone number. Please check your phone number and try again.`,
          ),
        })
      } else if (
        err instanceof
        AppBskyContactStartPhoneVerification.RateLimitExceededError
      ) {
        setError({
          retryable: true,
          isResendError: true,
          message: _(
            msg`Too many codes sent. Please wait a few minutes and try again.`,
          ),
        })
      } else {
        logger.error('Resend failed', {safeMessage: err})
        setError({
          retryable: true,
          isResendError: true,
          message: _(msg`An error occurred. ${cleanError(err)}`),
        })
      }
    },
  })

  const onPressBack = useOnPressBackButton()

  return (
    <View style={[a.h_full]}>
      <Layout.Header.Outer noBottomBorder>
        <Layout.Header.BackButton onPress={onPressBack} />
        <Layout.Header.Content />
        {context === 'Onboarding' ? (
          <Button
            size="small"
            color="secondary"
            variant="ghost"
            label={_(msg`Skip contact sharing and continue to the app`)}
            onPress={onSkip}>
            <ButtonText>
              <Trans>Skip</Trans>
            </ButtonText>
          </Button>
        ) : (
          <Layout.Header.Slot />
        )}
      </Layout.Header.Outer>
      <Layout.Content
        contentContainerStyle={[gutters, a.pt_sm, a.flex_1]}
        keyboardShouldPersistTaps="always">
        {context === 'Onboarding' && <OnboardingPosition />}
        <Text style={[a.font_bold, a.text_3xl]}>
          <Trans>Verify phone number</Trans>
        </Text>
        <Text
          style={[
            a.text_md,
            t.atoms.text_contrast_medium,
            a.leading_snug,
            a.mt_sm,
          ]}>
          <Trans>Enter the 6-digit code sent to {prettyNumber}</Trans>
        </Text>
        <View style={[a.mt_2xl]}>
          <OTPInput
            label={_(
              msg`Enter 6-digit code that was sent to your phone number`,
            )}
            value={otpCode}
            onChange={setOtpCode}
            onComplete={code => verifyNumber(code)}
          />
        </View>
        <View style={[a.mt_sm]}>
          <OTPStatus
            error={error}
            isPending={isPending}
            isResendingCode={isResendingCode}
            isSuccess={isSuccess}
            onResend={() => resendCode()}
            onRetry={() => verifyNumber(otpCode)}
            lastCodeSentAt={state.lastSentAt}
          />
        </View>
      </Layout.Content>
    </View>
  )
}

/**
 * Horrible component that takes all the state above and figures out what messages
 * and buttons to display.
 */
function OTPStatus({
  error,
  isPending,
  isResendingCode,
  isSuccess,
  onResend,
  onRetry,
  lastCodeSentAt,
}: {
  error: {
    retryable: boolean
    isResendError: boolean
    message: string
  } | null
  isPending: boolean
  isResendingCode: boolean
  isSuccess: boolean
  onResend: () => void
  onRetry: () => void
  lastCodeSentAt: Date | null
}) {
  const {_} = useLingui()
  const t = useTheme()

  const [time, setTime] = useState(Date.now())
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const timeUntilCanResend = Math.max(
    0,
    30000 - (time - (lastCodeSentAt?.getTime() ?? 0)),
  )
  const isWaiting = timeUntilCanResend > 0

  let Icon: React.ComponentType<SVGIconProps> | null = null
  let text = ''
  let textColor = t.atoms.text_contrast_medium.color
  let showResendButton = false
  let showRetryButton = false

  if (isSuccess) {
    Icon = CircleCheckIcon
    text = _(msg`Phone number verified`)
    textColor = t.palette.positive_500
  } else if (isPending) {
    text = _(msg`Verifying...`)
  } else if (error) {
    Icon = WarningIcon
    text = error.message
    textColor = t.palette.negative_500
    if (error.retryable) {
      if (error.isResendError) {
        showResendButton = true
      } else {
        showRetryButton = true
      }
    }
  } else {
    showResendButton = true
  }

  return (
    <View style={[a.w_full, a.align_center]}>
      {text && (
        <View
          style={[
            a.gap_xs,
            a.flex_row,
            a.align_center,
            (isSuccess || isPending) && a.mt_lg,
          ]}>
          {Icon && <Icon size="xs" style={{color: textColor}} />}
          <Text
            style={[
              {color: textColor},
              a.text_sm,
              a.leading_snug,
              a.text_center,
            ]}>
            {text}
          </Text>
        </View>
      )}

      {showRetryButton && (
        <Button
          size="small"
          color="secondary_inverted"
          label={_(msg`Retry`)}
          onPress={onRetry}
          style={[a.mt_2xl]}>
          <ButtonIcon icon={RetryIcon} />
          <ButtonText>
            <Trans>Retry</Trans>
          </ButtonText>
        </Button>
      )}

      {showResendButton && (
        <Button
          size="large"
          color="secondary"
          variant="ghost"
          label={_(msg`Resend code`)}
          disabled={isResendingCode || isWaiting}
          onPress={onResend}
          style={[a.mt_2xl]}>
          {isResendingCode && <ButtonIcon icon={Loader} />}
          <ButtonText>
            {isWaiting ? (
              <Trans>
                Resend code in{' '}
                <NestedText style={{fontVariant: ['tabular-nums']}}>
                  00:
                  {String(
                    clamp(Math.round(timeUntilCanResend / 1000), 0, 30),
                  ).padStart(2, '0')}
                </NestedText>
              </Trans>
            ) : (
              <Trans>Resend code</Trans>
            )}
          </ButtonText>
        </Button>
      )}
    </View>
  )
}
