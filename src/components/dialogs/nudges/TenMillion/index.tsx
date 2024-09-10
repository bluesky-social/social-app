import React from 'react'
import {View} from 'react-native'
import ViewShot from 'react-native-view-shot'
import {Image} from 'expo-image'
import {moderateProfile} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {getCanvas} from '#/lib/canvas'
import {shareUrl} from '#/lib/sharing'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {isNative} from '#/platform/detection'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {useComposerControls} from 'state/shell'
import {formatCount} from '#/view/com/util/numeric/format'
// import {UserAvatar} from '#/view/com/util/UserAvatar'
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
import {useContext} from '#/components/dialogs/nudges'
import {OnePercent} from '#/components/dialogs/nudges/TenMillion/icons/OnePercent'
import {PointOnePercent} from '#/components/dialogs/nudges/TenMillion/icons/PointOnePercent'
import {TenPercent} from '#/components/dialogs/nudges/TenMillion/icons/TenPercent'
import {Divider} from '#/components/Divider'
import {GradientFill} from '#/components/GradientFill'
import {ArrowOutOfBox_Stroke2_Corner0_Rounded as Share} from '#/components/icons/ArrowOutOfBox'
import {Download_Stroke2_Corner0_Rounded as Download} from '#/components/icons/Download'
import {Image_Stroke2_Corner0_Rounded as ImageIcon} from '#/components/icons/Image'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
// import {TwentyFivePercent} from '#/components/dialogs/nudges/TenMillion/icons/TwentyFivePercent'

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
  // else if (percent <= 0.25) {
  //   return TwentyFivePercent
  // }
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

export function TenMillion() {
  const t = useTheme()
  const lightTheme = useTheme('light')
  const {_, i18n} = useLingui()
  const {controls} = useContext()
  const {gtMobile} = useBreakpoints()
  const {openComposer} = useComposerControls()
  const {currentAccount} = useSession()
  const {isLoading: isProfileLoading, data: profile} = useProfileQuery({
    did: currentAccount!.did,
  }) // TODO PWI
  const moderationOpts = useModerationOpts()
  const moderation = React.useMemo(() => {
    return profile && moderationOpts
      ? moderateProfile(profile, moderationOpts)
      : undefined
  }, [profile, moderationOpts])
  const [uri, setUri] = React.useState<string | null>(null)

  const isLoadingData = isProfileLoading || !moderation || !profile
  const isLoadingImage = !uri

  const userNumber = 56_738 // TODO
  const percent = userNumber / 10_000_000
  const Badge = getPercentBadge(percent)

  const sharePost = () => {
    if (uri) {
      controls.tenMillion.close(() => {
        setTimeout(() => {
          openComposer({
            text: '10 milly, babyyy',
            imageUris: [
              {
                uri,
                width: WIDTH,
                height: HEIGHT,
              },
            ],
          })
        }, 1e3)
      })
    }
  }

  const onNativeShare = () => {
    if (uri) {
      controls.tenMillion.close(() => {
        shareUrl(uri)
      })
    }
  }

  const download = async () => {
    if (uri) {
      const canvas = await getCanvas(uri)
      const imgHref = canvas
        .toDataURL('image/png')
        .replace('image/png', 'image/octet-stream')
      const link = document.createElement('a')
      link.setAttribute('download', `Bluesky 10M Users.png`)
      link.setAttribute('href', imgHref)
      link.click()
    }
  }

  const imageRef = React.useRef<ViewShot>(null)
  // const captureInProgress = React.useRef(false)
  // const [cavasRelayout, setCanvasRelayout] = React.useState('key')
  // const onCanvasReady = async () => {
  //   if (
  //     imageRef.current &&
  //     imageRef.current.capture &&
  //     !captureInProgress.current
  //   ) {
  //     captureInProgress.current = true
  //     setCanvasRelayout('updated')
  //   }
  // }
  const onCanvasLayout = async () => {
    if (
      imageRef.current &&
      imageRef.current.capture // &&
      // cavasRelayout === 'updated'
    ) {
      const uri = await imageRef.current.capture()
      setUri(uri)
    }
  }

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
                // key={cavasRelayout}
                onLayout={onCanvasLayout}
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
                        style={[
                          a.absolute,
                          {
                            color: t.palette.primary_500,
                            fontSize: 32,
                            fontWeight: '900',
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
                        style={[
                          a.relative,
                          a.text_center,
                          {
                            fontStyle: 'italic',
                            fontSize: getFontSize(userNumber),
                            lineHeight: getFontSize(userNumber),
                            fontWeight: '900',
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
                        <Text style={[a.text_sm, a.font_bold, a.leading_tight]}>
                          {sanitizeDisplayName(
                            profile.displayName ||
                              sanitizeHandle(profile.handle),
                            moderation.ui('displayName'),
                          )}
                        </Text>
                        <View style={[a.flex_row, a.justify_between]}>
                          <Text
                            style={[
                              a.text_sm,
                              a.font_semibold,
                              ,
                              a.leading_tight,
                              lightTheme.atoms.text_contrast_medium,
                            ]}>
                            {sanitizeHandle(profile.handle, '@')}
                          </Text>

                          {profile.createdAt && (
                            <Text
                              style={[
                                a.text_sm,
                                a.font_semibold,
                                ,
                                a.leading_tight,
                                lightTheme.atoms.text_contrast_low,
                              ]}>
                              <Trans>
                                Joined{' '}
                                {i18n.date(profile.createdAt, {
                                  dateStyle: 'long',
                                })}
                              </Trans>
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
    <Dialog.Outer control={controls.tenMillion}>
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
              {isLoadingData || isLoadingImage ? (
                <Loader size="xl" fill="white" />
              ) : (
                <Image
                  accessibilityIgnoresInvertColors
                  source={{uri}}
                  style={[a.w_full, a.h_full]}
                />
              )}
            </View>
          </Frame>

          {canvas}

          <View style={[gtMobile ? a.p_2xl : a.p_xl]}>
            <Text
              style={[
                a.text_5xl,
                a.leading_tight,
                a.pb_lg,
                {
                  fontWeight: '900',
                },
              ]}>
              You're part of the next wave of the internet.
            </Text>

            <Text style={[a.leading_snug, a.text_lg, a.pb_md]}>
              <Trans>
                Online culture is too important to be controlled by a few
                corporations.
              </Trans>{' '}
              <Text style={[a.leading_snug, a.text_lg, a.italic]}>
                <Trans>
                  We’re dedicated to building an open foundation for the social
                  internet so that we can all shape its future.
                </Trans>
              </Text>
            </Text>

            <Text style={[a.leading_snug, a.text_lg, a.font_bold, a.pb_xl]}>
              <Trans>Congratulations. We're glad you're here.</Trans>
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
              <Text style={[a.text_md, a.italic, t.atoms.text_contrast_medium]}>
                Brag a little ;)
              </Text>

              <Button
                disabled={isLoadingImage}
                label={
                  isNative
                    ? _(msg`Share image externally`)
                    : _(msg`Download image`)
                }
                size="large"
                variant="solid"
                color="secondary"
                shape="square"
                onPress={isNative ? onNativeShare : download}>
                <ButtonIcon icon={isNative ? Share : Download} />
              </Button>
              <Button
                disabled={isLoadingImage}
                label={_(msg`Share image in post`)}
                size="large"
                variant="solid"
                color="primary"
                onPress={sharePost}>
                <ButtonText>{_(msg`Share post`)}</ButtonText>
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
