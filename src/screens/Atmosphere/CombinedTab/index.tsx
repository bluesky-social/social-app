import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {cleanError} from '#/lib/strings/errors'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {List} from '#/view/com/util/List'
import {ActivityContentHider} from '#/screens/Atmosphere/ActivityTab/components/ActivityContentHider'
import {
  ActivityContentCard,
  ActivityRow,
} from '#/screens/Atmosphere/ActivityTab/components/ActivityRow'
import {AtmosphereNux} from '#/screens/Atmosphere/components/AtmosphereNux'
import {
  type AtmosphereFeedback,
  AtmosphereFeedbackProvider,
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
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import {ListFooter} from '#/components/Lists'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {LiveNowRow} from './LiveNowRow'
import {type CombinedDateBucket, type CombinedRow} from './mix'
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
  const rows = data?.pages.flat() ?? []
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
      ListHeaderComponent={
        <>
          <LiveNowRow livestreams={data.livestreams} />
          <AtmosphereNux style={a.pt_lg} />
        </>
      }
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
    case 'dateHeader':
      return <DateHeader bucket={row.bucket} first={position === 0} />
    case 'recommendedHeader':
      return (
        <RecommendedHeader caughtUp={row.caughtUp} first={position === 0} />
      )
    case 'interstitial':
      // None are produced yet.
      return null
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
  const t = useTheme()
  return (
    <View
      testID="combinedRecommendedRow"
      style={[a.gap_md, a.p_lg, a.border_b, t.atoms.border_contrast_low]}>
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

function DateHeader({
  bucket,
  first,
}: {
  bucket: CombinedDateBucket
  first: boolean
}) {
  const {t: l} = useLingui()
  const titles: Record<CombinedDateBucket, string> = {
    today: l({message: 'Today', context: 'Feed section header'}),
    yesterday: l({message: 'Yesterday', context: 'Feed section header'}),
    pastWeek: l({
      message: 'Past week',
      comment: 'Feed section header for activity from 2 to 6 days ago',
      context: 'Feed section header',
    }),
    earlier: l({
      message: 'Earlier',
      comment: 'Feed section header for activity from over a week ago',
      context: 'Feed section header',
    }),
  }
  return (
    <SectionHeader
      testID="combinedDateHeader"
      title={titles[bucket]}
      first={first}
    />
  )
}

/** Where activity ends and the remaining recommendations begin. */
function RecommendedHeader({
  caughtUp,
  first,
}: {
  caughtUp: boolean
  first: boolean
}) {
  const {t: l} = useLingui()
  return (
    <SectionHeader
      testID="combinedRecommendedHeader"
      title={l`Recommended for you`}
      subtitle={caughtUp ? l`You’re all caught up` : undefined}
      first={first}
    />
  )
}

/** Titles the rows below it, which bring their own dividers. */
function SectionHeader({
  title,
  subtitle,
  first,
  testID,
}: {
  title: string
  /** Above the title, in smaller text. */
  subtitle?: string
  /** Whether it's the first row, so there's no row above to separate from. */
  first: boolean
  testID?: string
}) {
  const t = useTheme()
  return (
    <View
      testID={testID}
      style={[a.gap_2xs, a.px_lg, first ? a.pt_2xl : a.pt_4xl]}>
      {subtitle && (
        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          {subtitle}
        </Text>
      )}
      <Text role="heading" style={[a.text_xl, a.font_bold, t.atoms.text]}>
        {title}
      </Text>
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
