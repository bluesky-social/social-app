import {View} from 'react-native'
import {type ModerationUI} from '@bsky/sdk/moderation'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import * as Hider from '#/components/moderation/Hider'
import {Text} from '#/components/Typography'

/**
 * Masks a card the user can click through. Cards they can't reveal never get
 * here; the query drops them.
 */
export function ActivityContentHider({
  moderation,
  children,
}: {
  moderation: ModerationUI
  children: React.ReactNode
}) {
  // Most cards aren't blurred; skip the Hider and its dialog for those.
  if (!moderation.blur) return children
  return (
    <Hider.Outer modui={moderation}>
      <Hider.Mask>
        <Mask />
      </Hider.Mask>
      <Hider.Content>{children}</Hider.Content>
    </Hider.Outer>
  )
}

/* TODO: placeholder until the mask has a design. */
function Mask() {
  const t = useTheme()
  const {t: l} = useLingui()
  const {info, setIsContentVisible} = Hider.useHider()
  return (
    <Button
      testID="activityContentMask"
      label={info.name}
      accessibilityHint={l`Shows the content`}
      onPress={() => setIsContentVisible(true)}>
      {({hovered, pressed}) => (
        <View
          style={[
            a.flex_1,
            a.flex_row,
            a.align_center,
            a.gap_sm,
            a.py_md,
            a.px_lg,
            a.rounded_md,
            t.atoms.bg_contrast_25,
            (hovered || pressed) && t.atoms.bg_contrast_50,
          ]}>
          <info.icon size="md" fill={t.atoms.text_contrast_medium.color} />
          <Text
            numberOfLines={2}
            style={[
              a.flex_1,
              a.font_semi_bold,
              a.leading_snug,
              t.atoms.text_contrast_medium,
            ]}>
            {info.name}
          </Text>
          <Text
            style={[
              a.font_semi_bold,
              a.leading_snug,
              t.atoms.text_contrast_high,
            ]}>
            <Trans>Show</Trans>
          </Text>
        </View>
      )}
    </Button>
  )
}
