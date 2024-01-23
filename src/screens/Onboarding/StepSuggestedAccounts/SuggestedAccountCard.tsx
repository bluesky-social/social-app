import React from 'react'
import {View, ViewStyle} from 'react-native'
import {AppBskyActorDefs, moderateProfile} from '@atproto/api'

import {useTheme, atoms as a, flatten} from '#/alf'
import {Text} from '#/components/Typography'
import {useItemContext} from '#/components/forms/Toggle'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {useModerationOpts} from '#/state/queries/preferences'

export function SuggestedAccountCard({
  profile,
  moderationOpts,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
  moderationOpts: ReturnType<typeof useModerationOpts>
}) {
  const t = useTheme()
  const ctx = useItemContext()
  const moderation = moderateProfile(profile, moderationOpts!)

  const styles = React.useMemo(() => {
    const light = t.name === 'light'
    const base: ViewStyle[] = [t.atoms.bg_contrast_25]
    const hover: ViewStyle[] = [t.atoms.bg_contrast_50]
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
            ]}>
            <UserAvatar
              size={48}
              avatar={profile.avatar}
              moderation={moderation.avatar}
            />
          </View>
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

export function SuggestedAccountCardPlaceholder() {
  const t = useTheme()
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
          t.atoms.bg_contrast_25,
        ]}>
        <View style={[a.flex_row, a.align_center, a.gap_md]}>
          <View
            style={[
              {width: 48, height: 48},
              a.relative,
              a.rounded_full,
              t.atoms.bg_contrast_100,
            ]}
          />
          <View style={[a.gap_xs]}>
            <View
              style={[
                {width: 100, height: 16},
                a.rounded_sm,
                t.atoms.bg_contrast_100,
              ]}
            />
            <View
              style={[
                {width: 60, height: 12},
                a.rounded_sm,
                t.atoms.bg_contrast_100,
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  )
}
