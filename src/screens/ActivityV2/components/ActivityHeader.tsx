import {isValidElement} from 'react'
import {View} from 'react-native'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeHandle} from '#/lib/strings/handles'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {atoms as a, useTheme} from '#/alf'
import {AvatarStack} from '#/components/AvatarStack'
import {Text, type TextProps} from '#/components/Typography'
import type * as bsky from '#/types/bsky'
import {ACTIVITY_ROW_AVATAR_SIZE} from '../constants'
import {type ActivityPresentationProps} from '../presentation'
import {ActivityInlineLinkText} from './ActivityInlineLinkText'

const MAX_ACTIVITY_HEADER_AVATARS = 5

export function ActivityRow({
  children,
  hideTopBorder,
  testID,
}: React.PropsWithChildren<{
  hideTopBorder: boolean
  testID?: string
}>) {
  const t = useTheme()

  return (
    <View
      style={[!hideTopBorder && a.border_t, t.atoms.border_contrast_low]}
      testID={testID}>
      {children}
    </View>
  )
}

export function ActivityRowHeader({
  computedItemView,
  item,
  children,
}: React.PropsWithChildren<ActivityPresentationProps>) {
  const {t: l} = useLingui()
  const actors = computedItemView.actors
  const primaryActor = actors[0]
  if (!primaryActor) {
    return null
  }

  const primaryLabel = sanitizeHandle(primaryActor.handle, '@')
  const othersCount =
    item.type === 'group' && item.group.groupBy === 'subject'
      ? actors.length - 1
      : 0
  const othersLabel =
    othersCount > 0
      ? l`and ${plural(othersCount, {
          one: '# other',
          other: '# others',
        })}`
      : undefined
  const accessibilityLabel = [
    primaryLabel,
    othersLabel,
    getActivityRowText(children),
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <View
      style={[a.flex_row, a.align_center, a.gap_md, a.px_xl, a.pt_lg, a.pb_xs]}>
      <AvatarStack
        profiles={
          actors.slice(
            0,
            MAX_ACTIVITY_HEADER_AVATARS,
          ) as bsky.profile.AnyProfileView[]
        }
        size={ACTIVITY_ROW_AVATAR_SIZE}
      />
      <View style={[a.flex_1, a.justify_center]}>
        <ActivityRowHeaderText
          accessibilityHint=""
          accessibilityLabel={accessibilityLabel}
          numberOfLines={2}
          emoji>
          <ActivityInlineLinkText
            label={l`View ${primaryLabel}’s profile`}
            to={makeProfileLink({
              did: primaryActor.did,
              handle: primaryActor.handle,
            })}>
            {primaryLabel}
          </ActivityInlineLinkText>
          {othersLabel ? ` ${othersLabel}` : ''} {children}
        </ActivityRowHeaderText>
      </View>
    </View>
  )
}

export function ActivityRowHeaderText({style, ...rest}: TextProps) {
  const t = useTheme()

  return (
    <Text {...rest} style={[a.text_md, a.leading_snug, t.atoms.text, style]} />
  )
}

export function ActivityRowBody({children}: React.PropsWithChildren<{}>) {
  if (!children) {
    return null
  }

  return <View style={[a.px_xl, a.pb_xs]}>{children}</View>
}

export function ActivityRowFooter({
  item,
}: Pick<ActivityPresentationProps, 'item'>) {
  const t = useTheme()
  const timestamp =
    item.type === 'activity'
      ? item.activity.record.indexedAt
      : item.group.indexedAt

  return (
    <TimeElapsed timestamp={timestamp}>
      {({timeElapsed}) => (
        <View style={[a.px_xl, a.pb_lg]}>
          <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
            {timeElapsed}
          </Text>
        </View>
      )}
    </TimeElapsed>
  )
}

function getActivityRowText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }

  if (!node) {
    return ''
  }

  if (Array.isArray(node)) {
    return node.map(getActivityRowText).join('')
  }

  if (!isValidElement<{children?: React.ReactNode}>(node)) {
    return ''
  }

  return getActivityRowText(node.props.children)
}
