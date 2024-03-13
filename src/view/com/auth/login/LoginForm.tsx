import React, {useState, useRef} from 'react'
import {
  ActivityIndicator,
  Keyboard,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {ComAtprotoServerDescribeServer} from '@atproto/api'
import {useAnalytics} from 'lib/analytics/analytics'
import {Text} from '../../util/text/Text'
import {s} from 'lib/styles'
import {createFullHandle} from 'lib/strings/handles'
import {toNiceDomain} from 'lib/strings/url-helpers'
import {isNetworkError} from 'lib/strings/errors'
import {usePalette} from 'lib/hooks/usePalette'
import {useTheme} from 'lib/ThemeContext'
import {useSessionApi} from '#/state/session'
import {cleanError} from 'lib/strings/errors'
import {logger} from '#/logger'
import {Trans, msg} from '@lingui/macro'
import {styles} from './styles'
import {useLingui} from '@lingui/react'
import {useDialogControl} from '#/components/Dialog'

import {ServerInputDialog} from '../server-input'

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
  onPressForgotPassword,
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
  const pal = usePalette('default')
  const theme = useTheme()
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [identifier, setIdentifier] = useState<string>(initialHandle)
  const [password, setPassword] = useState<string>('')
  const passwordInputRef = useRef<TextInput>(null)
  const {_} = useLingui()
  const {login} = useSessionApi()
  const serverInputControl = useDialogControl()

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
    <View testID="loginForm">
      <ServerInputDialog
        control={serverInputControl}
        onSelect={setServiceUrl}
      />

      <Text type="sm-bold" style={[pal.text, styles.groupLabel]}>
        <Trans>Sign into</Trans>
      </Text>
      <View style={[pal.borderDark, styles.group]}>
        <View style={[pal.borderDark, styles.groupContent, styles.noTopBorder]}>
          <FontAwesomeIcon
            icon="globe"
            style={[pal.textLight, styles.groupContentIcon]}
          />
          <TouchableOpacity
            testID="loginSelectServiceButton"
            style={styles.textBtn}
            onPress={onPressSelectService}
            accessibilityRole="button"
            accessibilityLabel={_(msg`Select service`)}
            accessibilityHint={_(msg`Sets server for the Bluesky client`)}>
            <Text type="xl" style={[pal.text, styles.textBtnLabel]}>
              {toNiceDomain(serviceUrl)}
            </Text>
            <View style={[pal.btn, styles.textBtnFakeInnerBtn]}>
              <FontAwesomeIcon
                icon="pen"
                size={12}
                style={pal.textLight as FontAwesomeIconStyle}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>
      <Text type="sm-bold" style={[pal.text, styles.groupLabel]}>
        <Trans>Account</Trans>
      </Text>
      <View style={[pal.borderDark, styles.group]}>
        <View style={[pal.borderDark, styles.groupContent, styles.noTopBorder]}>
          <FontAwesomeIcon
            icon="at"
            style={[pal.textLight, styles.groupContentIcon]}
          />
          <TextInput
            testID="loginUsernameInput"
            style={[pal.text, styles.textInput]}
            placeholder={_(msg`Username or email address`)}
            placeholderTextColor={pal.colors.textLight}
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
            keyboardAppearance={theme.colorScheme}
            value={identifier}
            onChangeText={str =>
              setIdentifier((str || '').toLowerCase().trim())
            }
            editable={!isProcessing}
            accessibilityLabel={_(msg`Username or email address`)}
            accessibilityHint={_(
              msg`Input the username or email address you used at signup`,
            )}
          />
        </View>
        <View style={[pal.borderDark, styles.groupContent]}>
          <FontAwesomeIcon
            icon="lock"
            style={[pal.textLight, styles.groupContentIcon]}
          />
          <TextInput
            testID="loginPasswordInput"
            ref={passwordInputRef}
            style={[pal.text, styles.textInput]}
            placeholder="Password"
            placeholderTextColor={pal.colors.textLight}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password"
            returnKeyType="done"
            enablesReturnKeyAutomatically={true}
            keyboardAppearance={theme.colorScheme}
            secureTextEntry={true}
            textContentType="password"
            clearButtonMode="while-editing"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={onPressNext}
            blurOnSubmit={false} // HACK: https://github.com/facebook/react-native/issues/21911#issuecomment-558343069 Keyboard blur behavior is now handled in onSubmitEditing
            editable={!isProcessing}
            accessibilityLabel={_(msg`Password`)}
            accessibilityHint={
              identifier === ''
                ? _(msg`Input your password`)
                : _(msg`Input the password tied to ${identifier}`)
            }
          />
          <TouchableOpacity
            testID="forgotPasswordButton"
            style={styles.textInputInnerBtn}
            onPress={onPressForgotPassword}
            accessibilityRole="button"
            accessibilityLabel={_(msg`Forgot password`)}
            accessibilityHint={_(msg`Opens password reset form`)}>
            <Text style={pal.link}>
              <Trans>Forgot</Trans>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {error ? (
        <View style={styles.error}>
          <View style={styles.errorIcon}>
            <FontAwesomeIcon icon="exclamation" style={s.white} size={10} />
          </View>
          <View style={s.flex1}>
            <Text style={[s.white, s.bold]}>{error}</Text>
          </View>
        </View>
      ) : undefined}
      <View style={[s.flexRow, s.alignCenter, s.pl20, s.pr20]}>
        <TouchableOpacity onPress={onPressBack} accessibilityRole="button">
          <Text type="xl" style={[pal.link, s.pl5]}>
            <Trans>Back</Trans>
          </Text>
        </TouchableOpacity>
        <View style={s.flex1} />
        {!serviceDescription && error ? (
          <TouchableOpacity
            testID="loginRetryButton"
            onPress={onPressRetryConnect}
            accessibilityRole="button"
            accessibilityLabel={_(msg`Retry`)}
            accessibilityHint={_(msg`Retries login`)}>
            <Text type="xl-bold" style={[pal.link, s.pr5]}>
              <Trans>Retry</Trans>
            </Text>
          </TouchableOpacity>
        ) : !serviceDescription ? (
          <>
            <ActivityIndicator />
            <Text type="xl" style={[pal.textLight, s.pl10]}>
              <Trans>Connecting...</Trans>
            </Text>
          </>
        ) : isProcessing ? (
          <ActivityIndicator />
        ) : isReady ? (
          <TouchableOpacity
            testID="loginNextButton"
            onPress={onPressNext}
            accessibilityRole="button"
            accessibilityLabel={_(msg`Go to next`)}
            accessibilityHint={_(msg`Navigates to the next screen`)}>
            <Text type="xl-bold" style={[pal.link, s.pr5]}>
              <Trans>Next</Trans>
            </Text>
          </TouchableOpacity>
        ) : undefined}
      </View>
    </View>
  )
}
