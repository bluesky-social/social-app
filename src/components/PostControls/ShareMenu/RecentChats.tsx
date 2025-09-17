import {ScrollView, View} from 'react-native'
import {moderateProfile, type ModerationOpts} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {isBlockedOrBlocking, isMuted} from '#/lib/moderation/blocked-and-muted'
import {type NavigationProp} from '#/lib/routes/types'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {logger} from '#/logger'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useListConvosQuery} from '#/state/queries/messages/list-conversations'
import {useSession} from '#/state/session'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, tokens, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useDialogContext} from '#/components/Dialog'
import {Text} from '#/components/Typography'
import {useSimpleVerificationState} from '#/components/verification'
import {VerificationCheck} from '#/components/verification/VerificationCheck'
import type * as bsky from '#/types/bsky'

export function RecentChats({postUri}: {postUri: string}) {
  const control = useDialogContext()
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const {data} = useListConvosQuery({status: 'accepted'})
  const convos = data?.pages[0]?.convos?.slice(0, 10)
  const moderationOpts = useModerationOpts()
  const navigation = useNavigation<NavigationProp>()

  const onSelectChat = (convoId: string) => {
    control.close(() => {
      logger.metric('share:press:recentDm', {}, {statsig: true})
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
        fadingEdgeLength={64}
        nestedScrollEnabled>
        {convos && convos.length > 0 ? (
          convos.map(convo => {
            const otherMember = convo.members.find(
              member => member.did !== currentAccount?.did,
            )

            if (
              !otherMember ||
              otherMember.handle === 'missing.invalid' ||
              convo.muted
            )
              return null

            return (
              <RecentChatItem
                key={convo.id}
                profile={otherMember}
                onPress={() => onSelectChat(convo.id)}
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
  profile: profileUnshadowed,
  onPress,
  moderationOpts,
}: {
  profile: bsky.profile.AnyProfileView
  onPress: () => void
  moderationOpts: ModerationOpts
}) {
  const {_} = useLingui()
  const t = useTheme()

  const profile = useProfileShadow(profileUnshadowed)

  const moderation = moderateProfile(profile, moderationOpts)
  const name = sanitizeDisplayName(
    profile.displayName || sanitizeHandle(profile.handle),
    moderation.ui('displayName'),
  )
  const verification = useSimpleVerificationState({profile})

  if (isBlockedOrBlocking(profile) || isMuted(profile)) {
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
      <UserAvatar
        avatar={profile.avatar}
        size={WIDTH - 8}
        type={profile.associated?.labeler ? 'labeler' : 'user'}
        moderation={moderation.ui('avatar')}
      />
      <View style={[a.flex_row, a.align_center, a.justify_center, a.w_full]}>
        <Text
          emoji
          style={[a.text_xs, a.leading_snug, t.atoms.text_contrast_medium]}
          numberOfLines={1}>
          {name}
        </Text>
        {verification.showBadge && (
          <View style={[a.pl_2xs]}>
            <VerificationCheck
              width={10}
              verifier={verification.role === 'verifier'}
            />
          </View>
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
