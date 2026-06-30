import {type StyleProp, View, type ViewStyle} from 'react-native'

import {
  type ChatInvitePreview,
  isKnownJoinLinkPreview,
} from '#/state/queries/join-links'
import {atoms as a, useTheme} from '#/alf'
import * as ChatInvite from '#/components/dms/ChatInvite'

const JOIN_REQUEST_EMBED_HEIGHT = 140

/**
 * The "join request" presentation of a chat invite, used as a post embed (in
 * feeds and the post composer). Composes the headless `ChatInvite` primitive:
 * pass either a `code` to fetch by, or an already-resolved `preview` as the
 * initial data to avoid a loading flash.
 */
export function JoinRequestEmbed({
  code,
  preview,
  style,
  onOpen,
}: {
  code?: string
  preview?: ChatInvitePreview
  style?: StyleProp<ViewStyle>
  onOpen?: () => void
}) {
  const resolvedCode =
    code ?? (isKnownJoinLinkPreview(preview) ? preview.code : undefined)
  if (!resolvedCode) return null

  return (
    <ChatInvite.Root
      code={resolvedCode}
      initialPreview={preview}
      hasFixedHeight>
      <JoinRequestEmbedBody style={style} onOpen={onOpen} />
    </ChatInvite.Root>
  )
}

/**
 * The context-consuming presentation (loading / no-longer-available / card +
 * join button). Exported so surfaces that own their own `ChatInvite.Root` (e.g.
 * to add an error fallback) can render it without nesting another Root.
 */
export function JoinRequestEmbedBody({
  style,
  onOpen,
}: {
  style?: StyleProp<ViewStyle>
  onOpen?: () => void
}) {
  const t = useTheme()
  const {status} = ChatInvite.useChatInvite()

  const box = [
    a.border,
    a.rounded_lg,
    t.atoms.border_contrast_low,
    {height: JOIN_REQUEST_EMBED_HEIGHT},
  ]

  if (status === 'loading') {
    return <ChatInvite.Loading style={[box, a.p_lg, style]} />
  }

  if (status !== 'available') {
    return (
      <ChatInvite.Unavailable
        style={[box, a.p_lg, t.atoms.bg_contrast_25, style]}
      />
    )
  }

  return (
    <View style={[a.justify_between, a.p_lg, a.gap_lg, box, style]}>
      <ChatInvite.Card size="large" />
      <ChatInvite.JoinButton onPress={onOpen} />
    </View>
  )
}
