import React, {useState} from 'react'
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native'
import {Circle, Path, Svg} from 'react-native-svg'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {cleanError} from '#/lib/strings/errors'
import {colors, s} from '#/lib/styles'
import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import {useModalControls} from '#/state/modals'
import {useAgent, useSession} from '#/state/session'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {Button} from '../util/forms/Button'
import {Text} from '../util/text/Text'
import * as Toast from '../util/Toast'
import {ScrollView, TextInput} from './util'

export const snapPoints = ['90%']

enum Stages {
  Reminder,
  Email,
  ConfirmCode,
}

export function Component({
  showReminder,
  onSuccess,
}: {
  showReminder?: boolean
  onSuccess?: () => void
}) {
  const pal = usePalette('default')
  const agent = useAgent()
  const {currentAccount} = useSession()
  const {_} = useLingui()
  const [stage, setStage] = useState<Stages>(
    showReminder ? Stages.Reminder : Stages.Email,
  )
  const [confirmationCode, setConfirmationCode] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const {isMobile} = useWebMediaQueries()
  const {openModal, closeModal} = useModalControls()

  React.useEffect(() => {
    if (!currentAccount) {
      logger.error(`VerifyEmail modal opened without currentAccount`)
      closeModal()
    }
  }, [currentAccount, closeModal])

  const onSendEmail = async () => {
    setError('')
    setIsProcessing(true)
    try {
      await agent.com.atproto.server.requestEmailConfirmation()
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
      await agent.com.atproto.server.confirmEmail({
        email: (currentAccount?.email || '').trim(),
        token: confirmationCode.trim(),
      })
      await agent.resumeSession(agent.session!)
      Toast.show(_(msg`Email verified`))
      closeModal()
      onSuccess?.()
    } catch (e) {
      setError(cleanError(String(e)))
    } finally {
      setIsProcessing(false)
    }
  }

  const onEmailIncorrect = () => {
    closeModal()
    openModal({name: 'change-email'})
  }

  return (
    <SafeAreaView style={[pal.view, s.flex1]}>
      <ScrollView
        testID="verifyEmailModal"
        style={[s.flex1, isMobile && {paddingHorizontal: 18}]}>
        {stage === Stages.Reminder && <ReminderIllustration />}
        <View style={styles.titleSection}>
          <Text type="title-lg" style={[pal.text, styles.title]}>
            {stage === Stages.Reminder ? (
              <Trans>Please Verify Your Email</Trans>
            ) : stage === Stages.Email ? (
              <Trans>Verify Your Email</Trans>
            ) : stage === Stages.ConfirmCode ? (
              <Trans>Enter Confirmation Code</Trans>
            ) : (
              ''
            )}
          </Text>
        </View>

        <Text type="lg" style={[pal.textLight, {marginBottom: 10}]}>
          {stage === Stages.Reminder ? (
            <Trans>
              Your email has not yet been verified. This is an important
              security step which we recommend.
            </Trans>
          ) : stage === Stages.Email ? (
            <Trans>
              This is important in case you ever need to change your email or
              reset your password.
            </Trans>
          ) : stage === Stages.ConfirmCode ? (
            <Trans>
              An email has been sent to {currentAccount?.email || '(no email)'}.
              It includes a confirmation code which you can enter below.
            </Trans>
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
              <Text type="xl-medium" style={[pal.text, s.flex1, {minWidth: 0}]}>
                {currentAccount?.email || _(msg`(no email)`)}
              </Text>
            </View>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={_(msg`Change my email`)}
              accessibilityHint=""
              onPress={onEmailIncorrect}
              style={styles.changeEmailLink}>
              <Text type="lg" style={pal.link}>
                <Trans>Change</Trans>
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
            accessibilityLabel={_(msg`Confirmation code`)}
            accessibilityHint=""
            autoCapitalize="none"
            autoComplete="one-time-code"
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
                  accessibilityLabel={_(msg`Get Started`)}
                  accessibilityHint=""
                  label={_(msg`Get Started`)}
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
                    accessibilityLabel={_(msg`Send Confirmation Email`)}
                    accessibilityHint=""
                    label={_(msg`Send Confirmation Email`)}
                    labelContainerStyle={{
                      justifyContent: 'center',
                      padding: 4,
                    }}
                    labelStyle={[s.f18]}
                  />
                  <Button
                    testID="haveCodeBtn"
                    type="default"
                    accessibilityLabel={_(msg`I have a code`)}
                    accessibilityHint=""
                    label={_(msg`I have a confirmation code`)}
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
                  accessibilityLabel={_(msg`Confirm`)}
                  accessibilityHint=""
                  label={_(msg`Confirm`)}
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
                  stage === Stages.Reminder
                    ? _(msg`Not right now`)
                    : _(msg`Cancel`)
                }
                accessibilityHint=""
                label={
                  stage === Stages.Reminder
                    ? _(msg`Not right now`)
                    : _(msg`Cancel`)
                }
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

function ReminderIllustration() {
  const pal = usePalette('default')
  const palInverted = usePalette('inverted')
  return (
    <View style={[pal.viewLight, {borderRadius: 8, marginBottom: 20}]}>
      <Svg viewBox="0 0 112 84" fill="none" height={200}>
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M26 26.4264V55C26 60.5229 30.4772 65 36 65H76C81.5228 65 86 60.5229 86 55V27.4214L63.5685 49.8528C59.6633 53.7581 53.3316 53.7581 49.4264 49.8528L26 26.4264Z"
          fill={palInverted.colors.background}
        />
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M83.666 19.5784C85.47 21.7297 84.4897 24.7895 82.5044 26.7748L60.669 48.6102C58.3259 50.9533 54.5269 50.9533 52.1838 48.6102L29.9502 26.3766C27.8241 24.2505 26.8952 20.8876 29.0597 18.8005C30.8581 17.0665 33.3045 16 36 16H76C79.0782 16 81.8316 17.3908 83.666 19.5784Z"
          fill={palInverted.colors.background}
        />
        <Circle cx="82" cy="61" r="13" fill="#20BC07" />
        <Path d="M75 61L80 66L89 57" stroke="white" strokeWidth="2" />
      </Svg>
    </View>
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
