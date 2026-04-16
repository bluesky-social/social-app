import {ScrollView, View} from 'react-native'
import {moderateProfile, type ModerationOpts} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {isBlockedOrBlocking, isMuted} from '#/lib/moderation/blocked-and-muted'
import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {type NavigationProp} from '#/lib/routes/types'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useListConvosQuery} from '#/state/queries/messages/list-conversations'
import {useSession} from '#/state/session'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, tokens, useTheme} from '#/alf'
import {AvatarBubbles} from '#/components/AvatarBubbles'
import {Button} from '#/components/Button'
import {useDialogContext} from '#/components/Dialog'
import {type ConvoWithDetails, parseConvoView} from '#/components/dms/util'
import {ProfileBadges} from '#/components/ProfileBadges'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'

export function RecentChats({
  postUri,
  onBeforePress,
}: {
  postUri: string
  onBeforePress?: () => void
}) {
  const ax = useAnalytics()
  const control = useDialogContext()
  const {currentAccount} = useSession()
  const {data} = useListConvosQuery({status: 'accepted'})
  const convos = data?.pages[0]?.convos?.slice(0, 10)
  const moderationOpts = useModerationOpts()
  const navigation = useNavigation<NavigationProp>()

  const onSelectChat = (convoId: string) => {
    onBeforePress?.()
    control.close(() => {
      ax.metric('share:press:recentDm', {})
      navigation.navigate('MessagesConversation', {
        conversation: convoId,
        embed: postUri,
      })
    })
  }

  if (!moderationOpts) return null

  return (
    <View
      style={[a.relative, a.flex_1, {marginHorizontal: tokens.space.md * -1}]}>
      <ScrollView
        horizontal
        style={[a.flex_1, a.pt_2xs, {minHeight: 98}]}
        contentContainerStyle={[a.gap_sm, a.px_md]}
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled>
        {convos && convos.length > 0 ? (
          convos.map(c => {
            const convo = parseConvoView(c, currentAccount?.did)

            if (!convo) return null

            if (
              (convo.kind === 'direct' &&
                convo.primaryMember.handle === 'missing.invalid') ||
              convo.view.muted
            ) {
              return null
            }

            return (
              <RecentChatItem
                key={convo.view.id}
                convo={convo}
                onPress={() => onSelectChat(convo.view.id)}
                moderationOpts={moderationOpts}
              />
            )
          })
        ) : (
          <>
            <ConvoSkeleton />
            <ConvoSkeleton />
            <ConvoSkeleton />
            <ConvoSkeleton />
            <ConvoSkeleton />
          </>
        )}
      </ScrollView>
      {convos && convos.length === 0 && <NoConvos />}
    </View>
  )
}

const WIDTH = 80

function RecentChatItem({
  onPress,
  moderationOpts,
  convo,
}: {
  onPress: () => void
  moderationOpts: ModerationOpts
  convo: ConvoWithDetails
}) {
  const {_} = useLingui()
  const t = useTheme()

  const primaryProfile = useProfileShadow(convo.primaryMember)

  const moderation = moderateProfile(primaryProfile, moderationOpts)
  const name =
    convo.kind === 'group'
      ? convo.details.name
      : createSanitizedDisplayName(
          primaryProfile,
          true,
          moderation.ui('displayName'),
        )

  if (
    convo.kind === 'direct' &&
    (isBlockedOrBlocking(primaryProfile) || isMuted(primaryProfile))
  ) {
    return null
  }

  return (
    <Button
      onPress={onPress}
      label={_(msg`Send post to ${name}`)}
      style={[
        a.flex_col,
        {width: WIDTH},
        a.gap_sm,
        a.justify_start,
        a.align_center,
      ]}>
      {convo.kind === 'group' ? (
        <AvatarBubbles profiles={convo.members} size={WIDTH - 8} />
      ) : (
        <UserAvatar
          avatar={primaryProfile.avatar}
          size={WIDTH - 8}
          type={primaryProfile.associated?.labeler ? 'labeler' : 'user'}
          moderation={moderation.ui('avatar')}
        />
      )}
      <View style={[a.flex_row, a.align_center, a.justify_center, a.w_full]}>
        <Text
          emoji
          style={[a.text_xs, a.leading_snug, t.atoms.text_contrast_medium]}
          numberOfLines={1}>
          {name}
        </Text>
        {convo.kind === 'direct' && (
          <ProfileBadges
            profile={primaryProfile}
            size="xs"
            style={[a.pl_2xs]}
          />
        )}
      </View>
    </Button>
  )
}

function ConvoSkeleton() {
  const t = useTheme()
  return (
    <View
      style={[
        a.flex_col,
        {width: WIDTH, height: WIDTH + 15},
        a.gap_xs,
        a.justify_start,
        a.align_center,
      ]}>
      <View
        style={[
          t.atoms.bg_contrast_50,
          {width: WIDTH - 8, height: WIDTH - 8},
          a.rounded_full,
        ]}
      />
      <View
        style={[
          t.atoms.bg_contrast_50,
          {width: WIDTH - 8, height: 10},
          a.rounded_xs,
        ]}
      />
    </View>
  )
}

function NoConvos() {
  const t = useTheme()

  return (
    <View
      style={[
        a.absolute,
        a.inset_0,
        a.justify_center,
        a.align_center,
        a.px_2xl,
      ]}>
      <View
        style={[a.absolute, a.inset_0, t.atoms.bg_contrast_25, {opacity: 0.5}]}
      />
      <Text
        style={[
          a.text_sm,
          t.atoms.text_contrast_high,
          a.text_center,
          a.font_semi_bold,
        ]}>
        <Trans>Start a conversation, and it will appear here.</Trans>
      </Text>
    </View>
  )
}
