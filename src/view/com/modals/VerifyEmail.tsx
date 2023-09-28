import React, {useState} from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native'
import {ScrollView, TextInput} from './util'
import {observer} from 'mobx-react-lite'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
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

export const snapPoints = ['90%']

enum Stages {
  Reminder,
  Email,
  ConfirmCode,
}

export const Component = observer(function Component({
  showReminder,
}: {
  showReminder?: boolean
}) {
  const pal = usePalette('default')
  const store = useStores()
  const [stage, setStage] = useState<Stages>(
    showReminder ? Stages.Reminder : Stages.Email,
  )
  const [confirmationCode, setConfirmationCode] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const {isMobile} = useWebMediaQueries()

  const onSendEmail = async () => {
    setError('')
    setIsProcessing(true)
    try {
      await store.agent.com.atproto.server.requestEmailConfirmation()
      setStage(Stages.ConfirmCode)
    } catch (e) {
      setError(cleanError(String(e)))
    } finally {
      setIsProcessing(false)
    }
  }

  const onConfirm = async () => {
    setError('')
    setIsProcessing(true)
    try {
      await store.agent.com.atproto.server.confirmEmail({
        email: (store.session.currentSession?.email || '').trim(),
        token: confirmationCode.trim(),
      })
      store.session.updateLocalAccountData({emailConfirmed: true})
      Toast.show('Email verified')
      store.shell.closeModal()
    } catch (e) {
      setError(cleanError(String(e)))
    } finally {
      setIsProcessing(false)
    }
  }

  const onEmailIncorrect = () => {
    store.shell.closeModal()
    store.shell.openModal({name: 'change-email'})
  }

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[pal.view, styles.container]}>
      <SafeAreaView style={s.flex1}>
        <ScrollView
          testID="verifyEmailModal"
          style={[s.flex1, isMobile && {paddingHorizontal: 18}]}>
          <View style={styles.titleSection}>
            <Text type="title-lg" style={[pal.text, styles.title]}>
              {stage === Stages.Reminder ? 'Please Verify Your Email' : ''}
              {stage === Stages.ConfirmCode ? 'Enter Confirmation Code' : ''}
              {stage === Stages.Email ? 'Verify Your Email' : ''}
            </Text>
          </View>

          <Text type="lg" style={[pal.textLight, {marginBottom: 10}]}>
            {stage === Stages.Reminder ? (
              <>
                Your email has not yet been verified. This is an important
                security step which we recommend.
              </>
            ) : stage === Stages.Email ? (
              <>
                This is important in case you ever need to change your email or
                reset your password.
              </>
            ) : stage === Stages.ConfirmCode ? (
              <>
                An email has been sent to{' '}
                {store.session.currentSession?.email || ''}. It includes a
                confirmation code which you can enter below.
              </>
            ) : (
              ''
            )}
          </Text>

          {stage === Stages.Email ? (
            <>
              <View style={styles.emailContainer}>
                <FontAwesomeIcon
                  icon="envelope"
                  color={pal.colors.text}
                  size={16}
                />
                <Text
                  type="xl-medium"
                  style={[pal.text, s.flex1, {minWidth: 0}]}>
                  {store.session.currentSession?.email || ''}
                </Text>
              </View>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Change my email"
                accessibilityHint=""
                onPress={onEmailIncorrect}
                style={styles.changeEmailLink}>
                <Text type="lg" style={pal.link}>
                  Change
                </Text>
              </Pressable>
            </>
          ) : stage === Stages.ConfirmCode ? (
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
          ) : undefined}

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
                {stage === Stages.Reminder && (
                  <Button
                    testID="getStartedBtn"
                    type="primary"
                    onPress={() => setStage(Stages.Email)}
                    accessibilityLabel="Get Started"
                    accessibilityHint=""
                    label="Get Started"
                    labelContainerStyle={{justifyContent: 'center', padding: 4}}
                    labelStyle={[s.f18]}
                  />
                )}
                {stage === Stages.Email && (
                  <>
                    <Button
                      testID="sendEmailBtn"
                      type="primary"
                      onPress={onSendEmail}
                      accessibilityLabel="Send Confirmation Email"
                      accessibilityHint=""
                      label="Send Confirmation Email"
                      labelContainerStyle={{
                        justifyContent: 'center',
                        padding: 4,
                      }}
                      labelStyle={[s.f18]}
                    />
                    <Button
                      testID="haveCodeBtn"
                      type="default"
                      accessibilityLabel="I have a code"
                      accessibilityHint=""
                      label="I have a confirmation code"
                      labelContainerStyle={{
                        justifyContent: 'center',
                        padding: 4,
                      }}
                      labelStyle={[s.f18]}
                      onPress={() => setStage(Stages.ConfirmCode)}
                    />
                  </>
                )}
                {stage === Stages.ConfirmCode && (
                  <Button
                    testID="confirmBtn"
                    type="primary"
                    onPress={onConfirm}
                    accessibilityLabel="Confirm"
                    accessibilityHint=""
                    label="Confirm"
                    labelContainerStyle={{justifyContent: 'center', padding: 4}}
                    labelStyle={[s.f18]}
                  />
                )}
                <Button
                  testID="cancelBtn"
                  type="default"
                  onPress={() => store.shell.closeModal()}
                  accessibilityLabel={
                    stage === Stages.Reminder ? 'Not right now' : 'Cancel'
                  }
                  accessibilityHint=""
                  label={stage === Stages.Reminder ? 'Not right now' : 'Cancel'}
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
    paddingHorizontal: 14,
    marginTop: 10,
  },
  changeEmailLink: {
    marginHorizontal: 12,
    marginBottom: 12,
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
