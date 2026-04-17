import {useMemo} from 'react'
import {View} from 'react-native'
import {
  type AppBskyActorDefs,
  type ModerationCause,
  type ModerationDecision,
} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {makeProfileLink} from '#/lib/routes/links'
import {type NavigationProp} from '#/lib/routes/types'
import {logger} from '#/logger'
import {type Shadow} from '#/state/cache/profile-shadow'
import {
  type ActiveConvoStates,
  isConvoActive,
  useConvo,
} from '#/state/messages/convo'
import {type ConvoItem} from '#/state/messages/convo/types'
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

const PFP_SIZE = IS_WEB ? 40 : Layout.HEADER_SLOT_SIZE

export function MessagesListHeader({
  profile,
  moderation,
}: {
  profile?: Shadow<AppBskyActorDefs.ProfileViewDetailed>
  moderation?: ModerationDecision | null
}) {
  const t = useTheme()

  const convoState = useConvo()
  const isGroupChat = convoState?.isGroup?.()

  const blockInfo = useMemo(() => {
    if (!moderation) return
    const modui = moderation.ui('profileView')
    const blocks = modui.alerts.filter(alert => alert.type === 'blocking')
    const listBlocks = blocks.filter(alert => alert.source.type === 'list')
    const userBlock = blocks.find(alert => alert.source.type === 'user')
    return {
      listBlocks,
      userBlock,
    }
  }, [moderation])

  return (
    <Layout.Header.Outer noBottomBorder={IS_LIQUID_GLASS}>
      <View style={[a.w_full, a.flex_row, a.gap_xs, a.align_start]}>
        <View style={[{minHeight: PFP_SIZE}, a.justify_center]}>
          <Layout.Header.BackButton />
        </View>
        {isConvoActive(convoState) ? (
          moderation && blockInfo && profile && !isGroupChat ? (
            <ProfileHeaderReady
              convoState={convoState}
              profile={profile}
              moderation={moderation}
              blockInfo={blockInfo}
            />
          ) : (
            <GroupHeaderReady
              convoState={convoState}
              profile={profile}
              moderation={moderation}
            />
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
  convoState,
  profile,
  moderation,
  blockInfo,
}: {
  convoState: ActiveConvoStates
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>
  moderation: ModerationDecision
  blockInfo: {
    listBlocks: ModerationCause[]
    userBlock?: ModerationCause
  }
}) {
  const {t: l} = useLingui()
  const {currentAccount} = useSession()

  const isDeletedAccount = profile?.handle === 'missing.invalid'
  const displayName = isDeletedAccount
    ? l`Deleted Account`
    : createSanitizedDisplayName(profile, true, moderation.ui('displayName'))

  const latestMessageFromOther = convoState.items.findLast(
    (item: ConvoItem) =>
      item.type === 'message' &&
      item.message.sender.did !== currentAccount?.did,
  )

  const latestReportableMessage =
    latestMessageFromOther?.type === 'message'
      ? latestMessageFromOther.message
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
          <ProfileBadges profile={profile} size="md" style={[a.pl_xs]} />
        </Link>
      }
      muted={convoState.convo?.muted}
      settings={
        isConvoActive(convoState) ? (
          <ConvoMenu
            convo={convoState.convo}
            profile={profile}
            currentScreen="conversation"
            blockInfo={blockInfo}
            latestReportableMessage={latestReportableMessage}
          />
        ) : null
      }
    />
  )
}

function GroupHeaderReady({
  convoState,
  profile,
  moderation,
}: {
  convoState: ActiveConvoStates
  profile?: Shadow<AppBskyActorDefs.ProfileViewDetailed>
  moderation?: ModerationDecision | null
}) {
  const {t: l} = useLingui()

  const navigation = useNavigation<NavigationProp>()

  const groupInfo = convoState.getGroupInfo?.()

  const isDeletedAccount = profile?.handle === 'missing.invalid'
  const displayName = isDeletedAccount
    ? l`Deleted Account`
    : profile
      ? createSanitizedDisplayName(profile, true, moderation?.ui('displayName'))
      : undefined
  const groupName =
    groupInfo?.name ??
    (displayName ? l`${displayName}’s group chat` : l`Group chat`)

  const handleNavigateToSettings = () => {
    const convoId = convoState.convo?.id
    if (convoId) {
      navigation.navigate('MessagesConversationSettings', {
        conversation: convoId,
      })
    } else {
      logger.error(`handleNavigateToSettings: missing convo ID`)
    }
  }

  return (
    <Wrapper
      heading={
        <>
          <AvatarBubbles size="small" profiles={convoState.recipients ?? []} />
          <Text style={[a.text_md, a.font_semi_bold]} numberOfLines={1}>
            {groupName}
          </Text>
        </>
      }
      muted={convoState.convo?.muted}
      settings={
        isConvoActive(convoState) ? (
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
        ) : null
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
