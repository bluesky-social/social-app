import {isValidElement} from 'react'
import {View} from 'react-native'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {makeProfileLink} from '#/lib/routes/links'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {atoms as a, useTheme} from '#/alf'
import {AvatarStack} from '#/components/AvatarStack'
import {Text} from '#/components/Typography'
import {type ResolvedActivityActors} from '../presentation'
import {ActivityInlineLinkText} from './ActivityInlineLinkText'

const ACTIVITY_ROW_AVATAR_SIZE = 36

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
  actorPresentation,
  children,
}: React.PropsWithChildren<{
  actorPresentation: ResolvedActivityActors
}>) {
  const t = useTheme()
  const {t: l} = useLingui()

  const othersLabel =
    actorPresentation.othersCount > 0
      ? l`and ${plural(actorPresentation.othersCount, {
          one: '# other',
          other: '# others',
        })}`
      : undefined
  const accessibilityLabel = [
    actorPresentation.primary.label,
    othersLabel,
    getActivityRowText(children),
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <View
      style={[a.flex_row, a.align_center, a.gap_md, a.px_xl, a.pt_lg, a.pb_xs]}>
      <AvatarStack
        profiles={actorPresentation.profiles}
        size={ACTIVITY_ROW_AVATAR_SIZE}
      />
      <View style={[a.flex_1, a.justify_center]}>
        <Text
          accessibilityHint=""
          accessibilityLabel={accessibilityLabel}
          numberOfLines={2}
          style={[a.text_md, a.leading_snug, t.atoms.text]}
          emoji>
          <ActivityInlineLinkText
            label={l`View ${actorPresentation.primary.label}’s profile`}
            to={makeProfileLink({
              did: actorPresentation.primary.did,
              handle: actorPresentation.primary.handle,
            })}>
            {actorPresentation.primary.label}
          </ActivityInlineLinkText>
          {othersLabel ? ` ${othersLabel}` : ''} {children}
        </Text>
      </View>
    </View>
  )
}

export function ActivityRowBody({children}: React.PropsWithChildren<{}>) {
  if (!children) {
    return null
  }

  return (
    <View style={[a.px_xl, a.pb_xs]}>
      <View style={[a.flex_row, a.gap_md]}>
        <View style={{width: ACTIVITY_ROW_AVATAR_SIZE}} />
        <View style={[a.flex_1]}>{children}</View>
      </View>
    </View>
  )
}

export function ActivityRowFooter({timestamp}: {timestamp: string}) {
  const t = useTheme()

  return (
    <TimeElapsed timestamp={timestamp}>
      {({timeElapsed}) => (
        <View style={[a.px_xl, a.pb_lg]}>
          <View style={[a.flex_row, a.align_center, a.gap_md]}>
            <View style={{width: ACTIVITY_ROW_AVATAR_SIZE}} />
            <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
              {timeElapsed}
            </Text>
          </View>
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
