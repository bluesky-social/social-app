import React from 'react'
import {View} from 'react-native'
import {AppBskyLabelerDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {sanitizeHandle} from '#/lib/strings/handles'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme, ViewStyleProp} from '#/alf'
import {Flag_Stroke2_Corner0_Rounded as Flag} from '#/components/icons/Flag'
import {Link as InternalLink, LinkProps} from '#/components/Link'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '../icons/Chevron'

type LabelingServiceProps = {
  labeler: AppBskyLabelerDefs.LabelerViewDetailed
}

export function Outer({
  children,
  style,
}: React.PropsWithChildren<ViewStyleProp>) {
  return (
    <View
      style={[
        a.flex_row,
        a.gap_md,
        a.w_full,
        a.p_lg,
        a.pr_md,
        a.overflow_hidden,
        style,
      ]}>
      {children}
    </View>
  )
}

export function Avatar({avatar}: {avatar?: string}) {
  return <UserAvatar type="labeler" size={40} avatar={avatar} />
}

export function Title({value}: {value: string}) {
  return (
    <Text emoji style={[a.text_md, a.font_bold, a.leading_tight]}>
      {value}
    </Text>
  )
}

export function Description({value, handle}: {value?: string; handle: string}) {
  const {_} = useLingui()
  return value ? (
    <Text numberOfLines={2}>
      <RichText value={value} style={[a.leading_snug]} />
    </Text>
  ) : (
    <Text emoji style={[a.leading_snug]}>
      {_(msg`By ${sanitizeHandle(handle, '@')}`)}
    </Text>
  )
}

export function RegionalNotice() {
  const t = useTheme()
  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.gap_xs,
        a.pt_2xs,
        {marginLeft: -2},
      ]}>
      <Flag fill={t.atoms.text_contrast_low.color} size="sm" />
      <Text style={[a.italic, a.leading_snug]}>
        <Trans>Required in your region</Trans>
      </Text>
    </View>
  )
}

export function Content({children}: React.PropsWithChildren<{}>) {
  const t = useTheme()

  return (
    <View
      style={[
        a.flex_1,
        a.flex_row,
        a.gap_md,
        a.align_center,
        a.justify_between,
      ]}>
      <View style={[a.gap_2xs, a.flex_1]}>{children}</View>

      <ChevronRight size="md" style={[a.z_10, t.atoms.text_contrast_low]} />
    </View>
  )
}

export function Link({
  children,
  labeler,
}: LabelingServiceProps & Pick<LinkProps, 'children'>) {
  const {_} = useLingui()

  return (
    <InternalLink
      to={{
        screen: 'Profile',
        params: {
          name: labeler.creator.handle,
        },
      }}
      label={_(
        msg`View the labeling service provided by @${labeler.creator.handle}`,
      )}>
      {children}
    </InternalLink>
  )
}
