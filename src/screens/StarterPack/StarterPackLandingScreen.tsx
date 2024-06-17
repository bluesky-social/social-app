import React from 'react'
import {Pressable, ScrollView, View} from 'react-native'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {AppBskyGraphDefs, AppBskyGraphStarterpack, AtUri} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isAndroidWeb} from 'lib/browser'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {isWeb} from 'platform/detection'
import {
  useCurrentStarterPack,
  useSetCurrentStarterPack,
} from 'state/preferences/starter-pack'
import {useResolveDidQuery} from 'state/queries/resolve-uri'
import {useStarterPackQuery} from 'state/queries/useStarterPackQuery'
import {LoggedOutScreenState} from 'view/com/auth/LoggedOut'
import {CenteredView} from 'view/com/util/Views'
import {Logo} from 'view/icons/Logo'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import * as FeedCard from '#/components/FeedCard'
import {LinearGradientBackground} from '#/components/LinearGradientBackground'
import {ListMaybePlaceholder} from '#/components/Lists'
import {Default as ProfileCardInner} from '#/components/ProfileCard'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

interface AppClipMessage {
  action: 'present' | 'store'
  keyToStoreAs?: string
  jsonToStore?: string
}

function postAppClipMessage(message: AppClipMessage) {
  // @ts-expect-error safari webview only
  window.webkit.messageHandlers.onMessage.postMessage(JSON.stringify(message))
}

function parseStarterPackHttpUri(uri: string): {name?: string; rkey?: string} {
  try {
    const parsed = new URL(uri)
    const [_, _path, name, rkey] = parsed.pathname.split('/')
    return {
      name,
      rkey,
    }
  } catch (e) {
    return {}
  }
}

function createGooglePlayLink(name: string, rkey: string) {
  return `https://play.google.com/store/apps/details?id=xyz.blueskyweb.app&referrer=utm_source%3Dbluesky%26utm_medium%3Dstarterpack%26utm_content%3Dstarterpack-${name}-${rkey}`
}

export function LandingScreen({
  setScreenState,
}: {
  setScreenState: (state: LoggedOutScreenState) => void
}) {
  const currentStarterPack = useCurrentStarterPack()
  const {name, rkey} =
    parseStarterPackHttpUri(currentStarterPack?.uri || '') ?? {}

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
  const currentStarterPack = useCurrentStarterPack()
  const setCurrentStarterPack = useSetCurrentStarterPack()
  const {isTabletOrDesktop} = useWebMediaQueries()
  const androidDialogControl = useDialogControl()

  const [appClipOverlayVisible, setAppClipOverlayVisible] =
    React.useState(false)

  const listItemsCount = starterPack.list?.listItemCount ?? 0

  const onContinue = () => {
    setCurrentStarterPack({
      uri: starterPack.uri,
    })
    setScreenState(LoggedOutScreenState.S_CreateAccount)
  }

  const onJoinPress = () => {
    if (currentStarterPack?.isClip) {
      setAppClipOverlayVisible(true)
      postAppClipMessage({
        action: 'present',
      })
    } else if (isAndroidWeb) {
      androidDialogControl.open()
    } else {
      onContinue()
    }
  }

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
            currentStarterPack?.isClip && {
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
            onPress={onJoinPress}
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
                  These great feeds will be available after signing up!
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
                        <Trans>
                          You'll also follow these people right away!
                        </Trans>
                      ) : (
                        <Trans>
                          You'll also follow these people and{' '}
                          {listItemsCount - 8} others!
                        </Trans>
                      )}
                    </>
                  ) : (
                    <>
                      {listItemsCount <= 8 ? (
                        <Trans>You'll follow these people right away!</Trans>
                      ) : (
                        <Trans>
                          You'll follow these people and {listItemsCount - 8}
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
        <Button
          label={_(msg`Signup without a starter pack`)}
          variant="ghost"
          color="secondary"
          size="medium"
          style={[a.mt_2xl]}
          onPress={() => {
            setCurrentStarterPack(undefined)
            setScreenState(LoggedOutScreenState.S_CreateAccount)
          }}>
          <ButtonText>
            <Trans>Signup without a starter pack</Trans>
          </ButtonText>
        </Button>
      </ScrollView>
      <AppClipOverlay
        visible={appClipOverlayVisible}
        setIsVisible={setAppClipOverlayVisible}
      />
      <Prompt.Outer control={androidDialogControl}>
        <Prompt.TitleText>
          <Trans>Download Bluesky</Trans>
        </Prompt.TitleText>
        <Prompt.DescriptionText>
          <Trans>
            The experience is better in the app. Download Bluesky now and we'll
            pick back up where you left off.
          </Trans>
        </Prompt.DescriptionText>
        <Prompt.Actions>
          <Prompt.Action
            cta="Download on Google Play"
            color="primary"
            onPress={() => {
              const rkey = new AtUri(starterPack.uri).rkey
              if (!rkey) return

              window.location.href = createGooglePlayLink(creator.handle, rkey)
            }}
          />
          <Prompt.Action
            cta="Continue on web"
            color="secondary"
            onPress={onContinue}
          />
        </Prompt.Actions>
      </Prompt.Outer>
      {isWeb && (
        <meta
          name="apple-itunes-app"
          content="app-id=xyz.blueskyweb.app, app-clip-bundle-id=xyz.blueskyweb.app.AppClip, app-clip-display=card"
        />
      )}
    </CenteredView>
  )
}

function AppClipOverlay({
  visible,
  setIsVisible,
}: {
  visible: boolean
  setIsVisible: (visible: boolean) => void
}) {
  if (!visible) return

  return (
    <AnimatedPressable
      accessibilityRole="button"
      style={[
        a.absolute,
        {
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          zIndex: 1,
        },
      ]}
      entering={FadeIn}
      exiting={FadeOut}
      onPress={() => setIsVisible(false)}>
      <View style={[a.flex_1, a.px_lg, {marginTop: 250}]}>
        {/* Webkit needs this to have a zindex of 2? */}
        <View style={[a.gap_md, {zIndex: 2}]}>
          <Text
            style={[a.font_bold, a.text_4xl, {lineHeight: 40, color: 'white'}]}>
            Download Bluesky to get started!
          </Text>
          <Text style={[a.text_lg, {color: 'white'}]}>
            We'll remember the starter pack you chose and use it when you create
            an account in the app.
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  )
}
