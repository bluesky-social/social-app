import React, {useEffect, useState, useMemo} from 'react'
import {FlatList, StyleSheet, View} from 'react-native'
import {GestureDetector, Gesture} from 'react-native-gesture-handler'
import {useSharedValue, withTiming, runOnJS} from 'react-native-reanimated'
import {Selector} from './Selector'

const HEADER_ITEM = {_reactKey: '__header__'}
const SELECTOR_ITEM = {_reactKey: '__selector__'}
const STICKY_HEADER_INDICES = [1]
const SWIPE_GESTURE_MAX_DISTANCE = 200
const SWIPE_GESTURE_VEL_TRIGGER = 2000
const SWIPE_GESTURE_HIT_SLOP = {left: -50, top: 0, right: 0, bottom: 0} // we ignore the left 20 pixels to avoid conflicts with the page-nav gesture

export function ViewSelector({
  sections,
  items,
  refreshing,
  renderHeader,
  renderItem,
  onSelectView,
  onRefresh,
  onEndReached,
}: {
  sections: string[]
  items: any[]
  refreshing?: boolean
  renderHeader?: () => JSX.Element
  renderItem: (item: any) => JSX.Element
  onSelectView?: (viewIndex: number) => void
  onRefresh?: () => void
  onEndReached?: (info: {distanceFromEnd: number}) => void
}) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const swipeGestureInterp = useSharedValue<number>(0)

  // events
  // =

  const onPressSelection = (index: number) => setSelectedIndex(index)
  useEffect(() => {
    onSelectView?.(selectedIndex)
  }, [selectedIndex])

  // gestures
  // =

  const swipeGesture = useMemo(
    () =>
      Gesture.Pan()
        .hitSlop(SWIPE_GESTURE_HIT_SLOP)
        .onUpdate(e => {
          // calculate [-1, 1] range for the gesture
          const clamped = Math.min(e.translationX, SWIPE_GESTURE_MAX_DISTANCE)
          const reversed = clamped * -1
          const scaled = reversed / SWIPE_GESTURE_MAX_DISTANCE
          swipeGestureInterp.value = scaled
        })
        .onEnd(e => {
          const vx = e.velocityX
          if (
            swipeGestureInterp.value >= 0.5 ||
            (vx < 0 && Math.abs(vx) > SWIPE_GESTURE_VEL_TRIGGER)
          ) {
            // swiped to next
            if (selectedIndex < sections.length - 1) {
              // interp to the next item's position...
              swipeGestureInterp.value = withTiming(1, {duration: 100}, () => {
                // ...then update the index, which triggers the useEffect() below [1]
                runOnJS(setSelectedIndex)(selectedIndex + 1)
              })
            } else {
              swipeGestureInterp.value = withTiming(0, {duration: 100})
            }
          } else if (
            swipeGestureInterp.value <= -0.5 ||
            (vx > 0 && Math.abs(vx) > SWIPE_GESTURE_VEL_TRIGGER)
          ) {
            // swiped to prev
            if (selectedIndex > 0) {
              // interp to the prev item's position...
              swipeGestureInterp.value = withTiming(-1, {duration: 100}, () => {
                // ...then update the index, which triggers the useEffect() below [1]
                runOnJS(setSelectedIndex)(selectedIndex - 1)
              })
            } else {
              swipeGestureInterp.value = withTiming(0, {duration: 100})
            }
          } else {
            swipeGestureInterp.value = withTiming(0, {duration: 100})
          }
        }),
    [swipeGestureInterp, selectedIndex, sections.length],
  )
  useEffect(() => {
    // [1] completes the swipe gesture animation by resetting the interp value
    // this has to be done as an effect so that it occurs *after* the selectedIndex has been updated
    swipeGestureInterp.value = 0
  }, [swipeGestureInterp, selectedIndex])

  // rendering
  // =

  const renderItemInternal = ({item}: {item: any}) => {
    if (item === HEADER_ITEM) {
      if (renderHeader) {
        return renderHeader()
      }
      return <View />
    } else if (item === SELECTOR_ITEM) {
      return (
        <Selector
          items={sections}
          selectedIndex={selectedIndex}
          swipeGestureInterp={swipeGestureInterp}
          onSelect={onPressSelection}
        />
      )
    } else {
      return renderItem(item)
    }
  }

  const data = [HEADER_ITEM, SELECTOR_ITEM, ...items]
  return (
    <GestureDetector gesture={swipeGesture}>
      <FlatList
        data={data}
        keyExtractor={item => item._reactKey}
        renderItem={renderItemInternal}
        stickyHeaderIndices={STICKY_HEADER_INDICES}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={onEndReached}
      />
    </GestureDetector>
  )
}

const styles = StyleSheet.create({})
