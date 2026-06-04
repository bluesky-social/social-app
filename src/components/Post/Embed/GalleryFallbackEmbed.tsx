import {Linking, View} from 'react-native'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'

import {BSKY_DOWNLOAD_URL} from '#/lib/constants'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Sparkle_Stroke2_Corner0_Rounded as Sparkle} from '#/components/icons/Sparkle'
import {Text} from '#/components/Typography'
import {IS_NATIVE} from '#/env'

/**
 * OTA-able fallback that ships to native builds which don't yet know how to
 * render the new gallery embed (>4 images, Photos v2). Final copy and visual
 * treatment pending design from Darrin/Danielle/Alex.
 *
 * Native-only per APP-2308 - web builds receive the new gallery support in
 * the same release that adds it.
 */
export function GalleryFallbackEmbed({count}: {count?: number}) {
  const t = useTheme()
  const {t: l} = useLingui()

  if (!IS_NATIVE) return null

  const bodyStyle = [
    a.text_sm,
    a.text_center,
    a.leading_snug,
    t.atoms.text_contrast_high,
  ]

  return (
    <View
      style={[
        a.mt_sm,
        a.rounded_md,
        a.border,
        a.p_lg,
        a.pb_2xl,
        a.gap_sm,
        a.align_center,
        {
          borderColor: t.palette.primary_200,
          backgroundColor: t.palette.primary_25,
        },
      ]}>
      <Sparkle size="lg" fill={t.palette.primary_500} />
      <Text style={[a.text_md, a.font_bold, a.text_center, t.atoms.text]}>
        <Trans>Something new is here</Trans>
      </Text>
      {count ? (
        <View>
          <Text style={bodyStyle}>
            {plural(count, {
              one: 'This post has # photo.',
              other: 'This post has # photos.',
            })}
          </Text>
          <Text style={bodyStyle}>
            {plural(count, {
              one: 'Update your app to see it.',
              other: 'Update your app to see them all.',
            })}
          </Text>
        </View>
      ) : (
        <Text style={bodyStyle}>
          <Trans>Update your app to see it.</Trans>
        </Text>
      )}
      <Button
        label={l`Update your app`}
        size="small"
        color="primary"
        onPress={() => {
          void Linking.openURL(BSKY_DOWNLOAD_URL)
        }}
        style={[a.mt_xs]}>
        <ButtonText>
          <Trans>Update app</Trans>
        </ButtonText>
      </Button>
    </View>
  )
}
