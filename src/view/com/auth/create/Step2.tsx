import React from 'react'
import {StyleSheet, TouchableWithoutFeedback, View} from 'react-native'
import {CreateAccountState, CreateAccountDispatch, is18} from './state'
import {Text} from 'view/com/util/text/Text'
import {DateInput} from 'view/com/util/forms/DateInput'
import {StepHeader} from './StepHeader'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {TextInput} from '../util/TextInput'
import {Policies} from './Policies'
import {ErrorMessage} from 'view/com/util/error/ErrorMessage'
import {isWeb} from 'platform/detection'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useModalControls} from '#/state/modals'
import {logger} from '#/logger'

function sanitizeDate(date: Date): Date {
  if (!date || date.toString() === 'Invalid Date') {
    logger.error(`Create account: handled invalid date for birthDate`, {
      hasDate: !!date,
    })
    return new Date()
  }
  return date
}

/** STEP 2: Your account
 * @field Invite code or waitlist
 * @field Email address
 * @field Email address
 * @field Email address
 * @field Password
 * @field Birth date
 * @readonly Terms of service & privacy policy
 */
export function Step2({
  uiState,
  uiDispatch,
}: {
  uiState: CreateAccountState
  uiDispatch: CreateAccountDispatch
}) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const {openModal} = useModalControls()

  const onPressWaitlist = React.useCallback(() => {
    openModal({name: 'waitlist'})
  }, [openModal])

  const birthDate = React.useMemo(() => {
    return sanitizeDate(uiState.birthDate)
  }, [uiState.birthDate])

  return (
    <View>
      <StepHeader step="2" title={_(msg`Your account`)} />

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
          />
        </View>
      )}

      {!uiState.inviteCode && uiState.isInviteCodeRequired ? (
        <Text style={[s.alignBaseline, pal.text]}>
          <Trans>Don't have an invite code?</Trans>{' '}
          <TouchableWithoutFeedback
            onPress={onPressWaitlist}
            accessibilityLabel={_(msg`Join the waitlist.`)}
            accessibilityHint="">
            <View style={styles.touchable}>
              <Text style={pal.link}>
                <Trans>Join the waitlist.</Trans>
              </Text>
            </View>
          </TouchableWithoutFeedback>
        </Text>
      ) : (
        <>
          <View style={s.pb20}>
            <Text type="md-medium" style={[pal.text, s.mb2]} nativeID="email">
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
              accessibilityHint={_(msg`Input email for Bluesky waitlist`)}
              accessibilityLabelledBy="email"
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
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
              autoComplete="off"
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
              onChange={value => uiDispatch({type: 'set-birth-date', value})}
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
      )}
      {uiState.error ? (
        <ErrorMessage message={uiState.error} style={styles.error} />
      ) : undefined}
    </View>
  )
}

const styles = StyleSheet.create({
  error: {
    borderRadius: 6,
    marginTop: 10,
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
