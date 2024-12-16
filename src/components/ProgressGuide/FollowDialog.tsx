import {useRef, useState} from 'react'
import {useWindowDimensions, View} from 'react-native'
import {ScrollView} from 'react-native'
import Animated, {
  LayoutAnimationConfig,
  LinearTransition,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated'
import {AppBskyActorDefs, ModerationOpts} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isNative} from '#/platform/detection'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {
  useSuggestedFollowsByActorQuery,
  useSuggestedFollowsQuery,
} from '#/state/queries/suggested-follows'
import {useInterestsDisplayNames} from '#/screens/Onboarding/state'
import {
  atoms as a,
  native,
  tokens,
  useBreakpoints,
  useTheme,
  ViewStyleProp,
} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as SearchIcon} from '#/components/icons/MagnifyingGlass2'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as ArrowRotateIcon} from '../icons/ArrowRotateCounterClockwise'
import {PersonGroup_Stroke2_Corner2_Rounded as PersonGroupIcon} from '../icons/Person'
import {Loader} from '../Loader'

export function FollowDialog() {
  const {_} = useLingui()
  const control = Dialog.useDialogControl()
  const {gtMobile} = useBreakpoints()
  const {height: minHeight} = useWindowDimensions()

  return (
    <>
      <Button
        label={_(msg`Find people to follow`)}
        onPress={control.open}
        size={gtMobile ? 'small' : 'large'}
        color="primary"
        variant="solid">
        <ButtonIcon icon={PersonGroupIcon} />
        <ButtonText>
          <Trans>Find people to follow</Trans>
        </ButtonText>
      </Button>
      <Dialog.Outer control={control} nativeOptions={{minHeight}}>
        <Dialog.Handle />
        <DialogInner />
      </Dialog.Outer>
    </>
  )
}

function DialogInner() {
  const {_} = useLingui()

  const interestsDisplayNames = useInterestsDisplayNames()
  const {data: preferences} = usePreferencesQuery()
  const moderationOpts = useModerationOpts()
  const suggestions = useSuggestedFollowsQuery({limit: 6})
  const ref = useRef<ScrollView>(null)

  return (
    <Dialog.ScrollableInner
      ref={isNative ? ref : undefined}
      label={_(msg`Find people to follow`)}
      contentContainerStyle={[a.gap_md]}>
      <Text style={[a.font_heavy, a.text_2xl]}>
        <Trans>Find people to follow</Trans>
      </Text>
      <ScrollView
        horizontal
        contentContainerStyle={[a.gap_sm, a.px_xl]}
        style={{marginHorizontal: -tokens.space.xl}}
        showsHorizontalScrollIndicator={false}>
        <Button
          label={_(msg`For you`)}
          variant="solid"
          color="primary"
          size="small">
          <ButtonText>For you</ButtonText>
        </Button>
        {preferences?.interests &&
          preferences.interests.tags.map(interest => (
            <Button
              key={interest}
              label={interestsDisplayNames[interest]}
              variant="outline"
              color="secondary"
              size="small">
              <ButtonIcon icon={SearchIcon} />
              <ButtonText>{interestsDisplayNames[interest]}</ButtonText>
            </Button>
          ))}
      </ScrollView>
      {suggestions.data && moderationOpts ? (
        <View style={[a.pb_xl]}>
          {suggestions.data.pages.at(-1)?.actors.map((profile, i) => (
            <Animated.View
              key={profile.did}
              entering={native(ZoomIn.delay(i * 100))}
              exiting={native(ZoomOut.delay(i * 100))}
              layout={native(LinearTransition)}>
              <ReplacableProfileCard
                profile={profile}
                moderationOpts={moderationOpts}
              />
            </Animated.View>
          ))}
          <Animated.View
            style={[a.justify_center, a.flex_row]}
            layout={native(LinearTransition)}>
            <Button
              label={_(msg`Reshuffle`)}
              onPress={() =>
                suggestions.fetchNextPage().then(() => {
                  if (isNative) ref.current?.scrollTo({y: 0, animated: true})
                })
              }
              size="small"
              color="secondary"
              variant="solid">
              <ButtonIcon
                icon={suggestions.isFetchingNextPage ? Loader : ArrowRotateIcon}
              />
              <ButtonText>
                <Trans>Reshuffle</Trans>
              </ButtonText>
            </Button>
          </Animated.View>
        </View>
      ) : (
        <View
          style={[{height: 300}, a.w_full, a.justify_center, a.align_center]}>
          <Loader />
        </View>
      )}
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

function ReplacableProfileCard({
  profile,
  moderationOpts,
}: {
  profile: AppBskyActorDefs.ProfileView
  moderationOpts: ModerationOpts
}) {
  const followupSuggestion = useSuggestedFollowsByActorQuery({
    did: profile.did,
  })
  const [hasFollowed, setHasFollowed] = useState(false)
  const followupProfile = followupSuggestion.data?.suggestions?.[0]

  if (!followupSuggestion.isPending) {
    if (followupProfile) {
      console.log('! followup found for', profile.handle)
    } else {
      console.log('  no suggestions for', profile.handle)
    }
  }

  return (
    <LayoutAnimationConfig skipEntering skipExiting>
      {hasFollowed ? (
        followupProfile ? (
          <Animated.View entering={native(ZoomIn)} key="in">
            <ReplacableProfileCard
              profile={followupProfile}
              moderationOpts={moderationOpts}
            />
          </Animated.View>
        ) : (
          followupSuggestion.isPending && (
            <View
              style={[
                {height: 50},
                a.w_full,
                a.justify_center,
                a.align_center,
              ]}>
              <Loader />
            </View>
          )
        )
      ) : (
        <Animated.View exiting={native(ZoomOut)} key="out" style={[a.pb_md]}>
          <ReplacableProfileCardInner
            profile={profile}
            moderationOpts={moderationOpts}
            onFollow={() => setHasFollowed(true)}
          />
        </Animated.View>
      )}
    </LayoutAnimationConfig>
  )
}

function ReplacableProfileCardInner({
  profile,
  moderationOpts,
  onFollow,
}: {
  profile: AppBskyActorDefs.ProfileView
  moderationOpts: ModerationOpts
  onFollow: () => void
}) {
  const control = Dialog.useDialogContext()
  const t = useTheme()
  return (
    <ProfileCard.Link
      profile={profile}
      style={[a.flex_1]}
      onPress={() => control.close()}>
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
                logContext="FeedInterstitial"
                color="secondary_inverted"
                shape="round"
                onPress={onFollow}
              />
            </ProfileCard.Header>
            <ProfileCard.Description profile={profile} numberOfLines={2} />
          </ProfileCard.Outer>
        </CardOuter>
      )}
    </ProfileCard.Link>
  )
}

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
        style,
      ]}>
      {children}
    </View>
  )
}
