import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {cleanError} from '#/lib/strings/errors'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {List} from '#/view/com/util/List'
import {ActivityContentHider} from '#/screens/Atmosphere/ActivityTab/components/ActivityContentHider'
import {
  ActivityContentCard,
  ActivityRow,
} from '#/screens/Atmosphere/ActivityTab/components/ActivityRow'
import {isLive} from '#/screens/Atmosphere/ActivityTab/components/LivestreamCard'
import {FeaturedLivestreams} from '#/screens/Atmosphere/components/FeaturedLivestreams'
import {FeaturedPhotos} from '#/screens/Atmosphere/components/FeaturedPhotos'
import {FeaturedPublications} from '#/screens/Atmosphere/components/FeaturedPublications'
import {EXPLORE_PHOTOS_FEEDBACK} from '#/screens/Atmosphere/const'
import {
  getAtmosphereLivestreams,
  getAtmospherePhotos,
  getAtmospherePublications,
} from '#/screens/Atmosphere/data/exploreData'
import {useAtmosphereExploreQuery} from '#/screens/Atmosphere/data/useAtmosphereExploreQuery'
import {
  type AtmosphereFeedback,
  AtmosphereFeedbackProvider,
  useExploreFeedback,
  useForYouFeedback,
} from '#/screens/Atmosphere/feedback'
import {type ForYouItem} from '#/screens/Atmosphere/ForYouTab/useAtmosphereRecommendedActivityQuery'
import {getContentMetricContextProps} from '#/screens/Atmosphere/metrics/content'
import {
  AtmosphereContentItem,
  useLogContentImpression,
} from '#/screens/Atmosphere/metrics/context'
import {useLoadMetrics} from '#/screens/Atmosphere/metrics/useLoadMetrics'
import {atoms as a, useTheme} from '#/alf'
import {
  CardSurfaceProvider,
  useCardSurface,
} from '#/components/atmosphere/cardSurface'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import {ListFooter} from '#/components/Lists'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {type app} from '#/lexicons'
import {type CombinedInterstitial, type CombinedRow} from './mix'
import {
  MIN_LIVE_STREAMS_IN_DEV,
  PLACEHOLDER_LIVE_STREAMS,
} from './placeholderLivestreams'
import {useCombinedFeedQuery} from './useCombinedFeedQuery'

/**
 * Activity and For You in one feed: the viewer's activity in time order, with
 * recommended activity mixed in and then filling the feed once activity runs
 * out. In development as its own tab.
 */
export function CombinedTab() {
  const {t: l} = useLingui()
  const {
    data,
    error,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCombinedFeedQuery()
  const [isPTRing, setIsPTRing] = useState(false)
  const {rows: feedRows, liveStreams} = splitLiveStreams(
    data?.pages.flat() ?? [],
  )
  const rows = withInterstitials(feedRows)
  const feedback = useForYouFeedback(
    data?.recIdStr
      ? {items: data.recommendedItems, recIdStr: data.recIdStr}
      : undefined,
  )
  const logImpression = useLogContentImpression(rows, (row, position) => {
    if (row.kind === 'activity') {
      const {row: activity} = row
      if (activity.kind !== 'card' || activity.moderation.blur) return
      return getContentMetricContextProps(
        activity.content.type,
        activity.content.view,
        {
          position,
          activityReferrerCollection: activity.collection,
          activityReferrerGrouping: activity.grouping,
        },
      )
    }
    if (row.kind === 'recommended') {
      const {content, moderation} = row.item
      if (moderation.blur) return
      return getContentMetricContextProps(content.type, content.view, {
        position,
      })
    }
  })
  const onItemSeen = useNonReactiveCallback(
    (row: CombinedRow, position: number | undefined) => {
      logImpression(row, position)
      if (row.kind === 'recommended') {
        feedback.onItemSeen(row.item, row.recommendationPosition)
      }
    },
  )
  const metrics = useLoadMetrics({
    hasData: !!data,
    isError,
    itemCount: rows.length,
    pages: data?.pages,
  })

  async function onRefresh() {
    metrics.logRefresh()
    setIsPTRing(true)
    try {
      await refetch()
    } finally {
      setIsPTRing(false)
    }
  }

  async function onEndReached() {
    if (isFetchingNextPage || !hasNextPage || isError) return
    await fetchNextPage()
  }

  if (!data) {
    return isError ? (
      <ErrorMessage
        message={l`Could not load activity. Please try again.`}
        onPressTryAgain={() => {
          void refetch()
        }}
      />
    ) : (
      <View
        testID="combinedLoading"
        style={[a.align_center, a.justify_center, a.py_5xl]}>
        <Loader size="xl" />
      </View>
    )
  }

  return (
    <CardSurfaceProvider value="filled">
      <List
        testID="combinedList"
        data={rows}
        keyExtractor={(row: CombinedRow) => row.key}
        renderItem={({item, index}: {item: CombinedRow; index: number}) => (
          <CombinedFeedRow
            row={item}
            position={index}
            feedback={
              item.kind === 'recommended'
                ? feedback.forItem(item.item)
                : undefined
            }
          />
        )}
        onItemSeen={onItemSeen}
        refreshing={isPTRing}
        onRefresh={() => void onRefresh()}
        onEndReached={() => void onEndReached()}
        onEndReachedThreshold={4}
        ListHeaderComponent={<LiveNow feedStreams={liveStreams} />}
        ListEmptyComponent={<EmptyState />}
        ListFooterComponent={
          <ListFooter
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            error={isError ? cleanError(error) : undefined}
            onRetry={() => fetchNextPage()}
          />
        }
        sideBorders={false}
      />
    </CardSurfaceProvider>
  )
}

/**
 * Pulls live Streamplace streams out of the feed so they show in the Live now
 * carousel instead. Ended or moderated streams stay in the feed, as do rows
 * carrying the "Recommended for you" eyebrow so the label isn't lost.
 */
function splitLiveStreams(allRows: CombinedRow[]) {
  const rows: CombinedRow[] = []
  const liveStreams: app.bsky.embed.external.ViewLivestream[] = []
  for (const row of allRows) {
    const content =
      row.kind === 'activity' &&
      row.row.kind === 'card' &&
      !row.row.moderation.blur
        ? row.row.content
        : row.kind === 'recommended' &&
            !row.eyebrow &&
            !row.item.moderation.blur
          ? row.item.content
          : undefined
    if (content?.type === 'livestream' && isLive(content.view)) {
      liveStreams.push(content.view)
    } else {
      rows.push(row)
    }
  }
  return {rows, liveStreams}
}

/**
 * The rails placed in the feed, each after this many feed rows. Live now and
 * other rails don't count toward it.
 */
const INTERSTITIALS: {afterRows: number; interstitial: CombinedInterstitial}[] =
  [
    {afterRows: 3, interstitial: {key: 'popularPhotos', type: 'popularPhotos'}},
    {
      afterRows: 6,
      interstitial: {key: 'featuredPublications', type: 'featuredPublications'},
    },
  ]

/**
 * Places the rails among the feed rows, or at the end of a shorter feed. Each
 * renders nothing when it has no content.
 */
function withInterstitials(rows: CombinedRow[]): CombinedRow[] {
  if (!rows.length) return rows
  const toRow = (interstitial: CombinedInterstitial): CombinedRow => ({
    kind: 'interstitial',
    key: `interstitial:${interstitial.key}`,
    interstitial,
  })
  const placed: CombinedRow[] = []
  rows.forEach((row, index) => {
    placed.push(row)
    for (const {afterRows, interstitial} of INTERSTITIALS) {
      if (afterRows === index + 1) placed.push(toRow(interstitial))
    }
  })
  for (const {afterRows, interstitial} of INTERSTITIALS) {
    if (afterRows > rows.length) placed.push(toRow(interstitial))
  }
  return placed
}

/** Explore's featured publications, as a rail within the feed. */
function PublicationsInterstitial() {
  const bandStyle = useRailBandStyle()
  const {data} = useAtmosphereExploreQuery()
  const moderationOpts = useModerationOpts()
  const publications = data
    ? getAtmospherePublications(data, moderationOpts)
    : []
  if (!publications.length) return null

  return (
    <View testID="combinedFeaturedPublications" style={[a.py_lg, bandStyle]}>
      {/* Cards in the page's color, on the gray band */}
      <CardSurfaceProvider value="inverse">
        <FeaturedPublications publications={publications} />
      </CardSurfaceProvider>
    </View>
  )
}

/**
 * The band behind a rail: the cards' fill, with no lines. Its negative top
 * margin covers the line under the row above.
 */
function useRailBandStyle() {
  const surface = useCardSurface()
  return [{marginTop: -surface.dividerWidth}, {backgroundColor: surface.fill}]
}

/** Explore's featured photos, as a rail within the feed. */
function PhotosInterstitial() {
  const bandStyle = useRailBandStyle()
  const {data} = useAtmosphereExploreQuery()
  const moderationOpts = useModerationOpts()
  const feedback = useExploreFeedback(
    EXPLORE_PHOTOS_FEEDBACK,
    data?.photos.recIdStr,
  )
  const photos = data ? getAtmospherePhotos(data, moderationOpts) : []
  if (!photos.length) return null

  return (
    <View testID="combinedFeaturedPhotos" style={[a.pt_lg, bandStyle]}>
      <FeaturedPhotos photos={photos} feedback={feedback} />
    </View>
  )
}

/**
 * Streams that are live right now, in a carousel above the feed: the feed's
 * own, then Explore's featured ones. Hidden when nothing is live.
 */
function LiveNow({
  feedStreams,
}: {
  feedStreams: app.bsky.embed.external.ViewLivestream[]
}) {
  const {t: l} = useLingui()
  const {data} = useAtmosphereExploreQuery()
  // Matches the cards' fill, so the rail reads as part of the same surface
  const surface = useCardSurface()
  const exploreStreams = data ? getAtmosphereLivestreams(data) : []
  const seen = new Set<string>()
  const live = [...feedStreams, ...exploreStreams].filter(stream => {
    if (!isLive(stream) || seen.has(stream.uri)) return false
    seen.add(stream.uri)
    return true
  })
  if (!live.length) return null
  if (__DEV__) {
    for (const placeholder of PLACEHOLDER_LIVE_STREAMS) {
      if (live.length >= MIN_LIVE_STREAMS_IN_DEV) break
      live.push(placeholder)
    }
  }

  return (
    <View
      testID="combinedLiveNow"
      style={[a.py_lg, {backgroundColor: surface.fill}]}>
      <FeaturedLivestreams livestreams={live} title={l`Live now`} />
    </View>
  )
}

function CombinedFeedRow({
  row,
  position,
  feedback,
}: {
  row: CombinedRow
  /** 0-based, in the list. */
  position: number
  feedback: AtmosphereFeedback | undefined
}) {
  switch (row.kind) {
    case 'activity':
      return <ActivityRow row={row.row} position={position} />
    case 'recommended':
      return (
        <RecommendedRow
          item={row.item}
          eyebrow={row.eyebrow}
          position={position}
          feedback={feedback}
        />
      )
    case 'recommendedHeader':
      return <RecommendedHeader caughtUp={row.caughtUp} />
    case 'interstitial':
      switch (row.interstitial.type) {
        case 'popularPhotos':
          return <PhotosInterstitial />
        case 'featuredPublications':
          return <PublicationsInterstitial />
      }
  }
}

/** Labels a recommended row in place of the activity header. */
function RecommendedEyebrow() {
  const t = useTheme()
  return (
    <View style={[a.flex_row, a.align_center, a.gap_xs]}>
      <SparkleIcon size="sm" style={t.atoms.text_contrast_medium} />
      <Text
        style={[
          a.text_sm,
          a.font_semi_bold,
          a.leading_snug,
          t.atoms.text_contrast_medium,
        ]}>
        <Trans>Recommended for you</Trans>
      </Text>
    </View>
  )
}

function RecommendedRow({
  item: {content, moderation},
  eyebrow,
  position,
  feedback,
}: {
  item: ForYouItem
  eyebrow: boolean
  position: number
  feedback: AtmosphereFeedback | undefined
}) {
  const surface = useCardSurface()
  return (
    <View
      testID="combinedRecommendedRow"
      style={[
        a.gap_md,
        a.p_lg,
        {
          borderBottomWidth: surface.dividerWidth,
          borderColor: surface.divider,
        },
      ]}>
      {eyebrow && <RecommendedEyebrow />}
      <ActivityContentHider moderation={moderation}>
        <AtmosphereContentItem
          item={getContentMetricContextProps(content.type, content.view, {
            position,
          })}>
          <AtmosphereFeedbackProvider value={feedback}>
            <ActivityContentCard content={content} />
          </AtmosphereFeedbackProvider>
        </AtmosphereContentItem>
      </ActivityContentHider>
    </View>
  )
}

/** Where activity ends and the remaining recommendations begin. */
function RecommendedHeader({caughtUp}: {caughtUp: boolean}) {
  const t = useTheme()
  const surface = useCardSurface()
  return (
    <View
      testID="combinedRecommendedHeader"
      style={[
        a.gap_xs,
        a.px_lg,
        a.pt_xl,
        a.pb_md,
        {
          borderBottomWidth: surface.dividerWidth,
          borderColor: surface.divider,
        },
      ]}>
      {caughtUp && (
        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          <Trans>You’re all caught up</Trans>
        </Text>
      )}
      <View style={[a.flex_row, a.align_center, a.gap_xs]}>
        <SparkleIcon size="md" style={t.atoms.text} />
        <Text style={[a.text_lg, a.font_bold, t.atoms.text]}>
          <Trans>Recommended for you</Trans>
        </Text>
      </View>
    </View>
  )
}

function EmptyState() {
  const t = useTheme()
  return (
    <View testID="combinedEmpty" style={[a.align_center, a.px_xl, a.py_5xl]}>
      <Text style={[a.text_md, a.text_center, t.atoms.text_contrast_medium]}>
        <Trans>Nothing here yet. Check back soon.</Trans>
      </Text>
    </View>
  )
}
