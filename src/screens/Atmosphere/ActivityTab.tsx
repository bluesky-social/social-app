import {useState} from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {cleanError} from '#/lib/strings/errors'
import {EmptyState} from '#/view/com/util/EmptyState'
import {List} from '#/view/com/util/List'
import {TimelineRow} from '#/screens/Atmosphere/components/TimelineRow'
import {buildActivityListItems} from '#/screens/Atmosphere/model'
import {buildActivityPresentationListItems} from '#/screens/Atmosphere/presentation'
import {useAtmosphereQuery} from '#/screens/Atmosphere/query'
import {
  type ActivityTimelineListItem,
  buildActivityTimelineItems,
} from '#/screens/Atmosphere/timeline'
import {useTimelineNow} from '#/screens/Atmosphere/useTimelineNow'
import {atoms as a} from '#/alf'
import {Atom_Stroke2_Corner0_Rounded as AtomIcon} from '#/components/icons/Atom'
import {ListFooter} from '#/components/Lists'
import {Loader} from '#/components/Loader'
import {IS_IOS} from '#/env'

export function AtmosphereActivityTab() {
  const initialNumToRender = useInitialNumToRender()
  const [isPTRing, setIsPTRing] = useState(false)
  const query = useAtmosphereQuery()
  const now = useTimelineNow()
  const items = buildActivityListItems(
    query.data,
    query.error ? cleanError(query.error) : undefined,
  )
  const timelineItems = buildActivityTimelineItems(
    buildActivityPresentationListItems(items),
    now,
  )
  const hasActivityRows = timelineItems.some(item => item.layout)

  const onRefresh = async () => {
    setIsPTRing(true)
    try {
      await query.refetch()
    } finally {
      setIsPTRing(false)
    }
  }

  const onEndReached = async () => {
    if (
      query.isFetchingNextPage ||
      !query.hasNextPage ||
      query.error ||
      !hasActivityRows
    ) {
      return
    }
    try {
      await query.fetchNextPage()
    } catch {}
  }

  return (
    <List
      testID="atmosphereList"
      data={timelineItems}
      contentContainerStyle={{paddingBottom: 24}}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      refreshing={isPTRing}
      onRefresh={() => void onRefresh()}
      onEndReached={() => void onEndReached()}
      onEndReachedThreshold={4}
      ListFooterComponent={
        hasActivityRows ? (
          <ListFooter
            isFetchingNextPage={query.isFetchingNextPage}
            hasNextPage={query.hasNextPage}
            error={query.error ? cleanError(query.error) : undefined}
            onRetry={query.fetchNextPage}
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

function AtmosphereLoading() {
  return (
    <View style={[a.w_full, a.align_center, a.py_5xl]}>
      <Loader size="xl" />
    </View>
  )
}

function AtmosphereEmpty() {
  const {t: l} = useLingui()
  return (
    <EmptyState
      icon={AtomIcon}
      message={l`There’s no activity to show yet.`}
      testID="atmosphereEmptyState"
    />
  )
}

function AtmosphereError({error}: {error: string}) {
  const {t: l} = useLingui()
  const query = useAtmosphereQuery()

  return (
    <EmptyState
      icon={AtomIcon}
      message={l`Unable to load activity: ${error}`}
      testID="atmosphereErrorState"
      button={{
        label: l`Retry loading activity`,
        text: l`Retry`,
        onPress: () => void query.refetch(),
        size: 'small',
        color: 'secondary',
      }}
    />
  )
}

function renderItem({item}: {item: ActivityTimelineListItem}) {
  switch (item.item.type) {
    case 'loading':
      return <AtmosphereLoading />
    case 'empty':
      return <AtmosphereEmpty />
    case 'error':
      return <AtmosphereError error={item.item.error} />
    case 'activity':
    case 'group':
      return item.computedItemView && item.layout ? (
        <TimelineRow
          item={item.item}
          computedItemView={item.computedItemView}
          layout={item.layout}
        />
      ) : null
  }
}

const keyExtractor = (item: ActivityTimelineListItem) => item.item.key
