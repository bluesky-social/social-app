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
 *
 * Every callback carries this list instance's generation, captured by value,
 * so the probe can drop whatever a retired list still delivers.
 */
function createHandlers(probe: Probe, generation: number) {
  const {onNativeScroll, onDrag, onMomentumEnd} = probe
  return {
    onScroll: (e: NativeScrollEvent) => {
      'worklet'
      scheduleOnRN(
        onNativeScroll,
        generation,
        e.contentOffset.y,
        e.contentSize.height,
        e.layoutMeasurement.height,
      )
    },
    onBeginDrag: () => {
      'worklet'
      scheduleOnRN(onDrag, generation, true)
    },
    onEndDrag: () => {
      'worklet'
      scheduleOnRN(onDrag, generation, false)
    },
    onMomentumEnd: () => {
      'worklet'
      scheduleOnRN(onMomentumEnd, generation)
    },
    setList: (instance: ListMethods | null) => {
      probe.setList(generation, instance)
    },
    onContentSizeChange: (width: number, height: number) => {
      probe.onContentSizeChange(generation, width, height)
    },
    onViewableItemsChanged: (info: {
      viewableItems: Array<{index?: number | null}>
    }) => {
      probe.onViewableItemsChanged(generation, info)
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
  generation,
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
  /** From `probe.reset()`, and part of this list's key. */
  generation: number
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
  const [handlers] = useState(() => createHandlers(probe, generation))

  // Runs after VirtualizedList's own componentDidUpdate for this data.
  useLayoutEffect(() => {
    probe.onRowsCommitted(generation, rows, minIndexForVisible)
  }, [probe, generation, rows, minIndexForVisible])

  const renderItem = ({item}: {item: LabRow}) => (
    <Row
      row={item}
      probe={probe}
      generation={generation}
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
        ref={handlers.setList}
        data={rows}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        maintainVisibleContentPosition={{minIndexForVisible}}
        removeClippedSubviews={removeClippedSubviews}
        windowSize={windowSize}
        initialNumToRender={initialNumToRender}
        maxToRenderPerBatch={maxToRenderPerBatch}
        ListHeaderComponent={listHeader ? ListHeader : undefined}
        onContentSizeChange={handlers.onContentSizeChange}
        onViewableItemsChanged={handlers.onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
        disableFullWindowScroll
        style={a.flex_1}
      />
    </ScrollProvider>
  )
})
