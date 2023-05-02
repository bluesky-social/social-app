import React from 'react'
import {
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import {observer} from 'mobx-react-lite'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {CreateAccountModel} from 'state/models/ui/create-account'
import {Text} from 'view/com/util/text/Text'
import {StepHeader} from './StepHeader'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {TextInput} from '../util/TextInput'
import {Policies} from './Policies'
import {ErrorMessage} from 'view/com/util/error/ErrorMessage'
import {useStores} from 'state/index'

export const Step2 = observer(({model}: {model: CreateAccountModel}) => {
  const pal = usePalette('default')
  const store = useStores()

  const onPressWaitlist = React.useCallback(() => {
    store.shell.openModal({name: 'waitlist'})
  }, [store])

  return (
    <View>
      <StepHeader step="2" title="Your account" />

      {model.isInviteCodeRequired && (
        <View style={s.pb20}>
          <Text type="md-medium" style={[pal.text, s.mb2]}>
            Invite code
          </Text>
          <TextInput
            testID="inviteCodeInput"
            icon="ticket"
            placeholder="Required for this provider"
            value={model.inviteCode}
            editable
            onChange={model.setInviteCode}
            accessibilityRole="button"
            accessibilityLabel="Invite code"
            accessibilityHint="Input invite code to proceed"
          />
        </View>
      )}

      {!model.inviteCode && model.isInviteCodeRequired ? (
        <Text style={[s.alignBaseline, pal.text]}>
          Don't have an invite code?{' '}
          <TouchableWithoutFeedback
            onPress={onPressWaitlist}
            accessibilityRole="button"
            accessibilityLabel="Waitlist"
            accessibilityHint="Opens Bluesky waitlist form">
            <Text style={pal.link}>Join the waitlist</Text>
          </TouchableWithoutFeedback>{' '}
          to try the beta before it's publicly available.
        </Text>
      ) : (
        <>
          <View style={s.pb20}>
            <Text type="md-medium" style={[pal.text, s.mb2]} nativeID="email">
              Email address
            </Text>
            <TextInput
              testID="emailInput"
              icon="envelope"
              placeholder="Enter your email address"
              value={model.email}
              editable
              onChange={model.setEmail}
              accessibilityLabel="Email"
              accessibilityHint="Input email for Bluesky waitlist"
              accessibilityLabelledBy="email"
            />
          </View>

          <View style={s.pb20}>
            <Text
              type="md-medium"
              style={[pal.text, s.mb2]}
              nativeID="password">
              Password
            </Text>
            <TextInput
              testID="passwordInput"
              icon="lock"
              placeholder="Choose your password"
              value={model.password}
              editable
              secureTextEntry
              onChange={model.setPassword}
              accessibilityLabel="Password"
              accessibilityHint="Set password"
              accessibilityLabelledBy="password"
            />
          </View>

          <View style={s.pb20}>
            <Text
              type="md-medium"
              style={[pal.text, s.mb2]}
              nativeID="legalCheck">
              Legal check
            </Text>
            <TouchableOpacity
              testID="is13Input"
              style={[styles.toggleBtn, pal.border]}
              onPress={() => model.setIs13(!model.is13)}
              accessibilityRole="checkbox"
              accessibilityLabel="Verify age"
              accessibilityHint="Verifies that I am at least 13 years of age"
              accessibilityLabelledBy="legalCheck">
              <View style={[pal.borderDark, styles.checkbox]}>
                {model.is13 && (
                  <FontAwesomeIcon icon="check" style={s.blue3} size={16} />
                )}
              </View>
              <Text type="md" style={[pal.text, styles.toggleBtnLabel]}>
                I am 13 years old or older
              </Text>
            </TouchableOpacity>
          </View>

          {model.serviceDescription && (
            <Policies serviceDescription={model.serviceDescription} />
          )}
        </>
      )}
      {model.error ? (
        <ErrorMessage message={model.error} style={styles.error} />
      ) : undefined}
    </View>
  )
})

const styles = StyleSheet.create({
  error: {
    borderRadius: 6,
    marginTop: 10,
  },

  toggleBtn: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 6,
  },
  toggleBtnLabel: {
    flex: 1,
    paddingHorizontal: 10,
  },

  checkbox: {
    borderWidth: 1,
    borderRadius: 2,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
