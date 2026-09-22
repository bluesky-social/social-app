import {useState} from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {cleanError} from '#/lib/strings/errors'
import {EmptyState} from '#/view/com/util/EmptyState'
import {List} from '#/view/com/util/List'
import {
  type ActivityListItem,
  buildActivityListItems,
} from '#/screens/Atmosphere/model'
import {useAtmosphereRawQuery} from '#/screens/Atmosphere/query'
import {atoms as a} from '#/alf'
import {Atom_Stroke2_Corner0_Rounded as AtomIcon} from '#/components/icons/Atom'
import {ListFooter} from '#/components/Lists'
import {Loader} from '#/components/Loader'
import {IS_IOS} from '#/env'
import {RawActivityFootnote} from './RawActivityFootnote'

export function RawActivityList() {
  const {t: l} = useLingui()
  const initialNumToRender = useInitialNumToRender()
  const [refreshing, setRefreshing] = useState(false)
  const query = useAtmosphereRawQuery()
  const error = query.error ? cleanError(query.error) : undefined
  const items = buildActivityListItems(query.data, error)
  const hasRows = items.some(item => item.type === 'activity')

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
    if (!hasRows || !query.hasNextPage || query.isFetching || query.error)
      return
    void fetchNextPage()
  }

  return (
    <List
      testID="atmosphereRawList"
      data={items}
      contentContainerStyle={a.pb_2xl}
      keyExtractor={(item: ActivityListItem) => item.key}
      renderItem={({item}: {item: ActivityListItem}) => {
        switch (item.type) {
          case 'activity':
            return (
              <View testID="atmosphereRawRow" style={[a.px_xl, a.py_md]}>
                <RawActivityFootnote item={item} />
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
          case 'group':
            return null
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
