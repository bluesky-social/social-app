import React, {useCallback} from 'react'
import {TouchableOpacity, View} from 'react-native'
import {
  AppBskyActorDefs,
  ModerationCause,
  ModerationDecision,
} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {BACK_HITSLOP} from '#/lib/constants'
import {makeProfileLink} from '#/lib/routes/links'
import {NavigationProp} from '#/lib/routes/types'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {isWeb} from '#/platform/detection'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {isConvoActive, useConvo} from '#/state/messages/convo'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {ConvoMenu} from '#/components/dms/ConvoMenu'
import {Bell2Off_Filled_Corner0_Rounded as BellStroke} from '#/components/icons/Bell2'
import {Link} from '#/components/Link'
import {PostAlerts} from '#/components/moderation/PostAlerts'
import {Text} from '#/components/Typography'

const PFP_SIZE = isWeb ? 40 : 34

export let MessagesListHeader = ({
  profile,
  moderation,
  blockInfo,
}: {
  profile?: AppBskyActorDefs.ProfileViewBasic
  moderation?: ModerationDecision
  blockInfo?: {
    listBlocks: ModerationCause[]
    userBlock?: ModerationCause
  }
}): React.ReactNode => {
  const t = useTheme()
  const {_} = useLingui()
  const {gtTablet} = useBreakpoints()
  const navigation = useNavigation<NavigationProp>()

  const onPressBack = useCallback(() => {
    if (isWeb) {
      navigation.replace('Messages', {})
    } else {
      navigation.goBack()
    }
  }, [navigation])

  return (
    <View
      style={[
        t.atoms.bg,
        t.atoms.border_contrast_low,
        a.border_b,
        a.flex_row,
        a.align_start,
        a.gap_sm,
        gtTablet ? a.pl_lg : a.pl_xl,
        a.pr_lg,
        a.py_sm,
      ]}>
      {!gtTablet && (
        <TouchableOpacity
          testID="conversationHeaderBackBtn"
          onPress={onPressBack}
          hitSlop={BACK_HITSLOP}
          style={{width: 30, height: 30, marginTop: isWeb ? 6 : 4}}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Back`)}
          accessibilityHint="">
          <FontAwesomeIcon
            size={18}
            icon="angle-left"
            style={{
              marginTop: 6,
            }}
            color={t.atoms.text.color}
          />
        </TouchableOpacity>
      )}

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

          <View style={{width: 30}} />
        </>
      )}
    </View>
  )
}
MessagesListHeader = React.memo(MessagesListHeader)

function HeaderReady({
  profile: profileUnshadowed,
  moderation,
  blockInfo,
}: {
  profile: AppBskyActorDefs.ProfileViewBasic
  moderation: ModerationDecision
  blockInfo: {
    listBlocks: ModerationCause[]
    userBlock?: ModerationCause
  }
}) {
  const {_} = useLingui()
  const t = useTheme()
  const convoState = useConvo()
  const profile = useProfileShadow(profileUnshadowed)

  const isDeletedAccount = profile?.handle === 'missing.invalid'
  const displayName = isDeletedAccount
    ? _(msg`Deleted Account`)
    : sanitizeDisplayName(
        profile.displayName || profile.handle,
        moderation.ui('displayName'),
      )

  return (
    <View style={[a.flex_1]}>
      <View style={[a.w_full, a.flex_row, a.align_center, a.justify_between]}>
        <Link
          label={_(msg`View ${displayName}'s profile`)}
          style={[a.flex_row, a.align_start, a.gap_md, a.flex_1, a.pr_md]}
          to={makeProfileLink(profile)}>
          <View style={[a.pt_2xs]}>
            <PreviewableUserAvatar
              size={PFP_SIZE}
              profile={profile}
              moderation={moderation.ui('avatar')}
              disableHoverCard={moderation.blocked}
            />
          </View>
          <View style={a.flex_1}>
            <Text
              emoji
              style={[
                a.text_md,
                a.font_bold,
                a.self_start,
                web(a.leading_normal),
              ]}
              numberOfLines={1}>
              {displayName}
            </Text>
            {!isDeletedAccount && (
              <Text
                style={[
                  t.atoms.text_contrast_medium,
                  a.text_sm,
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

        {isConvoActive(convoState) && (
          <ConvoMenu
            convo={convoState.convo}
            profile={profile}
            currentScreen="conversation"
            blockInfo={blockInfo}
          />
        )}
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
