import React from 'react'
import {ActivityIndicator, StyleSheet, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {nanoid} from 'nanoid/non-secure'

import {createFullHandle} from '#/lib/strings/handles'
import {isWeb} from '#/platform/detection'
import {CaptchaWebView} from '#/view/com/auth/create/CaptchaWebView'
import {ScreenTransition} from '#/screens/Login/ScreenTransition'
import {useSignupContext, useSubmitSignup} from '#/screens/Signup/state'
import {atoms as a, useTheme} from '#/alf'
import {FormError} from '#/components/forms/FormError'

const CAPTCHA_PATH = '/gate/signup'

export function StepCaptcha() {
  const {_} = useLingui()
  const theme = useTheme()
  const {state, dispatch} = useSignupContext()
  const submit = useSubmitSignup({state, dispatch})

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
      submit(code)
    },
    [submit],
  )

  const onError = React.useCallback(() => {
    dispatch({
      type: 'setError',
      value: _(msg`Error receiving captcha response.`),
    })
  }, [_, dispatch])

  return (
    <ScreenTransition>
      <View style={[a.gap_lg]}>
        <View style={[styles.container, completed && styles.center]}>
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
    </ScreenTransition>
  )
}

const styles = StyleSheet.create({
  error: {
    borderRadius: 6,
    marginTop: 10,
  },
  // @ts-expect-error: Suppressing error due to incomplete `ViewStyle` type definition in react-native-web, missing `cursor` prop as discussed in https://github.com/necolas/react-native-web/issues/832.
  touchable: {
    ...(isWeb && {cursor: 'pointer'}),
  },
  container: {
    minHeight: 500,
    width: '100%',
    paddingBottom: 20,
    overflow: 'hidden',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
