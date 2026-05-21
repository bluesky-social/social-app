import {type StyleProp, type ViewStyle} from 'react-native'
import {type AppBskyEmbedExternal} from '@atproto/api'

import {useJoinLinkPreviewsQuery} from '#/state/queries/join-links'
import {useSession} from '#/state/session'
import {atoms as a} from '#/alf'
import {ExternalEmbed} from '#/components/Post/Embed/ExternalEmbed'
import {JoinRequestEmbed} from '#/components/Post/Embed/JoinRequestEmbed'

export function ChatInviteEmbed({
  code,
  link,
  onOpen,
  style,
}: {
  code: string
  link: AppBskyEmbedExternal.ViewExternal
  onOpen?: () => void
  style?: StyleProp<ViewStyle>
}) {
  const {hasSession} = useSession()
  const {data, error, isPending} = useJoinLinkPreviewsQuery({
    codes: [code],
    hasSession,
  })

  const preview = data?.joinLinkPreviews[0]

  if (error || (data && !Array.isArray(data.joinLinkPreviews))) {
    return <ExternalEmbed link={link} onOpen={onOpen} style={style} />
  }

  return (
    <JoinRequestEmbed
      loading={isPending}
      preview={preview}
      style={[a.mt_sm, style]}
    />
  )
}
