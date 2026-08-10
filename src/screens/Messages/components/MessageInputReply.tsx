import {LayoutAnimation, View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {HITSLOP_20} from '#/lib/constants'
import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {useConvoActive} from '#/state/messages/convo'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useMessageReplies} from '#/components/dms/MessageReplies'
import {useReplyPreviewText} from '#/components/dms/replyPreview'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {Text} from '#/components/Typography'
import {type chat} from '#/lexicons'

/**
 * The reply staged in the message composer. Renders a preview of the message
 * being replied to, with a button to cancel the reply.
 */
export function MessageInputReply() {
  const {replyTo} = useMessageReplies()

  if (!replyTo) {
    return null
  }

  return <MessageInputReplyInner replyTo={replyTo} />
}

function MessageInputReplyInner({
  replyTo,
}: {
  replyTo: chat.bsky.convo.defs.MessageView
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const convo = useConvoActive()
  const {clearReply} = useMessageReplies()
  const getReplyPreviewText = useReplyPreviewText()
  const {text, subtle} = getReplyPreviewText(replyTo)

  const onRemove = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    clearReply()
  }

  const senderProfile = convo.relatedProfiles.get(replyTo.sender.did)
  const displayName = senderProfile
    ? createSanitizedDisplayName(senderProfile, false)
    : null

  return (
    <View
      style={[
        a.flex_1,
        a.flex_row,
        a.gap_sm,
        a.align_start,
        t.atoms.border_contrast_high,
        a.rounded_md,
        a.border,
        a.p_sm,
        a.mt_sm,
        a.mx_sm,
        a.gap_2xs,
      ]}>
      <View style={[a.flex_1]}>
        {displayName && (
          <Text
            style={[a.text_xs, t.atoms.text_contrast_high]}
            emoji
            numberOfLines={1}>
            {displayName}
          </Text>
        )}
        <Text
          style={[a.text_sm, subtle && [a.italic, t.atoms.text_contrast_high]]}
          emoji
          numberOfLines={2}>
          {text}
        </Text>
      </View>
      <Button
        label={l`Cancel reply`}
        onPress={onRemove}
        style={[a.px_2xs, {transform: [{translateX: 2}]}]}
        hitSlop={HITSLOP_20}>
        <XIcon size="xs" style={t.atoms.text_contrast_high} />
      </Button>
    </View>
  )
}
