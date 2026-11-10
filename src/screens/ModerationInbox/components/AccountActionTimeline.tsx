import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'
import {type tools} from '#/lexicons'
import {ContentBlock} from './ContentBlock'
import {useActionedSubjectLabels} from './hooks/useActionedSubjectLabels'

type Detail = tools.ozone.inbox.getActionedSubject.$OutputBody
type Action = tools.ozone.inbox.defs.ActionView

export function AccountActionTimeline({
  data,
  actions,
}: {
  data: Detail
  actions: Action[]
}) {
  const {t: l} = useLingui()
  if (!actions.length) return null
  return (
    <ContentBlock header={l`Timeline`}>
      <View>
        {actions.map((action, index) => (
          <AccountAction
            key={action.id}
            data={data}
            action={action}
            last={index === actions.length - 1}
          />
        ))}
      </View>
    </ContentBlock>
  )
}

function AccountAction({
  data,
  action,
  last,
}: {
  data: Detail
  action: Action
  last: boolean
}) {
  const t = useTheme()
  const labels = useActionedSubjectLabels({
    src: data.src,
    subject: data.subject,
    enforcement: data.enforcement,
    latestAction: action,
  })
  if (!labels) return null
  return (
    <View style={[a.flex_row, a.gap_sm]}>
      <View style={[a.align_center]}>
        <View
          style={[
            a.mt_xs,
            a.rounded_full,
            last
              ? {
                  width: 8,
                  height: 8,
                  borderColor: t.palette.primary_500,
                  borderWidth: 2,
                }
              : {width: 8, height: 8, backgroundColor: t.palette.contrast_300},
          ]}
        />
        {!last && (
          <View
            style={[
              a.mt_xs,
              a.flex_1,
              a.rounded_full,
              {
                width: 2,
                minHeight: 12,
                backgroundColor: t.palette.contrast_100,
              },
            ]}
          />
        )}
      </View>
      <View style={[a.flex_1, a.gap_2xs, !last && a.pb_md]}>
        <Text emoji style={[a.text_sm, a.font_medium]}>
          {labels.subject}
        </Text>
        {(action.type === 'labelApplied' || action.type === 'labelRemoved') &&
        labels.summary ? (
          <Text emoji style={[a.text_sm]}>
            {labels.summary}
          </Text>
        ) : null}
        {action.policies?.map(policy => (
          <Text key={policy.key} emoji style={[a.text_sm]}>
            <InlineLinkText to={policy.link} label={policy.displayName}>
              {policy.displayName}
            </InlineLinkText>
          </Text>
        ))}
        {action.reversedAt ? (
          <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
            <Trans>Action reversed</Trans>
          </Text>
        ) : null}
      </View>
    </View>
  )
}
