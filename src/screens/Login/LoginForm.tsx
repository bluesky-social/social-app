import React from 'react'
import {Keyboard, View} from 'react-native'
import * as Browser from 'expo-web-browser'
import {ComAtprotoServerDescribeServer} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAnalytics} from '#/lib/analytics/analytics'
import {isAndroid} from 'platform/detection'
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
  onPressForgotPassword: () => void
}) => {
  const {track} = useAnalytics()
  const {_} = useLingui()

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

  const onPressNext = async () => {
    const authSession = await Browser.openAuthSessionAsync(
      'https://bsky.app/login', // Replace this with the PDS auth url
      'bsky://login', // Replace this as well with the appropriate link
      {
        windowFeatures: {},
      },
    )

    if (authSession.type !== 'success') {
      return
    }

    // Handle session storage here
  }

  console.log(serviceDescription)

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
          onPress={onPressNext}
          disabled={!serviceDescription}>
          <ButtonText>
            <Trans>Sign In</Trans>
          </ButtonText>
        </Button>
      </View>
    </FormContainer>
  )
}
