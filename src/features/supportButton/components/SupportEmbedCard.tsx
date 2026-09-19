import {type StyleProp, View, type ViewStyle} from 'react-native'
import {Image} from 'expo-image'
import {useLingui} from '@lingui/react/macro'

import {useHaptics} from '#/lib/haptics'
import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'
import {SupportedBy} from './SupportedBy'
import {SupportPill} from './SupportPill'

/**
 * A regular link card (same anatomy as `ExternalEmbed`) with the green Support
 * button appended, shown when a post links to a recognized payment provider.
 * The card already shows where you're headed (title, description, domain), so
 * body and button open the provider directly - no interstitial. The
 * interstitial is reserved for the profile button, which has no such context.
 */
export function SupportEmbedCard({
  link,
  author,
  preview = false,
  onOpen,
  style,
}: {
  link: {uri: string; title?: string; description?: string; thumb?: string}
  author?: bsky.profile.AnyProfileView
  /** Composer preview: render inert. */
  preview?: boolean
  onOpen?: () => void
  style?: StyleProp<ViewStyle>
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const playHaptic = useHaptics()
  const openLink = useOpenLink()
  const {state: hovered, onIn, onOut} = useInteractionState()

  const hasMedia = !!link.thumb
  const authorName = author
    ? sanitizeDisplayName(author.displayName || author.handle)
    : null
  const title =
    link.title ||
    (authorName ? l`Support ${authorName}` : l`Support this creator`)

  const open = () => {
    if (preview) return
    playHaptic('Light')
    onOpen?.()
    openLink(link.uri, undefined, true)
  }

  const borderColor = hovered
    ? t.atoms.border_contrast_high
    : t.atoms.border_contrast_low

  return (
    <>
      <View
        testID="supportEmbedCard"
        style={[
          a.w_full,
          a.rounded_md,
          a.overflow_hidden,
          a.border,
          borderColor,
          {borderWidth: 1},
          preview && a.pointer_events_none,
          style,
        ]}>
        <Button
          label={title}
          onPress={open}
          onHoverIn={onIn}
          onHoverOut={onOut}
          style={[a.w_full, a.flex_col, {alignItems: 'stretch'}]}>
          {link.thumb ? (
            <Image
              style={[a.aspect_card]}
              source={{uri: link.thumb}}
              accessibilityIgnoresInvertColors
              loading="lazy"
              useAppleWebpCodec
            />
          ) : null}
          <View
            style={[
              a.flex_1,
              a.pt_sm,
              {gap: 3},
              hasMedia && a.border_t,
              borderColor,
            ]}>
            <View style={[{gap: 3}, a.pb_xs, a.px_md]}>
              <Text
                emoji
                numberOfLines={3}
                style={[a.text_md, a.font_semi_bold, a.leading_snug]}>
                {title}
              </Text>
              {link.description ? (
                <Text
                  emoji
                  numberOfLines={hasMedia ? 2 : 4}
                  style={[a.text_sm, a.leading_snug]}>
                  {link.description}
                </Text>
              ) : null}
            </View>
          </View>
        </Button>

        <View style={[a.px_md, a.pt_xs, a.pb_md, a.gap_sm]}>
          {preview ? null : <SupportedBy creator={author} size="compact" />}
          <SupportPill
            uri={link.uri}
            showProvider
            size="medium"
            fullWidth
            arrow
            onPress={open}
          />
        </View>
      </View>
    </>
  )
}
