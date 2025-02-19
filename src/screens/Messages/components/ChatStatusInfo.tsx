import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {ActiveConvoStates} from '#/state/messages/convo'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {KnownFollowers} from '#/components/KnownFollowers'
import {DeleteChatButton, RejectMenu} from './RequestListItem'

export function ChatStatusInfo({convoState}: {convoState: ActiveConvoStates}) {
  const t = useTheme()
  const {_} = useLingui()
  const moderationOpts = useModerationOpts()
  const {currentAccount} = useSession()

  const otherUser = convoState.recipients.find(
    user => user.did !== currentAccount?.did,
  )

  if (!moderationOpts) {
    return null
  }

  return (
    <View
      style={[
        a.flex_1,
        t.atoms.bg,
        a.px_lg,
        a.py_lg,
        a.gap_md,
        a.align_center,
        a.absolute,
        {bottom: '100%'},
        a.left_0,
        a.right_0,
      ]}>
      {otherUser && (
        <KnownFollowers
          profile={otherUser}
          moderationOpts={moderationOpts}
          showIfEmpty
        />
      )}
      <View style={[a.flex_row, a.gap_sm]}>
        {otherUser && (
          <RejectMenu
            label={_(msg`Block or report`)}
            convo={convoState.convo}
            profile={otherUser}
            color="negative"
            size="small"
          />
        )}
        <DeleteChatButton
          label={_(msg`Delete`)}
          convo={convoState.convo}
          popOnLeave
          color="secondary"
          size="small"
        />
      </View>
    </View>
  )
}
