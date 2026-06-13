import {LayoutAnimation, View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {HITSLOP_20} from '#/lib/constants'
import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {useConvoActive} from '#/state/messages/convo'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useMessageDialogs} from '#/components/dms/MessageOverlays'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {Text} from '#/components/Typography'

/**
 * The reply staged in the message composer. Renders a preview of the message
 * being replied to, with a button to cancel the reply.
 */
export function MessageInputReply() {
  const t = useTheme()
  const {t: l} = useLingui()
  const {currentAccount} = useSession()
  const convo = useConvoActive()
  const {replyTo, clearReply} = useMessageDialogs()

  if (!replyTo) {
    return null
  }

  const onRemove = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    clearReply()
  }

  const isFromSelf = replyTo.sender.did === currentAccount?.did
  const senderProfile = convo.relatedProfiles.get(replyTo.sender.did)
  const displayName = senderProfile
    ? createSanitizedDisplayName(senderProfile)
    : null

  return (
    <View
      style={[
        a.flex_1,
        a.flex_row,
        a.gap_sm,
        a.align_center,
        t.atoms.border_contrast_high,
        a.rounded_md,
        a.border,
        a.p_sm,
        a.mt_sm,
        a.mx_sm,
      ]}>
      <View style={[a.flex_1]}>
        <Text
          style={[a.text_xs, a.font_bold, t.atoms.text_contrast_medium]}
          emoji
          numberOfLines={1}>
          {isFromSelf ? (
            <Trans>Replying to yourself</Trans>
          ) : displayName ? (
            <Trans>Replying to {displayName}</Trans>
          ) : (
            <Trans>Replying to message</Trans>
          )}
        </Text>
        <Text
          style={[a.text_sm, t.atoms.text_contrast_high, a.mt_2xs]}
          emoji
          numberOfLines={1}>
          {replyTo.text}
        </Text>
      </View>
      <Button
        label={l`Cancel reply`}
        onPress={onRemove}
        style={[a.px_2xs]}
        hitSlop={HITSLOP_20}>
        <XIcon size="xs" style={t.atoms.text_contrast_high} />
      </Button>
    </View>
  )
}
