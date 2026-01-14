import {useMemo} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {LinearGradient} from 'expo-linear-gradient'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isBskyCustomFeedUrl} from '#/lib/strings/url-helpers'
import {logger} from '#/logger'
import {atoms as a, useBreakpoints, utils} from '#/alf'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {
  type LiveEventFeed,
  type LiveEventFeedMetricContext,
} from '#/features/liveEvents/types'

const roundedStyles = [a.rounded_lg, a.curve_continuous]

export function LiveEventFeedCardWide({
  feed,
  metricContext,
}: {
  feed: LiveEventFeed
  metricContext: LiveEventFeedMetricContext
}) {
  const {_} = useLingui()
  const {gtPhone} = useBreakpoints()

  const image = feed.images.wide
  const overlayColor = image.overlayColor
  const textColor = image.textColor
  const url = useMemo(() => {
    // Validated in multiple places on the backend
    if (isBskyCustomFeedUrl(feed.url)) {
      return new URL(feed.url).pathname
    }
    return '/'
  }, [feed.url])

  return (
    <Link
      to={url}
      label={_(msg`Live event happening now: ${feed.title}`)}
      style={[a.w_full]}
      onPress={() => {
        logger.metric('liveEvents:feed:click', {
          feed: feed.url,
          context: metricContext,
        })
      }}>
      {({hovered, pressed}) => (
        <View style={[roundedStyles, a.shadow_md, a.w_full]}>
          <View
            style={[
              a.align_start,
              roundedStyles,
              a.overflow_hidden,
              {
                aspectRatio: gtPhone ? 576 / 144 : 369 / 100,
              },
            ]}>
            <Image
              accessibilityIgnoresInvertColors
              source={{
                uri: image.url,
                blurhash: image.blurhash,
              }}
              style={[a.absolute, a.inset_0]}
              contentFit="cover"
            />

            <LinearGradient
              colors={[overlayColor, utils.alpha(overlayColor, 0)]}
              locations={[0, 1]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={[
                a.absolute,
                a.inset_0,
                a.transition_opacity,
                {
                  transitionDuration: '200ms',
                  opacity: hovered || pressed ? 0.6 : 0,
                },
              ]}
            />

            <View style={[a.flex_1, a.justify_end]}>
              <LinearGradient
                colors={[overlayColor, utils.alpha(overlayColor, 0)]}
                locations={[0, 1]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={[a.absolute, a.inset_0]}
              />

              <View
                style={[
                  a.z_10,
                  gtPhone ? [a.pl_xl, a.pb_lg] : [a.pl_lg, a.pb_md],
                  {paddingRight: 64},
                ]}>
                <Text
                  style={[
                    a.leading_snug,
                    gtPhone ? a.text_xs : a.text_2xs,
                    {color: textColor, opacity: 0.8},
                  ]}>
                  {feed.preview ? (
                    <Trans>Preview</Trans>
                  ) : (
                    <Trans>Happening now</Trans>
                  )}
                </Text>
                <Text
                  style={[
                    a.leading_snug,
                    a.font_bold,
                    gtPhone ? a.text_3xl : a.text_lg,
                    {color: textColor},
                  ]}>
                  {feed.title}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </Link>
  )
}
