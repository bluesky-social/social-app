import {LayoutAnimation, View} from 'react-native'
import {AppBskyEmbedRecord, ChatBskyEmbedJoinLink} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'

import {HITSLOP_20} from '#/lib/constants'
import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {useConvoActive} from '#/state/messages/convo'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useMessageReplies} from '#/components/dms/MessageReplies'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {Text} from '#/components/Typography'

/**
 * The reply staged in the message composer. Renders a preview of the message
 * being replied to, with a button to cancel the reply.
 */
export function MessageInputReply() {
  const t = useTheme()
  const {t: l} = useLingui()
  const convo = useConvoActive()
  const {replyTo, clearReply} = useMessageReplies()

  if (!replyTo) {
    return null
  }

  const onRemove = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    clearReply()
  }

  const senderProfile = convo.relatedProfiles.get(replyTo.sender.did)
  const displayName = senderProfile
    ? createSanitizedDisplayName(senderProfile, false)
    : null

  let text = replyTo.text
  let subtle = false
  if (!text.trim()) {
    subtle = true
    if (ChatBskyEmbedJoinLink.isView(replyTo.embed)) {
      text = l`(chat invite link)`
    } else if (AppBskyEmbedRecord.isView(replyTo.embed)) {
      text = l`(contains embedded content)`
    } else {
      text = l`No text`
    }
  }

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
