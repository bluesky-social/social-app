import {useEffect, useRef, useState} from 'react'
import {ScreenGeometry} from 'lib/hooks/waverly/useScreenGeometry'
import {
  Animated,
  GestureResponderEvent,
  PanResponderGestureState,
  PanResponderCallbacks,
} from 'react-native'
import {Haptics} from 'lib/haptics'
import {useFunctionRef} from './useFunctionRef'
import {useAnimatedValueXY} from './useAnimatedValueXY'

type TransformType = (
  | {translateX: Animated.AnimatedNode}
  | {translateY: Animated.AnimatedNode}
)[]

export interface Pointer {
  pageX: number
  pageY: number
  x: number
  y: number
}

export interface PointerComponentProps {
  // Pointer controlled by this draggable component
  onPointerMoved: (pointer?: Pointer) => void
}

export type ReleaseComponentFunction = (
  toPos?: {x: number; y: number} | null,
  callback?: () => void,
) => void

interface Params extends PointerComponentProps {
  onGeometryComputed?: (geometry?: ScreenGeometry) => void
  onDragStart?: () => any
  // releaseComponent must be called if an onDragStop is provided
  onDragStop?: (releaseComponent: ReleaseComponentFunction) => any
  pointerDelta?: {x: number; y: number}
  animDuration: number
}

interface Return {
  transform: TransformType
  forceStartDragging: () => void
  panResponderCallbacks: PanResponderCallbacks
}

export function useMovingBlocksPointer({
  onPointerMoved: _onPointerMoved,
  onDragStart: _onDragStart,
  onDragStop: _onDragStop,
  pointerDelta: _pointerDelta,
  animDuration: _animDuration,
}: Params): Return {
  const [transform, setTransform] = useState<TransformType>([])

  const [onPointerMoved] = useFunctionRef(_onPointerMoved)
  const [onDragStart] = useFunctionRef(_onDragStart)
  const [onDragStop, isOnDragStopUndefined] = useFunctionRef(_onDragStop)
  const panVal = useAnimatedValueXY()

  const refs = useRef({
    pointerDelta: {x: 0, y: 0},
    isDragging: false,
    animDuration: _animDuration,
  }).current

  useEffect(() => {
    refs.pointerDelta = _pointerDelta ? _pointerDelta : {x: 0, y: 0}
  }, [_pointerDelta, refs])

  useEffect(() => {
    refs.animDuration = _animDuration
  }, [_animDuration, refs])

  const [releaseComponent] = useFunctionRef(
    (toPos?: {x: number; y: number} | null, callback?: () => void) => {
      const toValue = toPos ? toPos : {x: 0, y: 0}

      // Move the component back to its initial position.
      Animated.timing(panVal, {
        duration: refs.animDuration,
        toValue,
        useNativeDriver: false,
      }).start(() => {
        if (!refs.isDragging) {
          panVal.setValue({x: 0, y: 0})
          onPointerMoved(undefined)
          setTransform([])
          if (callback) callback()
        }
      })
    },
  )

  const [startDragging] = useFunctionRef(() => {
    if (refs.isDragging) return
    refs.isDragging = true
    panVal.removeAllListeners()
    setTransform([{translateX: panVal.x}, {translateY: panVal.y}])
    panVal.addListener(({x, y}) => {
      if (!refs.isDragging) return
      const {x: dx, y: dy} = refs.pointerDelta
      onPointerMoved({pageX: x + dx, pageY: y + dy, x, y})
    })
    const {x: dx, y: dy} = refs.pointerDelta
    onPointerMoved({pageX: dx, pageY: dy, x: 0, y: 0})
    onDragStart()
    Haptics.default()
  })

  const onPanResponderMove = (
    e: GestureResponderEvent,
    gestureState: PanResponderGestureState,
  ) => {
    if (refs.isDragging) {
      Animated.event([null, {dx: panVal.x, dy: panVal.y}], {
        useNativeDriver: false,
      })(e, gestureState)
    } else {
      startDragging()
    }
  }

  const onPanResponderRelease = () => {
    if (refs.isDragging) {
      refs.isDragging = false
      panVal.removeAllListeners()
      if (!isOnDragStopUndefined()) onDragStop(releaseComponent)
      else releaseComponent()
    }
  }

  const panResponderCallbacks: PanResponderCallbacks = useRef({
    onPanResponderMove,
    onPanResponderRelease,
  }).current

  return {
    transform,
    forceStartDragging: startDragging,
    panResponderCallbacks,
  }
}
