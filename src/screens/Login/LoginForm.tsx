import React, {useState, useRef} from 'react'
import {
  ActivityIndicator,
  Keyboard,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import {ComAtprotoServerDescribeServer} from '@atproto/api'
import {Trans, msg} from '@lingui/macro'

import {useAnalytics} from 'lib/analytics/analytics'
import {s} from 'lib/styles'
import {createFullHandle} from 'lib/strings/handles'
import {toNiceDomain} from 'lib/strings/url-helpers'
import {isNetworkError} from 'lib/strings/errors'
import {useSessionApi} from '#/state/session'
import {cleanError} from 'lib/strings/errors'
import {logger} from '#/logger'
import {styles} from '../../view/com/auth/login/styles'
import {useLingui} from '@lingui/react'
import {useDialogControl} from '#/components/Dialog'
import {ServerInputDialog} from '../../view/com/auth/server-input'
import {Button} from '#/components/Button'
import {isAndroid} from '#/platform/detection'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import * as TextField from '#/components/forms/TextField'
import {At_Stroke2_Corner0_Rounded as At} from '#/components/icons/At'
import {Lock_Stroke2_Corner0_Rounded as Lock} from '#/components/icons/Lock'
import {Globe_Stroke2_Corner0_Rounded as Globe} from '#/components/icons/Globe'
import {Pencil_Stroke2_Corner0_Rounded as Pencil} from '#/components/icons/Pencil'
import {Warning_Stroke2_Corner0_Rounded as Warning} from '#/components/icons/Warning'

type ServiceDescription = ComAtprotoServerDescribeServer.OutputSchema

export const LoginForm = ({
  error,
  serviceUrl,
  serviceDescription,
  initialHandle,
  setError,
  setServiceUrl,
  onPressRetryConnect,
  onPressBack,
}: {
  error: string
  serviceUrl: string
  serviceDescription: ServiceDescription | undefined
  initialHandle: string
  setError: (v: string) => void
  setServiceUrl: (v: string) => void
  onPressRetryConnect: () => void
  onPressBack: () => void
  onPressForgotPassword: () => void
}) => {
  const {track} = useAnalytics()
  const t = useTheme()
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [identifier, setIdentifier] = useState<string>(initialHandle)
  const [password, setPassword] = useState<string>('')
  const passwordInputRef = useRef<TextInput>(null)
  const {_} = useLingui()
  const {login} = useSessionApi()
  const serverInputControl = useDialogControl()
  const {gtMobile} = useBreakpoints()

  const onPressSelectService = () => {
    serverInputControl.open()
    Keyboard.dismiss()
    track('Signin:PressedSelectService')
  }

  const onPressNext = async () => {
    Keyboard.dismiss()
    setError('')
    setIsProcessing(true)

    try {
      // try to guess the handle if the user just gave their own username
      let fullIdent = identifier
      if (
        !identifier.includes('@') && // not an email
        !identifier.includes('.') && // not a domain
        serviceDescription &&
        serviceDescription.availableUserDomains.length > 0
      ) {
        let matched = false
        for (const domain of serviceDescription.availableUserDomains) {
          if (fullIdent.endsWith(domain)) {
            matched = true
          }
        }
        if (!matched) {
          fullIdent = createFullHandle(
            identifier,
            serviceDescription.availableUserDomains[0],
          )
        }
      }

      // TODO remove double login
      await login({
        service: serviceUrl,
        identifier: fullIdent,
        password,
      })
    } catch (e: any) {
      const errMsg = e.toString()
      setIsProcessing(false)
      if (errMsg.includes('Authentication Required')) {
        logger.debug('Failed to login due to invalid credentials', {
          error: errMsg,
        })
        setError(_(msg`Invalid username or password`))
      } else if (isNetworkError(e)) {
        logger.warn('Failed to login due to network error', {error: errMsg})
        setError(
          _(
            msg`Unable to contact your service. Please check your Internet connection.`,
          ),
        )
      } else {
        logger.warn('Failed to login', {error: errMsg})
        setError(cleanError(errMsg))
      }
    }
  }

  const isReady = !!serviceDescription && !!identifier && !!password
  return (
    <View testID="loginForm" style={[a.gap_lg, !gtMobile && a.px_lg]}>
      <ServerInputDialog
        control={serverInputControl}
        onSelect={setServiceUrl}
      />

      <View>
        <TextField.Label>
          <Trans>Hosting provider</Trans>
        </TextField.Label>
        <TouchableOpacity
          accessibilityRole="button"
          style={[
            a.w_full,
            a.flex_row,
            a.align_center,
            a.rounded_sm,
            a.px_md,
            a.gap_xs,
            {paddingVertical: isAndroid ? 14 : 9},
            t.atoms.bg_contrast_25,
          ]}
          onPress={onPressSelectService}>
          <TextField.Icon icon={Globe} />
          <Text style={[a.text_md]}>{toNiceDomain(serviceUrl)}</Text>
          <View
            style={[
              a.rounded_sm,
              t.atoms.bg_contrast_100,
              {marginLeft: 'auto', left: 6, padding: 6},
            ]}>
            <Pencil
              style={{color: t.palette.contrast_500}}
              height={18}
              width={18}
            />
          </View>
        </TouchableOpacity>
      </View>
      <View>
        <TextField.Label>
          <Trans>Account</Trans>
        </TextField.Label>
        <TextField.Root>
          <TextField.Icon icon={At} />
          <TextField.Input
            testID="loginUsernameInput"
            label={_(msg`Username or email address`)}
            autoCapitalize="none"
            autoFocus
            autoCorrect={false}
            autoComplete="username"
            returnKeyType="next"
            textContentType="username"
            onSubmitEditing={() => {
              passwordInputRef.current?.focus()
            }}
            blurOnSubmit={false} // prevents flickering due to onSubmitEditing going to next field
            value={identifier}
            onChangeText={str =>
              setIdentifier((str || '').toLowerCase().trim())
            }
            editable={!isProcessing}
            accessibilityHint={_(
              msg`Input the username or email address you used at signup`,
            )}
          />
        </TextField.Root>
      </View>
      <View>
        <TextField.Root>
          <TextField.Icon icon={Lock} />
          <TextField.Input
            testID="loginPasswordInput"
            inputRef={passwordInputRef}
            label={_(msg`Password`)}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password"
            returnKeyType="done"
            enablesReturnKeyAutomatically={true}
            secureTextEntry={true}
            textContentType="password"
            clearButtonMode="while-editing"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={onPressNext}
            blurOnSubmit={false} // HACK: https://github.com/facebook/react-native/issues/21911#issuecomment-558343069 Keyboard blur behavior is now handled in onSubmitEditing
            editable={!isProcessing}
            accessibilityHint={
              identifier === ''
                ? _(msg`Input your password`)
                : _(msg`Input the password tied to ${identifier}`)
            }
          />
          {/* <TouchableOpacity
            testID="forgotPasswordButton"
            style={styles.textInputInnerBtn}
            onPress={onPressForgotPassword}
            accessibilityRole="button"
            accessibilityLabel={_(msg`Forgot password`)}
            accessibilityHint={_(msg`Opens password reset form`)}>
            <Text style={pal.link}>
              <Trans>Forgot</Trans>
            </Text>
          </TouchableOpacity> */}
        </TextField.Root>
      </View>
      {error ? (
        <View style={[styles.error, {marginHorizontal: 0}]}>
          <Warning style={s.white} size="sm" />
          <View style={(a.flex_1, a.ml_sm)}>
            <Text style={[s.white, s.bold]}>{error}</Text>
          </View>
        </View>
      ) : undefined}
      <View style={[a.flex_row, a.align_center]}>
        <Button
          label={_(msg`Back`)}
          variant="solid"
          color="secondary"
          size="small"
          onPress={onPressBack}>
          {_(msg`Back`)}
        </Button>
        <View style={s.flex1} />
        {!serviceDescription && error ? (
          <Button
            testID="loginRetryButton"
            label={_(msg`Retry`)}
            accessibilityHint={_(msg`Retries login`)}
            variant="solid"
            color="secondary"
            size="small"
            onPress={onPressRetryConnect}>
            {_(msg`Retry`)}
          </Button>
        ) : !serviceDescription ? (
          <>
            <ActivityIndicator />
            <Text style={[t.atoms.text_contrast_high, a.pl_md]}>
              <Trans>Connecting...</Trans>
            </Text>
          </>
        ) : isProcessing ? (
          <ActivityIndicator />
        ) : isReady ? (
          <Button
            label={_(msg`Next`)}
            accessibilityHint={_(msg`Navigates to the next screen`)}
            variant="solid"
            color="primary"
            size="small"
            onPress={onPressNext}>
            {_(msg`Next`)}
          </Button>
        ) : undefined}
      </View>
    </View>
  )
}
