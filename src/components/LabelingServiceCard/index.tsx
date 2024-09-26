import React from 'react'
import {View} from 'react-native'
import {AppBskyLabelerDefs} from '@atproto/api'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {getLabelingServiceTitle} from '#/lib/moderation'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useLabelerInfoQuery} from '#/state/queries/labeler'
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

export function LikeCount({count}: {count: number}) {
  const t = useTheme()
  return (
    <Text
      style={[
        a.mt_sm,
        a.text_sm,
        t.atoms.text_contrast_medium,
        {fontWeight: '600'},
      ]}>
      <Plural value={count} one="Liked by # user" other="Liked by # users" />
    </Text>
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

/**
 * The canonical view for a labeling service. Use this or compose your own.
 */
export function Default({
  labeler,
  style,
}: LabelingServiceProps & ViewStyleProp) {
  return (
    <Outer style={style}>
      <Avatar avatar={labeler.creator.avatar} />
      <Content>
        <Title
          value={getLabelingServiceTitle({
            displayName: labeler.creator.displayName,
            handle: labeler.creator.handle,
          })}
        />
        <Description
          value={labeler.creator.description}
          handle={labeler.creator.handle}
        />
        {labeler.likeCount ? <LikeCount count={labeler.likeCount} /> : null}
      </Content>
    </Outer>
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

// TODO not finished yet
export function DefaultSkeleton() {
  return (
    <View>
      <Text>Loading</Text>
    </View>
  )
}

export function Loader({
  did,
  loading: LoadingComponent = DefaultSkeleton,
  error: ErrorComponent,
  component: Component,
}: {
  did: string
  loading?: React.ComponentType<{}>
  error?: React.ComponentType<{error: string}>
  component: React.ComponentType<{
    labeler: AppBskyLabelerDefs.LabelerViewDetailed
  }>
}) {
  const {isLoading, data, error} = useLabelerInfoQuery({did})

  return isLoading ? (
    LoadingComponent ? (
      <LoadingComponent />
    ) : null
  ) : error || !data ? (
    ErrorComponent ? (
      <ErrorComponent error={error?.message || 'Unknown error'} />
    ) : null
  ) : (
    <Component labeler={data} />
  )
}
