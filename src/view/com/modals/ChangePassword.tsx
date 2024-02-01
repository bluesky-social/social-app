import React, {useState} from 'react'
import {ActivityIndicator, SafeAreaView, StyleSheet, View} from 'react-native'
import {ScrollView, TextInput} from './util'
import {Text} from '../util/text/Text'
import {Button} from '../util/forms/Button'
import {ErrorMessage} from '../util/error/ErrorMessage'
import * as Toast from '../util/Toast'
import {s, colors} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {isWeb} from 'platform/detection'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {cleanError, isNetworkError} from 'lib/strings/errors'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useModalControls} from '#/state/modals'
import {useSession, useSessionApi, getAgent} from '#/state/session'
import * as EmailValidator from 'email-validator'
import {BskyAgent} from '@atproto/api'
import {logger} from '#/logger'

enum Stages {
  RequestCode,
  ResetPassword,
  Done,
}

export const snapPoints = ['90%']

export function Component({loggedIn = false}: {loggedIn: boolean}) {
  const pal = usePalette('default')
  const {currentAccount} = useSession()
  const {updateCurrentAccount} = useSessionApi()
  const {_} = useLingui()
  const [stage, setStage] = useState<Stages>(Stages.RequestCode)
  const [email, setEmail] = useState<string>(
    loggedIn && currentAccount?.email ? currentAccount.email : '',
  )
  const [confirmationCode, setConfirmationCode] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const {isMobile} = useWebMediaQueries()
  const {openModal, closeModal} = useModalControls()

  const onRequestCode = async () => {
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

  const onEmailSent = () => {}

  return (
    <SafeAreaView style={[pal.view, s.flex1]}>
      <ScrollView
        testID="changePasswordModal"
        style={[s.flex1, isMobile && {paddingHorizontal: 18}]}>
        <View style={styles.titleSection}>
          <Text type="title-lg" style={[pal.text, styles.title]}>
            {stage === Stages.RequestCode ? _(msg`Change Your Password`) : ''}
            {stage === Stages.ConfirmCode ? _(msg`Security Step Required`) : ''}
            {stage === Stages.Done ? _(msg`Email Updated`) : ''}
          </Text>
        </View>

        <Text type="lg" style={[pal.textLight, {marginBottom: 10}]}>
          {stage === Stages.RequestCode && loggedIn ? (
            <Trans>
              We'll send you a code to verify that this is your account so you
              can set a new password.
            </Trans>
          ) : stage === Stages.RequestCode && !loggedIn ? (
            <Trans>
              Enter the email you used to create your account. We'll send you a
              "reset code" so you can set a new password.
            </Trans>
          ) : stage === Stages.ResetPassword ? (
            <Trans>
              You will receive an email with a "reset code." Enter that code
              here, then enter your new password.
            </Trans>
          ) : (
            <Trans>Your password has been changed successfully!</Trans>
          )}
        </Text>

        {stage === Stages.InputEmail && (
          <TextInput
            testID="emailInput"
            style={[styles.textInput, pal.border, pal.text]}
            placeholder="alice@mail.com"
            placeholderTextColor={pal.colors.textLight}
            value={email}
            onChangeText={setEmail}
            accessible={true}
            accessibilityLabel={_(msg`Email`)}
            accessibilityHint=""
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
          />
        )}
        {stage === Stages.ConfirmCode && (
          <TextInput
            testID="confirmCodeInput"
            style={[styles.textInput, pal.border, pal.text]}
            placeholder="XXXXX-XXXXX"
            placeholderTextColor={pal.colors.textLight}
            value={confirmationCode}
            onChangeText={setConfirmationCode}
            accessible={true}
            accessibilityLabel={_(msg`Confirmation code`)}
            accessibilityHint=""
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
          />
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
              {stage === Stages.InputEmail && (
                <Button
                  testID="requestChangeBtn"
                  type="primary"
                  onPress={onRequestChange}
                  accessibilityLabel={_(msg`Request Change`)}
                  accessibilityHint=""
                  label={_(msg`Request Change`)}
                  labelContainerStyle={{justifyContent: 'center', padding: 4}}
                  labelStyle={[s.f18]}
                />
              )}
              {stage === Stages.ConfirmCode && (
                <Button
                  testID="confirmBtn"
                  type="primary"
                  onPress={onConfirm}
                  accessibilityLabel={_(msg`Confirm Change`)}
                  accessibilityHint=""
                  label={_(msg`Confirm Change`)}
                  labelContainerStyle={{justifyContent: 'center', padding: 4}}
                  labelStyle={[s.f18]}
                />
              )}
              {stage === Stages.Done && (
                <Button
                  testID="verifyBtn"
                  type="primary"
                  onPress={onVerify}
                  accessibilityLabel={_(msg`Verify New Email`)}
                  accessibilityHint=""
                  label={_(msg`Verify New Email`)}
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
                accessibilityLabel={_(msg`Cancel`)}
                accessibilityHint=""
                label={_(msg`Cancel`)}
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
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 6,
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
})
