import React from 'react'
import {View, ViewStyle} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'

import {useTheme, atoms as a, flatten} from '#/alf'
import {Text} from '#/components/Typography'
import {useItemContext} from '#/components/forms/Toggle'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'

export function SuggestedAccountCard({
  profile,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
}) {
  const t = useTheme()
  const ctx = useItemContext()

  const styles = React.useMemo(() => {
    const light = t.name === 'light'
    const base: ViewStyle[] = [t.atoms.bg_contrast_25]
    const hover: ViewStyle[] = [t.atoms.bg_contrast_100]
    const selected: ViewStyle[] = [
      {
        backgroundColor: light ? t.palette.primary_25 : t.palette.primary_975,
      },
    ]
    const selectedHover: ViewStyle[] = [
      {
        backgroundColor: light ? t.palette.primary_50 : t.palette.primary_950,
      },
    ]
    const checkboxBase: ViewStyle[] = [t.atoms.bg_contrast_25]
    const checkboxSelected: ViewStyle[] = [
      {
        backgroundColor: t.palette.primary_500,
      },
    ]
    const avatarBase: ViewStyle[] = [t.atoms.bg_contrast_100]
    const avatarSelected: ViewStyle[] = [
      {
        backgroundColor: light ? t.palette.primary_100 : t.palette.primary_900,
      },
    ]

    return {
      base,
      hover: flatten(hover),
      selected: flatten(selected),
      selectedHover: flatten(selectedHover),
      checkboxBase: flatten(checkboxBase),
      checkboxSelected: flatten(checkboxSelected),
      avatarBase: flatten(avatarBase),
      avatarSelected: flatten(avatarSelected),
    }
  }, [t])

  return (
    <View style={[a.w_full, a.py_xs]}>
      <View
        style={[
          a.w_full,
          a.flex_row,
          a.justify_between,
          a.align_center,
          a.p_md,
          a.pr_lg,
          a.gap_xl,
          a.rounded_md,
          styles.base,
          (ctx.hovered || ctx.focused || ctx.pressed) && styles.hover,
          ctx.selected && styles.selected,
          ctx.selected &&
            (ctx.hovered || ctx.focused || ctx.pressed) &&
            styles.selectedHover,
        ]}>
        <View style={[a.flex_row, a.align_center, a.gap_md]}>
          <View
            style={[
              {width: 48, height: 48},
              a.relative,
              a.rounded_full,
              styles.avatarBase,
              ctx.selected && styles.avatarSelected,
            ]}
          />
          <View>
            <Text style={[a.font_bold, a.text_md, a.pb_xs]}>
              {profile.displayName}
            </Text>
            <Text style={[t.atoms.text_contrast_600]}>{profile.handle}</Text>
          </View>
        </View>

        <View
          style={[
            a.justify_center,
            a.align_center,
            a.rounded_sm,
            styles.checkboxBase,
            ctx.selected && styles.checkboxSelected,
            {
              width: 28,
              height: 28,
            },
          ]}>
          {ctx.selected && <Check size="sm" fill={t.palette.white} />}
        </View>
      </View>
    </View>
  )
}
