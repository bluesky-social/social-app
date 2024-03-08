import React from 'react'
import {useTheme} from '#/alf'
import {useLingui} from '@lingui/react'
import {ActivityIndicator, StyleSheet, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useSignupContext, useSubmitSignup} from '#/screens/Signup/state'
import {createFullHandle} from 'lib/strings/handles'
import {isWeb} from 'platform/detection'
import {CaptchaWebView} from 'view/com/auth/create/CaptchaWebView'
import {ErrorMessage} from 'view/com/util/error/ErrorMessage'
import {nanoid} from 'nanoid/non-secure'

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
    <View>
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

      {state.error ? (
        <ErrorMessage message={state.error} style={styles.error} />
      ) : undefined}
    </View>
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
