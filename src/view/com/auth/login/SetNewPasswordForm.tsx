import React, {useState, useEffect} from 'react'
import {
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {BskyAgent} from '@atproto/api'
import {useAnalytics} from 'lib/analytics/analytics'
import {Text} from '../../util/text/Text'
import {s} from 'lib/styles'
import {isNetworkError} from 'lib/strings/errors'
import {usePalette} from 'lib/hooks/usePalette'
import {useTheme} from 'lib/ThemeContext'
import {cleanError} from 'lib/strings/errors'
import {logger} from '#/logger'
import {styles} from './styles'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

export const SetNewPasswordForm = ({
  error,
  serviceUrl,
  setError,
  onPressBack,
  onPasswordSet,
}: {
  error: string
  serviceUrl: string
  setError: (v: string) => void
  onPressBack: () => void
  onPasswordSet: () => void
}) => {
  const pal = usePalette('default')
  const theme = useTheme()
  const {screen} = useAnalytics()
  const {_} = useLingui()

  useEffect(() => {
    screen('Signin:SetNewPasswordForm')
  }, [screen])

  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [resetCode, setResetCode] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  const onPressNext = async () => {
    setError('')
    setIsProcessing(true)

    try {
      const agent = new BskyAgent({service: serviceUrl})
      const token = resetCode.replace(/\s/g, '')
      await agent.com.atproto.server.resetPassword({
        token,
        password,
      })
      onPasswordSet()
    } catch (e: any) {
      const errMsg = e.toString()
      logger.warn('Failed to set new password', {error: e})
      setIsProcessing(false)
      if (isNetworkError(e)) {
        setError(
          'Unable to contact your service. Please check your Internet connection.',
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
          <Trans>Set new password</Trans>
        </Text>
        <Text type="lg" style={[pal.text, styles.instructions]}>
          <Trans>
            You will receive an email with a "reset code." Enter that code here,
            then enter your new password.
          </Trans>
        </Text>
        <View
          testID="newPasswordView"
          style={[pal.view, pal.borderDark, styles.group]}>
          <View
            style={[pal.borderDark, styles.groupContent, styles.noTopBorder]}>
            <FontAwesomeIcon
              icon="ticket"
              style={[pal.textLight, styles.groupContentIcon]}
            />
            <TextInput
              testID="resetCodeInput"
              style={[pal.text, styles.textInput]}
              placeholder={_(msg`Reset code`)}
              placeholderTextColor={pal.colors.textLight}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardAppearance={theme.colorScheme}
              autoFocus
              value={resetCode}
              onChangeText={setResetCode}
              editable={!isProcessing}
              accessible={true}
              accessibilityLabel={_(msg`Reset code`)}
              accessibilityHint={_(
                msg`Input code sent to your email for password reset`,
              )}
            />
          </View>
          <View style={[pal.borderDark, styles.groupContent]}>
            <FontAwesomeIcon
              icon="lock"
              style={[pal.textLight, styles.groupContentIcon]}
            />
            <TextInput
              testID="newPasswordInput"
              style={[pal.text, styles.textInput]}
              placeholder={_(msg`New password`)}
              placeholderTextColor={pal.colors.textLight}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardAppearance={theme.colorScheme}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!isProcessing}
              accessible={true}
              accessibilityLabel={_(msg`Password`)}
              accessibilityHint={_(msg`Input new password`)}
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
          {isProcessing ? (
            <ActivityIndicator />
          ) : !resetCode || !password ? (
            <Text type="xl-bold" style={[pal.link, s.pr5, styles.dimmed]}>
              <Trans>Next</Trans>
            </Text>
          ) : (
            <TouchableOpacity
              testID="setNewPasswordButton"
              onPress={onPressNext}
              accessibilityRole="button"
              accessibilityLabel={_(msg`Go to next`)}
              accessibilityHint={_(msg`Navigates to the next screen`)}>
              <Text type="xl-bold" style={[pal.link, s.pr5]}>
                <Trans>Next</Trans>
              </Text>
            </TouchableOpacity>
          )}
          {isProcessing ? (
            <Text type="xl" style={[pal.textLight, s.pl10]}>
              <Trans>Updating...</Trans>
            </Text>
          ) : undefined}
        </View>
      </View>
    </>
  )
}
