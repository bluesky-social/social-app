import {ScrollView, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useSuggestedFollowsByActorQuery} from '#/state/queries/suggested-follows'
import {BlockDrawerGesture} from '#/view/shell/BlockDrawerGesture'
import {atoms as a, tokens, useTheme, type ViewStyleProp} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as ProfileCard from '#/components/ProfileCard'
import * as Skellie from '#/components/Skeleton'
import {Text} from '#/components/Typography'

const INNER_PADDING = tokens.space.lg
const CARD_HEIGHT = 200
const MOBILE_CARD_WIDTH = 150

function CardOuter({
  children,
  style,
}: {children: React.ReactNode | React.ReactNode[]} & ViewStyleProp) {
  const t = useTheme()
  return (
    <View
      style={[
        a.p_md,
        a.align_center,
        a.justify_between,
        a.rounded_lg,
        a.curve_continuous,
        a.border,
        t.atoms.bg,
        t.atoms.border_contrast_low,
        {height: CARD_HEIGHT, width: MOBILE_CARD_WIDTH},
        style,
      ]}>
      {children}
    </View>
  )
}

export function SuggestedFollowPlaceholder() {
  return (
    <CardOuter>
      <Skellie.Circle size={64} />
      <View
        style={[
          a.w_full,
          a.flex_col,
          a.align_center,
          a.flex_1,
          a.pt_md,
          a.pb_sm,
        ]}>
        <Skellie.Text style={[a.text_sm, {width: '60%'}]} />
        <Skellie.Text style={[a.text_sm, {width: '90%'}]} />
        <Skellie.Text style={[a.text_sm, {width: '80%'}]} />
      </View>
      <Skellie.Pill size={33} style={[a.rounded_sm, a.w_full, a.flex_grow_0]} />
    </CardOuter>
  )
}

export function ProfileHeaderSuggestedFollows({actorDid}: {actorDid: string}) {
  const t = useTheme()
  const {_} = useLingui()
  const {isPending: isSuggestionsPending, data} =
    useSuggestedFollowsByActorQuery({did: actorDid})
  const moderationOpts = useModerationOpts()
  const isPending = isSuggestionsPending || !moderationOpts

  const followAll = () => {}

  return (
    <>
      <View
        style={[
          a.flex_row,
          a.justify_between,
          a.align_center,
          a.pb_xs,
          {
            paddingLeft: INNER_PADDING,
            paddingRight: INNER_PADDING / 2,
          },
        ]}>
        <Text style={[a.text_sm, a.font_bold]}>
          <Trans>Suggested for you</Trans>
        </Text>

        <Button
          onPress={followAll}
          hitSlop={10}
          label={_(msg`Follow all`)}
          size="small"
          variant="ghost"
          color="primary">
          <ButtonText>
            <Trans>Follow all</Trans>
          </ButtonText>
        </Button>
      </View>
      <View style={[{height: CARD_HEIGHT}]}>
        <BlockDrawerGesture>
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={isWeb}
            persistentScrollbar={true}
            scrollIndicatorInsets={{bottom: 0}}
            decelerationRate="fast"
            contentContainerStyle={[
              a.flex_row,
              a.gap_sm,
              {
                paddingHorizontal: INNER_PADDING,
              },
            ]}>
            {isPending ? (
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
                      logger.metric(
                        'profile:header:suggestedFollowsCard:press',
                        {},
                      )
                    }}
                    style={[a.flex_1]}>
                    {({hovered, pressed}) => (
                      <CardOuter
                        style={[
                          a.flex_1,
                          (hovered || pressed) && t.atoms.border_contrast_high,
                        ]}>
                        <ProfileCard.Avatar
                          size={64}
                          profile={profile}
                          moderationOpts={moderationOpts}
                        />
                        <View style={[a.flex_grow_0, a.pt_sm]}>
                          <ProfileCard.Name
                            profile={profile}
                            moderationOpts={moderationOpts}
                          />
                        </View>
                        <View
                          style={[
                            a.flex_grow_0,
                            {minHeight: 38},
                            a.justify_start,
                          ]}>
                          <ProfileCard.Description
                            profile={profile}
                            numberOfLines={2}
                            style={[a.text_center]}
                          />
                        </View>
                        <View style={[a.pt_md, a.flex_grow, a.w_full]}>
                          <ProfileCard.FollowButton
                            profile={profile}
                            moderationOpts={moderationOpts}
                            logContext="ProfileHeaderSuggestedFollows"
                            color="primary"
                            withIcon={false}
                          />
                        </View>
                      </CardOuter>
                    )}
                  </ProfileCard.Link>
                ))
            ) : null}
          </ScrollView>
        </BlockDrawerGesture>
      </View>
    </>
  )
}
