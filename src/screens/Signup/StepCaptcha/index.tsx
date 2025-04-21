import React from 'react'
import {ActivityIndicator, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {nanoid} from 'nanoid/non-secure'

import {createFullHandle} from '#/lib/strings/handles'
import {logger} from '#/logger'
import {ScreenTransition} from '#/screens/Login/ScreenTransition'
import {useSignupContext} from '#/screens/Signup/state'
import {CaptchaWebView} from '#/screens/Signup/StepCaptcha/CaptchaWebView'
import {atoms as a, useTheme} from '#/alf'
import {FormError} from '#/components/forms/FormError'
import {BackNextButtons} from '../BackNextButtons'

const CAPTCHA_PATH = '/gate/signup'

export function StepCaptcha() {
  const {_} = useLingui()
  const theme = useTheme()
  const {state, dispatch} = useSignupContext()

  const [completed, setCompleted] = React.useState(false)

  const stateParam = React.useMemo(() => nanoid(15), [])
  const url = React.useMemo(() => {
    const newUrl = new URL(state.serviceUrl)
    newUrl.pathname = CAPTCHA_PATH
    newUrl.searchParams.set(
      'handle',
      createFullHandle(state.handle, state.userDomain),
    )
    newUrl.searchParams.set('state', stateParam)
    newUrl.searchParams.set('colorScheme', theme.name)

    return newUrl.href
  }, [state.serviceUrl, state.handle, state.userDomain, stateParam, theme.name])

  const onSuccess = React.useCallback(
    (code: string) => {
      setCompleted(true)
      logger.metric('signup:captchaSuccess', {}, {statsig: true})
      dispatch({
        type: 'submit',
        task: {verificationCode: code, mutableProcessed: false},
      })
    },
    [dispatch],
  )

  const onError = React.useCallback(
    (error?: unknown) => {
      dispatch({
        type: 'setError',
        value: _(msg`Error receiving captcha response.`),
      })
      logger.metric('signup:captchaFailure', {}, {statsig: true})
      logger.error('Signup Flow Error', {
        registrationHandle: state.handle,
        error,
      })
    },
    [_, dispatch, state.handle],
  )

  const onBackPress = React.useCallback(() => {
    logger.error('Signup Flow Error', {
      errorMessage:
        'User went back from captcha step. Possibly encountered an error.',
      registrationHandle: state.handle,
    })

    dispatch({type: 'prev'})
  }, [dispatch, state.handle])

  return (
    <ScreenTransition>
      <View style={[a.gap_lg]}>
        <View
          style={[
            a.w_full,
            a.overflow_hidden,
            {minHeight: 510},
            completed && [a.align_center, a.justify_center],
          ]}>
          {!completed ? (
            <CaptchaWebView
              url={url}
              stateParam={stateParam}
              state={state}
              onSuccess={onSuccess}
              onError={onError}
            />
          ) : (
            <ActivityIndicator size="large" />
          )}
        </View>
        <FormError error={state.error} />
      </View>
      <BackNextButtons
        hideNext
        isLoading={state.isLoading}
        onBackPress={onBackPress}
      />
    </ScreenTransition>
  )
}
