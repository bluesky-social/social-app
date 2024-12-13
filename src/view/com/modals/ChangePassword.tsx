import {useState} from 'react'
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import * as EmailValidator from 'email-validator'

import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {cleanError, isNetworkError} from '#/lib/strings/errors'
import {checkAndFormatResetCode} from '#/lib/strings/password'
import {colors, s} from '#/lib/styles'
import {logger} from '#/logger'
import {isAndroid, isWeb} from '#/platform/detection'
import {useModalControls} from '#/state/modals'
import {useAgent, useSession} from '#/state/session'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {Button} from '../util/forms/Button'
import {Text} from '../util/text/Text'
import {ScrollView} from './util'
import {TextInput} from './util'

enum Stages {
  RequestCode,
  ChangePassword,
  Done,
}

export const snapPoints = isAndroid ? ['90%'] : ['45%']

export function Component() {
  const pal = usePalette('default')
  const {currentAccount} = useSession()
  const agent = useAgent()
  const {_} = useLingui()
  const [stage, setStage] = useState<Stages>(Stages.RequestCode)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [resetCode, setResetCode] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [error, setError] = useState<string>('')
  const {isMobile} = useWebMediaQueries()
  const {closeModal} = useModalControls()

  const onRequestCode = async () => {
    if (
      !currentAccount?.email ||
      !EmailValidator.validate(currentAccount.email)
    ) {
      return setError(_(msg`Your email appears to be invalid.`))
    }

    setError('')
    setIsProcessing(true)
    try {
      await agent.com.atproto.server.requestPasswordReset({
        email: currentAccount.email,
      })
      setStage(Stages.ChangePassword)
    } catch (e: any) {
      const errMsg = e.toString()
      logger.warn('Failed to request password reset', {error: e})
      if (isNetworkError(e)) {
        setError(
          _(
            msg`Unable to contact your service. Please check your Internet connection.`,
          ),
        )
      } else {
        setError(cleanError(errMsg))
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const onChangePassword = async () => {
    const formattedCode = checkAndFormatResetCode(resetCode)
    // TODO Better password strength check
    if (!formattedCode || !newPassword) {
      setError(
        _(
          msg`You have entered an invalid code. It should look like XXXXX-XXXXX.`,
        ),
      )
      return
    }

    setError('')
    setIsProcessing(true)
    try {
      await agent.com.atproto.server.resetPassword({
        token: formattedCode,
        password: newPassword,
      })
      setStage(Stages.Done)
    } catch (e: any) {
      const errMsg = e.toString()
      logger.warn('Failed to set new password', {error: e})
      if (isNetworkError(e)) {
        setError(
          'Unable to contact your service. Please check your Internet connection.',
        )
      } else {
        setError(cleanError(errMsg))
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const onBlur = () => {
    const formattedCode = checkAndFormatResetCode(resetCode)
    if (!formattedCode) {
      setError(
        _(
          msg`You have entered an invalid code. It should look like XXXXX-XXXXX.`,
        ),
      )
      return
    }
    setResetCode(formattedCode)
  }

  return (
    <SafeAreaView style={[pal.view, s.flex1]}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          isMobile && styles.containerMobile,
        ]}
        keyboardShouldPersistTaps="handled">
        <View>
          <View style={styles.titleSection}>
            <Text type="title-lg" style={[pal.text, styles.title]}>
              {stage !== Stages.Done
                ? _(msg`Change Password`)
                : _(msg`Password Changed`)}
            </Text>
          </View>

          <Text type="lg" style={[pal.textLight, {marginBottom: 10}]}>
            {stage === Stages.RequestCode ? (
              <Trans>
                If you want to change your password, we will send you a code to
                verify that this is your account.
              </Trans>
            ) : stage === Stages.ChangePassword ? (
              <Trans>
                Enter the code you received to change your password.
              </Trans>
            ) : (
              <Trans>Your password has been changed successfully!</Trans>
            )}
          </Text>

          {stage === Stages.RequestCode && (
            <View style={[s.flexRow, s.justifyCenter, s.mt10]}>
              <TouchableOpacity
                testID="skipSendEmailButton"
                onPress={() => setStage(Stages.ChangePassword)}
                accessibilityRole="button"
                accessibilityLabel={_(msg`Go to next`)}
                accessibilityHint={_(msg`Navigates to the next screen`)}>
                <Text type="xl" style={[pal.link, s.pr5]}>
                  <Trans>Already have a code?</Trans>
                </Text>
              </TouchableOpacity>
            </View>
          )}
          {stage === Stages.ChangePassword && (
            <View style={[pal.border, styles.group]}>
              <View style={[styles.groupContent]}>
                <FontAwesomeIcon
                  icon="ticket"
                  style={[pal.textLight, styles.groupContentIcon]}
                />
                <TextInput
                  testID="codeInput"
                  style={[pal.text, styles.textInput]}
                  placeholder={_(msg`Reset code`)}
                  placeholderTextColor={pal.colors.textLight}
                  value={resetCode}
                  onChangeText={setResetCode}
                  onFocus={() => setError('')}
                  onBlur={onBlur}
                  accessible={true}
                  accessibilityLabel={_(msg`Reset Code`)}
                  accessibilityHint=""
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                />
              </View>
              <View
                style={[
                  pal.borderDark,
                  styles.groupContent,
                  styles.groupBottom,
                ]}>
                <FontAwesomeIcon
                  icon="lock"
                  style={[pal.textLight, styles.groupContentIcon]}
                />
                <TextInput
                  testID="codeInput"
                  style={[pal.text, styles.textInput]}
                  placeholder={_(msg`New password`)}
                  placeholderTextColor={pal.colors.textLight}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  accessible={true}
                  accessibilityLabel={_(msg`New Password`)}
                  accessibilityHint=""
                  autoCapitalize="none"
                  autoComplete="new-password"
                />
              </View>
            </View>
          )}
          {error ? (
            <ErrorMessage message={error} style={styles.error} />
          ) : undefined}
        </View>
        <View style={[styles.btnContainer]}>
          {isProcessing ? (
            <View style={styles.btn}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : (
            <View style={{gap: 6}}>
              {stage === Stages.RequestCode && (
                <Button
                  testID="requestChangeBtn"
                  type="primary"
                  onPress={onRequestCode}
                  accessibilityLabel={_(msg`Request Code`)}
                  accessibilityHint=""
                  label={_(msg`Request Code`)}
                  labelContainerStyle={{justifyContent: 'center', padding: 4}}
                  labelStyle={[s.f18]}
                />
              )}
              {stage === Stages.ChangePassword && (
                <Button
                  testID="confirmBtn"
                  type="primary"
                  onPress={onChangePassword}
                  accessibilityLabel={_(msg`Next`)}
                  accessibilityHint=""
                  label={_(msg`Next`)}
                  labelContainerStyle={{justifyContent: 'center', padding: 4}}
                  labelStyle={[s.f18]}
                />
              )}
              <Button
                testID="cancelBtn"
                type={stage !== Stages.Done ? 'default' : 'primary'}
                onPress={() => {
                  closeModal()
                }}
                accessibilityLabel={
                  stage !== Stages.Done ? _(msg`Cancel`) : _(msg`Close`)
                }
                accessibilityHint=""
                label={stage !== Stages.Done ? _(msg`Cancel`) : _(msg`Close`)}
                labelContainerStyle={{justifyContent: 'center', padding: 4}}
                labelStyle={[s.f18]}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
  },
  containerMobile: {
    paddingHorizontal: 18,
    paddingBottom: 35,
  },
  titleSection: {
    paddingTop: isWeb ? 0 : 4,
    paddingBottom: isWeb ? 14 : 10,
  },
  title: {
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 5,
  },
  error: {
    borderRadius: 6,
  },
  textInput: {
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    padding: 14,
    backgroundColor: colors.blue3,
  },
  btnContainer: {
    paddingTop: 20,
  },
  group: {
    borderWidth: 1,
    borderRadius: 10,
    marginVertical: 20,
  },
  groupLabel: {
    paddingHorizontal: 20,
    paddingBottom: 5,
  },
  groupContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupBottom: {
    borderTopWidth: 1,
  },
  groupContentIcon: {
    marginLeft: 10,
  },
})
