import React from 'react'
import {Keyboard, View} from 'react-native'
import * as Browser from 'expo-web-browser'
import {ComAtprotoServerDescribeServer} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAnalytics} from '#/lib/analytics/analytics'
import {isAndroid} from 'platform/detection'
import {useLogin} from '#/screens/Login/hooks/useLogin'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {FormError} from '#/components/forms/FormError'
import {HostingProvider} from '#/components/forms/HostingProvider'
import * as TextField from '#/components/forms/TextField'
import {FormContainer} from './FormContainer'

type ServiceDescription = ComAtprotoServerDescribeServer.OutputSchema

export const LoginForm = ({
  error,
  serviceUrl,
  serviceDescription,
  setError,
  setServiceUrl,
  onPressRetryConnect,
  onPressBack,
}: {
  error: string
  serviceUrl: string
  serviceDescription: ServiceDescription | undefined
  setError: (v: string) => void
  setServiceUrl: (v: string) => void
  onPressRetryConnect: () => void
  onPressBack: () => void
}) => {
  const {track} = useAnalytics()
  const {_} = useLingui()
  const {openAuthSession} = useLogin(serviceUrl)

  // This improves speed at which the browser presents itself on Android
  React.useEffect(() => {
    if (isAndroid) {
      Browser.warmUpAsync()
    }
  }, [])

  const onPressSelectService = React.useCallback(() => {
    Keyboard.dismiss()
    track('Signin:PressedSelectService')
  }, [track])

  return (
    <FormContainer testID="loginForm" titleText={<Trans>Sign in</Trans>}>
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
      <FormError error={error} />
      <View style={[a.flex_row, a.align_center, a.justify_between, a.pt_5xl]}>
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
          onPress={openAuthSession}
          disabled={!serviceDescription}>
          <ButtonText>
            <Trans>Sign In</Trans>
          </ButtonText>
        </Button>
      </View>
    </FormContainer>
  )
}
