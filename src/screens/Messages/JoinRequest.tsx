import {View} from 'react-native'
import {ImageBackground} from 'expo-image'
import {moderateProfile} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'

import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useJoinLinkPreviewsQuery} from '#/state/queries/join-links'
import {useActiveGroupChatJoinRequest} from '#/state/shell/landing'
import {LoggedOutScreenState} from '#/view/com/auth/LoggedOut'
import {LogomarkWithType} from '#/view/icons/LogomarkWithType'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {AvatarBubbles} from '#/components/AvatarBubbles'
import {Button, ButtonText} from '#/components/Button'
import {ChainLinkBroken_Stroke2_Corner0_Rounded as ChainLinkBrokenIcon} from '#/components/icons/ChainLink'
import {PersonGroup_Stroke2_Corner2_Rounded as PersonGroupIcon} from '#/components/icons/Person'
import {ProfileBadges} from '#/components/ProfileBadges'
import {Text} from '#/components/Typography'

const desktopDarkBg = require('../../../assets/images/chat-desktop-bg-dark.webp')
const desktopLightBg = require('../../../assets/images/chat-desktop-bg-light.webp')
const mobileDarkBg = require('../../../assets/images/chat-mobile-bg-dark.webp')
const mobileLightBg = require('../../../assets/images/chat-mobile-bg-light.webp')

type Props = {
  setScreenState: (state: LoggedOutScreenState) => void
}

export function JoinRequest({setScreenState}: Props) {
  const t = useTheme()
  const {t: l} = useLingui()

  const {gtMobile, gtTablet} = useBreakpoints()
  const moderationOpts = useModerationOpts()

  // Get code from context (logged-out only)
  const contextJoinRequest = useActiveGroupChatJoinRequest()
  const code = contextJoinRequest?.code

  const {data, error} = useJoinLinkPreviewsQuery({
    codes: code ? [code] : undefined,
    hasSession: false,
  })

  const isDarkMode = t.name !== 'light'
  const background = gtMobile
    ? isDarkMode
      ? desktopDarkBg
      : desktopLightBg
    : isDarkMode
      ? mobileDarkBg
      : mobileLightBg

  const requiresApproval = data?.joinLinkPreviews[0]?.requireApproval
  const requiresFollow =
    data?.joinLinkPreviews[0]?.joinRule === 'followedByOwner'

  return (
    <View style={[a.util_screen_outer, a.w_full, t.atoms.bg_contrast_25]}>
      <ImageBackground
        source={background}
        style={[a.util_screen_outer, a.w_full, a.flex_1, a.justify_center]}
        contentFit={gtTablet ? 'contain' : 'cover'}>
        <View
          style={[
            a.util_screen_outer,
            a.w_full,
            a.justify_center,
            a.align_center,
          ]}>
          {error ? (
            <Wrapper>
              <ChainLinkBrokenIcon fill={t.palette.primary_500} size="3xl" />
              <Text
                style={[
                  a.mb_sm,
                  a.text_center,
                  a.text_lg,
                  a.font_semi_bold,
                  t.atoms.text,
                ]}>
                {l`This invite link has expired`}
              </Text>
              <ActionButtons setScreenState={setScreenState} />
            </Wrapper>
          ) : data && moderationOpts ? (
            <Wrapper>
              <AvatarBubbles
                profiles={[
                  data.joinLinkPreviews[0].owner,
                  ...Array(
                    Math.min(
                      3,
                      Math.max(0, data.joinLinkPreviews[0].memberCount - 1),
                    ),
                  ).fill(undefined),
                ]}
                size={135}
              />
              <View style={[a.gap_2xs]}>
                <View
                  style={[
                    a.flex_row,
                    a.align_center,
                    a.justify_center,
                    a.gap_sm,
                  ]}>
                  <Text
                    style={[
                      a.text_center,
                      a.text_xs,
                      a.leading_snug,
                      t.atoms.text_contrast_medium,
                    ]}>
                    <Trans>Group chat</Trans>
                  </Text>
                  <View style={[a.flex_row, a.align_center]}>
                    <PersonGroupIcon
                      size="xs"
                      style={[a.mr_2xs, t.atoms.text_contrast_medium]}
                    />
                    <Text
                      style={[
                        a.text_center,
                        a.text_xs,
                        a.leading_snug,
                        t.atoms.text_contrast_medium,
                      ]}>
                      <Trans
                        context="group-chat-member-count"
                        comment="The number of active group chat members out of the total number allowed.">
                        {data.joinLinkPreviews[0].memberCount}/
                        {data.joinLinkPreviews[0].memberLimit}
                      </Trans>
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    a.text_center,
                    a.text_4xl,
                    a.leading_tight,
                    a.font_bold,
                    t.atoms.text,
                  ]}>
                  {data.joinLinkPreviews[0].name}
                </Text>
              </View>
              <View style={[a.w_full]}>
                <View
                  style={[
                    a.flex_row,
                    a.gap_xs,
                    a.align_center,
                    a.justify_center,
                  ]}>
                  <Text
                    style={[
                      a.mb_xs,
                      a.text_center,
                      a.text_sm,
                      a.leading_snug,
                      a.font_semi_bold,
                      t.atoms.text,
                      a.max_w_full,
                    ]}>
                    <Trans comment="The owner (creator) of a group chat.">
                      By{' '}
                      {createSanitizedDisplayName(
                        data.joinLinkPreviews[0].owner,
                        true,
                        moderateProfile(
                          data.joinLinkPreviews[0].owner,
                          moderationOpts,
                        ).ui('displayName'),
                      )}
                    </Trans>
                  </Text>
                  <ProfileBadges
                    profile={data.joinLinkPreviews[0].owner}
                    size="sm"
                    style={{marginTop: -4}}
                  />
                </View>
                <Text
                  style={[
                    a.text_center,
                    a.text_xs,
                    a.leading_snug,
                    a.font_medium,
                    t.atoms.text_contrast_medium,
                    a.max_w_full,
                  ]}>
                  {sanitizeHandle(data.joinLinkPreviews[0].owner.handle, '@')}
                </Text>
              </View>
              <Text
                style={[
                  a.text_center,
                  a.text_sm,
                  a.leading_snug,
                  t.atoms.text_contrast_high,
                ]}>
                {requiresApproval
                  ? l`Sign in to request access to this group chat.`
                  : l`Sign in to accept invite.`}{' '}
                {requiresFollow &&
                  l`Only people ${createSanitizedDisplayName(
                    data.joinLinkPreviews[0].owner,
                    true,
                    moderateProfile(
                      data.joinLinkPreviews[0].owner,
                      moderationOpts,
                    ).ui('displayName'),
                  )} follows can join.`}
              </Text>
              <ActionButtons setScreenState={setScreenState} />
            </Wrapper>
          ) : null}
        </View>
      </ImageBackground>
    </View>
  )
}

function Wrapper({children}: React.PropsWithChildren<unknown>) {
  const t = useTheme()

  const isDarkMode = t.name !== 'light'

  return (
    <>
      <LogomarkWithType
        width={136}
        fill={t.palette.primary_500}
        style={[
          a.absolute,
          {
            top: 40,
          },
        ]}
      />
      <View
        style={[
          a.zoom_fade_in,
          a.align_center,
          a.gap_lg,
          a.p_2xl,
          a.pt_4xl,
          t.atoms.bg,
          t.atoms.shadow_xl,
          isDarkMode ? [a.border, t.atoms.border_contrast_low] : null,
          {
            borderRadius: 48,
            maxWidth: 320,
            width: '90%',
          },
        ]}>
        {children}
      </View>
    </>
  )
}

function ActionButtons({
  setScreenState,
}: {
  setScreenState: (state: LoggedOutScreenState) => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const isDarkMode = t.name !== 'light'

  return (
    <View style={[a.w_full, a.gap_md]}>
      <Button
        testID="signInButton"
        onPress={() => {
          setScreenState(LoggedOutScreenState.S_Login)
        }}
        label={l`Sign in`}
        accessibilityHint={l`Opens flow to sign in to your existing Bluesky account`}
        size="large"
        color="primary"
        style={[a.w_full]}>
        <ButtonText>
          <Trans>Sign in</Trans>
        </ButtonText>
      </Button>
      <Button
        testID="createAccountButton"
        onPress={() => {
          setScreenState(LoggedOutScreenState.S_CreateAccount)
        }}
        label={l`Create new account`}
        accessibilityHint={l`Opens flow to create a new Bluesky account`}
        size="large"
        color={isDarkMode ? 'secondary_inverted' : 'secondary'}
        style={[a.w_full]}>
        <ButtonText>
          <Trans>Create account</Trans>
        </ButtonText>
      </Button>
    </View>
  )
}
