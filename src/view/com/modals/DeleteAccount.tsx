import React from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {TextInput} from './util'
import LinearGradient from 'react-native-linear-gradient'
import * as Toast from '../util/Toast'
import {Text} from '../util/text/Text'
import {useStores} from 'state/index'
import {s, colors, gradients} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useTheme} from 'lib/ThemeContext'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {cleanError} from 'lib/strings/errors'
import {resetToTab} from '../../../Navigation'

export const snapPoints = ['60%']

export function Component({}: {}) {
  const pal = usePalette('default')
  const theme = useTheme()
  const store = useStores()
  const {isMobile} = useWebMediaQueries()
  const [isEmailSent, setIsEmailSent] = React.useState<boolean>(false)
  const [confirmCode, setConfirmCode] = React.useState<string>('')
  const [password, setPassword] = React.useState<string>('')
  const [isProcessing, setIsProcessing] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string>('')
  const onPressSendEmail = async () => {
    setError('')
    setIsProcessing(true)
    try {
      await store.agent.com.atproto.server.requestAccountDelete()
      setIsEmailSent(true)
    } catch (e: any) {
      setError(cleanError(e))
    }
    setIsProcessing(false)
  }
  const onPressConfirmDelete = async () => {
    setError('')
    setIsProcessing(true)
    const token = confirmCode.replace(/\s/g, '')

    try {
      await store.agent.com.atproto.server.deleteAccount({
        did: store.me.did,
        password,
        token,
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
    <View style={[styles.container, pal.view]}>
      <View style={[styles.innerContainer, pal.view]}>
        <View style={[styles.titleContainer, pal.view]}>
          <Text type="title-xl" style={[s.textCenter, pal.text]}>
            Delete Account
          </Text>
          <View style={[pal.view, s.flexRow]}>
            <Text type="title-xl" style={[pal.text, s.bold]}>
              {' "'}
            </Text>
            <Text
              type="title-xl"
              numberOfLines={1}
              style={[
                isMobile ? styles.titleMobile : styles.titleDesktop,
                pal.text,
                s.bold,
              ]}>
              {store.me.handle}
            </Text>
            <Text type="title-xl" style={[pal.text, s.bold]}>
              {'"'}
            </Text>
          </View>
        </View>
        {!isEmailSent ? (
          <>
            <Text type="lg" style={[styles.description, pal.text]}>
              For security reasons, we'll need to send a confirmation code to
              your email address.
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
                  onPress={onPressSendEmail}
                  accessibilityRole="button"
                  accessibilityLabel="Send email"
                  accessibilityHint="Sends email with confirmation code for account deletion">
                  <LinearGradient
                    colors={[
                      gradients.blueLight.start,
                      gradients.blueLight.end,
                    ]}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={[styles.btn]}>
                    <Text type="button-lg" style={[s.white, s.bold]}>
                      Send Email
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, s.mt10]}
                  onPress={onCancel}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel account deletion"
                  accessibilityHint=""
                  onAccessibilityEscape={onCancel}>
                  <Text type="button-lg" style={pal.textLight}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </>
        ) : (
          <>
            {/* TODO: Update this label to be more concise */}
            <Text
              type="lg"
              style={styles.description}
              nativeID="confirmationCode">
              Check your inbox for an email with the confirmation code to enter
              below:
            </Text>
            <TextInput
              style={[styles.textInput, pal.borderDark, pal.text, styles.mb20]}
              placeholder="Confirmation code"
              placeholderTextColor={pal.textLight.color}
              keyboardAppearance={theme.colorScheme}
              value={confirmCode}
              onChangeText={setConfirmCode}
              accessibilityLabelledBy="confirmationCode"
              accessibilityLabel="Confirmation code"
              accessibilityHint="Input confirmation code for account deletion"
            />
            <Text type="lg" style={styles.description} nativeID="password">
              Please enter your password as well:
            </Text>
            <TextInput
              style={[styles.textInput, pal.borderDark, pal.text]}
              placeholder="Password"
              placeholderTextColor={pal.textLight.color}
              keyboardAppearance={theme.colorScheme}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              accessibilityLabelledBy="password"
              accessibilityLabel="Password"
              accessibilityHint="Input password for account deletion"
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
                  onPress={onPressConfirmDelete}
                  accessibilityRole="button"
                  accessibilityLabel="Confirm delete account"
                  accessibilityHint="">
                  <Text type="button-lg" style={[s.white, s.bold]}>
                    Delete my account
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, s.mt10]}
                  onPress={onCancel}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel account deletion"
                  accessibilityHint="Exits account deletion process"
                  onAccessibilityEscape={onCancel}>
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
  titleContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 12,
    marginBottom: 12,
    marginLeft: 20,
    marginRight: 20,
  },
  titleMobile: {
    textAlign: 'center',
  },
  titleDesktop: {
    textAlign: 'center',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    // @ts-ignore only rendered on web
    maxWidth: '400px',
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
