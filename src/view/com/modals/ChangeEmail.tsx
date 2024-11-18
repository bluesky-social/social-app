import {useState} from 'react'
import {ActivityIndicator, SafeAreaView, StyleSheet, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {cleanError} from '#/lib/strings/errors'
import {colors, s} from '#/lib/styles'
import {isWeb} from '#/platform/detection'
import {useModalControls} from '#/state/modals'
import {useAgent, useSession} from '#/state/session'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {Button} from '../util/forms/Button'
import {Text} from '../util/text/Text'
import * as Toast from '../util/Toast'
import {ScrollView, TextInput} from './util'

enum Stages {
  InputEmail,
  ConfirmCode,
  Done,
}

export const snapPoints = ['90%']

export function Component() {
  const pal = usePalette('default')
  const {currentAccount} = useSession()
  const agent = useAgent()
  const {_} = useLingui()
  const [stage, setStage] = useState<Stages>(Stages.InputEmail)
  const [email, setEmail] = useState<string>(currentAccount?.email || '')
  const [confirmationCode, setConfirmationCode] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const {isMobile} = useWebMediaQueries()
  const {openModal, closeModal} = useModalControls()

  const onRequestChange = async () => {
    if (email === currentAccount?.email) {
      setError(_(msg`Enter your new email above`))
      return
    }
    setError('')
    setIsProcessing(true)
    try {
      const res = await agent.com.atproto.server.requestEmailUpdate()
      if (res.data.tokenRequired) {
        setStage(Stages.ConfirmCode)
      } else {
        await agent.com.atproto.server.updateEmail({email: email.trim()})
        await agent.resumeSession(agent.session!)
        Toast.show(_(msg`Email updated`))
        setStage(Stages.Done)
      }
    } catch (e) {
      let err = cleanError(String(e))
      // TEMP
      // while rollout is occuring, we're giving a temporary error message
      // you can remove this any time after Oct2023
      // -prf
      if (err === 'email must be confirmed (temporary)') {
        err = _(
          msg`Please confirm your email before changing it. This is a temporary requirement while email-updating tools are added, and it will soon be removed.`,
        )
      }
      setError(err)
    } finally {
      setIsProcessing(false)
    }
  }

  const onConfirm = async () => {
    setError('')
    setIsProcessing(true)
    try {
      await agent.com.atproto.server.updateEmail({
        email: email.trim(),
        token: confirmationCode.trim(),
      })
      await agent.resumeSession(agent.session!)
      Toast.show(_(msg`Email updated`))
      setStage(Stages.Done)
    } catch (e) {
      setError(cleanError(String(e)))
    } finally {
      setIsProcessing(false)
    }
  }

  const onVerify = async () => {
    closeModal()
    openModal({name: 'verify-email'})
  }

  return (
    <SafeAreaView style={[pal.view, s.flex1]}>
      <ScrollView
        testID="changeEmailModal"
        style={[s.flex1, isMobile && {paddingHorizontal: 18}]}>
        <View style={styles.titleSection}>
          <Text type="title-lg" style={[pal.text, styles.title]}>
            {stage === Stages.InputEmail ? _(msg`Change Your Email`) : ''}
            {stage === Stages.ConfirmCode ? _(msg`Security Step Required`) : ''}
            {stage === Stages.Done ? _(msg`Email Updated`) : ''}
          </Text>
        </View>

        <Text type="lg" style={[pal.textLight, {marginBottom: 10}]}>
          {stage === Stages.InputEmail ? (
            <Trans>Enter your new email address below.</Trans>
          ) : stage === Stages.ConfirmCode ? (
            <Trans>
              An email has been sent to your previous address,{' '}
              {currentAccount?.email || '(no email)'}. It includes a
              confirmation code which you can enter below.
            </Trans>
          ) : (
            <Trans>
              Your email has been updated but not verified. As a next step,
              please verify your new email.
            </Trans>
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
