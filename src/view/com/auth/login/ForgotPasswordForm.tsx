import React, {useState, useEffect} from 'react'
import {
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {ComAtprotoServerDescribeServer} from '@atproto/api'
import * as EmailValidator from 'email-validator'
import {BskyAgent} from '@atproto/api'
import {useAnalytics} from 'lib/analytics/analytics'
import {Text} from '../../util/text/Text'
import {s} from 'lib/styles'
import {toNiceDomain} from 'lib/strings/url-helpers'
import {isNetworkError} from 'lib/strings/errors'
import {usePalette} from 'lib/hooks/usePalette'
import {useTheme} from 'lib/ThemeContext'
import {cleanError} from 'lib/strings/errors'
import {logger} from '#/logger'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {styles} from './styles'
import {useModalControls} from '#/state/modals'

type ServiceDescription = ComAtprotoServerDescribeServer.OutputSchema

export const ForgotPasswordForm = ({
  error,
  serviceUrl,
  serviceDescription,
  setError,
  setServiceUrl,
  onPressBack,
  onEmailSent,
}: {
  error: string
  serviceUrl: string
  serviceDescription: ServiceDescription | undefined
  setError: (v: string) => void
  setServiceUrl: (v: string) => void
  onPressBack: () => void
  onEmailSent: () => void
}) => {
  const pal = usePalette('default')
  const theme = useTheme()
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')
  const {screen} = useAnalytics()
  const {_} = useLingui()
  const {openModal} = useModalControls()

  useEffect(() => {
    screen('Signin:ForgotPassword')
  }, [screen])

  const onPressSelectService = () => {
    openModal({
      name: 'server-input',
      initialService: serviceUrl,
      onSelect: setServiceUrl,
    })
  }

  const onPressNext = async () => {
    if (!EmailValidator.validate(email)) {
      return setError(_(msg`Your email appears to be invalid.`))
    }

    setError('')
    setIsProcessing(true)

    try {
      const agent = new BskyAgent({service: serviceUrl})
      await agent.com.atproto.server.requestPasswordReset({email})
      onEmailSent()
    } catch (e: any) {
      const errMsg = e.toString()
      logger.warn('Failed to request password reset', {error: e})
      setIsProcessing(false)
      if (isNetworkError(e)) {
        setError(
          _(
            msg`Unable to contact your service. Please check your Internet connection.`,
          ),
        )
      } else {
        setError(cleanError(errMsg))
      }
    }
  }

  return (
    <>
      <View>
        <Text type="title-lg" style={[pal.text, styles.screenTitle]}>
          <Trans>Reset password</Trans>
        </Text>
        <Text type="md" style={[pal.text, styles.instructions]}>
          <Trans>
            Enter the email you used to create your account. We'll send you a
            "reset code" so you can set a new password.
          </Trans>
        </Text>
        <View
          testID="forgotPasswordView"
          style={[pal.borderDark, pal.view, styles.group]}>
          <TouchableOpacity
            testID="forgotPasswordSelectServiceButton"
            style={[pal.borderDark, styles.groupContent, styles.noTopBorder]}
            onPress={onPressSelectService}
            accessibilityRole="button"
            accessibilityLabel={_(msg`Hosting provider`)}
            accessibilityHint={_(
              msg`Sets hosting provider for password reset`,
            )}>
            <FontAwesomeIcon
              icon="globe"
              style={[pal.textLight, styles.groupContentIcon]}
            />
            <Text style={[pal.text, styles.textInput]} numberOfLines={1}>
              {toNiceDomain(serviceUrl)}
            </Text>
            <View style={[pal.btn, styles.textBtnFakeInnerBtn]}>
              <FontAwesomeIcon
                icon="pen"
                size={12}
                style={pal.text as FontAwesomeIconStyle}
              />
            </View>
          </TouchableOpacity>
          <View style={[pal.borderDark, styles.groupContent]}>
            <FontAwesomeIcon
              icon="envelope"
              style={[pal.textLight, styles.groupContentIcon]}
            />
            <TextInput
              testID="forgotPasswordEmail"
              style={[pal.text, styles.textInput]}
              placeholder={_(msg`Email address`)}
              placeholderTextColor={pal.colors.textLight}
              autoCapitalize="none"
              autoFocus
              autoCorrect={false}
              keyboardAppearance={theme.colorScheme}
              value={email}
              onChangeText={setEmail}
              editable={!isProcessing}
              accessibilityLabel={_(msg`Email`)}
              accessibilityHint={_(msg`Sets email for password reset`)}
            />
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
          {!serviceDescription || isProcessing ? (
            <ActivityIndicator />
          ) : !email ? (
            <Text type="xl-bold" style={[pal.link, s.pr5, styles.dimmed]}>
              <Trans>Next</Trans>
            </Text>
          ) : (
            <TouchableOpacity
              testID="newPasswordButton"
              onPress={onPressNext}
              accessibilityRole="button"
              accessibilityLabel={_(msg`Go to next`)}
              accessibilityHint={_(msg`Navigates to the next screen`)}>
              <Text type="xl-bold" style={[pal.link, s.pr5]}>
                <Trans>Next</Trans>
              </Text>
            </TouchableOpacity>
          )}
          {!serviceDescription || isProcessing ? (
            <Text type="xl" style={[pal.textLight, s.pl10]}>
              <Trans>Processing...</Trans>
            </Text>
          ) : undefined}
        </View>
      </View>
    </>
  )
}
