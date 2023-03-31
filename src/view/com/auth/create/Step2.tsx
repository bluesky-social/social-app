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
            icon="ticket"
            placeholder="Required for this provider"
            value={model.inviteCode}
            editable
            onChange={model.setInviteCode}
          />
        </View>
      )}

      {!model.inviteCode && model.isInviteCodeRequired ? (
        <Text style={s.alignBaseline}>
          Don't have an invite code?{' '}
          <TouchableWithoutFeedback onPress={onPressWaitlist}>
            <Text style={pal.link}>Join the waitlist</Text>
          </TouchableWithoutFeedback>{' '}
          to try the beta before it's publicly available.
        </Text>
      ) : (
        <>
          <View style={s.pb20}>
            <Text type="md-medium" style={[pal.text, s.mb2]}>
              Email address
            </Text>
            <TextInput
              testID="emailInput"
              icon="envelope"
              placeholder="Enter your email address"
              value={model.email}
              editable
              onChange={model.setEmail}
            />
          </View>

          <View style={s.pb20}>
            <Text type="md-medium" style={[pal.text, s.mb2]}>
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
            />
          </View>

          <View style={s.pb20}>
            <Text type="md-medium" style={[pal.text, s.mb2]}>
              Legal check
            </Text>
            <TouchableOpacity
              testID="is13Input"
              style={[styles.toggleBtn, pal.border]}
              onPress={() => model.setIs13(!model.is13)}>
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

/*

<View style={[pal.borderDark, styles.group]}>
{serviceDescription?.inviteCodeRequired ? (
  <View
    style={[pal.border, styles.groupContent, styles.noTopBorder]}>
    <FontAwesomeIcon
      icon="ticket"
      style={[pal.textLight, styles.groupContentIcon]}
    />
    <TextInput
      style={[pal.text, styles.textInput]}
      placeholder="Invite code"
      placeholderTextColor={pal.colors.textLight}
      autoCapitalize="none"
      autoCorrect={false}
      autoFocus
      keyboardAppearance={theme.colorScheme}
      value={inviteCode}
      onChangeText={setInviteCode}
      onBlur={onBlurInviteCode}
      editable={!isProcessing}
    />
  </View>
) : undefined}
<View style={[pal.border, styles.groupContent]}>
  <FontAwesomeIcon
    icon="envelope"
    style={[pal.textLight, styles.groupContentIcon]}
  />
  <TextInput
    testID="registerEmailInput"
    style={[pal.text, styles.textInput]}
    placeholder="Email address"
    placeholderTextColor={pal.colors.textLight}
    autoCapitalize="none"
    autoCorrect={false}
    value={email}
    onChangeText={setEmail}
    editable={!isProcessing}
  />
</View>
<View style={[pal.border, styles.groupContent]}>
  <FontAwesomeIcon
    icon="lock"
    style={[pal.textLight, styles.groupContentIcon]}
  />
  <TextInput
    testID="registerPasswordInput"
    style={[pal.text, styles.textInput]}
    placeholder="Choose your password"
    placeholderTextColor={pal.colors.textLight}
    autoCapitalize="none"
    autoCorrect={false}
    secureTextEntry
    value={password}
    onChangeText={setPassword}
    editable={!isProcessing}
  />
</View>
</View>
</>
) : undefined}
{serviceDescription ? (
<>
<View style={styles.groupLabel}>
<Text type="sm-bold" style={pal.text}>
  Choose your username
</Text>
</View>
<View style={[pal.border, styles.group]}>
<View
  style={[pal.border, styles.groupContent, styles.noTopBorder]}>
  <FontAwesomeIcon
    icon="at"
    style={[pal.textLight, styles.groupContentIcon]}
  />
  <TextInput
    testID="registerHandleInput"
    style={[pal.text, styles.textInput]}
    placeholder="eg alice"
    placeholderTextColor={pal.colors.textLight}
    autoCapitalize="none"
    value={handle}
    onChangeText={v => setHandle(makeValidHandle(v))}
    editable={!isProcessing}
  />
</View>
{serviceDescription.availableUserDomains.length > 1 && (
  <View style={[pal.border, styles.groupContent]}>
    <FontAwesomeIcon
      icon="globe"
      style={styles.groupContentIcon}
    />
    <Picker
      style={[pal.text, styles.picker]}
      labelStyle={styles.pickerLabel}
      iconStyle={pal.textLight as FontAwesomeIconStyle}
      value={userDomain}
      items={serviceDescription.availableUserDomains.map(d => ({
        label: `.${d}`,
        value: d,
      }))}
      onChange={itemValue => setUserDomain(itemValue)}
      enabled={!isProcessing}
    />
  </View>
)}
<View style={[pal.border, styles.groupContent]}>
  <Text style={[pal.textLight, s.p10]}>
    Your full username will be{' '}
    <Text type="md-bold" style={pal.textLight}>
      @{createFullHandle(handle, userDomain)}
    </Text>
  </Text>
</View>
</View>
<View style={styles.groupLabel}>
<Text type="sm-bold" style={pal.text}>
  Legal
</Text>
</View>
<View style={[pal.border, styles.group]}>
<View
  style={[pal.border, styles.groupContent, styles.noTopBorder]}>
  <TouchableOpacity
    testID="registerIs13Input"
    style={styles.textBtn}
    onPress={() => setIs13(!is13)}>
    <View
      style={[
        pal.border,
        is13 ? styles.checkboxFilled : styles.checkbox,
      ]}>
      {is13 && (
        <FontAwesomeIcon icon="check" style={s.blue3} size={14} />
      )}
    </View>
    <Text style={[pal.text, styles.textBtnLabel]}>
      I am 13 years old or older
    </Text>
  </TouchableOpacity>
</View>
</View>*/
