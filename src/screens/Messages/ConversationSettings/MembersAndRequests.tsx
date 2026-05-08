import {View} from 'react-native'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'
import {MEMBER_LIMIT} from './constants'

export function MembersAndRequests({
  memberCount,
  requestCount,
  hasMoreRequests,
  isOwner,
}: {
  memberCount: number
  requestCount: number
  hasMoreRequests: boolean
  isOwner: boolean
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  return (
    <View style={[a.flex_row, a.justify_between, a.px_xl, a.pt_xl, a.pb_sm]}>
      <View style={[a.flex_row, a.align_center, a.gap_xs]}>
        <Text style={[a.text_lg, a.font_semi_bold, t.atoms.text]}>
          <Trans comment="The heading above the list of chat members.">
            Members
          </Trans>
        </Text>
        <Text style={[a.text_xs, a.font_medium, t.atoms.text_contrast_medium]}>
          {l({
            message: `${memberCount}/${MEMBER_LIMIT}`,
            comment:
              'The number of group chat members out of the total number of permitted users.',
          })}
        </Text>
      </View>
      {isOwner && requestCount > 0 ? (
        <InlineLinkText
          label={l`View incoming group chat requests`}
          style={[a.text_sm, a.text_right, a.font_semi_bold]}
          // TODO Need to implement this. -dsb
          to="#">
          {hasMoreRequests
            ? l({
                message: `${requestCount}+ requests`,
                comment:
                  'Displayed when there are more than 50 requests to join a group chat',
              })
            : l({
                message: plural(requestCount, {
                  one: '# request',
                  other: '# requests',
                }),
                comment: 'The number of requests to join a group chat.',
              })}
        </InlineLinkText>
      ) : null}
    </View>
  )
}
