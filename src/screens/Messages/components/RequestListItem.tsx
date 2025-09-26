import {View} from 'react-native'
import {type ChatBskyConvoDefs} from '@atproto/api'
import {Trans} from '@lingui/macro'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useSession} from '#/state/session'
import {atoms as a, tokens} from '#/alf'
import {KnownFollowers} from '#/components/KnownFollowers'
import {Text} from '#/components/Typography'
import {ChatListItem} from './ChatListItem'
import {AcceptChatButton, DeleteChatButton, RejectMenu} from './RequestButtons'

export function RequestListItem({convo}: {convo: ChatBskyConvoDefs.ConvoView}) {
  const {currentAccount} = useSession()
  const moderationOpts = useModerationOpts()

  const otherUser = convo.members.find(
    member => member.did !== currentAccount?.did,
  )

  if (!otherUser || !moderationOpts) {
    return null
  }

  const isDeletedAccount = otherUser.handle === 'missing.invalid'

  return (
    <View style={[a.relative, a.flex_1]}>
      <ChatListItem convo={convo} showMenu={false}>
        <View style={[a.pt_xs, a.pb_2xs]}>
          <KnownFollowers
            profile={otherUser}
            moderationOpts={moderationOpts}
            minimal
            showIfEmpty
          />
        </View>
        {/* spacer, since you can't nest pressables */}
        <View style={[a.pt_md, a.pb_xs, a.w_full, {opacity: 0}]} aria-hidden>
          {/* Placeholder text so that it responds to the font height */}
          <Text style={[a.text_xs, a.leading_tight, a.font_semi_bold]}>
            <Trans comment="Accept a chat request">Accept Request</Trans>
          </Text>
        </View>
      </ChatListItem>
      <View
        style={[
          a.absolute,
          a.pr_md,
          a.w_full,
          a.flex_row,
          a.align_center,
          a.gap_sm,
          {
            bottom: tokens.space.md,
            paddingLeft: tokens.space.lg + 52 + tokens.space.md,
          },
        ]}>
        {!isDeletedAccount ? (
          <>
            <AcceptChatButton convo={convo} currentScreen="list" />
            <RejectMenu
              convo={convo}
              profile={otherUser}
              showDeleteConvo
              currentScreen="list"
            />
          </>
        ) : (
          <>
            <DeleteChatButton convo={convo} currentScreen="list" />
            <View style={a.flex_1} />
          </>
        )}
      </View>
    </View>
  )
}
