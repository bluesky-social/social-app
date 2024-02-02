import React, {useState} from 'react'
import {ActivityIndicator, SafeAreaView, StyleSheet, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {ScrollView, TextInput} from './util'
import {Text} from '../util/text/Text'
import {Button} from '../util/forms/Button'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {s, colors} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {isWeb} from 'platform/detection'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {cleanError, isNetworkError} from 'lib/strings/errors'
import {checkAndFormatCode} from 'lib/strings/password'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useModalControls} from '#/state/modals'
import {useSession, getAgent} from '#/state/session'
import * as EmailValidator from 'email-validator'
import {logger} from '#/logger'

enum Stages {
  RequestCode,
  ChangePassword,
  Done,
}

export const snapPoints = ['90%']

export function Component() {
  const pal = usePalette('default')
  const {currentAccount} = useSession()
  const {_} = useLingui()
  const [stage, setStage] = useState<Stages>(Stages.RequestCode)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [resetCode, setResetCode] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [error, setError] = useState<string>('')
  const {isMobile} = useWebMediaQueries()
  const {closeModal} = useModalControls()
  const agent = getAgent()

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
    const formattedCode = checkAndFormatCode(resetCode)
    // TODO Better password strength check
    if (!formattedCode || !newPassword) {
      setError('You have entered an invalid code.')
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
    const formattedCode = checkAndFormatCode(resetCode)
    if (!formattedCode) {
      setError('You have entered an invalid code.')
      return
    }
    setResetCode(formattedCode)
  }

  return (
    <SafeAreaView style={[pal.view, s.flex1]}>
      <ScrollView
        testID="changePasswordModal"
        style={[s.flex1, isMobile && {paddingHorizontal: 18}]}>
        <View style={styles.titleSection}>
          <Text type="title-lg" style={[pal.text, styles.title]}>
            {stage !== Stages.Done ? 'Change Password' : 'Password Changed'}
          </Text>
        </View>

        <Text type="lg" style={[pal.textLight, {marginBottom: 10}]}>
          {stage === Stages.RequestCode ? (
            <Trans>
              If you want to change your password, we will send you a code to
              verify that this is your account.
            </Trans>
          ) : stage === Stages.ChangePassword ? (
            <Trans>Enter the code you received to change your password.</Trans>
          ) : (
            <Trans>Your password has been changed successfully!</Trans>
          )}
        </Text>

        {stage === Stages.ChangePassword && (
          <View style={[pal.borderDark, styles.group]}>
            <View
              style={[pal.borderDark, styles.groupContent, styles.noTopBorder]}>
              <FontAwesomeIcon
                icon="ticket"
                style={[pal.textLight, styles.groupContentIcon]}
              />
              <TextInput
                testID="codeInput"
                style={[pal.text, styles.textInput]}
                placeholder="Reset code"
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
            <View style={[pal.borderDark, styles.groupContent]}>
              <FontAwesomeIcon
                icon="lock"
                style={[pal.textLight, styles.groupContentIcon]}
              />
              <TextInput
                testID="codeInput"
                style={[pal.text, styles.textInput]}
                placeholder="New password"
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
                type="default"
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
    marginTop: 10,
  },
  textInput: {
    width: '100%',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  textInputTop: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  textInputBottom: {
    borderTopWidth: 0,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
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
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  noTopBorder: {
    borderTopWidth: 0,
  },
  groupContentIcon: {
    marginLeft: 10,
  },
})
