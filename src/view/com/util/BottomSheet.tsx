import React from 'react'
import {View, Dimensions, Pressable} from 'react-native'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated'
import {smitter} from 'smitter'

type BottomSheetState = {
  index: number
  minIndex: number
  maxIndex: number
  position: number
  pinned: boolean
  offset: number
  snaps: number[]
}

type BottomSheetProps = {
  sheet: ReturnType<typeof useSheet>
}

type InternalEvents = {
  syncState: BottomSheetState
}

export function useSheet({
  index: initialIndex = 0,
  minIndex: initialMinIndex = 0,
  snaps,
  onStateChange,
}: {
  index?: number
  minIndex?: number
  maxIndex?: number
  snaps: (number | string)[]
  onStateChange?: (state: BottomSheetState) => void
}) {
  const internal = React.useMemo(() => smitter<InternalEvents>(), [])
  const dimensions = React.useMemo(() => Dimensions.get('window'), []) // TODO needs change?
  const snapPoints = React.useMemo(() => {
    return snaps.map(p => {
      const px =
        typeof p === 'number' ? p : (parseInt(p) / 100) * dimensions.height
      return px
    })
  }, [snaps, dimensions.height])

  const index = React.useRef(initialIndex)
  const minIndex = React.useRef(Math.max(initialMinIndex, 0))
  const maxIndex = React.useRef(snaps.length - 1)
  const position = React.useRef(
    index.current > -1 ? snapPoints[index.current] : 0,
  )
  const pinned = React.useRef(false)
  const offset = React.useRef(0)

  const getState = React.useCallback(() => {
    return {
      index: index.current,
      minIndex: minIndex.current,
      maxIndex: maxIndex.current,
      position: position.current,
      pinned: pinned.current,
      offset: offset.current,
      snaps: snapPoints,
    }
  }, [snapPoints])

  const syncState = React.useCallback(
    (state: Partial<BottomSheetState>) => {
      if (state.minIndex !== undefined) {
        minIndex.current = Math.max(state.minIndex, 0)
      }
      if (state.maxIndex !== undefined) {
        maxIndex.current = Math.min(state.maxIndex, snapPoints.length - 1)
      }
      if (state.index !== undefined) {
        index.current = Math.max(
          Math.min(state.index, maxIndex.current),
          minIndex.current,
        )
        position.current = snapPoints[index.current]
      }
      if (state.position !== undefined) {
        position.current = Math.max(
          Math.min(state.position, snapPoints[maxIndex.current]),
          snapPoints[minIndex.current],
        )
      }
      if (state.pinned !== undefined) {
        pinned.current = state.pinned
      }
      if (state.offset !== undefined) {
        offset.current = state.offset
      }

      onStateChange?.(getState())
    },
    [getState, onStateChange, snapPoints],
  )

  const setState = React.useCallback(
    (state: Partial<BottomSheetState>) => {
      syncState(state)
      internal.emit('syncState', getState())
    },
    [syncState, getState, internal],
  )

  return {
    get state() {
      return getState()
    },
    open() {
      setState({
        index: 1,
      })
    },
    close() {
      setState({
        index: 0,
        minIndex: 0,
      })
    },
    set index(value: number) {
      setState({index: value})
    },
    get index() {
      return index.current
    },
    set position(value: number | string) {
      const position =
        typeof value === 'number'
          ? value
          : (parseInt(value) / 100) * dimensions.height
      setState({position})
    },
    get position() {
      return position.current
    },
    set minIndex(index: number) {
      setState({minIndex: index})
    },
    get minIndex() {
      return minIndex.current
    },
    set maxIndex(index: number) {
      setState({maxIndex: index})
    },
    get maxIndex() {
      return maxIndex.current
    },
    set pinned(value: boolean) {
      setState({pinned: value})
    },
    get pinned() {
      return pinned.current
    },
    set offset(offset: number) {
      setState({offset})
    },
    get offset() {
      return offset.current
    },
    events: {
      internal,
    },
    _syncState: syncState,
  }
}

export function Sheet({
  children,
  sheet,
}: React.PropsWithChildren<BottomSheetProps>) {
  const state = useSharedValue(sheet.state)
  state.value = sheet.state

  const {index, snaps} = state.value

  const dimensions = React.useMemo(() => Dimensions.get('window'), [])

  const top = useSharedValue(index > -1 ? snaps[index] : 0)
  const animatedSheetStyles = useAnimatedStyle(() => ({
    transform: [{translateY: -top.value}],
  }))

  const offset = useSharedValue(dimensions.height)
  const animatedOuterStyles = useAnimatedStyle(() => ({
    transform: [{translateY: offset.value}],
  }))

  React.useEffect(() => {
    function goToPosition(pos: number) {
      top.value = withTiming(pos, {
        duration: 500,
        easing: Easing.out(Easing.exp),
      })
    }

    sheet.events.internal.on('syncState', s => {
      if (state.value.index != s.index) {
        const pos = index > -1 ? snaps[s.index] : 0
        goToPosition(pos)
      }
      if (state.value.position != s.position) {
        goToPosition(s.position)
      }
      if (state.value.offset != s.offset) {
        offset.value = withTiming(dimensions.height - s.offset, {
          duration: 500,
          easing: Easing.out(Easing.exp),
        })
      }

      state.value = s
    })
  }, [
    snaps,
    dimensions.height,
    index,
    offset,
    sheet.events.internal,
    state,
    top,
  ])

  const pan = Gesture.Pan()
    .onChange(e => {
      top.value = top.value - e.changeY
    })
    .onFinalize(e => {
      // ignore taps
      if (Math.abs(e.translationY) < 5) return

      let y = top.value // from the bottom

      const dir = e.velocityY > 0 ? 1 : -1
      let v = Math.abs(e.velocityY) / 100

      let decayDistance = 0
      while (v > 0.1) {
        v *= 1 - 0.15
        decayDistance += v
      }

      decayDistance = decayDistance * dir
      y = y - decayDistance

      let {index, minIndex, maxIndex, position, pinned} = state.value
      let nextPosition = position

      if (!pinned) {
        for (let i = index; i < snaps.length; i++) {
          const lower = snaps[i - 1] || snaps[0]
          const curr = snaps[i]
          const upper = snaps[i + 1] || snaps[snaps.length - 1]

          const lowerThreshold = (curr - lower) / 2 + lower
          const upperThreshold = (upper - curr) / 2 + curr

          if (y < curr && y < lowerThreshold) {
            index = Math.max(i - 1, minIndex)
            break
          } else if (
            (y <= curr && // less than current snap point
              y > lowerThreshold) || // more than half way to current snap point
            (y >= curr && // more than current snap point
              y < upperThreshold) // less than half way to upper snap point
          ) {
            index = i
            break
          } else if (
            y > upper && // less than upper snap point
            y > upperThreshold // more than current snap point
          ) {
            index = Math.min(i + 1, maxIndex)
            break
          }
        }

        nextPosition = index > 0 ? snaps[index] : 0
      }

      top.value = withTiming(nextPosition, {
        duration: 500,
        easing: Easing.out(Easing.exp),
      })

      // update UI thread state
      state.value = {
        ...state.value,
        index,
        position: nextPosition,
      }

      // update JS thread state without cyclical emit
      runOnJS(sheet._syncState)({index, position: nextPosition})
    })

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
        },
        animatedOuterStyles,
      ]}>
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
            },
            animatedSheetStyles,
          ]}>
          <View
            style={[
              {
                zIndex: 1,
                height: snaps[snaps.length - 1],
              },
            ]}>
            {children}
          </View>

          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 0,
              height: dimensions.height * 2,
            }}
          />
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  )
}

export function Backdrop({sheet}: {sheet: ReturnType<typeof useSheet>}) {
  const active = sheet.position > 0
  const opacity = useSharedValue(0)
  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    top: '-200%',
    bottom: '-200%',
    left: 0,
    right: 0,
    backgroundColor: '#000',
    zIndex: 0,
    opacity: opacity.value,
    display: opacity.value > 0 ? 'flex' : 'none',
  }))

  React.useEffect(() => {
    opacity.value = withTiming(active ? 0.5 : 0, {
      duration: 500,
      easing: Easing.out(Easing.exp),
    })
  }, [active, opacity])

  return (
    <Animated.View style={style}>
      <Pressable
        accessibilityHint="Click here to close the bottom sheet"
        accessibilityLabel="Click here to close the bottom sheet"
        onPress={() => sheet.close()}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        }}
      />
    </Animated.View>
  )
}
