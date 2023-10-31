import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  Animated,
  PanResponder,
  StyleProp,
  ViewStyle,
  StyleSheet,
  View,
  Easing,
} from 'react-native'

import {useScreenGeometry} from 'lib/hooks/waverly/useScreenGeometry'
import {usePalette} from 'lib/hooks/usePalette'
//import {clamp} from 'lib/numbers'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Image} from 'expo-image'
import {FabMode} from 'state/models/ui/shell'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {ComposeIcon2} from 'lib/icons'
import {colors, s} from 'lib/styles'
import {PickerContext} from '../util/PickerContext'
import {useStores} from 'state/index'
import {Haptics} from 'lib/haptics'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {useAnimatedValueXY} from 'lib/hooks/waverly/useAnimatedValueXY'

const RESET_ANIM_DURATION = 200

type Pos = {x: number; y: number} | undefined

interface Props {
  offset?: {x: number; y: number}
  onPressed: () => void
  onReleased: () => void
  fabMode: FabMode
  isFabMovable: boolean
  setPos: React.Dispatch<React.SetStateAction<Pos | undefined>>
  setSize?: React.Dispatch<
    React.SetStateAction<{width: number; height: number} | undefined>
  >
  style?: StyleProp<ViewStyle>
}

export const DraggableFab = ({
  offset,
  onPressed,
  onReleased,
  fabMode,
  isFabMovable,
  setPos,
  setSize,
  style,
}: Props) => {
  const {ref, onLayout, screenGeometry} = useScreenGeometry()
  const safeAreaInsets = useSafeAreaInsets()
  const pal = usePalette('primary')

  /////////////////////////////////////////////////////////////////////////////
  // FAB state

  // True while the FAB is being dragged.
  const isDragging = useRef(true)

  // Disables dragging while the FAB is animating back to its initial position.
  const canDrag = useRef(true)

  // Track if moving the FAB has been disabled by the screen.
  const isFabMovablePersistentMirror = useRef(isFabMovable)
  isFabMovablePersistentMirror.current = isFabMovable

  // Amount the user has dragged the FAB away from its initial position.
  const panVal = useAnimatedValueXY()
  const posVal = useAnimatedValueXY()

  // Scaling as the FAB comes in and out of view.
  const scaleVal = useAnimatedValue(1)

  // Center of the FAB in screenspace, computed post layout.
  const center = useRef({x: 0, y: 0})

  // Call the setPos callback while the FAB is dragging.
  const panValListener = useCallback(
    ({x, y}: {x: number; y: number}) => {
      if (isDragging.current)
        setPos({x: x + center.current.x, y: y + center.current.y})
    },
    [setPos],
  )
  useEffect(() => {
    if (offset)
      Animated.timing(posVal, {
        toValue: {x: offset.x, y: offset?.y},
        duration: 250,
        useNativeDriver: false,
        easing: Easing.ease,
      }).start()
  }, [offset, posVal])

  useEffect(() => {
    panVal.addListener(panValListener)
    return () => {
      panVal.removeAllListeners()
    }
  }, [panVal, panValListener])

  // Maintain the center of the FAB in screenspace, computed post layout.
  useEffect(() => {
    if (screenGeometry) {
      const {pageX, pageY, width, height} = screenGeometry
      center.current = {x: pageX + width / 2, y: pageY + height / 2}
      setSize?.({width, height})
    }
  }, [screenGeometry, setSize])

  const [requestedFabMode, setRequestedFabMode] = useState<FabMode>(fabMode)
  const [renderFabMode, setRenderFabMode] = useState<FabMode>(fabMode)
  useEffect(() => {
    if (fabMode !== requestedFabMode) {
      setRequestedFabMode(fabMode)
      scaleVal.setValue(1)
      Animated.timing(scaleVal, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.ease,
      }).start(() => {
        setRenderFabMode(fabMode)
        Animated.timing(scaleVal, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.in(Easing.bounce),
        }).start()
      })
    }
  }, [fabMode, requestedFabMode, scaleVal])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () =>
        canDrag.current && isFabMovablePersistentMirror.current,
      onMoveShouldSetPanResponder: () =>
        canDrag.current && isFabMovablePersistentMirror.current,
      onPanResponderGrant: () => {
        isDragging.current = true
        onPressed()
      },
      onPanResponderMove: Animated.event([null, {dx: panVal.x, dy: panVal.y}], {
        useNativeDriver: false,
      }),
      onPanResponderEnd: () => {
        isDragging.current = false
        canDrag.current = false // Mark FAB as being unable to drag, until animation is complete.
        setPos(undefined)
        onReleased()

        // Animate the FAB back to its initial position.
        Animated.timing(panVal, {
          toValue: {x: 0, y: 0},
          duration: RESET_ANIM_DURATION,
          useNativeDriver: false,
        }).start(() => (canDrag.current = true)) // Mark the FAB as draggable when finished.
      },
    }),
  ).current

  return (
    <Animated.View
      ref={ref}
      onLayout={onLayout}
      {...panResponder.panHandlers}
      style={[
        style,
        {
          bottom: safeAreaInsets.bottom, // clamp(safeAreaInsets.bottom, 15, 30) + 2,
        },
        pal.viewInverted,
        // debugGeom.hitbox,
        {
          transform: [
            {translateX: Animated.add(panVal.x, posVal.x)},
            {translateY: Animated.add(panVal.y, posVal.y)},
          ],
        },
      ]}>
      <Animated.View
        style={[
          {
            transform: [
              {
                scale: scaleVal.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              },
            ],
          },
        ]}>
        {renderFabMode === 'waverly' && (
          <Image
            accessibilityIgnoresInvertColors
            source={require('../../../../../assets/images/WaverlyCommaInverted.png')}
            style={styles.waverlyAvatar}
            contentFit="cover"
          />
        )}
        {renderFabMode === 'create' && (
          <ComposeIcon2 strokeWidth={1.5} size={32} style={s.white} />
        )}
        {renderFabMode === 'plus' && (
          <FontAwesomeIcon
            icon="plus"
            size={24}
            style={pal.textInverted as FontAwesomeIconStyle}
          />
        )}
      </Animated.View>
    </Animated.View>
  )
}

////////////////////////////////////////////////////////////////////////////////

export interface PickableData {
  x: number
  y: number
  width: number
  height: number
  pageX: number
  pageY: number
  pickID: string
  data: any
  type: FabPickableType
  zOrder: number
}

const usePickableData = (
  pickID: string,
  data: any,
  type: FabPickableType,
  zOrder: number,
) => {
  const ref = useRef<View>(null)
  const [pickableData, setPickableData] = useState<PickableData | undefined>()

  const store = useStores()
  const onLayout = useCallback(() => {
    if (!ref?.current) return
    ref.current.measure((x, y, width, height, pageX, pageY) => {
      const pd: PickableData = {
        x,
        y,
        width,
        height,
        pageX,
        pageY,
        pickID,
        data,
        type,
        zOrder,
      }
      store.shell.setPickableData(pd)
      setPickableData(pd)
    })
  }, [pickID, data, type, zOrder, store.shell])

  return {ref, onLayout, pickableData}
}

////////////////////////////////////////////////////////////////////////////////

export type FabPickableType =
  | 'UGCBody'
  | 'RecBody'
  | 'userInfo'
  | 'groupInfo'
  | 'postText'
  | 'embedInfo'
  | 'unknown'

interface FabPickableProps {
  pickID: string
  data?: any
  type?: FabPickableType
  zOrder?: number
  enableHitbox?: boolean
  enableHitRegion?: boolean
  style?: StyleProp<ViewStyle>
  children?: React.ReactNode
}

export function FabPickable({
  pickID,
  data = undefined,
  type = 'unknown',
  zOrder = 1,
  enableHitbox = false, // Toggle these to visualize hit regions.
  enableHitRegion = false, // Toggle these to visualize hit regions.
  style,
  children,
}: FabPickableProps) {
  const pickerContext = useContext(PickerContext)

  const {ref, onLayout, pickableData} = usePickableData(
    pickID,
    data,
    type,
    zOrder,
  )
  useEffect(() => {
    if (pickableData) {
      // Intentionally left blank.
    }
  }, [pickableData])

  if (!pickerContext.isPicking) return <>{children}</>

  return (
    <View
      ref={ref}
      onLayout={onLayout}
      style={[
        pickerContext.hitting === pickID
          ? styles.rollover
          : pickerContext.isPressing
          ? styles.softShadow
          : null,

        // Hitbox viz.
        enableHitbox ? debugGeom.hitbox : null,

        // Hitregion viz.
        enableHitRegion && pickerContext.hitting === pickID
          ? debugGeom.hitRegion
          : null,
        style,
      ]}>
      {children}
    </View>
  )
}

export const useOnFabPickMoved = (
  fabSize: {width: number; height: number} | undefined,
) => {
  const store = useStores()
  const onFabMoved = React.useCallback(
    (x: number, y: number) => {
      const xLeft = x - fabSize!.width / 2
      const xRight = x + fabSize!.width / 2
      const yTop = y - fabSize!.height / 2
      const yBottom = y + fabSize!.height / 2
      //console.log(x, y, xLeft, xRight, yTop, yBottom)

      const oldPickID = store.shell.hitting.pickID
      store.shell.clearHitting()

      let highestKey: string = ''
      let highestZ = -1
      store.shell.pickableData.forEach((pd: PickableData, key: string) => {
        //console.log(pd)
        if (pd.zOrder > highestZ) {
          const topY = pd.pageY
          const bottomY = pd.pageY + pd.height
          const leftX = pd.pageX
          const rightX = pd.pageX + pd.width

          if (
            xLeft < rightX &&
            xRight > leftX &&
            yTop < bottomY &&
            yBottom > topY
          ) {
            highestKey = key
            highestZ = pd.zOrder
          }
        }
      })

      if (highestKey.length) {
        //console.log('              in ', highestKey)
        store.shell.setHitting(highestKey)

        // Play a haptic if we picked something new.
        if (highestKey !== oldPickID) Haptics.default()
      }
      //console.log('=====================================')
    },
    [fabSize, store.shell],
  )
  return onFabMoved
}

const styles = StyleSheet.create({
  waverlyAvatar: {
    width: 48,
    height: 48,
  },

  softShadow: {
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.8,
    shadowColor: colors.white,
    shadowRadius: 8,
  },

  rollover: {
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.4,
    shadowColor: colors.waverly1,
    shadowRadius: 4,
  },
})

/** Various styles for debugging screen geometry. */
const debugGeom = StyleSheet.create({
  /** Use this style on your View to visualize its hitbox. */
  hitbox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ff0000',
  },
  /** Use this style on your View to visualize the hit region with translucent red. */
  hitRegion: {
    backgroundColor: '#ff000030', // Translucent red background
  },
})
