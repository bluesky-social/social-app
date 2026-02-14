import React, {useState} from 'react'
import {Keyboard, View} from 'react-native'
import {type ComAtprotoServerDescribeServer} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import * as EmailValidator from 'email-validator'

import {cleanError, isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {Agent} from '#/state/session/agent'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {FormError} from '#/components/forms/FormError'
import {HostingProvider} from '#/components/forms/HostingProvider'
import * as TextField from '#/components/forms/TextField'
import {At_Stroke2_Corner0_Rounded as At} from '#/components/icons/At'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'
import {FormContainer} from './FormContainer'

type ServiceDescription = ComAtprotoServerDescribeServer.OutputSchema

export const ForgotPasswordForm = ({
  error,
  serviceUrl,
  serviceDescription,
  setError,
  setServiceUrl,
  onPressBack,
  onEmailSent,
}: {
  error: string
  serviceUrl: string
  serviceDescription: ServiceDescription | undefined
  setError: (v: string) => void
  setServiceUrl: (v: string) => void
  onPressBack: () => void
  onEmailSent: () => void
}) => {
  const t = useTheme()
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')
  const {_} = useLingui()

  const onPressSelectService = React.useCallback(() => {
    Keyboard.dismiss()
  }, [])

  const onPressNext = async () => {
    if (!EmailValidator.validate(email)) {
      return setError(_(msg`Your email appears to be invalid.`))
    }

    setError('')
    setIsProcessing(true)

    try {
      const agent = new Agent(null, {service: serviceUrl})
      await agent.com.atproto.server.requestPasswordReset({email})
      onEmailSent()
    } catch (e: any) {
      const errMsg = e.toString()
      logger.warn('Failed to request password reset', {error: e})
      setIsProcessing(false)
      if (isNetworkError(e)) {
        setError(
          _(
            msg`Unable to contact your service. Please check your Internet connection.`,
          ),
        )
      } else {
        setError(cleanError(errMsg))
      }
    }
  }

  return (
    <FormContainer
      testID="forgotPasswordForm"
      titleText={<Trans>Reset password</Trans>}>
      <View>
        <TextField.LabelText>
          <Trans>Hosting provider</Trans>
        </TextField.LabelText>
        <HostingProvider
          serviceUrl={serviceUrl}
          onSelectServiceUrl={setServiceUrl}
          onOpenDialog={onPressSelectService}
        />
      </View>
      <View>
        <TextField.LabelText>
          <Trans>Email address</Trans>
        </TextField.LabelText>
        <TextField.Root>
          <TextField.Icon icon={At} />
          <TextField.Input
            testID="forgotPasswordEmail"
            label={_(msg`Enter your email address`)}
            autoCapitalize="none"
            autoFocus
            autoCorrect={false}
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            editable={!isProcessing}
            accessibilityHint={_(msg`Sets email for password reset`)}
          />
        </TextField.Root>
      </View>

      <Text style={[t.atoms.text_contrast_high, a.leading_snug]}>
        <Trans>
          Enter the email you used to create your account. We'll send you a
          "reset code" so you can set a new password.
        </Trans>
      </Text>

      <FormError error={error} />

      <View style={[web([a.flex_row, a.align_center]), a.pt_md]}>
        {IS_WEB && (
          <>
            <Button
              label={_(msg`Back`)}
              color="secondary"
              size="large"
              onPress={onPressBack}>
              <ButtonText>
                <Trans>Back</Trans>
              </ButtonText>
            </Button>
            <View style={a.flex_1} />
          </>
        )}
        {!serviceDescription ? (
          <Button
            label={_(msg`Connecting to service...`)}
            size="large"
            color="secondary"
            disabled>
            <ButtonIcon icon={Loader} />
            <ButtonText>Connecting...</ButtonText>
          </Button>
        ) : (
          <Button
            label={_(msg`Next`)}
            accessibilityHint={_(msg`Navigates to the next screen`)}
            color="primary"
            size="large"
            onPress={onPressNext}
            disabled={isProcessing}>
            <ButtonText>
              <Trans>Next</Trans>
            </ButtonText>
            {isProcessing && <ButtonIcon icon={Loader} />}
          </Button>
        )}
      </View>
      <View
        style={[
          t.atoms.border_contrast_medium,
          a.border_t,
          a.pt_xl,
          a.mt_md,
          a.flex_row,
          a.justify_center,
        ]}>
        <Button
          testID="skipSendEmailButton"
          onPress={onEmailSent}
          label={_(msg`Go to next`)}
          accessibilityHint={_(msg`Navigates to the next screen`)}
          size="large"
          variant="ghost"
          color="secondary">
          <ButtonText>
            <Trans>Already have a code?</Trans>
          </ButtonText>
        </Button>
      </View>
    </FormContainer>
  )
}
