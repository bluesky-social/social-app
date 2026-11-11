import {View} from 'react-native'
import {Image} from 'expo-image'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'

export function AboutAtmosphereDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const {t: l} = useLingui()

  return (
    <Dialog.Outer control={control} testID="aboutAtmosphereDialog">
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={l`What is the Atmosphere?`}
        style={[a.overflow_hidden, web({maxWidth: 440})]}
        contentContainerStyle={[a.px_0, a.pt_0, a.pb_0]}>
        <Image
          source={require('../../../../assets/images/atmosphere-tab-banner.webp')}
          contentFit="cover"
          style={[a.w_full, {aspectRatio: (724 * 3) / 2 / 418}]}
          accessible={false}
        />
        <View style={[a.p_2xl, a.gap_2xl]}>
          <View style={[a.gap_sm]}>
            <Text role="heading" style={[a.text_2xl, a.font_bold]}>
              <Trans>What is the Atmosphere?</Trans>
            </Text>
            <Text style={[a.text_md, a.leading_snug]}>
              <Trans>
                The Atmosphere is an open ecosystem of apps and integrations
                that connect to each other via the AT Protocol. Think of this
                protocol as the social connective layer of the internet you
                already know and love. In fact, Bluesky is just another
                Atmosphere app, so you’re already using it!
              </Trans>
            </Text>
          </View>
          <Text style={[a.text_md, a.leading_snug]}>
            <Trans>
              In the Atmosphere, a single login grants you access to hundreds of
              apps and services, and allows you to transfer your audience and
              data between apps as you see fit. No more being locked into a
              single platform because your friends are there.
            </Trans>
          </Text>
          <Text style={[a.text_md, a.leading_snug]}>
            <Trans>
              Anything can be built on the AT Protocol, and any app can
              integrate parts of it to enhance the experience for their users.
              On this page you’ll find articles, photos, apps and more. They’re
              all part of the Atmosphere, and so are you!
            </Trans>
          </Text>
          <Text emoji style={[a.text_md, a.leading_snug]}>
            <Trans>Welcome to the social internet 😀</Trans>
          </Text>
          <Button
            label={l`Okay`}
            color="primary"
            size="large"
            testID="aboutAtmosphereDialogOkay"
            onPress={() => control.close()}>
            <ButtonText>
              <Trans>Okay</Trans>
            </ButtonText>
          </Button>
        </View>
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
