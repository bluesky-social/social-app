import {View} from 'react-native'
import {Image} from 'expo-image'
import {Trans, useLingui} from '@lingui/react/macro'

import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeHandle} from '#/lib/strings/handles'
import {AppName} from '#/screens/Atmosphere/ActivityTab/components/ActivityHeader'
import {getAssociatedProfile} from '#/screens/Atmosphere/data/exploreData'
import {getContentMetricContextProps} from '#/screens/Atmosphere/metrics/content'
import {
  AtmosphereContentItem,
  useAtmosphereMetricContext,
  useLogContentPress,
} from '#/screens/Atmosphere/metrics/context'
import {atoms as a, useTheme} from '#/alf'
import {getAtmosphereProvider} from '#/components/atmosphere/providers'
import * as Gallery from '#/components/Gallery'
import {InlineLinkText, Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {type Livestream} from './useCombinedFeedQuery'

/** Fits one item with the next peeking in on phones. */
const ITEM_WIDTH = 320
const THUMBNAIL_WIDTH = 96
/** Livestreams are `place.stream.livestream` records, so always Streamplace. */
const STREAMPLACE = getAtmosphereProvider('stream.place')!

/**
 * Streams live now, above the feed: one stretched across the row, or several
 * in a carousel.
 */
export function LiveNowRow({livestreams}: {livestreams: Livestream[]}) {
  const {t: l} = useLingui()
  const t = useTheme()

  if (!livestreams.length) return null

  return (
    <View
      testID="combinedLiveNowRow"
      style={[
        a.border_b,
        t.atoms.border_contrast_low,
        {backgroundColor: t.palette.primary_25},
      ]}>
      {livestreams.length === 1 ? (
        <View style={[a.px_lg, a.py_lg]}>
          <LiveNowItem livestream={livestreams[0]} position={0} />
        </View>
      ) : (
        <Gallery.Bleed>
          <View style={[a.px_lg, a.py_lg]}>
            <Gallery.Root label={l`Live now`}>
              {livestreams.map((livestream, index) => (
                <Gallery.Item
                  key={livestream.view.uri}
                  label={livestream.view.title}>
                  {galleryFocus => (
                    <View
                      style={[
                        {width: ITEM_WIDTH},
                        index > 0 && a.pl_md,
                        index < livestreams.length - 1 && [
                          a.pr_md,
                          a.border_r,
                          t.atoms.border_contrast_low,
                        ],
                      ]}>
                      <LiveNowItem
                        livestream={livestream}
                        position={index}
                        galleryFocus={galleryFocus}
                      />
                    </View>
                  )}
                </Gallery.Item>
              ))}
            </Gallery.Root>
          </View>
        </Gallery.Bleed>
      )}
    </View>
  )
}

function LiveNowItem({
  livestream: {view},
  position,
  galleryFocus,
}: {
  livestream: Livestream
  /** 0-based, in the row. */
  position: number
  galleryFocus?: Gallery.ItemFocusProps
}) {
  return (
    <AtmosphereContentItem
      item={getContentMetricContextProps('livestream', view, {position})}>
      <LiveNowItemInner view={view} galleryFocus={galleryFocus} />
    </AtmosphereContentItem>
  )
}

function LiveNowItemInner({
  view,
  galleryFocus,
}: {
  view: Livestream['view']
  galleryFocus?: Gallery.ItemFocusProps
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const ax = useAnalytics()
  const metricContext = useAtmosphereMetricContext()
  const logPress = useLogContentPress()
  const author = getAssociatedProfile(view.associatedProfiles)
  const title = view.title.trim()

  return (
    <View style={[a.flex_row, a.align_center, a.gap_md, {maxWidth: 340}]}>
      <Link
        to={view.uri}
        label={l`Open livestream: ${title}, live`}
        accessibilityHint=""
        onPress={() => logPress('external')}
        ref={galleryFocus?.focusRef}
        tabIndex={galleryFocus?.tabIndex}
        onFocus={galleryFocus?.onFocus}
        style={[
          a.overflow_hidden,
          a.rounded_md,
          t.atoms.bg_contrast_25,
          {width: THUMBNAIL_WIDTH, aspectRatio: 3 / 2},
        ]}>
        {!!view.image && (
          <Image
            source={{uri: view.image}}
            contentFit="cover"
            accessible={false}
            style={[a.absolute, a.inset_0]}
          />
        )}
        <LiveBadge />
      </Link>
      <View style={[a.flex_1, a.gap_xs]}>
        <InlineLinkText
          to={view.uri}
          label={l`Open livestream: ${title}, live`}
          onPress={() => logPress('external')}
          disableMismatchWarning
          disableUnderline
          emoji
          numberOfLines={2}
          style={[a.text_md, a.font_bold, a.leading_snug, t.atoms.text]}>
          {title}
        </InlineLinkText>
        <View style={[a.flex_row, a.align_center, a.gap_xs]}>
          {author && (
            <InlineLinkText
              to={makeProfileLink(author)}
              label={sanitizeHandle(author.handle, '@')}
              onPress={() => {
                if (!metricContext) return
                ax.metric('atmosphere:profile:press', {
                  ...metricContext,
                  profileDid: author.did,
                  source: 'liveNowRow',
                })
              }}
              disableUnderline
              numberOfLines={1}
              style={[
                a.flex_shrink,
                a.text_xs,
                a.leading_snug,
                t.atoms.text_contrast_medium,
              ]}>
              {sanitizeHandle(author.handle, '@')}
            </InlineLinkText>
          )}
          {/* The handle gives way first, so the app name always shows. */}
          <Text
            numberOfLines={1}
            style={[
              a.flex_shrink_0,
              a.text_xs,
              a.leading_snug,
              t.atoms.text_contrast_medium,
            ]}>
            <Trans comment='The app a livestream is on, e.g. "on Streamplace". The app name includes its icon.'>
              on <AppName app={STREAMPLACE}>{STREAMPLACE.name}</AppName>
            </Trans>
          </Text>
        </View>
      </View>
    </View>
  )
}

function LiveBadge() {
  const t = useTheme()
  return (
    <View
      pointerEvents="none"
      style={[
        a.absolute,
        a.flex_row,
        a.align_center,
        a.gap_xs,
        a.px_xs,
        a.py_2xs,
        {
          top: 6,
          left: 6,
          paddingRight: 6,
          borderRadius: 5,
          backgroundColor: t.palette.negative_500,
        },
      ]}>
      <View
        style={[
          a.rounded_full,
          {width: 5, height: 5, backgroundColor: 'white'},
        ]}
      />
      <Text
        style={[
          a.text_xs,
          a.font_semi_bold,
          {color: 'white', textTransform: 'uppercase'},
        ]}>
        <Trans comment="Badge on a livestream thumbnail while it is streaming. Keep it very short.">
          Live
        </Trans>
      </Text>
    </View>
  )
}
