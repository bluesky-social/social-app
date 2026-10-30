import {useState} from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {cleanError} from '#/lib/strings/errors'
import {EmptyState} from '#/view/com/util/EmptyState'
import {List} from '#/view/com/util/List'
import {useAtmosphereQuery} from '#/screens/Atmosphere/query'
import {atoms as a} from '#/alf'
import {Atom_Stroke2_Corner0_Rounded as AtomIcon} from '#/components/icons/Atom'
import {ListFooter} from '#/components/Lists'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {IS_IOS} from '#/env'
import {type app} from '#/lexicons'

type RawListItem =
  | {
      type: 'entry'
      key: string
      entry: app.bsky.unspecced.getAtmosphereTimeline.$OutputBody['feed'][number]
    }
  | {type: 'loading' | 'empty'; key: string}
  | {type: 'error'; key: string; error: string}

export function RawActivityList() {
  const {t: l} = useLingui()
  const initialNumToRender = useInitialNumToRender()
  const [refreshing, setRefreshing] = useState(false)
  const query = useAtmosphereQuery()
  const error = query.error ? cleanError(query.error) : undefined
  const entries: RawListItem[] =
    query.data?.pages.flatMap((page, pageIndex) =>
      page.feed.map((entry, index) => ({
        type: 'entry' as const,
        key: `raw:${pageIndex}:${index}`,
        entry,
      })),
    ) ?? []
  const hasRows = entries.length > 0
  const items: RawListItem[] = hasRows
    ? entries
    : error
      ? [{type: 'error', key: 'error', error}]
      : query.data
        ? [{type: 'empty', key: 'empty'}]
        : [{type: 'loading', key: 'loading'}]

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await query.refetch()
    } finally {
      setRefreshing(false)
    }
  }
  const fetchNextPage = () => query.fetchNextPage({cancelRefetch: false})
  const onEndReached = () => {
    if (
      !hasRows ||
      !query.hasNextPage ||
      query.isFetching ||
      query.isFetchingNextPage ||
      query.error
    )
      return
    void fetchNextPage()
  }

  return (
    <List
      testID="atmosphereRawList"
      data={items}
      contentContainerStyle={a.pb_2xl}
      keyExtractor={(item: RawListItem) => item.key}
      renderItem={({item}: {item: RawListItem}) => {
        switch (item.type) {
          case 'entry':
            return (
              <View testID="atmosphereRawRow" style={[a.px_xl, a.py_md]}>
                <Text testID="atmosphereRawEntry" selectable style={a.text_xs}>
                  {JSON.stringify(item.entry, null, 2)}
                </Text>
              </View>
            )
          case 'loading':
            return (
              <View
                testID="atmosphereRawLoading"
                style={[a.align_center, a.py_5xl]}>
                <Loader size="xl" />
              </View>
            )
          case 'empty':
            return (
              <EmptyState
                testID="atmosphereRawEmpty"
                icon={AtomIcon}
                message={l`There’s no activity to show yet.`}
              />
            )
          case 'error':
            return (
              <EmptyState
                testID="atmosphereRawError"
                icon={AtomIcon}
                message={l`Unable to load activity: ${item.error}`}
                button={{
                  label: l`Retry loading raw activity`,
                  text: l`Retry`,
                  onPress: () => void query.refetch(),
                  size: 'small',
                  color: 'secondary',
                }}
              />
            )
        }
      }}
      refreshing={refreshing}
      onRefresh={() => void onRefresh()}
      onEndReached={onEndReached}
      onEndReachedThreshold={4}
      ListFooterComponent={
        hasRows ? (
          <ListFooter
            isFetchingNextPage={query.isFetchingNextPage}
            hasNextPage={query.hasNextPage}
            error={error}
            onRetry={fetchNextPage}
          />
        ) : undefined
      }
      initialNumToRender={initialNumToRender}
      windowSize={9}
      maxToRenderPerBatch={IS_IOS ? 5 : 1}
      updateCellsBatchingPeriod={40}
      sideBorders={false}
    />
  )
}
