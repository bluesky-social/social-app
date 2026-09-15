import {useCallback, useEffect, useMemo, useState} from 'react'
import {ActivityIndicator, Platform, View} from 'react-native'
import ReactNativeDeviceAttest from 'react-native-device-attest'
import {useLingui} from '@lingui/react/macro'
import {nanoid} from 'nanoid/non-secure'

import {createFullHandle} from '#/lib/strings/handles'
import {logger} from '#/logger'
import {useSignupContext} from '#/screens/Signup/state'
import {CaptchaWebView} from '#/screens/Signup/StepCaptcha/CaptchaWebView'
import {type CaptchaError} from '#/screens/Signup/StepCaptcha/CaptchaWebView.shared'
import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {useAnalytics} from '#/analytics'
import {GCP_PROJECT_ID, IS_ANDROID, IS_IOS, IS_NATIVE, IS_WEB} from '#/env'
import {BackNextButtons} from '../BackNextButtons'

const CAPTCHA_PATH =
  IS_WEB || GCP_PROJECT_ID === 0
    ? '/gate/signup'
    : '/gate/signup/attempt-attest'

/**
 * How long to block the challenge on attestation before giving up and loading
 * it unattested. The gate endpoint serves a standard challenge when no token is
 * present, so proceeding is always better than holding the user on a spinner.
 */
const ATTEST_TIMEOUT = 10_000

/** Matches the challenge height so swapping the spinner out doesn't jump. */
const STEP_MIN_HEIGHT = 510

type Attestation = {
  token?: string
  payload?: string
}

/** Resolves empty when unavailable - the gate serves a standard challenge. */
async function generateAttestation(): Promise<Attestation> {
  logger.debug('trying to generate attestation token...')
  try {
    if (IS_IOS) {
      logger.debug('starting to generate devicecheck token...')
      const token = await ReactNativeDeviceAttest.getDeviceCheckToken()
      logger.debug(`generated devicecheck token: ${token}`)
      return {token}
    }

    const {token, payload} =
      await ReactNativeDeviceAttest.getIntegrityToken('signup')
    return {token, payload: base64UrlEncode(payload)}
  } catch (err) {
    const e = err as Error
    logger.error(e)
    return {}
  }
}

export function StepCaptcha() {
  if (IS_WEB) {
    return <StepCaptchaInner />
  } else {
    return <StepCaptchaNative />
  }
}

export function StepCaptchaNative() {
  const ax = useAnalytics()
  const {dispatch} = useSignupContext()
  const [attestation, setAttestation] = useState<Attestation>()

  useEffect(() => {
    let cancelled = false
    let timer: NodeJS.Timeout | undefined

    const timeout = new Promise<'timeout'>(resolve => {
      timer = setTimeout(() => resolve('timeout'), ATTEST_TIMEOUT)
    })

    void Promise.race([generateAttestation(), timeout]).then(result => {
      if (timer) clearTimeout(timer)
      if (cancelled) return

      if (result === 'timeout') {
        ax.metric('signup:attestTimeout', {})
        setAttestation({})
      } else {
        setAttestation(result)
      }
    })

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [ax])

  const onBackPress = useCallback(() => {
    ax.metric('signup:captchaBackPress', {phase: 'attesting'})
    dispatch({type: 'prev'})
  }, [ax, dispatch])

  if (!attestation) {
    return (
      <>
        <View style={[a.gap_lg, a.pt_lg]}>
          <View
            style={[
              a.w_full,
              a.align_center,
              a.justify_center,
              {minHeight: STEP_MIN_HEIGHT},
            ]}>
            <ActivityIndicator size="large" />
          </View>
        </View>
        <BackNextButtons hideNext onBackPress={onBackPress} />
      </>
    )
  }

  return (
    <StepCaptchaInner token={attestation.token} payload={attestation.payload} />
  )
}

function StepCaptchaInner({
  token,
  payload,
}: {
  token?: string
  payload?: string
}) {
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const theme = useTheme()
  const {state, dispatch} = useSignupContext()

  const [completed, setCompleted] = useState(false)

  const stateParam = useMemo(() => nanoid(15), [])
  const url = useMemo(() => {
    const newUrl = new URL(state.serviceUrl)
    newUrl.pathname = CAPTCHA_PATH
    newUrl.searchParams.set(
      'handle',
      createFullHandle(state.handle, state.userDomain),
    )
    newUrl.searchParams.set('state', stateParam)
    newUrl.searchParams.set('colorScheme', theme.name)

    if (IS_NATIVE && token) {
      newUrl.searchParams.set('platform', Platform.OS)
      newUrl.searchParams.set('token', token)
      if (IS_ANDROID && payload) {
        newUrl.searchParams.set('payload', payload)
      }
    }

    return newUrl.href
  }, [
    state.serviceUrl,
    state.handle,
    state.userDomain,
    stateParam,
    theme.name,
    token,
    payload,
  ])

  const onSuccess = useCallback(
    (code: string) => {
      setCompleted(true)
      ax.metric('signup:captchaSuccess', {})
      dispatch({
        type: 'submit',
        task: {verificationCode: code, mutableProcessed: false},
      })
    },
    [ax, dispatch],
  )

  const onError = useCallback(
    (error: CaptchaError) => {
      dispatch({
        type: 'setError',
        value: l`Error receiving captcha response.`,
      })
      ax.metric('signup:captchaFailure', {
        reason: error.reason,
        host: error.host,
        statusCode: error.statusCode,
      })
      logger.error('Signup: captcha response error', {
        safeMessage: error.cause ?? error.reason,
      })
    },
    [l, ax, dispatch],
  )

  /*
   * Records latency without showing an error or counting against the failure rate.
   */
  const onSlow = useCallback(() => {
    ax.metric('signup:captchaSlow', {})
  }, [ax])

  const onBlockedLoad = useCallback(
    (host: string, isTopFrame: boolean) => {
      ax.metric('signup:captchaBlockedLoad', {host, isTopFrame})
    },
    [ax],
  )

  const onBackPress = useCallback(() => {
    ax.metric('signup:captchaBackPress', {phase: 'challenge'})
    dispatch({type: 'prev'})
  }, [ax, dispatch])

  return (
    <>
      <View style={[a.gap_lg, a.pt_lg]}>
        <View
          style={[
            a.w_full,
            a.overflow_hidden,
            {minHeight: STEP_MIN_HEIGHT},
            completed && [a.align_center, a.justify_center],
          ]}>
          {!completed ? (
            <CaptchaWebView
              url={url}
              stateParam={stateParam}
              state={state}
              onComplete={() => setCompleted(true)}
              onSuccess={onSuccess}
              onError={onError}
              onSlow={onSlow}
              onBlockedLoad={onBlockedLoad}
            />
          ) : (
            <ActivityIndicator size="large" />
          )}
        </View>
        {state.error && <Admonition type="error">{state.error}</Admonition>}
      </View>
      <BackNextButtons
        hideNext
        isLoading={state.isLoading}
        onBackPress={onBackPress}
      />
    </>
  )
}

function base64UrlEncode(data: string): string {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(data)

  const binaryString = String.fromCharCode(...bytes)
  const base64 = btoa(binaryString)

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/[=]/g, '')
}
