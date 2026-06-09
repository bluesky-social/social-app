import {useMemo} from 'react'
import {View} from 'react-native'
import {moderateProfile, type ModerationOpts} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'

import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {useIsWithinSplitView} from '#/screens/Messages/components/splitView/context'
import {atoms as a, useTheme, web} from '#/alf'
import {AvatarBubbles} from '#/components/AvatarBubbles'
import {ButtonIcon} from '#/components/Button'
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
  const {isWithinSplitView} = useIsWithinSplitView()

  return (
    <Layout.Header.Outer noBottomBorder={IS_LIQUID_GLASS}>
      <View style={[a.w_full, a.flex_row, a.gap_xs, a.align_start]}>
        {!isWithinSplitView && (
          <View style={[{minHeight: PFP_SIZE}, a.justify_center]}>
            <Layout.Header.BackButton />
          </View>
        )}
        {convo && moderationOpts ? (
          convo.kind === 'direct' ? (
            <ProfileHeaderReady convo={convo} moderationOpts={moderationOpts} />
          ) : (
            <GroupHeaderReady convo={convo} moderationOpts={moderationOpts} />
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
  const t = useTheme()
  const {t: l} = useLingui()
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
  const handle = isDeletedAccount ? null : sanitizeHandle(profile.handle, '@')

  return (
    <Wrapper
      heading={
        <Link
          label={l`View ${displayName}’s profile`}
          style={[a.flex_row, a.gap_md, a.flex_1]}
          to={makeProfileLink(profile)}>
          <PreviewableUserAvatar
            size={PFP_SIZE}
            profile={profile}
            moderation={moderation.ui('avatar')}
            disableHoverCard={moderation.blocked}
          />
          <View style={[a.flex_1]}>
            <View style={[a.flex_row, a.align_center, a.flex_1, web(a.mb_2xs)]}>
              <Text
                style={[a.text_lg, a.font_semi_bold, a.flex_shrink]}
                numberOfLines={1}
                emoji>
                {displayName}
              </Text>
              <ProfileBadges profile={profile} size="md" style={[a.pl_xs]} />
              <MuteStatus muted={convo.view.muted} />
            </View>
            {handle ? (
              <Text
                style={[a.text_xs, t.atoms.text_contrast_high]}
                numberOfLines={1}>
                {handle}
              </Text>
            ) : null}
          </View>
        </Link>
      }
      settings={
        <ConvoMenu
          convo={convo}
          profile={profile}
          currentScreen="conversation"
          blockInfo={blockInfo}
        />
      }
    />
  )
}

function GroupHeaderReady({
  convo,
  moderationOpts,
}: {
  convo: Extract<ConvoWithDetails, {kind: 'group'}>
  moderationOpts: ModerationOpts
}) {
  const {t: l} = useLingui()

  const disabled = convo.details.lockStatus === 'locked-permanently'

  return (
    <Wrapper
      heading={
        <Link
          label={convo.details.name}
          accessibilityHint={l`Open group chat settings`}
          style={[a.flex_row, a.gap_md, a.flex_1, a.justify_start]}
          to={
            disabled
              ? '#'
              : {
                  screen: 'MessagesConversationSettings',
                  params: {
                    conversation: convo.view.id,
                  },
                }
          }>
          <AvatarBubbles
            size={40}
            profiles={convo.members}
            moderationOpts={moderationOpts}
          />
          <View style={[a.flex_row, a.flex_1, a.align_center]}>
            <Text
              style={[a.text_lg, a.font_semi_bold, a.flex_shrink]}
              numberOfLines={1}
              emoji>
              {convo.details.name}
            </Text>
            <MuteStatus muted={convo.view.muted} />
          </View>
        </Link>
      }
      settings={
        <Link
          to={
            disabled
              ? '#'
              : {
                  screen: 'MessagesConversationSettings',
                  params: {
                    conversation: convo.view.id,
                  },
                }
          }
          label={l`Open group chat settings`}
          size="small"
          color="secondary"
          shape="round"
          variant="ghost"
          style={[a.bg_transparent, a.justify_center]}>
          <ButtonIcon icon={DotsHorizontalIcon} size="md" />
        </Link>
      }
    />
  )
}

function Wrapper({
  heading,

  settings,
}: {
  heading: React.ReactNode
  settings: React.ReactNode
}) {
  return (
    <View style={[a.flex_1]}>
      <View
        style={[
          a.w_full,
          a.flex_row,
          a.align_center,
          a.justify_between,
          a.gap_sm,
        ]}>
        <View style={[a.flex_row, a.align_center, a.gap_md, a.flex_1]}>
          {heading}
        </View>

        <View
          style={[{minHeight: PFP_SIZE}, a.justify_center, a.flex_shrink_0]}>
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
