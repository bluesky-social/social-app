import React from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import {
  CreateAccountState,
  CreateAccountDispatch,
  requestVerificationCode,
} from './state'
import {Text} from 'view/com/util/text/Text'
import {StepHeader} from './StepHeader'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {TextInput} from '../util/TextInput'
import {Button} from '../../util/forms/Button'
import {ErrorMessage} from 'view/com/util/error/ErrorMessage'
import {isWeb} from 'platform/detection'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import parsePhoneNumber from 'libphonenumber-js'

export function Step2({
  uiState,
  uiDispatch,
}: {
  uiState: CreateAccountState
  uiDispatch: CreateAccountDispatch
}) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const {isMobile} = useWebMediaQueries()

  const onPressRequest = React.useCallback(() => {
    if (
      uiState.verificationPhone.length >= 9 &&
      parsePhoneNumber(uiState.verificationPhone, 'US')
    ) {
      requestVerificationCode({uiState, uiDispatch, _})
    } else {
      uiDispatch({
        type: 'set-error',
        value: _(
          msg`There's something wrong with this number. Please include your country and/or area code!`,
        ),
      })
    }
  }, [uiState, uiDispatch, _])

  const onPressRetry = React.useCallback(() => {
    uiDispatch({type: 'set-has-requested-verification-code', value: false})
  }, [uiDispatch])

  const phoneNumberFormatted = React.useMemo(
    () =>
      uiState.hasRequestedVerificationCode
        ? parsePhoneNumber(
            uiState.verificationPhone,
            'US',
          )?.formatInternational()
        : '',
    [uiState.hasRequestedVerificationCode, uiState.verificationPhone],
  )

  return (
    <View>
      <StepHeader uiState={uiState} title={_(msg`SMS verification`)} />

      {!uiState.hasRequestedVerificationCode ? (
        <>
          <View style={s.pb20}>
            <Text
              type="md-medium"
              style={[pal.text, s.mb2]}
              nativeID="phoneNumber">
              <Trans>Phone number</Trans>
            </Text>
            <TextInput
              testID="phoneInput"
              icon="phone"
              placeholder={_(msg`Enter your phone number`)}
              value={uiState.verificationPhone}
              editable
              onChange={value =>
                uiDispatch({type: 'set-verification-phone', value})
              }
              accessibilityLabel={_(msg`Email`)}
              accessibilityHint={_(
                msg`Input phone number for SMS verification`,
              )}
              accessibilityLabelledBy="phoneNumber"
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoComplete="tel"
              autoCorrect={false}
              autoFocus={true}
            />
            <Text type="sm" style={[pal.textLight, s.mt5]}>
              <Trans>
                Please enter a phone number that can receive SMS text messages.
              </Trans>
            </Text>
          </View>

          <View style={isMobile ? {} : {flexDirection: 'row'}}>
            {uiState.isProcessing ? (
              <ActivityIndicator />
            ) : (
              <Button
                testID="requestCodeBtn"
                type="primary"
                label={_(msg`Request code`)}
                labelStyle={isMobile ? [s.flex1, s.textCenter, s.f17] : []}
                style={
                  isMobile ? {paddingVertical: 12, paddingHorizontal: 20} : {}
                }
                onPress={onPressRequest}
              />
            )}
          </View>
        </>
      ) : (
        <>
          <View style={s.pb20}>
            <View
              style={[
                s.flexRow,
                s.mb5,
                s.alignCenter,
                {justifyContent: 'space-between'},
              ]}>
              <Text
                type="md-medium"
                style={pal.text}
                nativeID="verificationCode">
                <Trans>Verification code</Trans>{' '}
              </Text>
              <TouchableWithoutFeedback
                onPress={onPressRetry}
                accessibilityLabel={_(msg`Retry.`)}
                accessibilityHint="">
                <View style={styles.touchable}>
                  <Text
                    type="md-medium"
                    style={pal.link}
                    nativeID="verificationCode">
                    <Trans>Retry</Trans>
                  </Text>
                </View>
              </TouchableWithoutFeedback>
            </View>
            <TextInput
              testID="codeInput"
              icon="hashtag"
              placeholder={_(msg`XXXXXX`)}
              value={uiState.verificationCode}
              editable
              onChange={value =>
                uiDispatch({type: 'set-verification-code', value})
              }
              accessibilityLabel={_(msg`Email`)}
              accessibilityHint={_(
                msg`Input the verification code we have texted to you`,
              )}
              accessibilityLabelledBy="verificationCode"
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              autoCorrect={false}
              autoFocus={true}
            />
            <Text type="sm" style={[pal.textLight, s.mt5]}>
              <Trans>Please enter the verification code sent to</Trans>{' '}
              {phoneNumberFormatted}.
            </Text>
          </View>
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
  // @ts-expect-error: Suppressing error due to incomplete `ViewStyle` type definition in react-native-web, missing `cursor` prop as discussed in https://github.com/necolas/react-native-web/issues/832.
  touchable: {
    ...(isWeb && {cursor: 'pointer'}),
  },
})
