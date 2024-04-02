import React, {useRef, useState} from 'react'
import {
  ActivityIndicator,
  Keyboard,
  LayoutAnimation,
  TextInput,
  View,
} from 'react-native'
import {ComAtprotoServerDescribeServer} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAnalytics} from '#/lib/analytics/analytics'
import {isNetworkError} from '#/lib/strings/errors'
import {cleanError} from '#/lib/strings/errors'
import {createFullHandle} from '#/lib/strings/handles'
import {logger} from '#/logger'
import {useSessionApi} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {FormError} from '#/components/forms/FormError'
import {HostingProvider} from '#/components/forms/HostingProvider'
import * as TextField from '#/components/forms/TextField'
import {At_Stroke2_Corner0_Rounded as At} from '#/components/icons/At'
import {Lock_Stroke2_Corner0_Rounded as Lock} from '#/components/icons/Lock'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {FormContainer} from './FormContainer'

type ServiceDescription = ComAtprotoServerDescribeServer.OutputSchema

export const LoginForm = ({
  error,
  serviceUrl,
  serviceDescription,
  initialHandle,
  setError,
  setServiceUrl,
  onPressRetryConnect,
  onPressBack,
  onPressForgotPassword,
}: {
  error: string
  serviceUrl: string
  serviceDescription: ServiceDescription | undefined
  initialHandle: string
  setError: (v: string) => void
  setServiceUrl: (v: string) => void
  onPressRetryConnect: () => void
  onPressBack: () => void
  onPressForgotPassword: () => void
}) => {
  const {track} = useAnalytics()
  const t = useTheme()
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const passwordInputRef = useRef<TextInput>(null)
  const {_} = useLingui()
  const {login} = useSessionApi()

  const onPressSelectService = React.useCallback(() => {
    Keyboard.dismiss()
    track('Signin:PressedSelectService')
  }, [track])

  const onPressNext = async () => {}

  return (
    <FormContainer testID="loginForm" title={<Trans>Sign in</Trans>}>
      <View>
        <TextField.Label>
          <Trans>Hosting provider</Trans>
        </TextField.Label>
        <HostingProvider
          serviceUrl={serviceUrl}
          onSelectServiceUrl={setServiceUrl}
          onOpenDialog={onPressSelectService}
        />
      </View>
      <FormError error={error} />
      <View style={[a.flex_row, a.align_center, a.justify_between, a.pt_md]}>
        <Button
          label={_(msg`Back`)}
          variant="solid"
          color="secondary"
          size="medium"
          onPress={onPressBack}>
          <ButtonText>
            <Trans>Back</Trans>
          </ButtonText>
        </Button>
        <Button
          label={_(msg`Back`)}
          variant="solid"
          color="primary"
          size="medium"
          onPress={onPressBack}>
          <ButtonText>
            <Trans>Login</Trans>
          </ButtonText>
        </Button>
      </View>
    </FormContainer>
  )
}
