import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {cleanError} from '#/lib/strings/errors'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {List} from '#/view/com/util/List'
import {AtmosphereNux} from '#/screens/Atmosphere/components/AtmosphereNux'
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
  const logImpression = useLogContentImpression()
  const onItemSeen = useNonReactiveCallback((row: ActivityRowModel) => {
    if (row.kind !== 'card' || row.moderation.blur) return
    const position = rows.indexOf(row)
    if (position < 0) return
    logImpression({
      contentType: row.content.type,
      contentId: row.content.view.uri,
      position,
      collection: row.collection,
      grouping: row.grouping,
    })
  })
  const metrics = useLoadMetrics({
    hasData: !!data,
    isError,
    itemCount: rows.length,
  })

  async function onRefresh() {
    metrics.logRefresh()
    setIsPTRing(true)
    await refetch()
    setIsPTRing(false)
  }

  async function loadNextPage() {
    const result = await fetchNextPage()
    if (result.isSuccess) metrics.logPageLoaded(result.data.pages)
  }

  async function onEndReached() {
    if (isFetchingNextPage || !hasNextPage || isError) return
    await loadNextPage()
  }

  if (!data) {
    return isError ? (
      <ErrorMessage
        message={l`Could not load activity. Please try again.`}
        onPressTryAgain={() => {
          metrics.logRetry('initial')
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
      ListHeaderComponent={<AtmosphereNux style={a.pt_lg} />}
      ListEmptyComponent={<EmptyState />}
      ListFooterComponent={
        <ListFooter
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          error={isError ? cleanError(error) : undefined}
          onRetry={() => {
            metrics.logRetry('pagination')
            return loadNextPage()
          }}
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
