import {type StyleProp, View, type ViewStyle} from 'react-native'
import {type ChatBskyGroupDefs} from '@atproto/api'
import {Trans} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import * as ChatInvite from '#/components/dms/ChatInvite'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

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
  preview?: ChatBskyGroupDefs.JoinLinkPreviewView
  style?: StyleProp<ViewStyle>
  onOpen?: () => void
}) {
  const resolvedCode = code ?? preview?.code
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
  const {loading, preview} = ChatInvite.useChatInvite()

  if (loading) {
    return (
      <View
        style={[
          a.align_center,
          a.justify_center,
          a.p_lg,
          a.border,
          a.rounded_lg,
          t.atoms.border_contrast_high,
          {height: JOIN_REQUEST_EMBED_HEIGHT},
          style,
        ]}>
        <Loader size="md" fill={t.atoms.text.color} />
      </View>
    )
  }

  if (!preview) {
    return (
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.justify_center,
          a.p_lg,
          a.gap_xs,
          a.border,
          a.rounded_lg,
          t.atoms.border_contrast_high,
          t.atoms.bg_contrast_25,
          {height: JOIN_REQUEST_EMBED_HEIGHT},
          style,
        ]}>
        <WarningIcon size="md" fill={t.atoms.text_contrast_medium.color} />
        <Text style={[a.text_sm, a.font_medium, t.atoms.text_contrast_medium]}>
          <Trans>Chat invite link no longer available</Trans>
        </Text>
      </View>
    )
  }

  return (
    <View
      style={[
        a.justify_between,
        a.border,
        a.rounded_lg,
        a.p_lg,
        a.gap_lg,
        t.atoms.border_contrast_high,
        {height: JOIN_REQUEST_EMBED_HEIGHT},
        style,
      ]}>
      <ChatInvite.Card size="large" />
      <ChatInvite.JoinButton onPress={onOpen} />
    </View>
  )
}
