import React from 'react'
import {View} from 'react-native'
import ViewShot from 'react-native-view-shot'
import {moderateProfile} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {isNative} from '#/platform/detection'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {useComposerControls} from 'state/shell'
import {formatCount} from '#/view/com/util/numeric/format'
import {UserAvatar} from '#/view/com/util/UserAvatar'
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
import {Divider} from '#/components/Divider'
import {GradientFill} from '#/components/GradientFill'
import {ArrowOutOfBox_Stroke2_Corner0_Rounded as Share} from '#/components/icons/ArrowOutOfBox'
import {Image_Stroke2_Corner0_Rounded as ImageIcon} from '#/components/icons/Image'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

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

export function TenMillion() {
  const t = useTheme()
  const lightTheme = useTheme('light')
  const {_, i18n} = useLingui()
  const {controls} = useContext()
  const {gtMobile} = useBreakpoints()
  const {openComposer} = useComposerControls()
  const imageRef = React.useRef<ViewShot>(null)
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

  const isLoading = isProfileLoading || !moderation || !profile

  const userNumber = 56738

  const share = () => {
    if (imageRef.current && imageRef.current.capture) {
      imageRef.current.capture().then(uri => {
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
      })
    }
  }

  return (
    <Dialog.Outer control={controls.tenMillion}>
      <Dialog.Handle />

      <Dialog.ScrollableInner
        label={_(msg`Ten Million`)}
        style={[
          {
            padding: 0,
          },
          // gtMobile ? {width: 'auto', maxWidth: 400, minWidth: 200} : a.w_full,
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
          <ThemeProvider theme="light">
            <View
              style={[
                a.relative,
                a.w_full,
                a.overflow_hidden,
                {
                  paddingTop: '80%',
                },
              ]}>
              <ViewShot
                ref={imageRef}
                options={{width: WIDTH, height: HEIGHT}}
                style={[a.absolute, a.inset_0]}>
                <View
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
                      paddingVertical: 32,
                      paddingHorizontal: 48,
                    },
                  ]}>
                  <GradientFill gradient={tokens.gradients.bonfire} />

                  {isLoading ? (
                    <Loader size="xl" fill="white" />
                  ) : (
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
                            paddingBottom: 48,
                          },
                        ]}>
                        <Text
                          style={[
                            a.text_md,
                            a.font_bold,
                            a.text_center,
                            a.pb_xs,
                            lightTheme.atoms.text_contrast_medium,
                          ]}>
                          <Trans>
                            Celebrating {formatCount(i18n, 10000000)} users
                          </Trans>{' '}
                          🎉
                        </Text>
                        <Text
                          style={[
                            a.relative,
                            a.text_center,
                            {
                              fontStyle: 'italic',
                              fontSize: getFontSize(userNumber),
                              fontWeight: '900',
                              letterSpacing: -2,
                            },
                          ]}>
                          <Text
                            style={[
                              a.absolute,
                              {
                                color: t.palette.primary_500,
                                fontSize: 32,
                                left: -18,
                                top: 8,
                              },
                            ]}>
                            #
                          </Text>
                          {i18n.number(userNumber)}
                        </Text>
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
                          <UserAvatar
                            size={36}
                            avatar={profile.avatar}
                            moderation={moderation.ui('avatar')}
                          />
                          <View style={[a.gap_2xs, a.flex_1]}>
                            <Text style={[a.text_sm, a.font_bold]}>
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
                                  lightTheme.atoms.text_contrast_medium,
                                ]}>
                                {sanitizeHandle(profile.handle, '@')}
                              </Text>

                              {profile.createdAt && (
                                <Text
                                  style={[
                                    a.text_sm,
                                    a.font_semibold,
                                    lightTheme.atoms.text_contrast_low,
                                  ]}>
                                  {i18n.date(profile.createdAt, {
                                    dateStyle: 'long',
                                  })}
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </ViewShot>
            </View>
          </ThemeProvider>

          <View style={[gtMobile ? a.p_2xl : a.p_xl]}>
            <Text
              style={[
                a.text_5xl,
                a.pb_lg,
                {
                  fontWeight: '900',
                },
              ]}>
              You're part of the next wave of the internet.
            </Text>

            <Text style={[a.leading_snug, a.text_lg, a.pb_xl]}>
              Online culture is too important to be controlled by a few
              corporations.{' '}
              <Text style={[a.leading_snug, a.text_lg, a.italic]}>
                We’re dedicated to building an open foundation for the social
                internet so that we can all shape its future.
              </Text>
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
                label={_(msg`Share image externally`)}
                size="large"
                variant="solid"
                color="secondary"
                shape="square"
                onPress={share}>
                <ButtonIcon icon={Share} />
              </Button>
              <Button
                label={_(msg`Share image in post`)}
                size="large"
                variant="solid"
                color="primary"
                onPress={share}>
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
