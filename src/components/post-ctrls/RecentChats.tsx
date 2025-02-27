import {ScrollView, View} from 'react-native'
import {moderateProfile} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {NavigationProp} from '#/lib/routes/types'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useListConvosQuery} from '#/state/queries/messages/list-conversations'
import {useSession} from '#/state/session'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, tokens, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useDialogContext} from '#/components/Dialog'
import {Text} from '#/components/Typography'

export function RecentChats({postUri}: {postUri: string}) {
  const control = useDialogContext()
  const {_} = useLingui()
  const t = useTheme()
  const {currentAccount} = useSession()
  const {data} = useListConvosQuery()
  const convos = data?.pages[0]?.convos?.slice(0, 10)
  const moderationOpts = useModerationOpts()
  const navigation = useNavigation<NavigationProp>()

  const onSelectChat = (convoId: string) => {
    control.close(() => {
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
        style={[a.flex_1, a.pt_2xs]}
        contentContainerStyle={[a.gap_sm, a.px_md]}
        showsHorizontalScrollIndicator={false}>
        {convos && convos.length > 0 ? (
          convos.map(convo => {
            const otherMember = convo.members.find(
              member => member.did !== currentAccount?.did,
            )

            if (!otherMember || otherMember.handle === 'missing.invalid')
              return null

            return (
              <Button
                key={convo.id}
                onPress={() => onSelectChat(convo.id)}
                label={_(
                  msg`Send post to ${sanitizeDisplayName(
                    otherMember.displayName || otherMember.handle,
                  )}`,
                )}
                style={[
                  a.flex_col,
                  {width: 72},
                  a.gap_sm,
                  a.justify_start,
                  a.align_center,
                ]}>
                <UserAvatar
                  avatar={otherMember.avatar}
                  size={56}
                  type={otherMember.associated?.labeler ? 'labeler' : 'user'}
                  moderation={moderateProfile(otherMember, moderationOpts).ui(
                    'avatar',
                  )}
                />
                <Text
                  style={[
                    a.text_xs,
                    t.atoms.text_contrast_medium,
                    a.text_center,
                    {minHeight: 28},
                  ]}
                  numberOfLines={2}>
                  {sanitizeDisplayName(
                    otherMember.displayName || otherMember.handle,
                  )}
                </Text>
              </Button>
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

function ConvoSkeleton() {
  const t = useTheme()
  return (
    <View
      style={[
        a.flex_col,
        {width: 72, height: 92},
        a.gap_sm,
        a.justify_start,
        a.align_center,
      ]}>
      <View
        style={[
          t.atoms.bg_contrast_50,
          {width: 56, height: 56},
          a.rounded_full,
        ]}
      />
      <View
        style={[t.atoms.bg_contrast_50, {width: 56, height: 14}, a.rounded_xs]}
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
          a.font_bold,
        ]}>
        Start a conversation, and it will appear here.
      </Text>
    </View>
  )
}
