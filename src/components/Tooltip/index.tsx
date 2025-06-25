import {
  Children,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import {useWindowDimensions, View} from 'react-native'
import Animated, {Easing, ZoomIn} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {atoms as a, select, useTheme} from '#/alf'
import {useOnGesture} from '#/components/hooks/useOnGesture'
import {Portal} from '#/components/Portal'
import {
  ARROW_HALF_SIZE,
  ARROW_SIZE,
  BUBBLE_MAX_WIDTH,
  MIN_EDGE_SPACE,
} from '#/components/Tooltip/const'
import {Text} from '#/components/Typography'

/**
 * These are native specific values, not shared with web
 */
const ARROW_VISUAL_OFFSET = ARROW_SIZE / 1.25 // vibes-based, slightly off the target
const BUBBLE_SHADOW_OFFSET = ARROW_SIZE / 3 // vibes-based, provide more shadow beneath tip

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
        if (pageX !== undefined && pageY !== undefined && width && height) {
          setTargetMeasurements({x: pageX, y: pageY, width, height})
          setReady(true)
        }
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

export function Target({children}: {children: React.ReactNode}) {
  const {targetRef} = useContext(TargetContext)

  return (
    <View collapsable={false} ref={targetRef}>
      {children}
    </View>
  )
}

export function Content({
  children,
  label,
}: {
  children: React.ReactNode
  label: string
}) {
  const {position, ready, onVisibleChange} = useContext(TooltipContext)
  const {targetMeasurements} = useContext(TargetContext)
  const requestClose = useCallback(() => {
    onVisibleChange(false)
  }, [onVisibleChange])

  if (!ready || !targetMeasurements) return null

  return (
    <Portal>
      <Bubble
        label={label}
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
  label,
  position,
  requestClose,
  targetMeasurements,
}: {
  children: React.ReactNode
  label: string
  position: TooltipContextType['position']
  requestClose: () => void
  targetMeasurements: Exclude<
    TargetContextType['targetMeasurements'],
    undefined
  >
}) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const dimensions = useWindowDimensions()
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

    const {width: ww, height: wh} = dimensions
    const maxTop = insets.top
    const maxBottom = wh - insets.bottom
    const {width: cw, height: ch} = bubbleMeasurements
    const minLeft = MIN_EDGE_SPACE
    const maxLeft = ww - minLeft

    let computedPosition: 'top' | 'bottom' = position
    let top = targetMeasurements.y + targetMeasurements.height
    let left = Math.max(
      minLeft,
      targetMeasurements.x + targetMeasurements.width / 2 - cw / 2,
    )
    const tipTranslate = ARROW_HALF_SIZE * -1
    let tipTop = tipTranslate

    if (left + cw > maxLeft) {
      left -= left + cw - maxLeft
    }

    let tipLeft =
      targetMeasurements.x -
      left +
      targetMeasurements.width / 2 -
      ARROW_HALF_SIZE

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
      top += ARROW_VISUAL_OFFSET
      bottom += ARROW_VISUAL_OFFSET
    } else {
      top -= ARROW_VISUAL_OFFSET
      bottom -= ARROW_VISUAL_OFFSET
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
  }, [position, targetMeasurements, bubbleMeasurements, insets, dimensions])

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
      accessible
      role="alert"
      accessibilityHint=""
      accessibilityLabel={label}
      // android
      importantForAccessibility="yes"
      // ios
      accessibilityViewIsModal
      style={[
        a.absolute,
        a.align_start,
        {
          width: BUBBLE_MAX_WIDTH,
          opacity: bubbleMeasurements ? 1 : 0,
          top: coords.top,
          left: coords.left,
        },
      ]}>
      <Animated.View
        entering={ZoomIn.easing(Easing.out(Easing.exp))}
        style={{transformOrigin: oppposite(position)}}>
        <View
          style={[
            a.absolute,
            a.top_0,
            a.z_10,
            t.atoms.bg,
            select(t.name, {
              light: t.atoms.bg,
              dark: t.atoms.bg_contrast_100,
              dim: t.atoms.bg_contrast_100,
            }),
            {
              borderTopLeftRadius: a.rounded_2xs.borderRadius,
              borderBottomRightRadius: a.rounded_2xs.borderRadius,
              width: ARROW_SIZE,
              height: ARROW_SIZE,
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
            select(t.name, {
              light: t.atoms.bg,
              dark: t.atoms.bg_contrast_100,
              dim: t.atoms.bg_contrast_100,
            }),
            t.atoms.shadow_md,
            {
              shadowOpacity: 0.2,
              shadowOffset: {
                width: 0,
                height:
                  BUBBLE_SHADOW_OFFSET *
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

function oppposite(position: 'top' | 'bottom') {
  switch (position) {
    case 'top':
      return 'center bottom'
    case 'bottom':
      return 'center top'
    default:
      return 'center'
  }
}

export function TextBubble({children}: {children: React.ReactNode}) {
  const c = Children.toArray(children)
  return (
    <Content label={c.join(' ')}>
      <View style={[a.gap_xs]}>
        {c.map((child, i) => (
          <Text key={i} style={[a.text_sm, a.leading_snug]}>
            {child}
          </Text>
        ))}
      </View>
    </Content>
  )
}
