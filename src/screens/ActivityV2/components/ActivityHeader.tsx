import {View} from 'react-native'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {makeProfileLink} from '#/lib/routes/links'
import {atoms as a, useTheme} from '#/alf'
import {AvatarStack} from '#/components/AvatarStack'
import {Text} from '#/components/Typography'
import {type ResolvedActivityActors} from '../presentation'
import {ActivityInlineLinkText} from './ActivityInlineLinkText'

export function ActivityHeader({
  hideTopBorder,
  actorPresentation,
  action,
  actionAccessibilityLabel,
  testID,
}: {
  hideTopBorder: boolean
  actorPresentation: ResolvedActivityActors
  action: React.ReactNode
  actionAccessibilityLabel: string
  testID?: string
}) {
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
    actionAccessibilityLabel,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <View
      style={[!hideTopBorder && a.border_t, t.atoms.border_contrast_low]}
      testID={testID}>
      <View style={[a.flex_row, a.align_center, a.gap_md, a.px_xl, a.py_lg]}>
        <AvatarStack profiles={actorPresentation.profiles} size={36} />
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
            {othersLabel ? ` ${othersLabel}` : ''} {action}
          </Text>
        </View>
      </View>
    </View>
  )
}
