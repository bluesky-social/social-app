import React from 'react'
import {View} from 'react-native'
import {AppBskyEmbedExternal} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQuery} from '@tanstack/react-query'

import {shareUrl} from '#/lib/sharing'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {isNative} from '#/platform/detection'
import {atoms as a, useTheme} from '#/alf'
import {Divider} from '#/components/Divider'
import {Earth_Stroke2_Corner0_Rounded as Globe} from '#/components/icons/Globe'
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

  return (
    <Link
      label={info.title || _(msg`Open this Gist`)}
      to={info.uri}
      onLongPress={onShareExternal}>
      {({hovered}) => (
        <View
          style={[
            a.transition_color,
            a.flex_col,
            a.rounded_md,
            a.overflow_hidden,
            a.w_full,
            a.border,
            hovered
              ? t.atoms.border_contrast_high
              : t.atoms.border_contrast_low,
          ]}>
          <View style={[a.p_lg, t.atoms.bg_contrast_25]}>
            {isLoading || !files ? (
              <Loader />
            ) : (
              <View>
                <Text
                  style={[
                    a.text_sm,
                    a.italic,
                    t.atoms.text_contrast_low,
                    a.pb_sm,
                  ]}>
                  {files[0].filename}
                </Text>
                <Text
                  style={[
                    {
                      fontFamily: 'monospace',
                    },
                  ]}>
                  {files[0].content}
                </Text>
              </View>
            )}
          </View>

          <View
            style={[
              a.flex_1,
              a.pt_sm,
              {gap: 3},
              a.border_t,
              hovered
                ? t.atoms.border_contrast_high
                : t.atoms.border_contrast_low,
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
              <Divider />
              <View
                style={[
                  a.flex_row,
                  a.align_center,
                  a.gap_2xs,
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
        </View>
      )}
    </Link>
  )
}
