import {useEffect, useMemo} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {LinearGradient} from 'expo-linear-gradient'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isBskyCustomFeedUrl} from '#/lib/strings/url-helpers'
import {logger} from '#/logger'
import {atoms as a, utils} from '#/alf'
import {Live_Stroke2_Corner0_Rounded as LiveIcon} from '#/components/icons/Live'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {
  type LiveEventFeed,
  type LiveEventFeedMetricContext,
} from '#/features/liveEvents/types'

const roundedStyles = [a.rounded_md, a.curve_continuous]

export function LiveEventFeedCardCompact({
  feed,
  metricContext,
}: {
  feed: LiveEventFeed
  metricContext: LiveEventFeedMetricContext
}) {
  const {_} = useLingui()

  const layout = feed.layouts.compact
  const overlayColor = layout.overlayColor
  const textColor = layout.textColor
  const url = useMemo(() => {
    // Validated in multiple places on the backend
    if (isBskyCustomFeedUrl(feed.url)) {
      return new URL(feed.url).pathname
    }
    return '/'
  }, [feed.url])

  useEffect(() => {
    logger.metric('liveEvents:feedBanner:seen', {
      feed: feed.url,
      context: metricContext,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Link
      to={url}
      label={_(msg`Live event happening now: ${feed.title}`)}
      style={[a.w_full]}
      onPress={() => {
        logger.metric('liveEvents:feedBanner:click', {
          feed: feed.url,
          context: metricContext,
        })
      }}>
      {({hovered, pressed}) => (
        <View style={[roundedStyles, a.shadow_md, a.w_full]}>
          <View
            style={[a.w_full, a.align_start, a.overflow_hidden, roundedStyles]}>
            <Image
              accessibilityIgnoresInvertColors
              source={{uri: layout.image}}
              placeholder={{blurhash: layout.blurhash}}
              style={[a.absolute, a.inset_0, a.w_full, a.h_full]}
              contentFit="cover"
              placeholderContentFit="cover"
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

            <View style={[a.w_full, a.justify_end]}>
              <LinearGradient
                colors={[
                  overlayColor,
                  utils.alpha(overlayColor, 0.7),
                  utils.alpha(overlayColor, 0),
                ]}
                locations={[0, 0.8, 1]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={[a.absolute, a.inset_0]}
              />

              <View
                style={[
                  a.flex_1,
                  a.flex_row,
                  a.align_center,
                  a.gap_xs,
                  a.z_10,
                  a.px_lg,
                  a.py_md,
                ]}>
                <LiveIcon size="md" fill={textColor} />
                <Text
                  numberOfLines={1}
                  style={[
                    a.flex_1,
                    a.leading_snug,
                    a.font_bold,
                    a.text_lg,
                    a.pr_xl,
                    {color: textColor},
                  ]}>
                  {layout.title}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </Link>
  )
}
