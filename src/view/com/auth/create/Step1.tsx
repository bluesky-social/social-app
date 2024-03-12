import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {usePalette} from 'lib/hooks/usePalette'
import {s} from 'lib/styles'
import {isWeb} from 'platform/detection'
import React from 'react'
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {ErrorMessage} from 'view/com/util/error/ErrorMessage'
import {DateInput} from 'view/com/util/forms/DateInput'
import {Text} from 'view/com/util/text/Text'

import {useDialogControl} from '#/components/Dialog'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {logger} from '#/logger'

import {ServerInputDialog} from '../server-input'
import {TextInput} from '../util/TextInput'
import {Policies} from './Policies'
import {CreateAccountDispatch, CreateAccountState, is18} from './state'
import {StepHeader} from './StepHeader'

function sanitizeDate(date: Date): Date {
  if (!date || date.toString() === 'Invalid Date') {
    logger.error(`Create account: handled invalid date for birthDate`, {
      hasDate: !!date,
    })
    return new Date()
  }
  return date
}

export function Step1({
  uiState,
  uiDispatch,
}: {
  uiState: CreateAccountState
  uiDispatch: CreateAccountDispatch
}) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const serverInputControl = useDialogControl()

  const onPressSelectService = React.useCallback(() => {
    serverInputControl.open()
    Keyboard.dismiss()
  }, [serverInputControl])

  const birthDate = React.useMemo(() => {
    return sanitizeDate(uiState.birthDate)
  }, [uiState.birthDate])

  return (
    <View>
      <ServerInputDialog
        control={serverInputControl}
        onSelect={url => uiDispatch({type: 'set-service-url', value: url})}
      />
      <StepHeader uiState={uiState} title={_(msg`Your account`)} />

      {uiState.error ? (
        <ErrorMessage message={uiState.error} style={styles.error} />
      ) : undefined}

      <View style={s.pb20}>
        <Text type="md-medium" style={[pal.text, s.mb2]}>
          <Trans>Hosting provider</Trans>
        </Text>
        <View style={[pal.border, {borderWidth: 1, borderRadius: 6}]}>
          <View
            style={[
              pal.borderDark,
              {flexDirection: 'row', alignItems: 'center'},
            ]}>
            <FontAwesomeIcon
              icon="globe"
              style={[pal.textLight, {marginLeft: 14}]}
            />
            <TouchableOpacity
              testID="selectServiceButton"
              style={{
                flexDirection: 'row',
                flex: 1,
                alignItems: 'center',
              }}
              onPress={onPressSelectService}
              accessibilityRole="button"
              accessibilityLabel={_(msg`Select service`)}
              accessibilityHint={_(msg`Sets server for the Bluesky client`)}>
              <Text
                type="xl"
                style={[
                  pal.text,
                  {
                    flex: 1,
                    paddingVertical: 10,
                    paddingRight: 12,
                    paddingLeft: 10,
                  },
                ]}>
                {toNiceDomain(uiState.serviceUrl)}
              </Text>
              <View
                style={[
                  pal.btn,
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderRadius: 6,
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    marginHorizontal: 6,
                  },
                ]}>
                <FontAwesomeIcon
                  icon="pen"
                  size={12}
                  style={pal.textLight as FontAwesomeIconStyle}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {!uiState.serviceDescription ? (
        <ActivityIndicator />
      ) : (
        <>
          {uiState.isInviteCodeRequired && (
            <View style={s.pb20}>
              <Text type="md-medium" style={[pal.text, s.mb2]}>
                <Trans>Invite code</Trans>
              </Text>
              <TextInput
                testID="inviteCodeInput"
                icon="ticket"
                placeholder={_(msg`Required for this provider`)}
                value={uiState.inviteCode}
                editable
                onChange={value => uiDispatch({type: 'set-invite-code', value})}
                accessibilityLabel={_(msg`Invite code`)}
                accessibilityHint={_(msg`Input invite code to proceed`)}
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect={false}
                autoFocus={true}
              />
            </View>
          )}

          {!uiState.isInviteCodeRequired || uiState.inviteCode ? (
            <>
              <View style={s.pb20}>
                <Text
                  type="md-medium"
                  style={[pal.text, s.mb2]}
                  nativeID="email">
                  <Trans>Email address</Trans>
                </Text>
                <TextInput
                  testID="emailInput"
                  icon="envelope"
                  placeholder={_(msg`Enter your email address`)}
                  value={uiState.email}
                  editable
                  onChange={value => uiDispatch({type: 'set-email', value})}
                  accessibilityLabel={_(msg`Email`)}
                  accessibilityHint={_(msg`Input email for Bluesky account`)}
                  accessibilityLabelledBy="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  autoFocus={!uiState.isInviteCodeRequired}
                />
              </View>

              <View style={s.pb20}>
                <Text
                  type="md-medium"
                  style={[pal.text, s.mb2]}
                  nativeID="password">
                  <Trans>Password</Trans>
                </Text>
                <TextInput
                  testID="passwordInput"
                  icon="lock"
                  placeholder={_(msg`Choose your password`)}
                  value={uiState.password}
                  editable
                  secureTextEntry
                  onChange={value => uiDispatch({type: 'set-password', value})}
                  accessibilityLabel={_(msg`Password`)}
                  accessibilityHint={_(msg`Set password`)}
                  accessibilityLabelledBy="password"
                  autoCapitalize="none"
                  autoComplete="new-password"
                  autoCorrect={false}
                />
              </View>

              <View style={s.pb20}>
                <Text
                  type="md-medium"
                  style={[pal.text, s.mb2]}
                  nativeID="birthDate">
                  <Trans>Your birth date</Trans>
                </Text>
                <DateInput
                  handleAsUTC
                  testID="birthdayInput"
                  value={birthDate}
                  onChange={value =>
                    uiDispatch({type: 'set-birth-date', value})
                  }
                  buttonType="default-light"
                  buttonStyle={[pal.border, styles.dateInputButton]}
                  buttonLabelType="lg"
                  accessibilityLabel={_(msg`Birthday`)}
                  accessibilityHint={_(msg`Enter your birth date`)}
                  accessibilityLabelledBy="birthDate"
                />
              </View>

              {uiState.serviceDescription && (
                <Policies
                  serviceDescription={uiState.serviceDescription}
                  needsGuardian={!is18(uiState)}
                />
              )}
            </>
          ) : undefined}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  error: {
    borderRadius: 6,
    marginBottom: 10,
  },
  dateInputButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 14,
  },
  // @ts-expect-error: Suppressing error due to incomplete `ViewStyle` type definition in react-native-web, missing `cursor` prop as discussed in https://github.com/necolas/react-native-web/issues/832.
  touchable: {
    ...(isWeb && {cursor: 'pointer'}),
  },
})
