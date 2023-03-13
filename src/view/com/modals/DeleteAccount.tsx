import React from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {BottomSheetTextInput} from '@gorhom/bottom-sheet'
import LinearGradient from 'react-native-linear-gradient'
import * as Toast from '../util/Toast'
import {Text} from '../util/text/Text'
import {useStores} from 'state/index'
import {s, colors, gradients} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useTheme} from 'lib/ThemeContext'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {cleanError} from 'lib/strings/errors'
import {resetToTab} from '../../../Navigation'

export const snapPoints = ['60%']

export function Component({}: {}) {
  const pal = usePalette('default')
  const theme = useTheme()
  const store = useStores()
  const [isEmailSent, setIsEmailSent] = React.useState<boolean>(false)
  const [confirmCode, setConfirmCode] = React.useState<string>('')
  const [password, setPassword] = React.useState<string>('')
  const [isProcessing, setIsProcessing] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string>('')
  const onPressSendEmail = async () => {
    setError('')
    setIsProcessing(true)
    try {
      await store.api.com.atproto.account.requestDelete()
      setIsEmailSent(true)
    } catch (e: any) {
      setError(cleanError(e))
    }
    setIsProcessing(false)
  }
  const onPressConfirmDelete = async () => {
    setError('')
    setIsProcessing(true)
    try {
      await store.api.com.atproto.account.delete({
        did: store.me.did,
        password,
        token: confirmCode,
      })
      Toast.show('Your account has been deleted')
      resetToTab('HomeTab')
      store.session.clear()
      store.shell.closeModal()
    } catch (e: any) {
      setError(cleanError(e))
    }
    setIsProcessing(false)
  }
  const onCancel = () => {
    store.shell.closeModal()
  }
  return (
    <View
      style={[styles.container, {backgroundColor: pal.colors.backgroundLight}]}>
      <View style={[styles.innerContainer, pal.view]}>
        <Text type="title-xl" style={[styles.title, pal.text]}>
          Delete account
        </Text>
        {!isEmailSent ? (
          <>
            <Text type="lg" style={[styles.description, pal.text]}>
              For security reasons, we'll need to send a confirmation code to
              your email.
            </Text>
            {error ? (
              <View style={s.mt10}>
                <ErrorMessage message={error} />
              </View>
            ) : undefined}
            {isProcessing ? (
              <View style={[styles.btn, s.mt10]}>
                <ActivityIndicator />
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.mt20}
                  onPress={onPressSendEmail}>
                  <LinearGradient
                    colors={[
                      gradients.blueLight.start,
                      gradients.blueLight.end,
                    ]}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={[styles.btn]}>
                    <Text type="button-lg" style={[s.white, s.bold]}>
                      Send email
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, s.mt10]}
                  onPress={onCancel}>
                  <Text type="button-lg" style={pal.textLight}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </>
        ) : (
          <>
            <Text type="lg" style={styles.description}>
              Check your inbox for an email with the confirmation code to enter
              below:
            </Text>
            <BottomSheetTextInput
              style={[styles.textInput, pal.borderDark, pal.text, styles.mb20]}
              placeholder="Confirmation code"
              placeholderTextColor={pal.textLight.color}
              keyboardAppearance={theme.colorScheme}
              value={confirmCode}
              onChangeText={setConfirmCode}
            />
            <Text type="lg" style={styles.description}>
              Please enter your password as well:
            </Text>
            <BottomSheetTextInput
              style={[styles.textInput, pal.borderDark, pal.text]}
              placeholder="Password"
              placeholderTextColor={pal.textLight.color}
              keyboardAppearance={theme.colorScheme}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            {error ? (
              <View style={styles.mt20}>
                <ErrorMessage message={error} />
              </View>
            ) : undefined}
            {isProcessing ? (
              <View style={[styles.btn, s.mt10]}>
                <ActivityIndicator />
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.btn, styles.evilBtn, styles.mt20]}
                  onPress={onPressConfirmDelete}>
                  <Text type="button-lg" style={[s.white, s.bold]}>
                    Delete my account
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, s.mt10]}
                  onPress={onCancel}>
                  <Text type="button-lg" style={pal.textLight}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    paddingBottom: 20,
  },
  title: {
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    paddingHorizontal: 22,
    marginBottom: 10,
  },
  mt20: {
    marginTop: 20,
  },
  mb20: {
    marginBottom: 20,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 20,
    marginHorizontal: 20,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    padding: 14,
    marginHorizontal: 20,
  },
  evilBtn: {
    backgroundColor: colors.red4,
  },
})
