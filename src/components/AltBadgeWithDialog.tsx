import {Pressable} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {HITSLOP_20} from '#/lib/constants'
import {useLargeAltBadgeEnabled} from '#/state/preferences/large-alt-badge'
import {atoms as a, useTheme} from '#/alf'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'

const positionStyles = {
  'top-left': {
    top: a.p_xs.padding,
    left: a.p_xs.padding,
  },
  'top-right': {
    top: a.p_xs.padding,
    right: a.p_xs.padding,
  },
  'bottom-left': {
    bottom: a.p_xs.padding,
    left: a.p_xs.padding,
  },
  'bottom-right': {
    bottom: a.p_xs.padding,
    right: a.p_xs.padding,
  },
}

export function AltBadgeWithDialog({
  text,
  position,
}: {
  text: string
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const large = useLargeAltBadgeEnabled()
  const control = Prompt.usePromptControl()

  const pos = position ? [a.absolute, positionStyles[position]] : {}

  return (
    <>
      <Pressable
        testID="altBadgeWithDialogButton"
        accessibilityRole="button"
        accessibilityLabel={l`Show alt text`}
        accessibilityHint=""
        hitSlop={HITSLOP_20}
        onPress={control.open}
        style={s => [
          a.justify_center,
          a.rounded_sm,
          a.p_xs,
          a.z_10,
          t.atoms.bg_contrast_25,
          large && {
            padding: 6,
          },
          {
            opacity: 0.8,
          },
          pos,
          s.hovered || s.pressed
            ? [
                {
                  opacity: 1,
                },
              ]
            : [],
        ]}>
        <Text
          accessible={false}
          style={[a.font_bold, large ? a.text_xs : {fontSize: 8}]}>
          <Trans>ALT</Trans>
        </Text>
      </Pressable>

      <Prompt.Outer control={control}>
        <Prompt.Content>
          <Prompt.TitleText>
            <Trans>Alt Text</Trans>
          </Prompt.TitleText>
          <Prompt.DescriptionText selectable>{text}</Prompt.DescriptionText>
        </Prompt.Content>
        <Prompt.Actions>
          <Prompt.Cancel cta={l`Close`} />
        </Prompt.Actions>
      </Prompt.Outer>
    </>
  )
}
