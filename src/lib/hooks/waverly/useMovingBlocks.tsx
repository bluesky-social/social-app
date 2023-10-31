import React, {useCallback, useEffect, useRef, useState} from 'react'
import {ScreenGeometry, useScreenGeometry} from './useScreenGeometry'
import {
  Animated,
  LayoutChangeEvent,
  PanResponder,
  PanResponderCallbacks,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native'
import {Haptics} from 'lib/haptics'
import {Pointer} from './useMovingBlocksPointer'
import {InsertionPoint} from 'state/models/w2/WordDJModel'
import {useTimer} from '../useTimer'
import {
  appendRanges,
  bounceInterpolation,
  decayAnimation,
  minScrollValue,
  springAnimation,
} from 'lib/waverly/anim-helper'
import {useFunctionRef} from './useFunctionRef'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'

const LONG_PRESS_DURATION = 200

type TransformType = (
  | {translateX: Animated.AnimatedNode}
  | {translateY: Animated.AnimatedNode}
)[]

type BlockState = 'default' | 'pressing' | 'canceled' | 'dragging' | 'moving'

// Any block that is added to a BlockList should support these props:
export interface BaseBlockProps {
  scrollViewGeometry?: ScreenGeometry
  targetPos: React.RefObject<{x: number; y: number} | undefined>
  onLayout?: (e: LayoutChangeEvent) => void
  transform: TransformType
  children?: React.ReactNode
  state: BlockState
  setState: React.Dispatch<React.SetStateAction<BlockState>>
  createPanResponderCallbacks: (
    blockCallbacks: PanResponderCallbacks,
  ) => PanResponderCallbacks
}

type MoveType = 'up' | 'down' | 'none'

interface ChildInfo<BlockProps extends BaseBlockProps> {
  index: number
  deltaY: Animated.Value
  move: MoveType
  targetPos: React.MutableRefObject<{x: number; y: number} | undefined>
  props: BlockProps
  geometry?: {y: number; height: number}
  state: BlockState
  setState: React.Dispatch<React.SetStateAction<BlockState>>
  onLayout: (e: LayoutChangeEvent) => void
  createPanResponderCallbacks: (
    blockCallbacks: PanResponderCallbacks,
  ) => PanResponderCallbacks
}

export interface PlaceholderInfo {
  top?: number
  height: number
}

type ExtraBlockProps<BlockProps extends BaseBlockProps> =
  | Omit<BlockProps, keyof BaseBlockProps>
  | ((key: React.Key) => Omit<BlockProps, keyof BaseBlockProps>)

type ScrollState = 'idle' | 'dragging' | 'snapping' | 'decaying'

interface Refs {
  disabled: boolean
  contentGeometry?: ScreenGeometry
  visibleScrollHeight: number
  scrollState: ScrollState
  scrollVal: number
  scrollVelocity: number
  activeBlock?: React.Key
}

interface Params<BlockProps extends BaseBlockProps> {
  pointer?: Pointer
  defaultsPlaceholderHeight: number
  blocksGap: number
  draggedBlockKey?: React.Key
  insertionPoint: React.MutableRefObject<InsertionPoint | undefined>

  blockType: React.ComponentType<BlockProps>
  blockProps: ExtraBlockProps<BlockProps>

  setPlaceholderInfo?: (info?: PlaceholderInfo) => void

  animDuration: number

  visibleScrollHeight: number
  disabled?: boolean

  style?: StyleProp<ViewStyle>
  containerStyle?: StyleProp<ViewStyle>
}

export const useMovingBlocks = <BlockProps extends BaseBlockProps>({
  pointer,
  defaultsPlaceholderHeight,
  blocksGap,
  draggedBlockKey,
  insertionPoint,
  blockType: CustomBlock,
  blockProps,
  setPlaceholderInfo,
  animDuration,
  visibleScrollHeight,
  disabled,
  style,
  containerStyle,
}: Params<BlockProps>) => {
  const childrenInfo = useRef<{[key: React.Key]: ChildInfo<BlockProps>}>({})
  const [childrenState, setChildrenState] = useState<{
    [key: React.Key]: BlockState
  }>({})

  const scrollVal = useAnimatedValue(0)
  const [transform, setTransform] = useState<TransformType>([])
  const [scrollState, setScrollState] = useState<ScrollState>('idle')

  const {ref, onLayout, screenGeometry} = useScreenGeometry()

  const refs = useRef<Refs>({
    disabled: !!disabled,
    visibleScrollHeight,
    scrollState: 'idle',
    scrollVal: 0,
    scrollVelocity: 0,
  }).current

  useEffect(() => {
    refs.disabled = !!disabled
    if (disabled) setPlaceholderInfo?.(undefined)
  }, [refs, disabled, setPlaceholderInfo])

  const [animateSnap] = useFunctionRef((snapTo: number) => {
    refs.scrollState = 'snapping' // Place it in refs, otherwise we recurse
    setScrollState('snapping')
    springAnimation(scrollVal, snapTo, refs.scrollVelocity).start(() => {
      setScrollState(curr => (curr === 'snapping' ? 'idle' : curr))
    })
  })

  const [snapIfNeeded] = useFunctionRef(() => {
    const min = minScrollValue(
      refs.visibleScrollHeight,
      refs.contentGeometry?.height ?? 0,
    )
    if (refs.scrollVal > 0) animateSnap(0)
    else if (refs.scrollVal < min) animateSnap(min)
  })

  useEffect(() => {
    scrollVal.addListener(({value}) => {
      refs.scrollVal = value
      if (refs.scrollState === 'idle' || refs.scrollState === 'decaying')
        snapIfNeeded()
    })
    return () => {
      scrollVal.removeAllListeners()
    }
  }, [refs, scrollVal, snapIfNeeded])

  useEffect(() => {
    refs.contentGeometry = screenGeometry
    refs.visibleScrollHeight = visibleScrollHeight
    refs.scrollState = scrollState
    if (scrollState === 'idle' || scrollState === 'decaying') snapIfNeeded()
  }, [refs, visibleScrollHeight, screenGeometry, scrollState, snapIfNeeded])

  useEffect(() => {
    const min = minScrollValue(visibleScrollHeight, screenGeometry?.height ?? 0)
    const top = bounceInterpolation(0, 'top')
    const bottom = bounceInterpolation(min, 'bottom')
    const translateY = scrollVal.interpolate(appendRanges(bottom, top))
    setTransform([{translateY}])
  }, [scrollVal, visibleScrollHeight, screenGeometry])

  // TODO: This gets called repetitively as the user drags the pointer around
  // the screen. It's a pretty heavy javascript function, but it only really
  // does anything when the pointer crosses the middle line of a block.
  // We could speed it up by precomputing, when dragging starts, a collection
  // of Y-regions and the state that we should switch to when the pointer enters
  // any of these Y-regions.
  useEffect(() => {
    if (disabled) return
    const infos = childrenInfo.current
    let moveDist = defaultsPlaceholderHeight + blocksGap
    let moveUpAboveY: number | undefined
    const phInfo: PlaceholderInfo = {height: defaultsPlaceholderHeight}
    const draggedGeo = !!draggedBlockKey && infos[draggedBlockKey]?.geometry
    if (draggedGeo) {
      moveDist = draggedGeo.height + blocksGap
      phInfo.top = draggedGeo.y + refs.scrollVal
      phInfo.height = draggedGeo.height
      moveUpAboveY = phInfo.top + (refs.contentGeometry?.pageY ?? 0)
    }
    let lastBottom: number | undefined
    let moveOccurred = false
    const keys = Object.keys(infos)
    let newInsertionPoint: InsertionPoint | undefined
    for (let i = 0; i < keys.length; ++i) {
      const key = keys[i]
      if (key === draggedBlockKey) {
        infos[key].deltaY.setValue(0)
        continue
      }
      const info = infos[key]
      info.targetPos.current = undefined
      const geo = info.geometry
      if (!geo) continue
      const top = geo.y + refs.scrollVal
      const bottom = top + geo.height
      const pageY = top + (refs.contentGeometry?.pageY ?? 0)
      if (bottom > (lastBottom ?? 0)) lastBottom = bottom
      const midY = pageY + geo.height / 2
      let move: MoveType = 'none'
      if (pointer) {
        const pointerY = pointer.pageY + (draggedBlockKey ? refs.scrollVal : 0)
        if (moveUpAboveY && midY > moveUpAboveY) {
          if (midY < pointerY + moveDist) move = 'up'
        } else if (midY > pointerY) move = 'down'
      }
      if (move === 'down' && top < (phInfo.top ?? +Infinity)) {
        phInfo.top = top
        newInsertionPoint = {type: 'before', key}
      }
      if (move === 'up' && top > (phInfo.top ?? -Infinity)) {
        phInfo.top = bottom - moveDist + blocksGap
        newInsertionPoint = {type: 'after', key}
      }

      // Animate if there's a change
      if (move !== info.move) {
        moveOccurred = true
        info.move = move
        Animated.timing(infos[key].deltaY, {
          duration: animDuration,
          toValue: move === 'none' ? 0 : move === 'down' ? moveDist : -moveDist,
          useNativeDriver: false,
        }).start()
      }
    }
    if (pointer) insertionPoint.current = newInsertionPoint

    if (phInfo.top === undefined)
      phInfo.top = lastBottom !== undefined ? lastBottom + blocksGap : undefined
    setPlaceholderInfo?.(phInfo)
    if (draggedBlockKey && phInfo.top !== undefined) {
      const info = infos[draggedBlockKey]
      info.targetPos.current = {
        x: 0,
        y: phInfo.top - (info.geometry?.y ?? 0) - refs.scrollVal,
      }
    }

    if (moveOccurred) Haptics.default()
  }, [
    animDuration,
    blocksGap,
    defaultsPlaceholderHeight,
    draggedBlockKey,
    insertionPoint,
    pointer,
    setPlaceholderInfo,
    disabled,
    refs,
  ])

  const [startLongPressTimer, cancelLongPressTimer] = useTimer(
    LONG_PRESS_DURATION,
    () => {
      setChildrenState(curr => {
        const key = refs.activeBlock
        if (!key || curr[key] === 'dragging') return curr
        childrenInfo.current[key].state = 'dragging'
        return {...curr, [key]: 'dragging' as BlockState}
      })
    },
    false,
  )

  const scrollResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => {
        const key = refs.activeBlock
        return !key || childrenInfo.current[key].state !== 'dragging'
      },
      onPanResponderGrant: () => {
        scrollVal.stopAnimation()
        scrollVal.extractOffset()
        setScrollState('dragging')
      },
      onPanResponderMove: (e, gestureState) => {
        refs.scrollVelocity = gestureState.vy
        Animated.event([null, {dy: scrollVal}], {
          useNativeDriver: false,
        })(e, gestureState)
      },
      onPanResponderRelease: (_e, gestureState) => {
        scrollVal.flattenOffset()
        refs.scrollVelocity = gestureState.vy
        scrollVal.stopAnimation()
        decayAnimation(scrollVal, gestureState.vy).start(() => {
          setScrollState(curr => (curr === 'decaying' ? 'idle' : curr))
        })
        setScrollState('decaying')
      },
    }),
  ).current

  const renderChildren = useCallback(
    function renderChildren(children: React.ReactNode) {
      const seenKeys: {[key: React.Key]: ChildInfo<BlockProps>} = {}
      const result = (
        <View ref={ref} onLayout={onLayout} style={style}>
          <Animated.View
            style={[containerStyle, {transform}]}
            {...scrollResponder.panHandlers}>
            {React.Children.map(children, (child, i) => {
              if (!React.isValidElement(child)) return null
              if (!child.key) throw new Error('Moving block needs a key')
              let info = childrenInfo.current[child.key]
              if (!info) {
                const props: BlockProps = (
                  typeof blockProps === 'function'
                    ? blockProps(child.key)
                    : blockProps
                ) as BlockProps
                const setState: React.Dispatch<
                  React.SetStateAction<BlockState>
                > = vOrF => {
                  if (vOrF instanceof Function) {
                    setChildrenState(curr => {
                      if (!child.key) return curr
                      const currV = curr[child.key] ?? 'default'
                      const v = vOrF(currV)
                      if (v === currV) return curr
                      childrenInfo.current[child.key].state = v
                      return {...curr, [child.key]: v}
                    })
                  } else {
                    setChildrenState(curr => {
                      if (!child.key || curr[child.key] === vOrF) return curr
                      childrenInfo.current[child.key].state = vOrF
                      return {...curr, [child.key]: vOrF}
                    })
                  }
                }

                info = {
                  index: i,
                  deltaY: new Animated.Value(0),
                  move: 'none',
                  props,
                  targetPos: {current: undefined},
                  onLayout: e =>
                    (childrenInfo.current[child.key!].geometry =
                      e.nativeEvent.layout),
                  state: 'default',
                  setState,
                  createPanResponderCallbacks: blockCallbacks => ({
                    ...blockCallbacks,
                    onStartShouldSetPanResponder: () => !refs.disabled,
                    onPanResponderGrant: (...args) => {
                      refs.activeBlock = child.key!
                      startLongPressTimer()
                      setState('pressing')
                      blockCallbacks.onPanResponderGrant?.(...args)
                    },
                    onPanResponderRelease: (...args) => {
                      setState(curr => (curr === 'pressing' ? 'default' : curr))
                      refs.activeBlock = undefined
                      cancelLongPressTimer()
                      blockCallbacks.onPanResponderRelease?.(...args)
                    },
                    onPanResponderTerminationRequest: () =>
                      refs.activeBlock !== child.key ||
                      childrenInfo.current[child.key].state !== 'dragging',
                    onPanResponderTerminate: () => {
                      setState('canceled')
                      cancelLongPressTimer()
                    },
                  }),
                }
              } else if (info.index !== i) {
                info.index = i
                info.deltaY.setValue(0)
                info.move = 'none'
                info.targetPos.current = undefined
                info.geometry = undefined
              }
              seenKeys[child.key] = info
              return (
                <CustomBlock
                  {...info.props}
                  key={child.key}
                  keyCopy={child.key}
                  targetPos={info.targetPos}
                  scrollViewGeometry={screenGeometry}
                  onLayout={info.onLayout}
                  transform={[{translateY: info.deltaY}]}
                  state={childrenState[child.key] ?? 'default'}
                  setState={info.setState}
                  createPanResponderCallbacks={
                    info.createPanResponderCallbacks
                  }>
                  {child}
                </CustomBlock>
              )
            })}
          </Animated.View>
        </View>
      )
      childrenInfo.current = seenKeys
      return result
    },
    [
      ref,
      onLayout,
      style,
      containerStyle,
      transform,
      scrollResponder,
      CustomBlock,
      screenGeometry,
      childrenState,
      blockProps,
      refs,
      startLongPressTimer,
      cancelLongPressTimer,
    ],
  )

  return {renderChildren}
}
