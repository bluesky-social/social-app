import React from 'react'
import {Pressable, View} from 'react-native'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {
  AppBskyGraphDefs,
  AppBskyGraphStarterpack,
  AtUri,
  ModerationOpts,
} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isAndroidWeb} from '#/lib/browser'
import {JOINED_THIS_WEEK} from '#/lib/constants'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {logEvent} from '#/lib/statsig/statsig'
import {createStarterPackGooglePlayUri} from '#/lib/strings/starter-pack'
import {isWeb} from '#/platform/detection'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useStarterPackQuery} from '#/state/queries/starter-packs'
import {
  useActiveStarterPack,
  useSetActiveStarterPack,
} from '#/state/shell/starter-pack'
import {LoggedOutScreenState} from '#/view/com/auth/LoggedOut'
import {formatCount} from '#/view/com/util/numeric/format'
import {Logo} from '#/view/icons/Logo'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import * as FeedCard from '#/components/FeedCard'
import {useRichText} from '#/components/hooks/useRichText'
import * as Layout from '#/components/Layout'
import {LinearGradientBackground} from '#/components/LinearGradientBackground'
import {ListMaybePlaceholder} from '#/components/Lists'
import {Default as ProfileCard} from '#/components/ProfileCard'
import * as Prompt from '#/components/Prompt'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'
import * as bsky from '#/types/bsky'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

interface AppClipMessage {
  action: 'present' | 'store'
  keyToStoreAs?: string
  jsonToStore?: string
}

export function postAppClipMessage(message: AppClipMessage) {
  // @ts-expect-error safari webview only
  window.webkit.messageHandlers.onMessage.postMessage(JSON.stringify(message))
}

export function LandingScreen({
  setScreenState,
}: {
  setScreenState: (state: LoggedOutScreenState) => void
}) {
  const moderationOpts = useModerationOpts()
  const activeStarterPack = useActiveStarterPack()

  const {
    data: starterPack,
    isError: isErrorStarterPack,
    isFetching,
  } = useStarterPackQuery({
    uri: activeStarterPack?.uri,
  })

  const isValid =
    starterPack &&
    starterPack.list &&
    AppBskyGraphDefs.validateStarterPackView(starterPack) &&
    AppBskyGraphStarterpack.validateRecord(starterPack.record)

  React.useEffect(() => {
    if (isErrorStarterPack || (starterPack && !isValid)) {
      setScreenState(LoggedOutScreenState.S_LoginOrCreateAccount)
    }
  }, [isErrorStarterPack, setScreenState, isValid, starterPack])

  if (isFetching || !starterPack || !isValid || !moderationOpts) {
    return <ListMaybePlaceholder isLoading={true} />
  }

  // Just for types, this cannot be hit
  if (
    !bsky.dangerousIsType<AppBskyGraphStarterpack.Record>(
      starterPack.record,
      AppBskyGraphStarterpack.isRecord,
    )
  ) {
    return null
  }

  return (
    <LandingScreenLoaded
      starterPack={starterPack}
      starterPackRecord={starterPack.record}
      setScreenState={setScreenState}
      moderationOpts={moderationOpts}
    />
  )
}

function LandingScreenLoaded({
  starterPack,
  starterPackRecord: record,
  setScreenState,
  // TODO apply this to profile card

  moderationOpts,
}: {
  starterPack: AppBskyGraphDefs.StarterPackView
  starterPackRecord: AppBskyGraphStarterpack.Record
  setScreenState: (state: LoggedOutScreenState) => void
  moderationOpts: ModerationOpts
}) {
  const {creator, listItemsSample, feeds} = starterPack
  const {_, i18n} = useLingui()
  const t = useTheme()
  const activeStarterPack = useActiveStarterPack()
  const setActiveStarterPack = useSetActiveStarterPack()
  const {isTabletOrDesktop} = useWebMediaQueries()
  const androidDialogControl = useDialogControl()
  const [descriptionRt] = useRichText(record.description || '')

  const [appClipOverlayVisible, setAppClipOverlayVisible] =
    React.useState(false)

  const listItemsCount = starterPack.list?.listItemCount ?? 0

  const onContinue = () => {
    setScreenState(LoggedOutScreenState.S_CreateAccount)
  }

  const onJoinPress = () => {
    if (activeStarterPack?.isClip) {
      setAppClipOverlayVisible(true)
      postAppClipMessage({
        action: 'present',
      })
    } else if (isAndroidWeb) {
      androidDialogControl.open()
    } else {
      onContinue()
    }
    logEvent('starterPack:ctaPress', {
      starterPack: starterPack.uri,
    })
  }

  const onJoinWithoutPress = () => {
    if (activeStarterPack?.isClip) {
      setAppClipOverlayVisible(true)
      postAppClipMessage({
        action: 'present',
      })
    } else {
      setActiveStarterPack(undefined)
      setScreenState(LoggedOutScreenState.S_CreateAccount)
    }
  }

  return (
    <View style={[a.flex_1]}>
      <Layout.Content ignoreTabletLayoutOffset>
        <LinearGradientBackground
          style={[
            a.align_center,
            a.gap_sm,
            a.px_lg,
            a.py_2xl,
            isTabletOrDesktop && [a.mt_2xl, a.rounded_md],
            activeStarterPack?.isClip && {
              paddingTop: 100,
            },
          ]}>
          <View style={[a.flex_row, a.gap_md, a.pb_sm]}>
            <Logo width={76} fill="white" />
          </View>
          <Text
            style={[
              a.font_bold,
              a.text_4xl,
              a.text_center,
              a.leading_tight,
              {color: 'white'},
            ]}>
            {record.name}
          </Text>
          <Text
            style={[a.text_center, a.font_bold, a.text_md, {color: 'white'}]}>
            Starter pack by {`@${creator.handle}`}
          </Text>
        </LinearGradientBackground>
        <View style={[a.gap_2xl, a.mx_lg, a.my_2xl]}>
          {record.description ? (
            <RichText value={descriptionRt} style={[a.text_md]} />
          ) : null}
          <View style={[a.gap_sm]}>
            <Button
              label={_(msg`Join Bluesky`)}
              onPress={onJoinPress}
              variant="solid"
              color="primary"
              size="large">
              <ButtonText style={[a.text_lg]}>
                <Trans>Join Bluesky</Trans>
              </ButtonText>
            </Button>
            <View style={[a.flex_row, a.align_center, a.gap_sm]}>
              <FontAwesomeIcon
                icon="arrow-trend-up"
                size={12}
                color={t.atoms.text_contrast_medium.color}
              />
              <Text
                style={[a.font_bold, a.text_sm, t.atoms.text_contrast_medium]}
                numberOfLines={1}>
                <Trans>
                  {formatCount(i18n, JOINED_THIS_WEEK)} joined this week
                </Trans>
              </Text>
            </View>
          </View>
          <View style={[a.gap_3xl]}>
            {Boolean(listItemsSample?.length) && (
              <View style={[a.gap_md]}>
                <Text style={[a.font_heavy, a.text_lg]}>
                  {listItemsCount <= 8 ? (
                    <Trans>You'll follow these people right away</Trans>
                  ) : (
                    <Trans>
                      You'll follow these people and {listItemsCount - 8} others
                    </Trans>
                  )}
                </Text>
                <View
                  style={
                    isTabletOrDesktop && [
                      a.border,
                      a.rounded_md,
                      t.atoms.border_contrast_low,
                    ]
                  }>
                  {starterPack.listItemsSample
                    ?.filter(p => !p.subject.associated?.labeler)
                    .slice(0, 8)
                    .map((item, i) => (
                      <View
                        key={item.subject.did}
                        style={[
                          a.py_lg,
                          a.px_md,
                          (!isTabletOrDesktop || i !== 0) && a.border_t,
                          t.atoms.border_contrast_low,
                          {pointerEvents: 'none'},
                        ]}>
                        <ProfileCard
                          profile={item.subject}
                          moderationOpts={moderationOpts}
                        />
                      </View>
                    ))}
                </View>
              </View>
            )}
            {feeds?.length ? (
              <View style={[a.gap_md]}>
                <Text style={[a.font_heavy, a.text_lg]}>
                  <Trans>You'll stay updated with these feeds</Trans>
                </Text>

                <View
                  style={[
                    {pointerEvents: 'none'},
                    isTabletOrDesktop && [
                      a.border,
                      a.rounded_md,
                      t.atoms.border_contrast_low,
                    ],
                  ]}>
                  {feeds?.map((feed, i) => (
                    <View
                      style={[
                        a.py_lg,
                        a.px_md,
                        (!isTabletOrDesktop || i !== 0) && a.border_t,
                        t.atoms.border_contrast_low,
                      ]}
                      key={feed.uri}>
                      <FeedCard.Default view={feed} />
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
          <Button
            label={_(msg`Create an account without using this starter pack`)}
            variant="solid"
            color="secondary"
            size="large"
            style={[a.py_lg]}
            onPress={onJoinWithoutPress}>
            <ButtonText>
              <Trans>Create an account without using this starter pack</Trans>
            </ButtonText>
          </Button>
        </View>
      </Layout.Content>
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

              const googlePlayUri = createStarterPackGooglePlayUri(
                creator.handle,
                rkey,
              )
              if (!googlePlayUri) return

              window.location.href = googlePlayUri
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
    </View>
  )
}

export function AppClipOverlay({
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
        a.inset_0,
        {
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
