import {useEffect, useMemo, useState} from 'react'
import {Text as NestedText, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation} from '@tanstack/react-query'

import {wait} from '#/lib/async/wait'
import {getPhoneCodeFromCountryCode} from '#/lib/international-telephone-codes'
import {clamp} from '#/lib/numbers'
import {cleanError, isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {atoms as a, useGutters, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as RetryIcon} from '#/components/icons/ArrowRotateCounterClockwise'
import {CircleCheck_Stroke2_Corner0_Rounded as CircleCheckIcon} from '#/components/icons/CircleCheck'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {OTPInput} from '../components/OTPInput'
import {type Action, type State} from '../state'
export function VerifyNumber({
  state,
  dispatch,
  showSkipButton,
  onSkip,
}: {
  state: Extract<State, {step: '2: verify number'}>
  dispatch: React.Dispatch<Action>
  showSkipButton: boolean
  onSkip: () => void
}) {
  const t = useTheme()
  const {_} = useLingui()
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

  const {
    mutate: verifyNumber,
    isPending,
    isSuccess,
  } = useMutation({
    mutationFn: async (_code: string) => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return 'success'
    },
    onSuccess: async () => {
      await wait(2e3, () => {})
      dispatch({
        type: 'VERIFY_PHONE_NUMBER_SUCCESS',
        payload: {
          token: 'example_token',
        },
      })
    },
    onMutate: () => setError(null),
    onError: err => {
      if (isNetworkError(err)) {
        setError({
          retryable: true,
          isResendError: false,
          message: _(
            msg`A network error occurred. Please check your internet connection.`,
          ),
        })
        // TODO: Check error with invalid code error!!
      } else if (true) {
        setError({
          retryable: false,
          isResendError: false,
          message: _(msg`This code is invalid. Resend to get a new code.`),
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
      await new Promise(resolve => setTimeout(resolve, 2000))
    },
    onSuccess: () => {
      dispatch({type: 'RESEND_VERIFICATION_CODE'})
      Toast.show(_(msg`Code resent`))
    },
    onMutate: () => {
      setError(null)
    },
    onError: err => {
      setError({
        retryable: true,
        isResendError: true,
        message: _(msg`An error occurred while resending the code.`),
      })
      if (!isNetworkError(err)) {
        logger.error('Resend code failed', {safeMessage: err})
      }
    },
  })

  const phoneCode = useMemo(
    () => getPhoneCodeFromCountryCode(state.phoneCountryCode),
    [state.phoneCountryCode],
  )

  return (
    <View style={[a.h_full]}>
      <Layout.Header.Outer noBottomBorder>
        <Layout.Header.BackButton />
        <Layout.Header.Content />
        {showSkipButton ? (
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
          <Trans>
            Enter the 6 digit code sent to {phoneCode} {state.phoneNumber}
          </Trans>
        </Text>
        <View style={[a.mt_2xl]}>
          <OTPInput
            label={_(
              msg`Enter 6-digit code that was sent to your phone number`,
            )}
            value={otpCode}
            onChange={setOtpCode}
            onComplete={() => verifyNumber(otpCode)}
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
    text = _(msg`Phone verified`)
    textColor = t.palette.positive_500
  } else if (isPending) {
    Icon = Loader
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
        <View style={[a.gap_xs, a.flex_row, a.align_center]}>
          {Icon && <Icon size="xs" color={textColor} />}
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
