import React, { useState } from 'react'
import { View } from 'react-native'
import { msg, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'

import { logger } from '#/logger'
import { ScreenTransition } from '#/screens/Login/ScreenTransition'
import { is13, is18, useSignupContext } from '#/screens/Signup/state'
import { Policies } from '#/screens/Signup/StepInfo/Policies'
import { atoms as a } from '#/alf'
import * as DateField from '#/components/forms/DateField'
import { FormError } from '#/components/forms/FormError'
import { HostingProvider } from '#/components/forms/HostingProvider'
import * as TextField from '#/components/forms/TextField'
import { Envelope_Stroke2_Corner0_Rounded as Envelope } from '#/components/icons/Envelope'
import { Lock_Stroke2_Corner0_Rounded as Lock } from '#/components/icons/Lock'
import { Ticket_Stroke2_Corner0_Rounded as Ticket } from '#/components/icons/Ticket'
import { Loader } from '#/components/Loader'

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
  
  const validDomains = [
    'gmail.com',
    'hotmail.com',
    'yahoo.com',
    'outlook.com',
    'icloud.com',
    'aol.com',
    'mail.com',
    'zoho.com',
    'protonmail.com',
    'yandex.com',
    'gmx.com',
    'live.com',
    'fastmail.com',
    'inbox.com',
    'mail.ru',
    'tutanota.com',
    'cox.net',
    'att.net',
    'verizon.net',
    'earthlink.net',
    'rocketmail.com',
    'optonline.net',
    'sbcglobal.net',
    'me.com',
    'msn.com',
    'mailinator.com',
    'runbox.com',
    'mail2world.com',
    'rambler.ru',
    'mail.ru',
    'yopmail.com',
    't-online.de',
    'bluewin.ch',
    'gmx.de',
    'libero.it',
    'web.de',
    'rediffmail.com',
    'bol.com.br',
    'terra.com.br',
    'yahoo.com.br',
    'uol.com.br',
    'ig.com.br',
    'hotmail.co.uk',
    'gmail.co.uk',
    'yahoo.co.uk',
    'btinternet.com',
    'virginmedia.com',
    'ntlworld.com',
    'orange.fr',
    'sfr.fr',
    'free.fr',
    'wanadoo.fr',
    'laposte.net',
    'hotmail.fr',
    'gmail.fr',
    'yahoo.fr',
    'hotmail.es',
    'gmail.es',
    'yahoo.es',
    'terra.es',
    'libero.it',
    'hotmail.it',
    'gmail.it',
    'yahoo.it',
    'alice.it',
    'live.nl',
    'hotmail.nl',
    'gmail.nl',
    'yahoo.nl',
    'ziggo.nl',
    'telenet.be',
    'hotmail.be',
    'gmail.be',
    'yahoo.be',
    'skynet.be',
    'mail.be',
    'live.com.au',
    'hotmail.com.au',
    'gmail.com.au',
    'yahoo.com.au',
    'bigpond.com',
    'iinet.net.au',
    'optusnet.com.au',
    'yahoo.co.in',
    'hotmail.co.in',
    'gmail.co.in',
    'rediffmail.com',
    'yahoo.co.id',
    'hotmail.co.id',
    'gmail.co.id',
    'yahoo.co.jp',
    'hotmail.co.jp',
    'gmail.co.jp',
    'yahoo.co.kr',
    'hotmail.co.kr',
    'gmail.co.kr',
    'yahoo.co.nz',
    'hotmail.co.nz',
    'gmail.co.nz',
    'yahoo.co.za',
    'hotmail.co.za',
    'gmail.co.za',
    'yahoo.com.mx',
    'hotmail.com.mx',
    'gmail.com.mx',
    'yahoo.com.ph',
    'hotmail.com.ph',
    'gmail.com.ph',
    'yahoo.com.sg',
    'hotmail.com.sg',
    'gmail.com.sg',
    'yahoo.se',
    'hotmail.se',
    'gmail.se'
  ];

  function isValidEmailDomain(email: string): boolean {
    const domain = email.split('@')[1];
    return validDomains.includes(domain);
  }

  const [emailIsValid, setEmailIsValid] = useState(true);

  const handleEmailChange = (value: string) => {
    dispatch({ type: 'setEmail', value: value.trim() });

    if (value.includes('@')) {
      setEmailIsValid(isValidEmailDomain(value));
    } else {
      setEmailIsValid(true); // o false, dependiendo de tu lógica de validación
    }
  };

  console.log('Email is valid:', emailIsValid);  // mostrar en console

  return (
    <ScreenTransition>
      <View style={[a.gap_md]}>
        <FormError error={state.error} />
        <View>
          <TextField.LabelText>
            <Trans>Hosting provider</Trans>
          </TextField.LabelText>
          <HostingProvider
            serviceUrl={state.serviceUrl}
            onSelectServiceUrl={v =>
              dispatch({ type: 'setServiceUrl', value: v })
            }
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
                <TextField.LabelText>
                  <Trans>Invite code</Trans>
                </TextField.LabelText>
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
              <TextField.LabelText>
                <Trans>Email</Trans>
              </TextField.LabelText>
              <TextField.Root>
                <TextField.Icon icon={Envelope} />
                <TextField.Input
                  testID="emailInput"
                  onChangeText={handleEmailChange}
                  label={_(msg`Enter your email address`)}
                  defaultValue={state.email}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                />
              </TextField.Root>
            </View>
            <View>
              <TextField.LabelText>
                <Trans>Password</Trans>
              </TextField.LabelText>
              <TextField.Root>
                <TextField.Icon icon={Lock} />
                <TextField.Input
                  testID="passwordInput"
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
              <DateField.LabelText>
                <Trans>Your birth date</Trans>
              </DateField.LabelText>
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
              verificatorEmail={emailIsValid}
            />
          </>
        ) : undefined}
      </View>
    </ScreenTransition>
  )
}
