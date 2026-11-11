import {isValidElement} from 'react'
import {View} from 'react-native'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {makeProfileLink} from '#/lib/routes/links'
import {forceLTR} from '#/lib/strings/bidi'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {atoms as a, useTheme} from '#/alf'
import {Text, type TextProps} from '#/components/Typography'
import {
  ACTIVITY_ROW_CONTENT_INSET,
  ACTIVITY_ROW_PADDING_START,
} from '../constants'
import {type ActivityPresentationProps} from '../presentation'
import {isSubjectGroup} from '../types'
import {ActivityHandle, useActivityDisplayName} from './ActivityIdentity'
import {ActivityInlineLinkText} from './ActivityInlineLinkText'
import {ActivityRowContent} from './ActivityPrimitives'

export function ActivityRow({
  children,
  testID,
}: React.PropsWithChildren<{
  hideTopBorder: boolean
  testID?: string
}>) {
  return (
    <View style={a.gap_md} testID={testID}>
      {children}
    </View>
  )
}

export function ActivityRowHeader({
  computedItemView,
  item,
  actions,
  children,
}: React.PropsWithChildren<
  ActivityPresentationProps & {actions?: React.ReactNode}
>) {
  const {t: l} = useLingui()
  const t = useTheme()
  const actors = computedItemView.actors
  const primaryActor = actors[0]
  const primaryLabel = useActivityDisplayName(primaryActor)
  if (!primaryActor) {
    return null
  }

  const othersCount =
    item.type === 'group' && isSubjectGroup(item.group) ? actors.length - 1 : 0
  const othersLabel =
    othersCount > 0
      ? l`and ${plural(othersCount, {
          one: '# other',
          other: '# others',
        })}`
      : undefined
  const actionLabel = [primaryLabel, othersLabel, getActivityRowText(children)]
    .filter(Boolean)
    .join(' ')
  const timestamp =
    item.type === 'activity'
      ? item.activity.record.indexedAt
      : item.group.indexedAt

  return (
    <TimeElapsed timestamp={timestamp}>
      {({timeElapsed}) => (
        <View style={[a.pr_lg, {paddingLeft: ACTIVITY_ROW_PADDING_START}]}>
          <ActivityRowContent
            actors={actors}
            actions={actions}
            header={
              <>
                <ActivityRowHeaderText
                  accessibilityHint=""
                  accessibilityLabel={`${actionLabel} · ${timeElapsed}`}
                  emoji>
                  <ActivityInlineLinkText
                    label={l`View ${primaryLabel}’s profile`}
                    to={makeProfileLink({
                      did: primaryActor.did,
                      handle: primaryActor.handle,
                    })}>
                    {forceLTR(primaryLabel)}
                  </ActivityInlineLinkText>
                  {othersLabel ? ` ${othersLabel}` : ''} {children}
                  <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                    {` · ${timeElapsed}`}
                  </Text>
                </ActivityRowHeaderText>
                <ActivityHandle actor={primaryActor} />
              </>
            }
          />
        </View>
      )}
    </TimeElapsed>
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

  return (
    <View style={[a.pr_lg, {paddingLeft: ACTIVITY_ROW_CONTENT_INSET}]}>
      {children}
    </View>
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
