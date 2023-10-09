import React, {useState} from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native'
import {ScrollView, TextInput} from './util'
import {observer} from 'mobx-react-lite'
import {Text} from '../util/text/Text'
import {Button} from '../util/forms/Button'
import {ErrorMessage} from '../util/error/ErrorMessage'
import * as Toast from '../util/Toast'
import {useStores} from 'state/index'
import {s, colors} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {isWeb} from 'platform/detection'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {cleanError} from 'lib/strings/errors'

enum Stages {
  InputEmail,
  ConfirmCode,
  Done,
}

export const snapPoints = ['90%']

export const Component = observer(function Component({}: {}) {
  const pal = usePalette('default')
  const store = useStores()
  const [stage, setStage] = useState<Stages>(Stages.InputEmail)
  const [email, setEmail] = useState<string>(
    store.session.currentSession?.email || '',
  )
  const [confirmationCode, setConfirmationCode] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const {isMobile} = useWebMediaQueries()

  const onRequestChange = async () => {
    if (email === store.session.currentSession?.email) {
      setError('Enter your new email above')
      return
    }
    setError('')
    setIsProcessing(true)
    try {
      const res = await store.agent.com.atproto.server.requestEmailUpdate()
      if (res.data.tokenRequired) {
        setStage(Stages.ConfirmCode)
      } else {
        await store.agent.com.atproto.server.updateEmail({email: email.trim()})
        store.session.updateLocalAccountData({
          email: email.trim(),
          emailConfirmed: false,
        })
        Toast.show('Email updated')
        setStage(Stages.Done)
      }
    } catch (e) {
      let err = cleanError(String(e))
      // TEMP
      // while rollout is occuring, we're giving a temporary error message
      // you can remove this any time after Oct2023
      // -prf
      if (err === 'email must be confirmed (temporary)') {
        err = `Please confirm your email before changing it. This is a temporary requirement while email-updating tools are added, and it will soon be removed.`
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
      await store.agent.com.atproto.server.updateEmail({
        email: email.trim(),
        token: confirmationCode.trim(),
      })
      store.session.updateLocalAccountData({
        email: email.trim(),
        emailConfirmed: false,
      })
      Toast.show('Email updated')
      setStage(Stages.Done)
    } catch (e) {
      setError(cleanError(String(e)))
    } finally {
      setIsProcessing(false)
    }
  }

  const onVerify = async () => {
    store.shell.closeModal()
    store.shell.openModal({name: 'verify-email'})
  }

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[pal.view, styles.container]}>
      <SafeAreaView style={s.flex1}>
        <ScrollView
          testID="changeEmailModal"
          style={[s.flex1, isMobile && {paddingHorizontal: 18}]}>
          <View style={styles.titleSection}>
            <Text type="title-lg" style={[pal.text, styles.title]}>
              {stage === Stages.InputEmail ? 'Change Your Email' : ''}
              {stage === Stages.ConfirmCode ? 'Security Step Required' : ''}
              {stage === Stages.Done ? 'Email Updated' : ''}
            </Text>
          </View>

          <Text type="lg" style={[pal.textLight, {marginBottom: 10}]}>
            {stage === Stages.InputEmail ? (
              <>Enter your new email address below.</>
            ) : stage === Stages.ConfirmCode ? (
              <>
                An email has been sent to your previous address,{' '}
                {store.session.currentSession?.email || ''}. It includes a
                confirmation code which you can enter below.
              </>
            ) : (
              <>
                Your email has been updated but not verified. As a next step,
                please verify your new email.
              </>
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
              accessibilityLabel="Email"
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
              accessibilityLabel="Confirmation code"
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
                    accessibilityLabel="Request Change"
                    accessibilityHint=""
                    label="Request Change"
                    labelContainerStyle={{justifyContent: 'center', padding: 4}}
                    labelStyle={[s.f18]}
                  />
                )}
                {stage === Stages.ConfirmCode && (
                  <Button
                    testID="confirmBtn"
                    type="primary"
                    onPress={onConfirm}
                    accessibilityLabel="Confirm Change"
                    accessibilityHint=""
                    label="Confirm Change"
                    labelContainerStyle={{justifyContent: 'center', padding: 4}}
                    labelStyle={[s.f18]}
                  />
                )}
                {stage === Stages.Done && (
                  <Button
                    testID="verifyBtn"
                    type="primary"
                    onPress={onVerify}
                    accessibilityLabel="Verify New Email"
                    accessibilityHint=""
                    label="Verify New Email"
                    labelContainerStyle={{justifyContent: 'center', padding: 4}}
                    labelStyle={[s.f18]}
                  />
                )}
                <Button
                  testID="cancelBtn"
                  type="default"
                  onPress={() => store.shell.closeModal()}
                  accessibilityLabel="Cancel"
                  accessibilityHint=""
                  label="Cancel"
                  labelContainerStyle={{justifyContent: 'center', padding: 4}}
                  labelStyle={[s.f18]}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: isWeb ? 0 : 40,
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
