import React from 'react'
import {ScrollView, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logEvent} from '#/lib/statsig/statsig'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useSuggestedFollowsByActorQuery} from '#/state/queries/suggested-follows'
import {isWeb} from 'platform/detection'
import {atoms as a, useTheme, ViewStyleProp} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'

const OUTER_PADDING = a.p_md.padding
const INNER_PADDING = a.p_lg.padding
const TOTAL_HEIGHT = 232
const MOBILE_CARD_WIDTH = 300

function CardOuter({
  children,
  style,
}: {children: React.ReactNode | React.ReactNode[]} & ViewStyleProp) {
  const t = useTheme()
  return (
    <View
      style={[
        a.w_full,
        a.p_lg,
        a.rounded_md,
        a.border,
        t.atoms.bg,
        t.atoms.border_contrast_low,
        {
          width: MOBILE_CARD_WIDTH,
        },
        style,
      ]}>
      {children}
    </View>
  )
}

export function SuggestedFollowPlaceholder() {
  const t = useTheme()
  return (
    <CardOuter style={[a.gap_sm, t.atoms.border_contrast_low]}>
      <ProfileCard.Header>
        <ProfileCard.AvatarPlaceholder />
        <ProfileCard.NameAndHandlePlaceholder />
      </ProfileCard.Header>

      <ProfileCard.DescriptionPlaceholder />
    </CardOuter>
  )
}

export function ProfileHeaderSuggestedFollows({
  actorDid,
  requestDismiss,
}: {
  actorDid: string
  requestDismiss: () => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {isLoading: isSuggestionsLoading, data} =
    useSuggestedFollowsByActorQuery({
      did: actorDid,
    })
  const moderationOpts = useModerationOpts()
  const isLoading = isSuggestionsLoading || !moderationOpts

  return (
    <View
      style={{paddingVertical: OUTER_PADDING, height: TOTAL_HEIGHT}}
      pointerEvents="box-none">
      <View
        pointerEvents="box-none"
        style={[
          t.atoms.bg_contrast_25,
          {
            height: '100%',
            paddingTop: INNER_PADDING / 2,
          },
        ]}>
        <View
          pointerEvents="box-none"
          style={[
            a.flex_row,
            a.justify_between,
            a.align_center,
            a.pt_xs,
            {
              paddingBottom: INNER_PADDING / 2,
              paddingLeft: INNER_PADDING,
              paddingRight: INNER_PADDING / 2,
            },
          ]}>
          <Text style={[a.text_md, a.font_bold, t.atoms.text_contrast_medium]}>
            <Trans>Similar accounts</Trans>
          </Text>

          <Button
            onPress={requestDismiss}
            hitSlop={10}
            label={_(msg`Dismiss`)}
            size="xsmall"
            variant="ghost"
            color="secondary"
            shape="round">
            <ButtonIcon icon={X} size="sm" />
          </Button>
        </View>

        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={isWeb}
          persistentScrollbar={true}
          scrollIndicatorInsets={{bottom: 0}}
          snapToInterval={MOBILE_CARD_WIDTH + a.gap_sm.gap}
          decelerationRate="fast">
          <View
            style={[
              a.flex_row,
              a.gap_sm,
              {
                paddingHorizontal: INNER_PADDING,
                paddingBottom: INNER_PADDING,
              },
            ]}>
            {isLoading ? (
              <>
                <SuggestedFollowPlaceholder />
                <SuggestedFollowPlaceholder />
                <SuggestedFollowPlaceholder />
                <SuggestedFollowPlaceholder />
                <SuggestedFollowPlaceholder />
              </>
            ) : data ? (
              data.suggestions
                .filter(s => (s.associated?.labeler ? false : true))
                .map(profile => (
                  <ProfileCard.Link
                    key={profile.did}
                    profile={profile}
                    onPress={() => {
                      logEvent('profile:header:suggestedFollowsCard:press', {})
                    }}
                    style={[a.flex_1]}>
                    {({hovered, pressed}) => (
                      <CardOuter
                        style={[
                          a.flex_1,
                          (hovered || pressed) && t.atoms.border_contrast_high,
                        ]}>
                        <ProfileCard.Outer>
                          <ProfileCard.Header>
                            <ProfileCard.Avatar
                              profile={profile}
                              moderationOpts={moderationOpts}
                            />
                            <ProfileCard.NameAndHandle
                              profile={profile}
                              moderationOpts={moderationOpts}
                            />
                            <ProfileCard.FollowButton
                              profile={profile}
                              moderationOpts={moderationOpts}
                              logContext="ProfileHeaderSuggestedFollows"
                              color="secondary_inverted"
                              shape="round"
                            />
                          </ProfileCard.Header>
                          <ProfileCard.Description profile={profile} />
                        </ProfileCard.Outer>
                      </CardOuter>
                    )}
                  </ProfileCard.Link>
                ))
            ) : (
              <View />
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  )
}
