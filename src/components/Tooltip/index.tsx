import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import {Dimensions, View} from 'react-native'
import Animated, {Easing, ZoomIn} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {atoms as a, useTheme} from '#/alf'
import {useOnGesture} from '#/components/hooks/useOnGesture'
import {Portal} from '#/components/Portal'
import {TIP_SIZE} from '#/components/Tooltip/const'

const HALF_TIP = TIP_SIZE / 2
const TIP_VISUAL_OFFSET = TIP_SIZE / 3

type TooltipContextType = {
  position: 'top' | 'bottom'
  ready: boolean
  onVisibleChange: (visible: boolean) => void
}

type TargetContextType = {
  targetMeasurements:
    | {
        x: number
        y: number
        width: number
        height: number
      }
    | undefined
  targetRef: React.RefObject<View>
}

const TooltipContext = createContext<TooltipContextType>({
  position: 'bottom',
  ready: false,
  onVisibleChange: () => {},
})

const TargetContext = createContext<TargetContextType>({
  targetMeasurements: undefined,
  targetRef: {current: null},
})

export function Outer({
  children,
  position = 'bottom',
  visible: requestVisible,
  onVisibleChange,
}: {
  children: React.ReactNode
  position?: 'top' | 'bottom'
  visible: boolean
  onVisibleChange: (visible: boolean) => void
}) {
  /**
   * Whether we have measured the target and are ready to show the tooltip.
   */
  const [ready, setReady] = useState(false)
  /**
   * Lagging state to track the externally-controlled visibility of the
   * tooltip.
   */
  const [prevRequestVisible, setPrevRequestVisible] = useState<
    boolean | undefined
  >()
  /**
   * Needs to reference the element this Tooltip is attached to.
   */
  const targetRef = useRef<View>(null)
  const [targetMeasurements, setTargetMeasurements] = useState<
    | {
        x: number
        y: number
        width: number
        height: number
      }
    | undefined
  >(undefined)

  if (requestVisible && !prevRequestVisible) {
    setPrevRequestVisible(true)

    if (targetRef.current) {
      /*
       * Once opened, measure the dimensions and position of the target
       */
      targetRef.current.measure((_x, _y, width, height, pageX, pageY) => {
        setTargetMeasurements({x: pageX, y: pageY, width, height})
        setReady(true)
      })
    }
  } else if (!requestVisible && prevRequestVisible) {
    setPrevRequestVisible(false)
    setTargetMeasurements(undefined)
    setReady(false)
  }

  const ctx = useMemo(
    () => ({position, ready, onVisibleChange}),
    [position, ready, onVisibleChange],
  )
  const targetCtx = useMemo(
    () => ({targetMeasurements, targetRef}),
    [targetMeasurements, targetRef],
  )

  return (
    <TooltipContext.Provider value={ctx}>
      <TargetContext.Provider value={targetCtx}>
        {children}
      </TargetContext.Provider>
    </TooltipContext.Provider>
  )
}

export function Target({
  children,
}: {
  children: (props: {ref: TargetContextType['targetRef']}) => React.ReactNode
}) {
  const {targetRef} = useContext(TargetContext)

  return children({
    ref: targetRef,
  })
}

export function Content({children}: {children: React.ReactNode}) {
  const {position, ready, onVisibleChange} = useContext(TooltipContext)
  const {targetMeasurements} = useContext(TargetContext)
  const requestClose = useCallback(() => {
    onVisibleChange(false)
  }, [onVisibleChange])

  if (!ready || !targetMeasurements) return null

  return (
    <Portal>
      <Bubble
        position={position}
        /*
         * Gotta pass these in here. Inside the Bubble, we're Potal-ed outside
         * the context providers.
         */
        targetMeasurements={targetMeasurements}
        requestClose={requestClose}>
        {children}
      </Bubble>
    </Portal>
  )
}

function Bubble({
  children,
  position,
  requestClose,
  targetMeasurements,
}: {
  children: React.ReactNode
  position: TooltipContextType['position']
  requestClose: () => void
  targetMeasurements: Exclude<
    TargetContextType['targetMeasurements'],
    undefined
  >
}) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const [bubbleMeasurements, setBubbleMeasurements] = useState<
    | {
        width: number
        height: number
      }
    | undefined
  >(undefined)
  const coords = useMemo(() => {
    if (!bubbleMeasurements)
      return {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        tipTop: 0,
        tipLeft: 0,
      }

    const {width: ww, height: wh} = Dimensions.get('window')
    const maxTop = insets.top
    const maxBottom = wh - insets.bottom
    const {width: cw, height: ch} = bubbleMeasurements
    const minLeft = a.px_xl.paddingLeft
    const maxLeft = ww - minLeft

    let computedPosition: 'top' | 'bottom' = position
    let top = targetMeasurements.y + targetMeasurements.height
    let left = Math.max(
      minLeft,
      targetMeasurements.x + targetMeasurements.width / 2 - cw / 2,
    )
    const tipTranslate = HALF_TIP * -1
    let tipTop = tipTranslate

    if (left + cw > maxLeft) {
      left -= left + cw - maxLeft
    }

    let tipLeft =
      targetMeasurements.x - left + targetMeasurements.width / 2 - HALF_TIP

    let bottom = top + ch

    function positionTop() {
      top = top - ch - targetMeasurements.height
      bottom = top + ch
      tipTop = tipTop + ch
      computedPosition = 'top'
    }

    function positionBottom() {
      top = targetMeasurements.y + targetMeasurements.height
      bottom = top + ch
      tipTop = tipTranslate
      computedPosition = 'bottom'
    }

    if (position === 'top') {
      positionTop()
      if (top < maxTop) {
        positionBottom()
      }
    } else {
      if (bottom > maxBottom) {
        positionTop()
      }
    }

    if (computedPosition === 'bottom') {
      top += TIP_VISUAL_OFFSET
      bottom += TIP_VISUAL_OFFSET
    } else {
      top -= TIP_VISUAL_OFFSET
      bottom -= TIP_VISUAL_OFFSET
    }

    return {
      computedPosition,
      top,
      bottom,
      left,
      right: left + cw,
      tipTop,
      tipLeft,
    }
  }, [position, targetMeasurements, bubbleMeasurements, insets])

  const requestCloseWrapped = useCallback(() => {
    setBubbleMeasurements(undefined)
    requestClose()
  }, [requestClose])

  useOnGesture(
    useCallback(
      e => {
        const {x, y} = e
        const isInside =
          x > coords.left &&
          x < coords.right &&
          y > coords.top &&
          y < coords.bottom

        if (!isInside) {
          requestCloseWrapped()
        }
      },
      [coords, requestCloseWrapped],
    ),
  )

  return (
    <View
      style={[
        a.absolute,
        a.align_start,
        {
          width: 200,
          opacity: bubbleMeasurements ? 1 : 0,
          top: coords.top,
          left: coords.left,
        },
      ]}>
      <Animated.View entering={ZoomIn.easing(Easing.out(Easing.exp))}>
        <View
          style={[
            a.absolute,
            a.top_0,
            a.z_10,
            t.atoms.bg,
            {
              borderTopLeftRadius: a.rounded_xs.borderRadius,
              width: TIP_SIZE,
              height: TIP_SIZE,
              transform: [{rotate: '45deg'}],
              top: coords.tipTop,
              left: coords.tipLeft,
            },
          ]}
        />
        <View
          style={[
            a.px_md,
            a.py_sm,
            a.rounded_sm,
            t.atoms.bg,
            t.atoms.shadow_md,
            {
              shadowOpacity: 0.2,
              shadowOffset: {
                width: 0,
                // provide more shadow beneath tip
                height:
                  TIP_VISUAL_OFFSET *
                  (coords.computedPosition === 'bottom' ? -1 : 1),
              },
            },
          ]}
          onLayout={e => {
            setBubbleMeasurements({
              width: e.nativeEvent.layout.width,
              height: e.nativeEvent.layout.height,
            })
          }}>
          {children}
        </View>
      </Animated.View>
    </View>
  )
}
