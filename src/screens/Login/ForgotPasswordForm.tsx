import React, {useState} from 'react'
import {ActivityIndicator, Keyboard, View} from 'react-native'
import {type ComAtprotoServerDescribeServer} from '@gander-social-atproto/api'
import {GndrAgent} from '@gander-social-atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import * as EmailValidator from 'email-validator'

import {isNetworkError} from '#/lib/strings/errors'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {FormError} from '#/components/forms/FormError'
import {HostingProvider} from '#/components/forms/HostingProvider'
import * as TextField from '#/components/forms/TextField'
import {PasswordLock} from '#/components/icons/PasswordLock'
import {Text} from '#/components/Typography'
import {FormContainer} from './FormContainer'
import {ResetPasswordDialog} from './ResetpasswordDialog'

type ServiceDescription = ComAtprotoServerDescribeServer.OutputSchema

export const ForgotPasswordForm = ({
  error,
  serviceUrl,
  serviceDescription,
  setError,
  setServiceUrl,
  onPressBack,
  onPasswordSet,
}: {
  error: string
  serviceUrl: string
  serviceDescription: ServiceDescription | undefined
  setError: (v: string) => void
  setServiceUrl: (v: string) => void
  onPressBack: () => void
  onPasswordSet: () => void
}) => {
  const [isAlreadyHaveCode, setAlreadyHaveCode] = useState(false)
  const t = useTheme()
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')
  const {_} = useLingui()
  const resetPasswordDialogControl = useDialogControl()

  const onPressSelectService = React.useCallback(() => {
    Keyboard.dismiss()
  }, [])

  const onPressNext = async () => {
    setAlreadyHaveCode(false)
    if (!EmailValidator.validate(email)) {
      return setError(_(msg`Your email appears to be invalid.`))
    }

    setError('')
    setIsProcessing(true)

    try {
      const agent = new GndrAgent({service: serviceUrl})
      await agent.com.atproto.server.requestPasswordReset({email})
      setIsProcessing(false)
      Keyboard.dismiss()
      resetPasswordDialogControl.open()
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
    <FormContainer testID="forgotPasswordForm" style={a.gap_2xl}>
      <ResetPasswordDialog
        isAlreadyHaveCode={isAlreadyHaveCode}
        email={email}
        control={resetPasswordDialogControl}
        onSelect={() => {
          Keyboard.dismiss()
        }}
        error={error}
        setError={setError}
        serviceUrl={serviceUrl}
        onPasswordSet={onPasswordSet}
      />
      <Text
        style={[a.text_md, a.font_medium, t.atoms.text_contrast_high, a.mb_sm]}>
        <Trans>Forgot Password</Trans>
      </Text>
      <PasswordLock />

      <Text style={[a.text_md, a.font_normal, t.atoms.text_contrast_high]}>
        <Trans>
          Select your hosting provider and enter the email you used to create
          your account. We’ll send you a “reset code” so you can set a new
          password.
        </Trans>
      </Text>
      <View>
        <HostingProvider
          serviceUrl={serviceUrl}
          onSelectServiceUrl={setServiceUrl}
          onOpenDialog={onPressSelectService}
        />
      </View>
      <View>
        <TextField.Root>
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
      <View style={[a.flex_row]}>
        <Button
          testID="skipSendEmailButton"
          onPress={() => {
            setAlreadyHaveCode(true)
            Keyboard.dismiss()
            resetPasswordDialogControl.open()
          }}
          label={_(msg`Go to next`)}
          accessibilityHint={_(msg`Navigates to the next screen`)}
          style={[a.px_0, a.py_0]}
          size="large"
          variant="ghost"
          color="link">
          <ButtonText>
            <Trans>I already have a reset code?</Trans>
          </ButtonText>
        </Button>
      </View>
      {/* <Text style={[t.atoms.text_contrast_high, a.leading_snug]}>
        <Trans>
          Enter the email you used to create your account. We'll send you a
          "reset code" so you can set a new password.
        </Trans>
      </Text> */}

      <FormError error={error} />
      <View style={a.flex_1} />

      <View
        style={[
          a.flex_row,
          a.align_center,
          a.pt_md,
          a.border_t,
          {borderColor: '#D8D8D8'},
        ]}>
        <Button
          label={_(msg`Back`)}
          variant="solid"
          color="secondary"
          size="large"
          onPress={onPressBack}>
          <ButtonText>
            <Trans>Back</Trans>
          </ButtonText>
        </Button>
        <View style={a.flex_1} />
        {!serviceDescription || isProcessing ? (
          <ActivityIndicator />
        ) : (
          <Button
            label={_(msg`Next`)}
            variant="solid"
            color={'primary'}
            size="large"
            onPress={onPressNext}>
            <ButtonText>
              <Trans>Send Code</Trans>
            </ButtonText>
          </Button>
        )}
        {!serviceDescription || isProcessing ? (
          <Text style={[t.atoms.text_contrast_high, a.pl_md]}>
            <Trans>Processing...</Trans>
          </Text>
        ) : undefined}
      </View>
    </FormContainer>
  )
}
