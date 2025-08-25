import Animated, {Easing, FadeInDown, FadeOut} from 'react-native-reanimated'
import {type ComAtprotoTempCheckHandleAvailability} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, native, useTheme} from '#/alf'
import {borderRadius} from '#/alf/tokens'
import {Button} from '#/components/Button'
import {Text} from '#/components/Typography'

export function HandleSuggestions({
  suggestions,
  onSelect,
}: {
  suggestions: ComAtprotoTempCheckHandleAvailability.Suggestion[]
  onSelect: (
    suggestions: ComAtprotoTempCheckHandleAvailability.Suggestion,
  ) => void
}) {
  const t = useTheme()
  const {_} = useLingui()

  return (
    <Animated.View
      entering={native(FadeInDown.easing(Easing.out(Easing.exp)))}
      exiting={native(FadeOut)}
      style={[
        a.flex_1,
        a.border,
        a.rounded_sm,
        t.atoms.shadow_sm,
        t.atoms.bg,
        t.atoms.border_contrast_low,
        a.mt_xs,
        a.z_50,
        a.w_full,
        a.zoom_fade_in,
      ]}>
      {suggestions.map((suggestion, index) => (
        <Button
          label={_(
            msg({
              message: `Select ${suggestion.handle}`,
              comment: `Accessibility label for a username suggestion in the account creation flow`,
            }),
          )}
          key={index}
          onPress={() => onSelect(suggestion)}
          hoverStyle={[t.atoms.bg_contrast_25]}
          style={[
            a.w_full,
            a.flex_row,
            a.align_center,
            a.justify_between,
            a.p_md,
            a.border_b,
            t.atoms.border_contrast_low,
            index === 0 && {
              borderTopStartRadius: borderRadius.sm,
              borderTopEndRadius: borderRadius.sm,
            },
            index === suggestions.length - 1 && [
              {
                borderBottomStartRadius: borderRadius.sm,
                borderBottomEndRadius: borderRadius.sm,
              },
              a.border_b_0,
            ],
          ]}>
          <Text style={[a.text_md]}>{suggestion.handle}</Text>
          <Text style={[a.text_sm, {color: t.palette.positive_700}]}>
            <Trans comment="Shown next to an available username suggestion in the account creation flow">
              Available
            </Trans>
          </Text>
        </Button>
      ))}
    </Animated.View>
  )
}
