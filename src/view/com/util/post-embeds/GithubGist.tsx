import React from 'react'
import {LayoutChangeEvent, ScrollView, View} from 'react-native'
import {LinearGradient} from 'expo-linear-gradient'
import {AppBskyEmbedExternal} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQuery} from '@tanstack/react-query'

import {shareUrl} from '#/lib/sharing'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {isNative} from '#/platform/detection'
import {ExternalLinkEmbedCard} from '#/view/com/util/post-embeds/ExternalLinkEmbed'
import {atoms as a, useBreakpoints,useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Divider} from '#/components/Divider'
import {ChevronBottom_Stroke2_Corner0_Rounded as Chevron} from '#/components/icons/Chevron'
import {CodeBrackets_Stroke2_Corner0_Rounded as Code} from '#/components/icons/CodeBrackets'
import {Globe_Stroke2_Corner0_Rounded as Globe} from '#/components/icons/Globe'
import {Link} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

const MAX_HEIGHT = 400

export function GithubGist({
  info,
  id,
}: {
  info: AppBskyEmbedExternal.ViewExternal
  id: string
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const [footerHeight, setFooterHeight] = React.useState(97) // magic #
  const [showMore, setShowMore] = React.useState<boolean | undefined>()

  const {data: files, error} = useQuery({
    queryKey: ['gist', id],
    async queryFn() {
      const url = `https://api.github.com/gists/${id}`
      const gist = await fetch(url).then(res => res.json())
      const files = Object.values(gist.files) as {
        filename: string
        type: 'text/markdown' | string
        language: 'Markdown' | string
        raw_url: string
        size: number
        truncated: boolean
        content: string
      }[]
      return files
    },
  })

  const onShareExternal = React.useCallback(() => {
    if (info.uri && isNative) {
      shareUrl(info.uri)
    }
  }, [info.uri])

  const onFooterLayout = React.useCallback(
    (e: LayoutChangeEvent) => {
      setFooterHeight(e.nativeEvent.layout.height)
    },
    [setFooterHeight],
  )

  const onCodeLayout = React.useCallback(
    (e: LayoutChangeEvent) => {
      if (showMore !== undefined) return
      const height = e.nativeEvent.layout.height
      if (height < 400) {
        setShowMore(true)
      } else {
        setShowMore(false)
      }
    },
    [showMore, setShowMore],
  )

  const onShowMore = React.useCallback(() => {
    setShowMore(true)
  }, [setShowMore])

  if (error) {
    return <ExternalLinkEmbedCard link={info} />
  }

  return (
    <View
      style={[
        a.transition_color,
        a.flex_col,
        a.rounded_md,
        a.overflow_hidden,
        a.w_full,
        a.border,
        t.atoms.border_contrast_low,
      ]}>
      <View style={[t.atoms.bg_contrast_25]}>
        {error ? null : !files ? ( // handled above
          <View style={[gtMobile ? a.p_lg : a.p_md]}>
            <Loader />
          </View>
        ) : (
          <View style={[a.relative]}>
            <View style={[gtMobile ? a.pt_lg : a.pt_md, a.relative]}>
              <ScrollView
                style={[
                  a.overflow_hidden,
                  showMore === undefined || showMore === false
                    ? {
                        maxHeight: MAX_HEIGHT,
                      }
                    : {},
                ]}>
                <ScrollView
                  horizontal
                  onLayout={onCodeLayout}
                  style={[{paddingBottom: footerHeight}]}>
                  <View>
                    <View
                      style={[
                        a.flex_row,
                        a.align_center,
                        a.gap_xs,
                        gtMobile ? a.px_lg : a.px_md,
                        a.pb_md,
                      ]}>
                      <Code
                        size="xs"
                        style={[
                          a.transition_color,
                          {color: t.palette.primary_500},
                        ]}
                      />

                      <Text
                        style={[
                          a.text_sm,
                          a.italic,
                          t.atoms.text_contrast_low,
                        ]}>
                        {files[0].filename}
                      </Text>
                    </View>
                    <Text
                      style={[
                        gtMobile ? a.px_lg : a.px_md,
                        {
                          fontFamily: 'monospace',
                        },
                      ]}>
                      {files[0].content.trimRight()}
                    </Text>
                  </View>
                </ScrollView>
              </ScrollView>

              {showMore === false && <View style={[a.absolute, a.inset_0]} />}
            </View>

            <View
              style={[
                a.absolute,
                a.inset_0,
                gtMobile ? a.p_lg : a.p_md,
                {top: 'auto'},
              ]}
              onLayout={onFooterLayout}>
              <LinearGradient
                colors={['rgba(0, 17, 36,0)', 'rgba(0, 17, 36,0.5)']}
                locations={[0, 1]}
                start={{x: 0, y: 0}}
                end={{x: 0, y: 1}}
                style={[a.absolute, a.inset_0]}
              />
              {showMore === false && (
                <View style={[a.flex_row, a.justify_center, a.pb_md]}>
                  <Button
                    label={_(msg`Show more`)}
                    size="small"
                    variant="solid"
                    color="primary"
                    style={[
                      a.rounded_full,
                      {
                        paddingVertical: 6,
                      },
                    ]}
                    onPress={onShowMore}>
                    <ButtonText>Show more</ButtonText>
                    <ButtonIcon icon={Chevron} size="sm" position="right" />
                  </Button>
                </View>
              )}

              <Link
                label={info.title || _(msg`Open this Gist`)}
                to={info.uri}
                onLongPress={onShareExternal}>
                {({hovered}) => (
                  <View
                    style={[
                      a.flex_1,
                      a.pt_sm,
                      a.rounded_sm,
                      a.border,
                      {gap: 3},
                      t.atoms.bg,
                      hovered
                        ? t.atoms.border_contrast_high
                        : t.atoms.border_contrast_low,
                    ]}>
                    <View style={[{gap: 3}, a.pb_xs, a.px_md]}>
                      <Text
                        emoji
                        numberOfLines={2}
                        style={[a.text_md, a.font_bold, a.leading_snug]}>
                        {info.title || info.uri}
                      </Text>
                    </View>
                    <View style={[a.px_md]}>
                      <Divider
                        style={[
                          hovered
                            ? t.atoms.border_contrast_high
                            : t.atoms.border_contrast_low,
                        ]}
                      />
                      <View
                        style={[
                          a.flex_row,
                          a.align_center,
                          a.gap_xs,
                          a.pb_sm,
                          {
                            paddingTop: 6, // off menu
                          },
                        ]}>
                        <Globe
                          size="xs"
                          style={[
                            a.transition_color,
                            hovered
                              ? t.atoms.text_contrast_high
                              : t.atoms.text_contrast_low,
                          ]}
                        />
                        <Text
                          numberOfLines={1}
                          style={[
                            a.transition_color,
                            a.text_xs,
                            a.leading_tight,
                            hovered
                              ? t.atoms.text_contrast_high
                              : t.atoms.text_contrast_medium,
                          ]}>
                          {toNiceDomain(info.uri)}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </Link>
            </View>
          </View>
        )}
      </View>
    </View>
  )
}
