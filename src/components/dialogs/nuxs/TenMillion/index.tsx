import React from 'react'
import {View} from 'react-native'
import Animated, {FadeIn} from 'react-native-reanimated'
import ViewShot from 'react-native-view-shot'
import {Image} from 'expo-image'
import {requestMediaLibraryPermissionsAsync} from 'expo-image-picker'
import * as MediaLibrary from 'expo-media-library'
import {moderateProfile} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {networkRetry} from '#/lib/async/retry'
import {getCanvas} from '#/lib/canvas'
import {shareUrl} from '#/lib/sharing'
import {logEvent} from '#/lib/statsig/statsig'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {isIOS, isNative} from '#/platform/detection'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useProfileQuery} from '#/state/queries/profile'
import {useAgent, useSession} from '#/state/session'
import {useComposerControls} from '#/state/shell'
import {formatCount} from '#/view/com/util/numeric/format'
import * as Toast from '#/view/com/util/Toast'
import {Logomark} from '#/view/icons/Logomark'
import {
  atoms as a,
  ThemeProvider,
  tokens,
  useBreakpoints,
  useTheme,
} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useNuxDialogContext} from '#/components/dialogs/nuxs'
import {OnePercent} from '#/components/dialogs/nuxs/TenMillion/icons/OnePercent'
import {PointOnePercent} from '#/components/dialogs/nuxs/TenMillion/icons/PointOnePercent'
import {TenPercent} from '#/components/dialogs/nuxs/TenMillion/icons/TenPercent'
import {Divider} from '#/components/Divider'
import {GradientFill} from '#/components/GradientFill'
import {ArrowOutOfBox_Stroke2_Corner0_Rounded as Share} from '#/components/icons/ArrowOutOfBox'
import {Download_Stroke2_Corner0_Rounded as Download} from '#/components/icons/Download'
import {Image_Stroke2_Corner0_Rounded as ImageIcon} from '#/components/icons/Image'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

const DEBUG = false
const RATIO = 8 / 10
const WIDTH = 2000
const HEIGHT = WIDTH * RATIO

function getFontSize(count: number) {
  const length = count.toString().length
  if (length < 7) {
    return 80
  } else if (length < 5) {
    return 100
  } else {
    return 70
  }
}

function getPercentBadge(percent: number) {
  if (percent <= 0.001) {
    return PointOnePercent
  } else if (percent <= 0.01) {
    return OnePercent
  } else if (percent <= 0.1) {
    return TenPercent
  }
  return null
}

function Frame({children}: {children: React.ReactNode}) {
  return (
    <View
      style={[
        a.relative,
        a.w_full,
        a.overflow_hidden,
        {
          paddingTop: '80%',
        },
      ]}>
      {children}
    </View>
  )
}

export function TenMillion({
  showTimeout,
  onClose,
  onFallback,
}: {
  showTimeout?: number
  onClose?: () => void
  onFallback?: () => void
}) {
  const agent = useAgent()
  const nuxDialogs = useNuxDialogContext()
  const [userNumber, setUserNumber] = React.useState<number>(0)
  const fetching = React.useRef(false)

  React.useEffect(() => {
    async function fetchUserNumber() {
      const isBlueskyHosted = agent.sessionManager.pdsUrl
        ?.toString()
        .includes('bsky.network')

      if (isBlueskyHosted && agent.session?.accessJwt) {
        const res = await fetch(
          `https://bsky.social/xrpc/com.atproto.temp.getSignupNumber`,
          {
            headers: {
              Authorization: `Bearer ${agent.session.accessJwt}`,
            },
          },
        )

        if (!res.ok) {
          throw new Error('Network request failed')
        }

        const data = await res.json()

        if (data.number && data.number <= 10_000_000) {
          setUserNumber(data.number)
        } else {
          // should be rare
          nuxDialogs.dismissActiveNux()
          onFallback?.()
        }
      } else {
        nuxDialogs.dismissActiveNux()
        onFallback?.()
      }
    }

    if (!fetching.current) {
      fetching.current = true
      networkRetry(3, fetchUserNumber).catch(() => {
        nuxDialogs.dismissActiveNux()
        onFallback?.()
      })
    }
  }, [
    agent.sessionManager.pdsUrl,
    agent.session?.accessJwt,
    setUserNumber,
    nuxDialogs.dismissActiveNux,
    nuxDialogs,
    onFallback,
  ])

  return userNumber ? (
    <TenMillionInner
      userNumber={userNumber}
      showTimeout={showTimeout ?? 3e3}
      onClose={onClose}
    />
  ) : null
}

export function TenMillionInner({
  userNumber,
  showTimeout,
  onClose: onCloseOuter,
}: {
  userNumber: number
  showTimeout: number
  onClose?: () => void
}) {
  const t = useTheme()
  const lightTheme = useTheme('light')
  const {_, i18n} = useLingui()
  const control = Dialog.useDialogControl()
  const {gtMobile} = useBreakpoints()
  const {openComposer} = useComposerControls()
  const {currentAccount} = useSession()
  const {
    isLoading: isProfileLoading,
    data: profile,
    error: profileError,
  } = useProfileQuery({
    did: currentAccount!.did,
  })
  const moderationOpts = useModerationOpts()
  const nuxDialogs = useNuxDialogContext()
  const moderation = React.useMemo(() => {
    return profile && moderationOpts
      ? moderateProfile(profile, moderationOpts)
      : undefined
  }, [profile, moderationOpts])
  const [uri, setUri] = React.useState<string | null>(null)
  const percent = userNumber / 10_000_000
  const Badge = getPercentBadge(percent)
  const isLoadingData = isProfileLoading || !moderation || !profile
  const isLoadingImage = !uri

  const displayName = React.useMemo(() => {
    if (!profile || !moderation) return ''
    return sanitizeDisplayName(
      profile.displayName || sanitizeHandle(profile.handle),
      moderation.ui('displayName'),
    )
  }, [profile, moderation])
  const handle = React.useMemo(() => {
    if (!profile) return ''
    return sanitizeHandle(profile.handle, '@')
  }, [profile])
  const joinedDate = React.useMemo(() => {
    if (!profile || !profile.createdAt) return ''
    const date = i18n.date(profile.createdAt, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    return date
  }, [i18n, profile])

  const error: string = React.useMemo(() => {
    if (profileError) {
      return _(
        msg`Oh no! We weren't able to generate an image for you to share. Rest assured, we're glad you're here 🦋`,
      )
    }
    return ''
  }, [_, profileError])

  /*
   * Opening and closing
   */
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      control.open()
    }, showTimeout)
    return () => {
      clearTimeout(timeout)
    }
  }, [control, showTimeout])
  const onClose = React.useCallback(() => {
    nuxDialogs.dismissActiveNux()
    onCloseOuter?.()
  }, [nuxDialogs, onCloseOuter])

  /*
   * Actions
   */
  const sharePost = React.useCallback(() => {
    if (uri) {
      control.close(() => {
        setTimeout(() => {
          logEvent('tmd:post', {})
          openComposer({
            text: _(
              msg`Bluesky now has over 10 million users, and I was #${i18n.number(
                userNumber,
              )}!`,
            ),
            imageUris: [
              {
                uri,
                width: WIDTH,
                height: HEIGHT,
                altText: _(
                  msg`A virtual certificate with text "Celebrating 10M users on Bluesky, #${i18n.number(
                    userNumber,
                  )}, ${displayName} ${handle}, joined on ${joinedDate}"`,
                ),
              },
            ],
          })
        }, 1e3)
      })
    }
  }, [
    _,
    i18n,
    control,
    openComposer,
    uri,
    userNumber,
    displayName,
    handle,
    joinedDate,
  ])
  const onNativeShare = React.useCallback(() => {
    if (uri) {
      control.close(() => {
        logEvent('tmd:share', {})
        shareUrl(uri)
      })
    }
  }, [uri, control])
  const onNativeDownload = React.useCallback(async () => {
    if (uri) {
      const res = await requestMediaLibraryPermissionsAsync()

      if (!res) {
        Toast.show(
          _(
            msg`You must grant access to your photo library to save the image.`,
          ),
          'xmark',
        )
        return
      }

      try {
        await MediaLibrary.createAssetAsync(uri)
        logEvent('tmd:download', {})
        Toast.show(_(msg`Image saved to your camera roll!`))
      } catch (e: unknown) {
        console.log(e)
        Toast.show(_(msg`An error occurred while saving the image!`), 'xmark')
        return
      }
    }
  }, [_, uri])
  const onWebDownload = React.useCallback(async () => {
    if (uri) {
      const canvas = await getCanvas(uri)
      const imgHref = canvas
        .toDataURL('image/png')
        .replace('image/png', 'image/octet-stream')
      const link = document.createElement('a')
      link.setAttribute('download', `Bluesky 10M Users.png`)
      link.setAttribute('href', imgHref)
      link.click()
      logEvent('tmd:download', {})
    }
  }, [uri])

  /*
   * Canvas stuff
   */
  const imageRef = React.useRef<ViewShot>(null)
  const captureInProgress = React.useRef(false)
  const onCanvasReady = React.useCallback(async () => {
    if (
      imageRef.current &&
      imageRef.current.capture &&
      !captureInProgress.current
    ) {
      captureInProgress.current = true
      const uri = await imageRef.current.capture()
      setUri(uri)
    }
  }, [setUri])
  const canvas = isLoadingData ? null : (
    <View
      style={[
        a.absolute,
        a.overflow_hidden,
        DEBUG
          ? {
              width: 600,
              height: 600 * RATIO,
            }
          : {
              width: 1,
              height: 1,
            },
      ]}>
      <View style={{width: 600}}>
        <ThemeProvider theme="light">
          <Frame>
            <ViewShot
              ref={imageRef}
              options={{width: WIDTH, height: HEIGHT}}
              style={[a.absolute, a.inset_0]}>
              <View
                onLayout={onCanvasReady}
                style={[
                  a.absolute,
                  a.inset_0,
                  a.align_center,
                  a.justify_center,
                  {
                    top: -1,
                    bottom: -1,
                    left: -1,
                    right: -1,
                    paddingVertical: 48,
                    paddingHorizontal: 48,
                  },
                ]}>
                <GradientFill gradient={tokens.gradients.bonfire} />

                <View
                  style={[
                    a.flex_1,
                    a.w_full,
                    a.align_center,
                    a.justify_center,
                    a.rounded_md,
                    {
                      backgroundColor: 'white',
                      shadowRadius: 32,
                      shadowOpacity: 0.1,
                      elevation: 24,
                      shadowColor: tokens.gradients.bonfire.values[0][1],
                    },
                  ]}>
                  <View
                    style={[
                      a.absolute,
                      a.px_xl,
                      a.py_xl,
                      {
                        top: 0,
                        left: 0,
                      },
                    ]}>
                    <Logomark fill={t.palette.primary_500} width={36} />
                  </View>

                  {/* Centered content */}
                  <View
                    style={[
                      {
                        paddingBottom: isNative ? 0 : 24,
                      },
                    ]}>
                    <Text
                      allowFontScaling={false}
                      style={[
                        a.text_md,
                        a.font_bold,
                        a.text_center,
                        a.pb_sm,
                        lightTheme.atoms.text_contrast_medium,
                      ]}>
                      <Trans>
                        Celebrating {formatCount(i18n, 10000000)} users
                      </Trans>{' '}
                      🎉
                    </Text>
                    <View style={[a.flex_row, a.align_start]}>
                      <Text
                        allowFontScaling={false}
                        style={[
                          a.absolute,
                          a.font_heavy,
                          {
                            color: t.palette.primary_500,
                            fontSize: 32,
                            width: 32,
                            top: isNative ? -10 : 0,
                            left: 0,
                            transform: [
                              {
                                translateX: -16,
                              },
                            ],
                          },
                        ]}>
                        #
                      </Text>
                      <Text
                        allowFontScaling={false}
                        style={[
                          a.relative,
                          a.text_center,
                          a.font_heavy,
                          {
                            fontStyle: 'italic',
                            fontSize: getFontSize(userNumber),
                            lineHeight: getFontSize(userNumber),
                            letterSpacing: -2,
                          },
                        ]}>
                        {i18n.number(userNumber)}
                      </Text>
                    </View>

                    {Badge && (
                      <View
                        style={[
                          a.absolute,
                          {
                            width: 64,
                            height: 64,
                            top: isNative ? 75 : 85,
                            right: '5%',
                            transform: [
                              {
                                rotate: '8deg',
                              },
                            ],
                          },
                        ]}>
                        <Badge fill={t.palette.primary_500} />
                      </View>
                    )}
                  </View>
                  {/* End centered content */}

                  <View
                    style={[
                      a.absolute,
                      a.px_xl,
                      a.py_xl,
                      {
                        bottom: 0,
                        left: 0,
                        right: 0,
                      },
                    ]}>
                    <View style={[a.flex_row, a.align_center, a.gap_sm]}>
                      {/*
                      <UserAvatar
                        size={36}
                        avatar={profile.avatar}
                        moderation={moderation.ui('avatar')}
                        onLoad={onCanvasReady}
                      />
                        */}
                      <View style={[a.gap_2xs, a.flex_1]}>
                        <Text
                          allowFontScaling={false}
                          style={[
                            a.flex_1,
                            a.text_sm,
                            a.font_bold,
                            a.leading_tight,
                            {maxWidth: '60%'},
                          ]}>
                          {displayName}
                        </Text>
                        <View
                          style={[a.flex_row, a.justify_between, a.gap_4xl]}>
                          <Text
                            allowFontScaling={false}
                            numberOfLines={1}
                            style={[
                              a.flex_1,
                              a.text_sm,
                              a.font_bold,
                              a.leading_snug,
                              lightTheme.atoms.text_contrast_medium,
                            ]}>
                            {handle}
                          </Text>

                          {profile.createdAt && (
                            <Text
                              allowFontScaling={false}
                              numberOfLines={1}
                              ellipsizeMode="head"
                              style={[
                                a.flex_1,
                                a.text_sm,
                                a.font_bold,
                                a.leading_snug,
                                a.text_right,
                                lightTheme.atoms.text_contrast_low,
                              ]}>
                              <Trans>Joined on {joinedDate}</Trans>
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </ViewShot>
          </Frame>
        </ThemeProvider>
      </View>
    </View>
  )

  return (
    <Dialog.Outer control={control} onClose={onClose}>
      <Dialog.ScrollableInner
        label={_(msg`Ten Million`)}
        style={[
          {
            padding: 0,
            paddingTop: 0,
          },
        ]}>
        <View
          style={[
            a.rounded_md,
            a.overflow_hidden,
            isNative && {
              borderTopLeftRadius: 40,
              borderTopRightRadius: 40,
            },
          ]}>
          <Frame>
            <View
              style={[a.absolute, a.inset_0, a.align_center, a.justify_center]}>
              <GradientFill gradient={tokens.gradients.bonfire} />
              {error ? (
                <View>
                  <Text
                    style={[
                      a.text_md,
                      a.leading_snug,
                      a.text_center,
                      a.pb_md,
                      {
                        maxWidth: 300,
                      },
                    ]}>
                    (╯°□°)╯︵ ┻━┻
                  </Text>
                  <Text
                    style={[
                      a.text_xl,
                      a.font_bold,
                      a.leading_snug,
                      a.text_center,
                      {
                        maxWidth: 300,
                      },
                    ]}>
                    {error}
                  </Text>
                </View>
              ) : isLoadingData || isLoadingImage ? (
                <Loader size="xl" fill="white" />
              ) : (
                <Animated.View
                  entering={FadeIn.duration(150)}
                  style={[a.w_full, a.h_full]}>
                  <Image
                    accessibilityIgnoresInvertColors
                    source={{uri}}
                    style={[a.w_full, a.h_full]}
                  />
                </Animated.View>
              )}
            </View>
          </Frame>

          {canvas}

          <View style={[gtMobile ? a.p_2xl : a.p_xl]}>
            <Text
              allowFontScaling={false}
              style={[a.text_5xl, a.leading_tight, a.pb_lg, a.font_heavy]}>
              <Trans>Thanks for being one of our first 10 million users.</Trans>
            </Text>

            <Text style={[a.leading_snug, a.text_lg, a.pb_xl]}>
              <Trans>
                Together, we're rebuilding the social internet. We're glad
                you're here.
              </Trans>
            </Text>

            <Divider />

            <View
              style={[
                a.flex_row,
                a.align_center,
                a.justify_end,
                a.gap_md,
                a.pt_xl,
              ]}>
              {gtMobile && (
                <Text
                  style={[a.text_md, a.italic, t.atoms.text_contrast_medium]}>
                  <Trans>Brag a little!</Trans>
                </Text>
              )}

              <Button
                disabled={isLoadingImage}
                label={
                  isNative && isIOS
                    ? _(msg`Share image externally`)
                    : _(msg`Download image`)
                }
                size="large"
                variant="solid"
                color="secondary"
                shape="square"
                onPress={
                  isNative
                    ? isIOS
                      ? onNativeShare
                      : onNativeDownload
                    : onWebDownload
                }>
                <ButtonIcon icon={isNative && isIOS ? Share : Download} />
              </Button>
              <Button
                disabled={isLoadingImage}
                label={_(msg`Share image in post`)}
                size="large"
                variant="solid"
                color="primary"
                onPress={sharePost}>
                <ButtonText>{_(msg`Share`)}</ButtonText>
                <ButtonIcon position="right" icon={ImageIcon} />
              </Button>
            </View>
          </View>
        </View>

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
