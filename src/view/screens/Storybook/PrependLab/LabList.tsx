import {memo, useLayoutEffect, useState} from 'react'
import {type NativeScrollEvent} from 'react-native'
import {scheduleOnRN} from 'react-native-worklets'

import {ScrollProvider} from '#/lib/ScrollContext'
import {List, type ListMethods} from '#/view/com/util/List'
import {atoms as a} from '#/alf'
import {type ResizeMode, type ResizeScope} from './config'
import {type LabRow} from './data'
import {type Probe} from './probe'
import {ListHeader, Row} from './Row'

const VIEWABILITY_CONFIG = {itemVisiblePercentThreshold: 1}

function keyExtractor(row: LabRow) {
  return row.id
}

/*
 * Native scroll events, forwarded from the UI thread as they arrive. These are
 * the offsets the native side actually has, unlike VirtualizedList's
 * `_scrollMetrics`, which lags a native mVCP correction.
 */
function createScrollHandlers(probe: Probe) {
  const {onNativeScroll, onDrag, onMomentumEnd} = probe
  return {
    onScroll: (e: NativeScrollEvent) => {
      'worklet'
      scheduleOnRN(
        onNativeScroll,
        e.contentOffset.y,
        e.contentSize.height,
        e.layoutMeasurement.height,
      )
    },
    onBeginDrag: () => {
      'worklet'
      scheduleOnRN(onDrag, true)
    },
    onEndDrag: () => {
      'worklet'
      scheduleOnRN(onDrag, false)
    },
    onMomentumEnd: () => {
      'worklet'
      scheduleOnRN(onMomentumEnd)
    },
  }
}

/**
 * The list under test: the app's `List` wrapper with the knobs applied and
 * nothing else. Props are primitives so that only a data change re-renders
 * it: an unrelated render would queue a VirtualizedList cells update, which is
 * itself one of the conditions under test (scenario 5).
 */
export const LabList = memo(function LabList({
  rows,
  probe,
  minIndexForVisible,
  listHeader,
  removeClippedSubviews,
  windowSize,
  initialNumToRender,
  maxToRenderPerBatch,
  resize,
  resizeScope,
  resizeDelayMs,
}: {
  rows: LabRow[]
  probe: Probe
  minIndexForVisible: number
  listHeader: boolean
  removeClippedSubviews: boolean
  windowSize: number
  initialNumToRender: number
  maxToRenderPerBatch: number
  resize: ResizeMode
  resizeScope: ResizeScope
  resizeDelayMs: number
}) {
  const [handlers] = useState(() => createScrollHandlers(probe))
  const [setListRef] = useState(() => (instance: ListMethods | null) => {
    probe.listRef.current = instance
  })

  // Runs after VirtualizedList's own componentDidUpdate for this data.
  useLayoutEffect(() => {
    probe.onRowsCommitted(rows, minIndexForVisible)
  }, [probe, rows, minIndexForVisible])

  const renderItem = ({item}: {item: LabRow}) => (
    <Row
      row={item}
      probe={probe}
      resize={resize}
      resizeScope={resizeScope}
      resizeDelayMs={resizeDelayMs}
    />
  )

  return (
    <ScrollProvider
      onScroll={handlers.onScroll}
      onBeginDrag={handlers.onBeginDrag}
      onEndDrag={handlers.onEndDrag}
      onMomentumEnd={handlers.onMomentumEnd}>
      <List
        ref={setListRef}
        data={rows}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        maintainVisibleContentPosition={{minIndexForVisible}}
        removeClippedSubviews={removeClippedSubviews}
        windowSize={windowSize}
        initialNumToRender={initialNumToRender}
        maxToRenderPerBatch={maxToRenderPerBatch}
        ListHeaderComponent={listHeader ? ListHeader : undefined}
        onContentSizeChange={probe.onContentSizeChange}
        onViewableItemsChanged={probe.onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
        disableFullWindowScroll
        style={a.flex_1}
      />
    </ScrollProvider>
  )
})
