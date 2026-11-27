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
                The Atmosphere is an open network of connected apps. Bluesky is
                one of them, so you’re already part of it!
              </Trans>
            </Text>
          </View>
          <Text style={[a.text_md, a.leading_snug]}>
            <Trans>
              You can use your Bluesky account to explore other Atmosphere apps
              for blogging, photos, livestreams, and more. You don't have to
              start over with a new account every time you try something new.
            </Trans>
          </Text>
          <Text style={[a.text_md, a.leading_snug]}>
            <Trans>
              These apps are built on the AT Protocol, a shared technology that
              lets them work together. Instead of keeping your identity,
              connections, and content locked inside one platform, the
              Atmosphere gives you choice in where and how you connect.
            </Trans>
          </Text>
          <Text style={[a.text_md, a.leading_snug]}>
            <Trans>
              On this screen, you can discover apps, explore what people are
              making, and keep up with people you follow.
            </Trans>
          </Text>
          <Text emoji style={[a.text_md, a.leading_snug]}>
            <Trans>Welcome to the social internet 😀</Trans>
          </Text>
          <Button
            label={l`Got it`}
            color="primary"
            size="large"
            testID="aboutAtmosphereDialogOkay"
            onPress={() => control.close()}>
            <ButtonText>
              <Trans>Got it</Trans>
            </ButtonText>
          </Button>
        </View>
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
