import {View} from 'react-native'

import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {InlineLinkText, Link} from '#/components/Link'
import {H1, H2, Text} from '#/components/Typography'

export function Links() {
  const t = useTheme()
  const openAppLink = useOpenLink({preferNativeApp: true})

  return (
    <View style={[a.gap_md, a.align_start]}>
      <H1>Links</H1>

      <View style={[a.gap_md, a.align_start]}>
        <InlineLinkText label="foo" to="https://google.com" style={[a.text_lg]}>
          https://google.com
        </InlineLinkText>
        <InlineLinkText label="foo" to="https://google.com" style={[a.text_lg]}>
          External with custom children (google.com)
        </InlineLinkText>
        <InlineLinkText
          label="foo"
          to="https://bsky.social"
          style={[a.text_md, t.atoms.text_contrast_low]}>
          Internal (bsky.social)
        </InlineLinkText>
        <InlineLinkText
          label="foo"
          to="https://bsky.app/profile/bsky.app"
          style={[a.text_md]}>
          Internal (bsky.app)
        </InlineLinkText>

        <Link
          variant="solid"
          color="primary"
          size="large"
          label="View @bsky.app's profile"
          to="https://bsky.app/profile/bsky.app">
          <ButtonText>Link as a button</ButtonText>
        </Link>

        <Link
          label="View @bsky.app's profile"
          to="https://bsky.app/profile/bsky.app">
          <View
            style={[
              a.flex_row,
              a.align_center,
              a.gap_md,
              a.rounded_md,
              a.p_md,
              t.atoms.bg_contrast_25,
            ]}>
            <View
              style={[
                {width: 32, height: 32},
                a.rounded_full,
                t.atoms.bg_contrast_200,
              ]}
            />
            <Text>View @bsky.app's profile</Text>
          </View>
        </Link>
      </View>

      <View style={[a.gap_md, a.align_start]}>
        <H2>Native app links</H2>
        <Text>
          On iOS and Android, try the installed app before browser consent or
          the saved browser preference. If no app handles the link, use the
          normal browser flow. Requires a native rebuild.
        </Text>
        <Button
          testID="storybookAppLinkGrain"
          label="Open Grain gallery"
          color="primary"
          size="large"
          onPress={() =>
            openAppLink(
              'https://grain.social/profile/esb.lol/gallery/3mx3sn672gljc',
            )
          }>
          <ButtonText>View on Grain</ButtonText>
        </Button>
        <Button
          testID="storybookAppLinkYouTube"
          label="Open YouTube video"
          color="primary"
          size="large"
          onPress={() =>
            openAppLink(
              'https://www.youtube.com/watch?v=_WCAOL7UsXM&list=RD_WCAOL7UsXM&start_radio=1',
            )
          }>
          <ButtonText>Watch on YouTube</ButtonText>
        </Button>
      </View>
    </View>
  )
}
