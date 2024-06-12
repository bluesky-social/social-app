import React from 'react'
import {ScrollView, View} from 'react-native'
import {LinearGradient} from 'expo-linear-gradient'
import {
  AppBskyActorDefs,
  AppBskyGraphDefs,
  AppBskyGraphStarterpack,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {CommonNavigatorParams, NavigationProp} from 'lib/routes/types'
import {useSetUsedStarterPack} from 'state/preferences/starter-pack'
import {useResolveDidQuery} from 'state/queries/resolve-uri'
import {useStarterPackQuery} from 'state/queries/useStarterPackQuery'
import {useSession} from 'state/session'
import {useSetMinimalShellMode} from 'state/shell'
import {useLoggedOutViewControls} from 'state/shell/logged-out'
import {FeedSourceCard} from 'view/com/feeds/FeedSourceCard'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {CenteredView} from 'view/com/util/Views'
import {Logo} from 'view/icons/Logo'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Divider} from '#/components/Divider'
import {ListMaybePlaceholder} from '#/components/Lists'
import {Text} from '#/components/Typography'

export function LandingScreen({
  route,
}: NativeStackScreenProps<CommonNavigatorParams, 'StarterPackLanding'>) {
  const {name, rkey} = route.params
  const navigation = useNavigation<NavigationProp>()
  const {currentAccount} = useSession()
  const setMinimalShellMode = useSetMinimalShellMode()

  const {
    data: did,
    isLoading: isLoadingDid,
    isError: isErrorDid,
  } = useResolveDidQuery(name)
  const {
    data: starterPack,
    isLoading: isLoadingStarterPack,
    isError: isErrorStarterPack,
  } = useStarterPackQuery({did, rkey})

  React.useEffect(() => {
    setMinimalShellMode(true)
    return () => {
      setMinimalShellMode(false)
    }
  }, [currentAccount, navigation, setMinimalShellMode])

  if (!did || !starterPack) {
    return (
      <ListMaybePlaceholder
        isLoading={isLoadingDid || isLoadingStarterPack}
        isError={isErrorDid || isErrorStarterPack}
      />
    )
  }

  return <LandingScreenInner starterPack={starterPack} />
}

function LandingScreenInner({
  starterPack,
}: {
  starterPack: AppBskyGraphDefs.StarterPackView
}) {
  const {record, creator, listItemsSample, feeds, joinedWeekCount} = starterPack
  const {_} = useLingui()
  const t = useTheme()
  const {requestSwitchToAccount} = useLoggedOutViewControls()
  const setUsedStarterPack = useSetUsedStarterPack()
  const {isTabletOrDesktop} = useWebMediaQueries()

  const gradient =
    t.name === 'light'
      ? [t.palette.primary_500, t.palette.primary_300]
      : [t.palette.primary_600, t.palette.primary_400]

  const sampleProfiles = listItemsSample?.map(item => item.subject)
  const userSets = {
    first: sampleProfiles?.slice(0, 4),
    second: sampleProfiles?.slice(4, 8),
  }

  if (!AppBskyGraphStarterpack.isRecord(record)) {
    return null
  }

  return (
    <CenteredView style={a.flex_1}>
      <ScrollView
        style={[a.flex_1]}
        contentContainerStyle={{paddingBottom: 100}}>
        <LinearGradient
          colors={gradient}
          style={[
            a.align_center,
            a.gap_sm,
            a.py_2xl,
            isTabletOrDesktop && {
              borderBottomLeftRadius: 10,
              borderBottomRightRadius: 10,
            },
          ]}>
          <View style={[a.flex_row, a.gap_md, a.pb_sm]}>
            <Logo width={76} fill="white" />
          </View>
          <View style={[a.align_center, a.gap_xs]}>
            <Text
              style={[
                a.font_bold,
                a.text_5xl,
                a.text_center,
                {color: 'white'},
              ]}>
              {record.name}
            </Text>
            <Text style={[a.font_bold, a.text_md, {color: 'white'}]}>
              Starter pack by {creator.displayName || `@${creator.handle}`}
            </Text>
          </View>
        </LinearGradient>
        <View style={[a.gap_2xl, a.mt_lg, a.mx_lg]}>
          <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
            {record.description}
          </Text>
          <Button
            label={_(msg`Join Bluesky now`)}
            onPress={() => {
              setUsedStarterPack({
                uri: starterPack.uri,
                cid: starterPack.cid,
              })
              requestSwitchToAccount({requestedAccount: 'new'})
            }}
            variant="solid"
            color="primary"
            size="large">
            <ButtonText style={[a.text_lg]}>
              <Trans>Join Bluesky now</Trans>
            </ButtonText>
          </Button>
          {joinedWeekCount && joinedWeekCount >= 25 ? (
            <Text
              style={[
                a.font_bold,
                a.text_md,
                a.text_center,
                t.atoms.text_contrast_medium,
              ]}>
              {joinedWeekCount} joined this week!
            </Text>
          ) : null}
          <Divider />
          <View style={[a.gap_3xl]}>
            {starterPack.feeds?.length ? (
              <View style={[a.gap_md]}>
                <Text style={[a.font_bold, a.text_lg]}>
                  Join Bluesky now to subscribe to these feeds
                </Text>

                <View
                  style={[
                    t.atoms.bg_contrast_25,
                    a.rounded_sm,
                    {pointerEvents: 'none'},
                  ]}>
                  {starterPack.feeds?.map((feed, index) => (
                    <FeedSourceCard
                      key={feed.uri}
                      feedUri={feed.uri}
                      hideTopBorder={index === 0}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {Boolean(sampleProfiles?.length) && (
              <View style={[a.gap_md]}>
                <Text style={[a.font_bold, a.text_lg]}>
                  {feeds?.length ? (
                    <Trans>Also follow these people and many others!</Trans>
                  ) : (
                    <Trans>
                      Get started by following these people and many others!
                    </Trans>
                  )}
                </Text>
                <View
                  style={[
                    t.atoms.bg_contrast_25,
                    a.rounded_sm,
                    a.px_xs,
                    a.py_md,
                    a.gap_xl,
                  ]}>
                  {userSets.first?.length ? (
                    <ProfilesSet profiles={userSets.first} />
                  ) : null}
                  {userSets.second?.length ? (
                    <ProfilesSet profiles={userSets.second} />
                  ) : null}
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </CenteredView>
  )
}

function User({displayName, avatar}: {displayName: string; avatar?: string}) {
  return (
    <View style={[a.flex_1, a.align_center, a.gap_sm]}>
      <UserAvatar size={64} avatar={avatar} />
      <Text style={[a.flex_1, a.text_sm, a.font_bold]} numberOfLines={1}>
        {displayName}
      </Text>
    </View>
  )
}

function ProfilesSet({
  profiles,
}: {
  profiles: AppBskyActorDefs.ProfileViewBasic[]
}) {
  return (
    <View style={[a.flex_row, a.gap_xs, a.align_center, a.justify_between]}>
      {profiles.map(profile => (
        <User
          key={profile.did}
          displayName={profile.displayName || `@${profile.handle}`}
          avatar={profile.avatar}
        />
      ))}
    </View>
  )
}
