import React from 'react'
import {View} from 'react-native'
import {Trans} from '@lingui/macro'

import {atoms as a, useTheme, ViewStyleProp, flatten} from '#/alf'
import {Text} from '#/components/Typography'
import {RichText} from '#/components/RichText'
import {RaisingHande4Finger_Stroke2_Corner0_Rounded as RaisingHand} from '#/components/icons/RaisingHand'
import {UserAvatar} from '#/view/com/util/UserAvatar'

export function Outer({
  children,
  style,
}: React.PropsWithChildren<ViewStyleProp>) {
  const t = useTheme()

  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.gap_sm,
        a.w_full,
        a.rounded_sm,
        a.pt_md,
        a.pb_md,
        a.pl_md,
        a.pr_md,
        a.overflow_hidden,
        a.border,
        t.atoms.border_contrast_low,
        t.atoms.bg_contrast_25,
        flatten(style),
      ]}>
      <View style={[a.flex_row, a.align_center, a.w_full, a.gap_md]}>
        {children}
      </View>
    </View>
  )
}

export function Avatar({avatar}: {avatar?: string}) {
  return <UserAvatar type="list" size={40} avatar={avatar} />
}

export function Content({
  title,
  description,
  handle,
}: {
  title: string
  description?: string
  handle: string
}) {
  const t = useTheme()

  return (
    <View style={[a.flex_1, a.flex_row, a.align_center, a.justify_between]}>
      <View>
        <Text style={[a.text_md, a.font_bold, a.pb_2xs]}>{title}</Text>

        {description ? (
          <RichText value={description} style={[]} />
        ) : (
          <Text>
            <Trans>Moderation service managed by @{handle}</Trans>
          </Text>
        )}
      </View>

      <RaisingHand size="xl" style={[a.z_10]} fill={t.palette.primary_500} />
    </View>
  )
}
