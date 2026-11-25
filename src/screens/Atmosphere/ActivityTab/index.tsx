import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {cleanError} from '#/lib/strings/errors'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {List} from '#/view/com/util/List'
import {getContentMetricContextProps} from '#/screens/Atmosphere/metrics/content'
import {useLogContentImpression} from '#/screens/Atmosphere/metrics/context'
import {useLoadMetrics} from '#/screens/Atmosphere/metrics/useLoadMetrics'
import {atoms as a, useTheme} from '#/alf'
import {ListFooter} from '#/components/Lists'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {ActivityRow} from './components/ActivityRow'
import {type ActivityRow as ActivityRowModel} from './rows'
import {useActivityTimelineQuery} from './useActivityTimelineQuery'

export function ActivityTab() {
  const {t: l} = useLingui()
  const {
    data,
    error,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useActivityTimelineQuery()
  const [isPTRing, setIsPTRing] = useState(false)
  const rows = data?.pages.flat() ?? []
  const onItemSeen = useLogContentImpression(rows, (row, position) => {
    if (row.kind !== 'card' || row.moderation.blur) return
    return getContentMetricContextProps(row.content.type, row.content.view, {
      position,
      activityReferrerCollection: row.collection,
      activityReferrerGrouping: row.grouping,
    })
  })
  const metrics = useLoadMetrics({
    hasData: !!data,
    isError,
    itemCount: rows.length,
    pages: data?.pages,
  })

  async function onRefresh() {
    metrics.logRefresh()
    setIsPTRing(true)
    await refetch()
    setIsPTRing(false)
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
        testID="activityLoading"
        style={[a.align_center, a.justify_center, a.py_5xl]}>
        <Loader size="xl" />
      </View>
    )
  }

  return (
    <List
      testID="activityList"
      data={rows}
      keyExtractor={(row: ActivityRowModel) => row.key}
      renderItem={({item, index}: {item: ActivityRowModel; index: number}) => (
        <ActivityRow row={item} position={index} />
      )}
      onItemSeen={onItemSeen}
      refreshing={isPTRing}
      onRefresh={() => void onRefresh()}
      onEndReached={() => void onEndReached()}
      onEndReachedThreshold={4}
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

function EmptyState() {
  const t = useTheme()
  return (
    <View testID="activityEmpty" style={[a.align_center, a.px_xl, a.py_5xl]}>
      <Text style={[a.text_md, a.text_center, t.atoms.text_contrast_medium]}>
        <Trans>No activity yet.</Trans>
      </Text>
    </View>
  )
}
