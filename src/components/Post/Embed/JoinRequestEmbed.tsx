import {type StyleProp, View, type ViewStyle} from 'react-native'
import {type ChatBskyGroupDefs} from '@atproto/api'
import {Plural, Trans, useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {type NavigationProp} from '#/lib/routes/types'
import {sanitizeHandle} from '#/lib/strings/handles'
import {atoms as a, useTheme} from '#/alf'
import {AvatarBubbles} from '#/components/AvatarBubbles'
import {
  Button,
  type ButtonColor,
  ButtonIcon,
  ButtonText,
} from '#/components/Button'
import {ArrowRight_Stroke2_Corner0_Rounded as ArrowRightIcon} from '#/components/icons/Arrow'
import {ArrowBoxRight_Stroke2_Corner3_Rounded as JoinIcon} from '#/components/icons/ArrowBoxRight'
import {CheckThick_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {RaisingHand4Finger_Stroke2_Corner2_Rounded as HandIcon} from '#/components/icons/RaisingHand'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import {useIntentDialogs} from '#/components/intents/IntentDialogs'
import {Loader} from '#/components/Loader'
import {ProfileBadges} from '#/components/ProfileBadges'
import {Text} from '#/components/Typography'

const JOIN_REQUEST_EMBED_HEIGHT = 164

export function JoinRequestEmbed({
  composer = false,
  loading = false,
  preview,
  style,
}: {
  composer?: boolean
  loading?: boolean
  preview?: ChatBskyGroupDefs.JoinLinkPreviewView
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()

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
    <JoinRequestEmbedInner
      composer={composer}
      preview={preview}
      style={style}
    />
  )
}

function JoinRequestEmbedInner({
  composer = false,
  preview,
  style,
}: {
  composer?: boolean
  preview: ChatBskyGroupDefs.JoinLinkPreviewView
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const navigation = useNavigation<NavigationProp>()

  const {groupChatJoinDialogControl, setGroupChatJoinState} = useIntentDialogs()

  const ownerDisplayName = createSanitizedDisplayName(preview.owner)
  const ownerHandle = sanitizeHandle(preview.owner.handle, '@')

  const avatarProfiles = preview.convo?.members ?? [preview.owner]

  const convoId = preview.convo?.id
  const isFollowing = preview.owner.viewer?.following ?? false
  const hasRequested = !convoId && preview.viewer?.requestedAt != null

  let canJoin = true
  let ButtonIconImage = JoinIcon
  let buttonText = preview.requireApproval ? l`Request to join` : l`Join`
  let buttonColor: ButtonColor = 'primary'
  if (preview.enabledStatus !== 'enabled') {
    canJoin = false
    ButtonIconImage = WarningIcon
    buttonText = l`Chat invite link no longer available`
    buttonColor = 'secondary'
  } else if (preview.memberCount >= preview.memberLimit) {
    canJoin = false
    ButtonIconImage = HandIcon
    buttonText = l`This chat is full`
    buttonColor = 'secondary'
  } else if (preview.joinRule === 'followedByOwner' && !isFollowing) {
    canJoin = false
    ButtonIconImage = HandIcon
    buttonText = l`Only people the chat owner follows can join`
    buttonColor = 'secondary'
  } else if (hasRequested) {
    ButtonIconImage = CheckIcon
    buttonText = l`Requested`
    buttonColor = 'secondary'
  }

  return (
    <View
      style={[
        a.border,
        a.rounded_lg,
        a.p_lg,
        a.gap_md,
        t.atoms.border_contrast_high,
        style,
      ]}>
      <View style={[a.flex_row, a.gap_md, a.align_center, a.mb_lg]}>
        <AvatarBubbles size={56} self profiles={avatarProfiles} />
        <View style={[a.flex_1]}>
          <Text
            emoji
            style={[a.text_lg, a.font_bold, a.leading_tight, t.atoms.text]}
            numberOfLines={1}>
            {preview.name}
          </Text>
          <View
            style={[a.flex_row, a.align_center, a.gap_sm, a.mt_2xs, a.mb_sm]}>
            <Text
              style={[
                a.text_xs,
                a.leading_tight,
                a.font_medium,
                t.atoms.text_contrast_high,
              ]}
              numberOfLines={1}>
              <Trans>Group chat</Trans>
            </Text>
            <Text
              style={[
                a.text_xs,
                a.leading_tight,
                a.font_medium,
                t.atoms.text_contrast_high,
              ]}
              numberOfLines={1}>
              <Trans comment="The number of members in a group chat, in the format '{members}/{total} members'.">
                {preview.memberCount}/{preview.memberLimit}{' '}
                <Plural
                  value={preview.memberCount}
                  one="member"
                  other="members"
                />
              </Trans>
            </Text>
          </View>
          <View style={[a.flex_row, a.align_center, a.gap_xs]}>
            <Text
              emoji
              style={[
                a.flex_shrink,
                a.text_sm,
                a.font_medium,
                a.leading_tight,
                t.atoms.text,
              ]}
              numberOfLines={1}>
              <Trans comment="The group chat creator, in the format 'By {displayName}'.">
                By{' '}
                <Text style={[a.font_medium, t.atoms.text]}>
                  {ownerDisplayName}
                </Text>
              </Trans>
            </Text>
            <ProfileBadges profile={preview.owner} size="sm" />
            <Text
              style={[
                a.flex_shrink,
                a.text_sm,
                a.font_medium,
                a.leading_tight,
                t.atoms.text_contrast_medium,
              ]}
              numberOfLines={1}>
              {ownerHandle}
            </Text>
          </View>
        </View>
      </View>
      {convoId ? (
        <Button
          testID="openButton"
          onPress={() =>
            navigation.navigate('MessagesConversation', {conversation: convoId})
          }
          label={l`Open group chat`}
          accessibilityHint={l`Open this group chat`}
          size="large"
          color="primary"
          disabled={composer}
          style={[a.w_full]}>
          <ButtonText>
            <Trans>Open chat</Trans>
          </ButtonText>
          <ButtonIcon icon={ArrowRightIcon} />
        </Button>
      ) : (
        <Button
          testID="joinButton"
          onPress={() => {
            setGroupChatJoinState({code: preview.code})
            groupChatJoinDialogControl.open()
          }}
          label={
            preview.requireApproval
              ? l`Request access to group chat`
              : l`Join group chat`
          }
          accessibilityHint={
            preview.requireApproval
              ? l`Request access to group chat`
              : l`Join group chat`
          }
          size="large"
          color={buttonColor}
          disabled={composer || !canJoin}
          style={[a.w_full]}>
          <ButtonIcon icon={ButtonIconImage} />
          <ButtonText>{buttonText}</ButtonText>
        </Button>
      )}
    </View>
  )
}
