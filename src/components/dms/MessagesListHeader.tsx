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
import {isConvoActive, useConvo} from '#/state/messages/convo'
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
  moderation?: ModerationDecision
}) {
  const t = useTheme()

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
        {profile && moderation && blockInfo ? (
          <HeaderReady
            profile={profile}
            moderation={moderation}
            blockInfo={blockInfo}
          />
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

function HeaderReady({
  profile,
  moderation,
  blockInfo,
}: {
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>
  moderation: ModerationDecision
  blockInfo: {
    listBlocks: ModerationCause[]
    userBlock?: ModerationCause
  }
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const convoState = useConvo()
  const {currentAccount} = useSession()

  const navigation = useNavigation<NavigationProp>()

  const groupInfo = convoState.getGroupInfo?.()
  const isGroupChat = groupInfo != null

  const isDeletedAccount = profile?.handle === 'missing.invalid'
  const displayName = isGroupChat
    ? (groupInfo.name ?? l`${profile.handle}'s group chat`)
    : isDeletedAccount
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
    <View style={[a.flex_1]}>
      <View style={[a.w_full, a.flex_row, a.align_center, a.justify_between]}>
        {isGroupChat ? (
          <View
            style={[a.flex_row, a.align_center, a.gap_md, a.flex_1, a.pr_md]}>
            <AvatarBubbles
              size="small"
              profiles={convoState.recipients ?? []}
            />
            <Text style={[a.text_md, a.font_semi_bold]} numberOfLines={1}>
              {displayName}
            </Text>
          </View>
        ) : (
          <Link
            label={l`View ${displayName}'s profile`}
            style={[a.flex_row, a.gap_md, a.flex_1, a.pr_md]}
            to={makeProfileLink(profile)}>
            <PreviewableUserAvatar
              size={PFP_SIZE}
              profile={profile}
              moderation={moderation.ui('avatar')}
              disableHoverCard={moderation.blocked}
            />
            <View style={[a.flex_1]}>
              <View style={[a.flex_row, a.align_center]}>
                <Text
                  emoji
                  style={[a.text_md, a.font_semi_bold, a.self_start]}
                  numberOfLines={1}>
                  {displayName}
                </Text>
                <ProfileBadges profile={profile} size="md" style={[a.pl_xs]} />
                {convoState.convo?.muted && (
                  <>
                    <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
                      {' '}
                      &middot;{' '}
                    </Text>
                    <BellOffIcon
                      size="sm"
                      style={t.atoms.text_contrast_medium}
                    />
                  </>
                )}
              </View>
            </View>
          </Link>
        )}

        <View style={[{minHeight: PFP_SIZE}, a.justify_center]}>
          <Layout.Header.Slot>
            {isConvoActive(convoState) ? (
              isGroupChat ? (
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
              ) : (
                <ConvoMenu
                  convo={convoState.convo}
                  profile={profile}
                  currentScreen="conversation"
                  blockInfo={blockInfo}
                  latestReportableMessage={latestReportableMessage}
                />
              )
            ) : null}
          </Layout.Header.Slot>
        </View>
      </View>
    </View>
  )
}
