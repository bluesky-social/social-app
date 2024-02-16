import React from 'react'
import {View} from 'react-native'
import {Trans} from '@lingui/macro'

import {atoms as a, useTheme, ViewStyleProp, flatten} from '#/alf'
import {Text} from '#/components/Typography'
import {RichText} from '#/components/RichText'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '../icons/Chevron'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {sanitizeHandle} from '#/lib/strings/handles'
import {pluralize} from '#/lib/strings/helpers'

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

export function Title({value}: {value: string}) {
  return <Text style={[a.text_md, a.font_bold, a.pb_2xs]}>{value}</Text>
}

export function Description({value, handle}: {value?: string; handle: string}) {
  return value ? (
    <RichText value={value} style={[]} />
  ) : (
    <Text>
      <Trans>
        Moderation service managed by @{sanitizeHandle(handle, '@')}
      </Trans>
    </Text>
  )
}

export function Content({
  title,
  description,
  handle,
  likeCount,
}: {
  title: string
  description?: string
  handle: string
  likeCount?: number
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
            <Trans>
              Moderation service managed by @{sanitizeHandle(handle, '@')}
            </Trans>
          </Text>
        )}

        {typeof likeCount === 'number' && (
          <Text
            style={[
              t.atoms.text_contrast_medium,
              a.text_sm,
              {fontWeight: '500'},
              a.mt_sm,
            ]}>
            <Trans>
              Liked by {likeCount || 0} {pluralize(likeCount || 0, 'user')}
            </Trans>
          </Text>
        )}
      </View>

      <ChevronRight size="md" style={[a.z_10]} fill={t.palette.contrast_500} />
    </View>
  )
}
