import {type StyleProp, type ViewStyle} from 'react-native'

import {atoms as a} from '#/alf'
import * as ChatInvite from '#/components/dms/ChatInvite'
import {ExternalEmbed} from '#/components/Post/Embed/ExternalEmbed'
import {JoinRequestEmbedBody} from '#/components/Post/Embed/JoinRequestEmbed'
import {type app} from '#/lexicons'

/**
 * Renders a chat invite link found in an `app.bsky.embed.external` embed (e.g.
 * a `bsky.app/chat/<code>` link posted to the feed) as a join request card,
 * falling back to a plain external embed if the invite can't be resolved.
 */
export function ChatInviteEmbed({
  code,
  link,
  onOpen,
  style,
}: {
  code: string
  link: app.bsky.embed.external.ViewExternal
  onOpen?: () => void
  style?: StyleProp<ViewStyle>
}) {
  return (
    <ChatInvite.Root code={code} hasFixedHeight>
      <ChatInviteEmbedBody link={link} onOpen={onOpen} style={style} />
    </ChatInvite.Root>
  )
}

function ChatInviteEmbedBody({
  link,
  onOpen,
  style,
}: {
  link: app.bsky.embed.external.ViewExternal
  onOpen?: () => void
  style?: StyleProp<ViewStyle>
}) {
  const {status} = ChatInvite.useChatInvite()

  if (status === 'error') {
    return <ExternalEmbed link={link} onOpen={onOpen} style={style} />
  }

  return <JoinRequestEmbedBody style={[a.mt_sm, style]} onOpen={onOpen} />
}
