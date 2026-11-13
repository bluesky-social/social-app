import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {cleanError} from '#/lib/strings/errors'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {List} from '#/view/com/util/List'
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

  async function onRefresh() {
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
        onPressTryAgain={() => void refetch()}
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
      renderItem={({item}: {item: ActivityRowModel}) => (
        <ActivityRow row={item} />
      )}
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
