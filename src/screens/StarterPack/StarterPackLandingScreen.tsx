import React from 'react'
import {ScrollView, View} from 'react-native'
import {AppBskyGraphDefs, AppBskyGraphStarterpack} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {
  useSetUsedStarterPack,
  useUsedStarterPack,
} from 'state/preferences/starter-pack'
import {useResolveDidQuery} from 'state/queries/resolve-uri'
import {useStarterPackQuery} from 'state/queries/useStarterPackQuery'
import {LoggedOutScreenState} from 'view/com/auth/LoggedOut'
import {CenteredView} from 'view/com/util/Views'
import {Logo} from 'view/icons/Logo'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Divider} from '#/components/Divider'
import * as FeedCard from '#/components/FeedCard'
import {LinearGradientBackground} from '#/components/LinearGradientBackground'
import {ListMaybePlaceholder} from '#/components/Lists'
import {Default as ProfileCardInner} from '#/components/ProfileCard'
import {Text} from '#/components/Typography'

function parseStarterPackHttpUri(uri: string): {name?: string; rkey?: string} {
  const parsed = new URL(uri)
  const [_, _path, name, rkey] = parsed.pathname.split('/')
  return {
    name,
    rkey,
  }
}

export function LandingScreen({
  setScreenState,
}: {
  setScreenState: (state: LoggedOutScreenState) => void
}) {
  const usedStarterPack = useUsedStarterPack()
  const {name, rkey} = parseStarterPackHttpUri(usedStarterPack?.uri || '')

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

  const isValid =
    starterPack &&
    AppBskyGraphDefs.validateStarterPackView(starterPack) &&
    AppBskyGraphStarterpack.validateRecord(starterPack.record)

  React.useEffect(() => {
    if (isErrorDid || isErrorStarterPack || (starterPack && !isValid)) {
      setScreenState(LoggedOutScreenState.S_LoginOrCreateAccount)
    }
  }, [isErrorDid, isErrorStarterPack, setScreenState, isValid, starterPack])

  if (!did || !starterPack || !isValid) {
    return (
      <ListMaybePlaceholder
        isLoading={isLoadingDid || isLoadingStarterPack || !isValid}
      />
    )
  }

  return (
    <LandingScreenInner
      starterPack={starterPack}
      setScreenState={setScreenState}
    />
  )
}

function LandingScreenInner({
  starterPack,
  setScreenState,
}: {
  starterPack: AppBskyGraphDefs.StarterPackView
  setScreenState: (state: LoggedOutScreenState) => void
}) {
  const {record, creator, listItemsSample, feeds, joinedWeekCount} = starterPack
  const {_} = useLingui()
  const t = useTheme()
  const setUsedStarterPack = useSetUsedStarterPack()
  const usedStarterPack = useUsedStarterPack()
  const {isTabletOrDesktop} = useWebMediaQueries()

  const listItemsCount = starterPack.list?.listItemCount ?? 0

  if (!AppBskyGraphStarterpack.isRecord(record)) {
    return null
  }

  return (
    <CenteredView style={a.flex_1}>
      <ScrollView
        style={[a.flex_1]}
        contentContainerStyle={{paddingBottom: 100}}>
        <LinearGradientBackground
          style={[
            a.align_center,
            a.gap_sm,
            a.py_2xl,
            isTabletOrDesktop && {
              borderBottomLeftRadius: 10,
              borderBottomRightRadius: 10,
            },
            usedStarterPack?.isClip && {
              paddingTop: 100,
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
        </LinearGradientBackground>
        <View style={[a.gap_2xl, a.mt_lg, a.mx_lg]}>
          {record.description ? (
            <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
              {record.description}
            </Text>
          ) : null}
          <Button
            label={_(msg`Join the conversation now!`)}
            onPress={() => {
              setUsedStarterPack({
                uri: starterPack.uri,
                cid: starterPack.cid,
              })
              setScreenState(LoggedOutScreenState.S_CreateAccount)
            }}
            variant="solid"
            color="primary"
            size="large">
            <ButtonText style={[a.text_lg]}>
              <Trans>Join the conversation now!</Trans>
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
                  Join Bluesky and subscribe to these feeds
                </Text>

                <View
                  style={[
                    t.atoms.bg_contrast_25,
                    a.rounded_sm,
                    {pointerEvents: 'none'},
                  ]}>
                  {starterPack.feeds?.map((feed, index) => (
                    <View
                      style={[
                        a.p_lg,
                        index !== 0 && a.border_t,
                        t.atoms.border_contrast_low,
                      ]}
                      key={feed.uri}>
                      <FeedCard.Default feed={feed} />
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {Boolean(listItemsSample?.length) && (
              <View style={[a.gap_md]}>
                <Text style={[a.font_bold, a.text_lg]}>
                  {feeds?.length ? (
                    <>
                      {listItemsCount <= 8 ? (
                        <Trans>Also follow these people right away!</Trans>
                      ) : (
                        <Trans>
                          Also follow these people and {listItemsCount - 8}{' '}
                          others!
                        </Trans>
                      )}
                    </>
                  ) : (
                    <>
                      {listItemsCount <= 8 ? (
                        <Trans>
                          Get started by following these people right away!
                        </Trans>
                      ) : (
                        <Trans>
                          Get started by following these people and{' '}
                          {listItemsCount - 8}
                          others!
                        </Trans>
                      )}
                    </>
                  )}
                </Text>
                <View style={[t.atoms.bg_contrast_25, a.rounded_sm]}>
                  {starterPack.listItemsSample
                    ?.slice(0, 8)
                    .map((item, index) => (
                      <View
                        key={item.subject.did}
                        style={[
                          a.p_lg,
                          index !== 0 && a.border_t,
                          t.atoms.border_contrast_low,
                        ]}>
                        <ProfileCardInner profile={item.subject} />
                      </View>
                    ))}
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </CenteredView>
  )
}
