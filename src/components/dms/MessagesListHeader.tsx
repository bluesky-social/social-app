import {useMemo} from 'react'
import {View} from 'react-native'
import {
  ChatBskyConvoDefs,
  moderateProfile,
  type ModerationOpts,
} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {makeProfileLink} from '#/lib/routes/links'
import {type NavigationProp} from '#/lib/routes/types'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useSession} from '#/state/session'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {AvatarBubbles} from '#/components/AvatarBubbles'
import {Button, ButtonIcon} from '#/components/Button'
import {ConvoMenu} from '#/components/dms/ConvoMenu'
import {Bell2Off_Filled_Corner0_Rounded as BellOffIcon} from '#/components/icons/Bell2'
import {DotGrid3x1_Stroke2_Corner0_Rounded as DotsHorizontalIcon} from '#/components/icons/DotGrid'
import * as Layout from '#/components/Layout'
import {Link} from '#/components/Link'
import {ProfileBadges} from '#/components/ProfileBadges'
import {Text} from '#/components/Typography'
import {IS_LIQUID_GLASS, IS_WEB} from '#/env'
import {type ConvoWithDetails} from './util'

const PFP_SIZE = IS_WEB ? 40 : Layout.HEADER_SLOT_SIZE

export function MessagesListHeader({convo}: {convo?: ConvoWithDetails | null}) {
  const t = useTheme()
  const moderationOpts = useModerationOpts()

  return (
    <Layout.Header.Outer noBottomBorder={IS_LIQUID_GLASS}>
      <View style={[a.w_full, a.flex_row, a.gap_xs, a.align_start]}>
        <View style={[{minHeight: PFP_SIZE}, a.justify_center]}>
          <Layout.Header.BackButton />
        </View>
        {convo && moderationOpts ? (
          convo.kind === 'direct' ? (
            <ProfileHeaderReady convo={convo} moderationOpts={moderationOpts} />
          ) : (
            <GroupHeaderReady convo={convo} />
          )
        ) : (
          <>
            <View style={[a.flex_row, a.align_center, a.gap_md, a.flex_1]}>
              <View
                style={[
                  {width: PFP_SIZE, height: PFP_SIZE},
                  a.rounded_full,
                  t.atoms.bg_contrast_25,
                ]}
              />
              <View style={a.gap_xs}>
                <View
                  style={[
                    {width: 150, height: 16},
                    a.rounded_xs,
                    t.atoms.bg_contrast_25,
                    a.mt_xs,
                  ]}
                />
              </View>
            </View>

            <Layout.Header.Slot />
          </>
        )}
      </View>
    </Layout.Header.Outer>
  )
}

function ProfileHeaderReady({
  convo,
  moderationOpts,
}: {
  convo: Extract<ConvoWithDetails, {kind: 'direct'}>
  moderationOpts: ModerationOpts
}) {
  const {t: l} = useLingui()
  const {currentAccount} = useSession()
  const profile = useProfileShadow(convo.primaryMember)

  const moderation = moderateProfile(profile, moderationOpts)

  const blockInfo = useMemo(() => {
    const modui = moderation.ui('profileView')
    const blocks = modui.alerts.filter(alert => alert.type === 'blocking')
    const listBlocks = blocks.filter(alert => alert.source.type === 'list')
    const userBlock = blocks.find(alert => alert.source.type === 'user')
    return {
      listBlocks,
      userBlock,
    }
  }, [moderation])

  const isDeletedAccount = profile?.handle === 'missing.invalid'
  const displayName = isDeletedAccount
    ? l`Deleted Account`
    : createSanitizedDisplayName(profile, true, moderation.ui('displayName'))

  const latestReportableMessage =
    ChatBskyConvoDefs.isMessageView(convo.view.lastMessage) &&
    convo.view.lastMessage.sender?.did !== currentAccount?.did
      ? convo.view.lastMessage
      : undefined

  return (
    <Wrapper
      heading={
        <Link
          label={l`View ${displayName}’s profile`}
          style={[a.flex_row, a.gap_md, a.flex_1, a.pr_md]}
          to={makeProfileLink(profile)}>
          <PreviewableUserAvatar
            size={PFP_SIZE}
            profile={profile}
            moderation={moderation.ui('avatar')}
            disableHoverCard={moderation.blocked}
          />
          <View style={[a.flex_row, a.align_center, a.flex_1]}>
            <Text style={[a.text_md, a.font_semi_bold]} numberOfLines={1}>
              {displayName}
            </Text>
            <ProfileBadges profile={profile} size="md" style={[a.pl_xs]} />
          </View>
        </Link>
      }
      muted={convo.view.muted}
      settings={
        <ConvoMenu
          convo={convo.view}
          profile={profile}
          currentScreen="conversation"
          blockInfo={blockInfo}
          latestReportableMessage={latestReportableMessage}
        />
      }
    />
  )
}

function GroupHeaderReady({
  convo,
}: {
  convo: Extract<ConvoWithDetails, {kind: 'group'}>
}) {
  const {t: l} = useLingui()

  const navigation = useNavigation<NavigationProp>()

  const handleNavigateToSettings = () => {
    navigation.navigate('MessagesConversationSettings', {
      conversation: convo.view.id,
    })
  }

  return (
    <Wrapper
      heading={
        <>
          <AvatarBubbles size="small" profiles={convo.members} />
          <Text style={[a.text_md, a.font_semi_bold]} numberOfLines={1}>
            {convo.details.name}
          </Text>
        </>
      }
      muted={convo.view.muted}
      settings={
        <Button
          label={l`Open group chat settings`}
          size="small"
          color="secondary"
          shape="round"
          variant="ghost"
          style={[a.bg_transparent]}
          onPress={handleNavigateToSettings}>
          <ButtonIcon icon={DotsHorizontalIcon} size="md" />
        </Button>
      }
    />
  )
}

function Wrapper({
  heading,
  muted,
  settings,
}: {
  heading: React.ReactNode
  muted: boolean
  settings: React.ReactNode
}) {
  return (
    <View style={[a.flex_1]}>
      <View style={[a.w_full, a.flex_row, a.align_center, a.justify_between]}>
        <View style={[a.flex_row, a.align_center, a.gap_md, a.flex_1, a.pr_md]}>
          {heading}
          <MuteStatus muted={muted} />
        </View>

        <View style={[{minHeight: PFP_SIZE}, a.justify_center]}>
          <Layout.Header.Slot>{settings}</Layout.Header.Slot>
        </View>
      </View>
    </View>
  )
}

function MuteStatus({muted}: {muted: boolean}) {
  const t = useTheme()

  return muted ? (
    <>
      <Text style={[a.text_md, t.atoms.text_contrast_medium]}> &middot; </Text>
      <BellOffIcon size="sm" style={t.atoms.text_contrast_medium} />
    </>
  ) : undefined
}
