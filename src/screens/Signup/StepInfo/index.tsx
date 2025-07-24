import React, {useRef} from 'react'
import {Keyboard, type TextInput, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import * as EmailValidator from 'email-validator'
import type tldts from 'tldts'

import {isEmailMaybeInvalid} from '#/lib/strings/email'
import {logger} from '#/logger'
import {ScreenTransition} from '#/screens/Login/ScreenTransition'
import {is13, is18, useSignupContext} from '#/screens/Signup/state'
import {ConfirmationDialog} from '#/screens/Signup/StepInfo/ConfirmationDialog'
import {PasswordValidation} from '#/screens/Signup/StepInfo/PasswordValidation'
import {Policies} from '#/screens/Signup/StepInfo/Policies'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import * as DateField from '#/components/forms/DateField'
import {type DateFieldRef} from '#/components/forms/DateField/types'
import {FormError} from '#/components/forms/FormError'
import {HostingProvider} from '#/components/forms/HostingProvider'
import * as TextField from '#/components/forms/TextField'
import {Ticket_Stroke2_Corner0_Rounded as Ticket} from '#/components/icons/Ticket'
import {Loader} from '#/components/Loader'

function sanitizeDate(date: Date): Date {
  if (!date || date.toString() === 'Invalid Date') {
    logger.error(`Create account: handled invalid date for birthDate`, {
      hasDate: !!date,
    })
    return new Date()
  }
  return date
}

export function StepInfo({
  onPressBack,
  isServerError,
  refetchServer,
  isLoadingStarterPack,
}: {
  onPressBack: () => void
  isServerError: boolean
  refetchServer: () => void
  isLoadingStarterPack: boolean
}) {
  const {_} = useLingui()
  const {state, dispatch} = useSignupContext()

  const inviteCodeValueRef = useRef<string>(state.inviteCode)
  const emailValueRef = useRef<string>(state.email)
  const prevEmailValueRef = useRef<string>(state.email)
  const passwordValueRef = useRef<string>(state.password)

  const emailInputRef = useRef<TextInput>(null)
  const passwordInputRef = useRef<TextInput>(null)
  const birthdateInputRef = useRef<DateFieldRef>(null)

  const [hasWarnedEmail, setHasWarnedEmail] = React.useState<boolean>(false)
  const [showPassword, setShowPassword] = React.useState<boolean>(false)
  const [currentPassword, setCurrentPassword] = React.useState<string>(
    state.password,
  )
  const [currentEmail, setCurrentEmail] = React.useState<string>(state.email)
  const confirmationDialogControl = useDialogControl()

  const tldtsRef = React.useRef<typeof tldts>()
  React.useEffect(() => {
    // @ts-expect-error - valid path
    import('tldts/dist/index.cjs.min.js').then(tldts => {
      tldtsRef.current = tldts
    })
    // This will get used in the avatar creator a few steps later, so lets preload it now
    // @ts-expect-error - valid path
    import('react-native-view-shot/src/index')
  }, [])

  const validateForm = () => {
    const inviteCode = inviteCodeValueRef.current
    const email = emailValueRef.current
    const emailChanged = prevEmailValueRef.current !== email
    const password = passwordValueRef.current

    if (!is13(state.dateOfBirth)) {
      return false
    }

    if (state.serviceDescription?.inviteCodeRequired && !inviteCode) {
      dispatch({
        type: 'setError',
        value: _(msg`Please enter your invite code.`),
        field: 'invite-code',
      })
      return false
    }
    if (!email) {
      dispatch({
        type: 'setError',
        value: _(msg`Please enter your email.`),
        field: 'email',
      })
      return false
    }
    if (!EmailValidator.validate(email)) {
      dispatch({
        type: 'setError',
        value: _(msg`Your email appears to be invalid.`),
        field: 'email',
      })
      return false
    }
    if (emailChanged && tldtsRef.current) {
      if (isEmailMaybeInvalid(email, tldtsRef.current)) {
        prevEmailValueRef.current = email
        setHasWarnedEmail(true)
        dispatch({
          type: 'setError',
          value: _(
            msg`Please double-check that you have entered your email address correctly.`,
          ),
        })
        return false
      }
    } else if (hasWarnedEmail) {
      setHasWarnedEmail(false)
    }
    prevEmailValueRef.current = email
    if (!password) {
      dispatch({
        type: 'setError',
        value: _(msg`Please choose your password.`),
        field: 'password',
      })
      return false
    }
    if (password.length < 8) {
      dispatch({
        type: 'setError',
        value: _(msg`Your password must be at least 8 characters long.`),
        field: 'password',
      })
      return false
    }
    if (
      !(
        /\d/.test(password) ||
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
      )
    ) {
      dispatch({
        type: 'setError',
        value: _(
          msg`Your password must contain at least one symbol or number.`,
        ),
        field: 'password',
      })
      return false
    }
    if (email && password.toLowerCase().includes(email.toLowerCase())) {
      dispatch({
        type: 'setError',
        value: _(msg`Your password cannot include your email address.`),
        field: 'password',
      })
      return false
    }

    return true
  }

  const onNextPress = () => {
    const inviteCode = inviteCodeValueRef.current
    const email = emailValueRef.current
    const password = passwordValueRef.current

    dispatch({type: 'setInviteCode', value: inviteCode})
    dispatch({type: 'setEmail', value: email})
    dispatch({type: 'setPassword', value: password})
    dispatch({type: 'next'})
    logger.metric(
      'signup:nextPressed',
      {
        activeStep: state.activeStep,
      },
      {statsig: true},
    )
  }

  const onPressSelectService = React.useCallback(() => {
    Keyboard.dismiss()
  }, [])

  const togglePasswordVisibility = React.useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

  return (
    <ScreenTransition>
      <View style={[a.gap_md]}>
        <FormError error={state.error} />
        <View style={[a.mb_md]}>
          <HostingProvider
            serviceUrl={state.serviceUrl}
            onSelectServiceUrl={v =>
              dispatch({type: 'setServiceUrl', value: v})
            }
            onOpenDialog={onPressSelectService}
          />
        </View>
        {state.isLoading || isLoadingStarterPack ? (
          <View style={[a.align_center]}>
            <Loader size="xl" />
          </View>
        ) : state.serviceDescription ? (
          <View>
            {state.serviceDescription.inviteCodeRequired && (
              <TextField.Root isInvalid={state.errorField === 'invite-code'}>
                <TextField.Icon icon={Ticket} />
                <TextField.Input
                  isFirst={true}
                  onChangeText={value => {
                    inviteCodeValueRef.current = value.trim()
                    if (
                      state.errorField === 'invite-code' &&
                      value.trim().length > 0
                    ) {
                      dispatch({type: 'clearError'})
                    }
                  }}
                  label={_(msg`Invite code`)}
                  defaultValue={state.inviteCode}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  returnKeyType="next"
                  textContentType="emailAddress"
                  onSubmitEditing={() => {
                    emailInputRef.current?.focus()
                  }}
                  blurOnSubmit={false}
                />
              </TextField.Root>
            )}
            <TextField.Root isInvalid={state.errorField === 'email'}>
              <TextField.Input
                isFirst={!state.serviceDescription.inviteCodeRequired}
                testID="emailInput"
                inputRef={emailInputRef}
                label={_(msg`Email address`)}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                returnKeyType="next"
                textContentType="emailAddress"
                defaultValue={state.email}
                onChangeText={value => {
                  const trimmedValue = value.trim()
                  emailValueRef.current = trimmedValue
                  setCurrentEmail(trimmedValue)
                  if (hasWarnedEmail) {
                    setHasWarnedEmail(false)
                  }
                  if (
                    state.errorField === 'email' &&
                    trimmedValue.length > 0 &&
                    EmailValidator.validate(trimmedValue)
                  ) {
                    dispatch({type: 'clearError'})
                  }
                }}
                onSubmitEditing={() => {
                  passwordInputRef.current?.focus()
                }}
                blurOnSubmit={false}
                accessibilityHint={_(
                  msg`Enter the email address you used when you created your account`,
                )}
              />
            </TextField.Root>
            <TextField.Root isInvalid={state.errorField === 'password'}>
              <TextField.Input
                isLast={true}
                testID="passwordInput"
                inputRef={passwordInputRef}
                label={_(msg`Password`)}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                returnKeyType="done"
                enablesReturnKeyAutomatically={true}
                secureTextEntry={!showPassword}
                textContentType="password"
                defaultValue={state.password}
                onChangeText={value => {
                  passwordValueRef.current = value
                  setCurrentPassword(value)
                  if (
                    state.errorField === 'password' &&
                    value.length >= 8 &&
                    (/\d/.test(value) ||
                      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) &&
                    (!emailValueRef.current ||
                      !value
                        .toLowerCase()
                        .includes(emailValueRef.current.toLowerCase()))
                  ) {
                    dispatch({type: 'clearError'})
                  }
                }}
                onSubmitEditing={() => {
                  birthdateInputRef.current?.focus()
                }}
                blurOnSubmit={false}
                passwordRules="minlength: 8;"
                accessibilityHint={_(msg`Enter your password`)}
              />
              <Button
                testID="showPasswordButton"
                onPress={togglePasswordVisibility}
                label={
                  showPassword ? _(msg`Hide password?`) : _(msg`Show password?`)
                }
                accessibilityHint={
                  showPassword
                    ? _(msg`Hides the password`)
                    : _(msg`Shows the password`)
                }
                variant="ghost"
                color="link">
                <ButtonText>
                  <Trans>{showPassword ? 'Hide' : 'Show'}</Trans>
                </ButtonText>
              </Button>
            </TextField.Root>
            <PasswordValidation
              password={currentPassword}
              email={currentEmail}
            />
            <View style={[a.mt_xl]}>
              <DateField.LabelText>
                <Trans>Your birth date</Trans>
              </DateField.LabelText>
              <DateField.DateField
                testID="date"
                inputRef={birthdateInputRef}
                value={state.dateOfBirth}
                onChangeDate={date => {
                  dispatch({
                    type: 'setDateOfBirth',
                    value: sanitizeDate(new Date(date)),
                  })
                }}
                label={_(msg`Date of birth`)}
                accessibilityHint={_(msg`Select your date of birth`)}
                maximumDate={new Date()}
              />
            </View>
            <View style={[a.mt_lg, a.mb_lg]}>
              <Policies
                serviceDescription={state.serviceDescription}
                needsGuardian={!is18(state.dateOfBirth)}
                under13={!is13(state.dateOfBirth)}
              />
            </View>
          </View>
        ) : undefined}
      </View>
      <View
        style={[a.border_t, a.w_full, {borderColor: '#D8D8D8', borderWidth: 1}]}
      />
      <View style={[a.flex_row, a.align_center, a.pt_lg]}>
        <Button
          label={_(msg`Cancel`)}
          variant="solid"
          color="secondary"
          size="large"
          onPress={onPressBack}>
          <ButtonText>
            <Trans>Cancel</Trans>
          </ButtonText>
        </Button>
        <View style={a.flex_1} />
        {isServerError ? (
          <Button
            testID="retryButton"
            label={_(msg`Retry`)}
            accessibilityHint={_(msg`Retries connection`)}
            variant="solid"
            color="secondary"
            size="large"
            onPress={refetchServer}>
            <ButtonText>
              <Trans>Retry</Trans>
            </ButtonText>
          </Button>
        ) : (
          <Button
            testID="nextBtn"
            label={_(msg`Continue to next step`)}
            accessibilityHint={_(msg`Opens confirmation dialog`)}
            variant="solid"
            color="primary"
            size="large"
            disabled={state.isLoading || !is13(state.dateOfBirth)}
            onPress={() => {
              if (validateForm()) {
                confirmationDialogControl.open()
              }
            }}>
            <ButtonText>
              {hasWarnedEmail ? (
                _(msg`It's correct`)
              ) : (
                <Trans>Agree and continue</Trans>
              )}
            </ButtonText>
            {state.isLoading && <ButtonIcon icon={Loader} />}
          </Button>
        )}
      </View>
      <ConfirmationDialog
        control={confirmationDialogControl}
        onConfirm={onNextPress}
        email={currentEmail}
      />
      <View style={[a.flex_row, a.align_center, a.pt_lg]}>
        <Button
          label={_(msg`Cancel`)}
          variant="solid"
          color="secondary"
          size="large"
          onPress={onPressBack}>
          <ButtonText>
            <Trans>Cancel</Trans>
          </ButtonText>
        </Button>
        <View style={a.flex_1} />
        {isServerError ? (
          <Button
            testID="retryButton"
            label={_(msg`Retry`)}
            accessibilityHint={_(msg`Retries connection`)}
            variant="solid"
            color="secondary"
            size="large"
            onPress={refetchServer}>
            <ButtonText>
              <Trans>Retry</Trans>
            </ButtonText>
          </Button>
        ) : (
          <Button
            testID="nextBtn"
            label={_(msg`Continue to next step`)}
            accessibilityHint={_(msg`Opens confirmation dialog`)}
            variant="solid"
            color="primary"
            size="large"
            disabled={state.isLoading || !is13(state.dateOfBirth)}
            onPress={() => {
              if (validateForm()) {
                confirmationDialogControl.open()
              }
            }}>
            <ButtonText>
              {hasWarnedEmail ? (
                _(msg`It's correct`)
              ) : (
                <Trans>Agree and continue</Trans>
              )}
            </ButtonText>
            {state.isLoading && <ButtonIcon icon={Loader} />}
          </Button>
        )}
      </View>
    </ScreenTransition>
  )
}
