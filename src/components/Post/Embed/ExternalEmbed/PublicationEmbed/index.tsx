import {type StyleProp, View, type ViewStyle} from 'react-native'
import {Image} from 'expo-image'
import {useLingui} from '@lingui/react/macro'

import {useHaptics} from '#/lib/haptics'
import {shareUrl} from '#/lib/sharing'
import {atoms as a, useTheme} from '#/alf'
import {Divider} from '#/components/Divider'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {IS_NATIVE} from '#/env'
import {MetaRow} from './MetaRow'
import {PublicationFooter} from './PublicationFooter'
import {
  type PublicationViewExternal,
  type PublicationViewExternalSource,
} from './types'

export function PublicationEmbed({
  link,
  source,
  onOpen,
  style,
}: {
  link: PublicationViewExternal
  source: PublicationViewExternalSource
  onOpen?: () => void
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const playHaptic = useHaptics()

  const onPress = () => {
    playHaptic('Light')
    onOpen?.()
  }

  const onShareExternal = () => {
    if (link.uri && IS_NATIVE) {
      playHaptic('Heavy')
      shareUrl(link.uri)
    }
  }

  return (
    <View
      testID="publication-embed"
      style={[
        a.w_full,
        a.rounded_md,
        a.overflow_hidden,
        a.border,
        t.atoms.border_contrast_low,
        style,
      ]}>
      <Link
        to={link.uri}
        label={link.title || l`Open link to ${link.uri}`}
        shouldProxy
        onPress={onPress}
        onLongPress={onShareExternal}>
        {({hovered}) => (
          <View
            style={[
              a.flex_col,
              a.w_full,
              a.transition_color,
              hovered ? t.atoms.bg_contrast_25 : null,
            ]}>
            {link.thumb ? (
              <Image
                style={[a.aspect_card]}
                source={{uri: link.thumb}}
                accessibilityIgnoresInvertColors
                loading="lazy"
              />
            ) : null}
            <View style={[a.p_md, {gap: 6}]}>
              <View style={[{gap: 4}]}>
                <Text
                  emoji
                  numberOfLines={3}
                  style={[
                    a.text_md,
                    a.font_semi_bold,
                    a.leading_snug,
                    t.atoms.text,
                  ]}>
                  {link.title || link.uri}
                </Text>
                {link.description ? (
                  <Text
                    emoji
                    numberOfLines={2}
                    style={[a.text_xs, a.leading_snug, t.atoms.text]}>
                    {link.description}
                  </Text>
                ) : null}
              </View>
              <MetaRow link={link} />
            </View>
          </View>
        )}
      </Link>
      <View style={[a.py_md]}>
        <Divider />
      </View>
      <PublicationFooter source={source} />
      {/*
        Note: `source.theme` (background/foreground/accent/accentForeground
        RGB triplets) is exposed by the lexicon but not consumed here. The
        current design does not apply per-publication accent colors. Pick up
        when product asks for theme accenting.
      */}
    </View>
  )
}
