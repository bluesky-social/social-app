import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {atoms as a} from '#/alf'
import * as TextField from '#/components/forms/TextField'
import {Envelope_Stroke2_Corner0_Rounded as Envelope} from '#/components/icons/Envelope'
import {Lock_Stroke2_Corner0_Rounded as Lock} from '#/components/icons/Lock'
import {Ticket_Stroke2_Corner0_Rounded as Ticket} from '#/components/icons/Ticket'
import {is13, is18, useSignupContext} from '#/screens/Signup/state'
import * as DateField from '#/components/forms/DateField'
import {logger} from '#/logger'
import {ErrorMessage} from 'view/com/util/error/ErrorMessage'
import {Loader} from '#/components/Loader'
import {Policies} from 'view/com/auth/create/Policies'
import {HostingProvider} from '#/components/forms/HostingProvider'
import Animated, {FadeInRight, FadeOutLeft} from 'react-native-reanimated'

function sanitizeDate(date: Date): Date {
  if (!date || date.toString() === 'Invalid Date') {
    logger.error(`Create account: handled invalid date for birthDate`, {
      hasDate: !!date,
    })
    return new Date()
  }
  return date
}

export function StepInfo() {
  const {_} = useLingui()
  const {state, dispatch} = useSignupContext()

  return (
    <Animated.View
      style={[a.gap_lg]}
      entering={FadeInRight}
      exiting={FadeOutLeft}>
      {state.error ? (
        <ErrorMessage message={state.error} style={[a.rounded_sm]} />
      ) : undefined}

      <View>
        <TextField.Label>
          <Trans>Hosting provider</Trans>
        </TextField.Label>
        <HostingProvider
          serviceUrl={state.serviceUrl}
          onSelectServiceUrl={v => dispatch({type: 'setServiceUrl', value: v})}
        />
      </View>
      {state.isLoading ? (
        <View style={[a.align_center]}>
          <Loader size="xl" />
        </View>
      ) : state.serviceDescription ? (
        <>
          {state.serviceDescription.inviteCodeRequired && (
            <View>
              <TextField.Label>
                <Trans>Invite code</Trans>
              </TextField.Label>
              <TextField.Root>
                <TextField.Icon icon={Ticket} />
                <TextField.Input
                  onChangeText={value => {
                    dispatch({
                      type: 'setInviteCode',
                      value: value.trim(),
                    })
                  }}
                  label={_(msg`Required for this provider`)}
                  defaultValue={state.inviteCode}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                />
              </TextField.Root>
            </View>
          )}
          <View>
            <TextField.Label>
              <Trans>Email</Trans>
            </TextField.Label>
            <TextField.Root>
              <TextField.Icon icon={Envelope} />
              <TextField.Input
                onChangeText={value => {
                  dispatch({
                    type: 'setEmail',
                    value: value.trim(),
                  })
                }}
                label={_(msg`Enter your email address`)}
                defaultValue={state.email}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
              />
            </TextField.Root>
          </View>
          <View>
            <TextField.Label>
              <Trans>Password</Trans>
            </TextField.Label>
            <TextField.Root>
              <TextField.Icon icon={Lock} />
              <TextField.Input
                onChangeText={value => {
                  dispatch({
                    type: 'setPassword',
                    value,
                  })
                }}
                label={_(msg`Choose your password`)}
                defaultValue={state.password}
                secureTextEntry
                autoComplete="new-password"
              />
            </TextField.Root>
          </View>
          <View>
            <DateField.Label>
              <Trans>Your birth date</Trans>
            </DateField.Label>
            <DateField.DateField
              testID="date"
              value={DateField.utils.toSimpleDateString(state.dateOfBirth)}
              onChangeDate={date => {
                dispatch({
                  type: 'setDateOfBirth',
                  value: sanitizeDate(new Date(date)),
                })
              }}
              label={_(msg`Date of birth`)}
              accessibilityHint={_(msg`Select your date of birth`)}
            />
          </View>
          <Policies
            serviceDescription={state.serviceDescription}
            needsGuardian={!is18(state.dateOfBirth)}
            under13={!is13(state.dateOfBirth)}
          />
        </>
      ) : undefined}
    </Animated.View>
  )
}
