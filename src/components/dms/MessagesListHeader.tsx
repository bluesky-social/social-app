import {useMemo} from 'react'
import {View} from 'react-native'
import {
  type AppBskyActorDefs,
  type ModerationCause,
  type ModerationDecision,
} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {type Shadow} from '#/state/cache/profile-shadow'
import {isConvoActive, useConvo} from '#/state/messages/convo'
import {type ConvoItem} from '#/state/messages/convo/types'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme, web} from '#/alf'
import {ConvoMenu} from '#/components/dms/ConvoMenu'
import {Bell2Off_Filled_Corner0_Rounded as BellStroke} from '#/components/icons/Bell2'
import * as Layout from '#/components/Layout'
import {Link} from '#/components/Link'
import {PostAlerts} from '#/components/moderation/PostAlerts'
import {Text} from '#/components/Typography'
import {useSimpleVerificationState} from '#/components/verification'
import {VerificationCheck} from '#/components/verification/VerificationCheck'
import {IS_WEB} from '#/env'

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
    <Layout.Header.Outer>
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
                    {width: 120, height: 16},
                    a.rounded_xs,
                    t.atoms.bg_contrast_25,
                    a.mt_xs,
                  ]}
                />
                <View
                  style={[
                    {width: 175, height: 12},
                    a.rounded_xs,
                    t.atoms.bg_contrast_25,
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
  const {_} = useLingui()
  const t = useTheme()
  const convoState = useConvo()
  const verification = useSimpleVerificationState({
    profile,
  })

  const isDeletedAccount = profile?.handle === 'missing.invalid'
  const displayName = isDeletedAccount
    ? _(msg`Deleted Account`)
    : sanitizeDisplayName(
        profile.displayName || profile.handle,
        moderation.ui('displayName'),
      )

  // @ts-ignore findLast is polyfilled - esb
  const latestMessageFromOther = convoState.items.findLast(
    (item: ConvoItem) =>
      item.type === 'message' && item.message.sender.did === profile.did,
  )

  const latestReportableMessage =
    latestMessageFromOther?.type === 'message'
      ? latestMessageFromOther.message
      : undefined

  return (
    <View style={[a.flex_1]}>
      <View style={[a.w_full, a.flex_row, a.align_center, a.justify_between]}>
        <Link
          label={_(msg`View ${displayName}'s profile`)}
          style={[a.flex_row, a.align_start, a.gap_md, a.flex_1, a.pr_md]}
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
                style={[
                  a.text_md,
                  a.font_semi_bold,
                  a.self_start,
                  web(a.leading_normal),
                ]}
                numberOfLines={1}>
                {displayName}
              </Text>
              {verification.showBadge && (
                <View style={[a.pl_xs]}>
                  <VerificationCheck
                    width={14}
                    verifier={verification.role === 'verifier'}
                  />
                </View>
              )}
            </View>
            {!isDeletedAccount && (
              <Text
                style={[
                  t.atoms.text_contrast_medium,
                  a.text_xs,
                  web([a.leading_normal, {marginTop: -2}]),
                ]}
                numberOfLines={1}>
                @{profile.handle}
                {convoState.convo?.muted && (
                  <>
                    {' '}
                    &middot;{' '}
                    <BellStroke
                      size="xs"
                      style={t.atoms.text_contrast_medium}
                    />
                  </>
                )}
              </Text>
            )}
          </View>
        </Link>

        <View style={[{minHeight: PFP_SIZE}, a.justify_center]}>
          <Layout.Header.Slot>
            {isConvoActive(convoState) && (
              <ConvoMenu
                convo={convoState.convo}
                profile={profile}
                currentScreen="conversation"
                blockInfo={blockInfo}
                latestReportableMessage={latestReportableMessage}
              />
            )}
          </Layout.Header.Slot>
        </View>
      </View>

      <View
        style={[
          {
            paddingLeft: PFP_SIZE + a.gap_md.gap,
          },
        ]}>
        <PostAlerts
          modui={moderation.ui('contentList')}
          size="lg"
          style={[a.pt_xs]}
        />
      </View>
    </View>
  )
}
