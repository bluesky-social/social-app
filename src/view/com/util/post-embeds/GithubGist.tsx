import React from 'react'
import {LayoutChangeEvent,ScrollView, View} from 'react-native'
import {LinearGradient} from 'expo-linear-gradient'
import {AppBskyEmbedExternal} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQuery} from '@tanstack/react-query'

import {shareUrl} from '#/lib/sharing'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {isNative} from '#/platform/detection'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Divider} from '#/components/Divider'
import {ChevronBottom_Stroke2_Corner0_Rounded as Chevron} from '#/components/icons/Chevron'
import {CodeBrackets_Stroke2_Corner0_Rounded as Code} from '#/components/icons/CodeBrackets'
import {Globe_Stroke2_Corner0_Rounded as Globe} from '#/components/icons/Globe'
import {Link} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function GithubGist({
  info,
  id,
}: {
  info: AppBskyEmbedExternal.ViewExternal
  id: string
}) {
  const t = useTheme()
  const {_} = useLingui()
  const [footerHeight, setFooterHeight] = React.useState(100)
  const [showMore, setShowMore] = React.useState(false)

  const {data: files, isLoading} = useQuery({
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

  const onShowMore = React.useCallback(() => {
    setShowMore(true)
  }, [setShowMore])

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
        {isLoading || !files ? (
          <View style={[a.px_lg]}>
            <Loader />
          </View>
        ) : (
          <View style={[a.relative]}>
            <View style={[a.relative]}>
              <ScrollView
                style={[a.pt_lg, {maxHeight: showMore ? undefined : 500}]}>
                <ScrollView horizontal style={[{paddingBottom: footerHeight}]}>
                  <View>
                    <View
                      style={[
                        a.flex_row,
                        a.align_center,
                        a.gap_xs,
                        a.px_lg,
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
                        a.px_lg,
                        {
                          fontFamily: 'monospace',
                        },
                      ]}>
                      {files[0].content}
                    </Text>
                  </View>
                </ScrollView>
              </ScrollView>

              {!showMore && <View style={[a.absolute, a.inset_0]} />}
            </View>

            <View
              style={[a.absolute, a.inset_0, a.p_lg, {top: 'auto'}]}
              onLayout={onFooterLayout}>
              {!showMore && (
                <View style={[a.absolute, a.inset_0]}>
                  <View
                    style={[
                      a.absolute,
                      a.flex_row,
                      a.justify_center,
                      {
                        left: 0,
                        right: 0,
                        top: 0,
                        transform: [{translateY: '-100%'}],
                      },
                    ]}>
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
                  <LinearGradient
                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)']}
                    locations={[0, 1]}
                    start={{x: 0, y: 0}}
                    end={{x: 0, y: 1}}
                    style={[a.absolute, a.inset_0]}
                  />
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
                      t.atoms.bg_contrast_100,
                      t.atoms.border_contrast_high,
                      hovered && {
                        borderColor: t.palette.contrast_400,
                      },
                    ]}>
                    <View style={[{gap: 3}, a.pb_xs, a.px_md]}>
                      <Text
                        emoji
                        numberOfLines={3}
                        style={[a.text_md, a.font_bold, a.leading_snug]}>
                        {info.title || info.uri}
                      </Text>
                    </View>
                    <View style={[a.px_md]}>
                      <Divider
                        style={[
                          t.atoms.border_contrast_high,
                          hovered && {
                            borderColor: t.palette.contrast_400,
                          },
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
                              ? t.atoms.text_contrast_medium
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
