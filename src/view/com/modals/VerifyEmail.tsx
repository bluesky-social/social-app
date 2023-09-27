import React, {useState} from 'react'
import {
  ActivityIndicator,
  TextInput,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
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

export const Component = observer(function Component({}: {}) {
  const pal = usePalette('default')
  const store = useStores()
  const [hasCode, setHasCode] = useState<boolean>(false)
  const [confirmationCode, setConfirmationCode] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const {isMobile} = useWebMediaQueries()

  const onSendEmail = async () => {
    setError('')
    setIsProcessing(true)
    try {
      await store.agent.com.atproto.server.requestEmailConfirmation()
      setHasCode(true)
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
        email: store.session.currentSession?.email || '',
        token: confirmationCode,
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
    <View
      testID="verifyEmailModal"
      style={[pal.view, styles.container, isMobile && {paddingHorizontal: 18}]}>
      <View style={styles.titleSection}>
        <Text type="title-lg" style={[pal.text, styles.title]}>
          {hasCode ? 'Enter Confirmation Code' : 'Verify Your Email'}
        </Text>
      </View>

      <Text type="lg" style={[pal.textLight, {marginBottom: 10}]}>
        {hasCode ? (
          <>
            An email has been sent to{' '}
            {store.session.currentSession?.email || ''}. It includes a
            confirmation code which you can enter below.
          </>
        ) : (
          <>
            This is important in case you ever need to change your email or
            reset your password.
          </>
        )}
      </Text>

      {hasCode ? (
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
        />
      ) : (
        <View style={[pal.border, styles.emailContainer]}>
          <FontAwesomeIcon icon="envelope" color={pal.colors.text} size={16} />
          <Text type="xl" style={[pal.text, s.flex1, {minWidth: 0}]}>
            {store.session.currentSession?.email || ''}
          </Text>
          <Pressable
            accessibilityLabel="Change my email"
            accessibilityHint=""
            onPress={onEmailIncorrect}>
            <Text type="lg" style={pal.link}>
              This is incorrect
            </Text>
          </Pressable>
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
            <Button
              testID="sendEmailBtn"
              type="primary"
              onPress={hasCode ? onConfirm : onSendEmail}
              accessibilityLabel={
                hasCode ? 'Confirm' : 'Send Confirmation Email'
              }
              accessibilityHint=""
              label={hasCode ? 'Confirm' : 'Send Confirmation Email'}
              labelContainerStyle={{justifyContent: 'center', padding: 4}}
              labelStyle={[s.f18]}
            />
            {!hasCode && (
              <Button
                testID="haveCodeBtn"
                type="default"
                accessibilityLabel="I have a code"
                accessibilityHint=""
                label="I have a confirmation code"
                labelContainerStyle={{justifyContent: 'center', padding: 4}}
                labelStyle={[s.f18]}
                onPress={() => setHasCode(v => !v)}
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
    </View>
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
