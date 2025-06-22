import {
  useCallback,
  useMemo,
  useRef,
  createContext,
  useContext,
  useState,
} from 'react'
import {View, Dimensions} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {Portal} from '#/components/Portal'
import {atoms as a, useTheme} from '#/alf'
import {useOnInteract} from '#/state/shell/GlobalGestureEvents'

type Context = {
  visible: boolean
  onVisibleChange: (visible: boolean) => void
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

const TooltipContext = createContext<Context>({
  visible: false,
  onVisibleChange: () => {},
  targetMeasurements: undefined,
  targetRef: {current: null},
})

export function Outer({
  children,
  visible: requestVisible,
  onVisibleChange,
}: {
  children: React.ReactNode
  visible: boolean
  onVisibleChange: (visible: boolean) => void
}) {
  const targetRef = useRef<View>(null)
  const [prevRequestVisible, setPrevRequestVisible] = useState<
    boolean | undefined
  >()
  const [visible, setVisible] = useState(false)
  const [measurements, setMeasurements] = useState<
    | {
        x: number
        y: number
        width: number
        height: number
      }
    | undefined
  >(undefined)

  if (requestVisible && !prevRequestVisible) {
    setPrevRequestVisible(requestVisible)
    if (targetRef.current) {
      targetRef.current.measure((_x, _y, width, height, pageX, pageY) => {
        setMeasurements({x: pageX, y: pageY, width, height})
        setVisible(true)
      })
    }
  } else if (!requestVisible && prevRequestVisible) {
    setPrevRequestVisible(requestVisible)
    setMeasurements(undefined)
    setVisible(false)
  }

  const ctx = useMemo(
    () => ({
      visible,
      onVisibleChange,
      targetMeasurements: measurements,
      targetRef,
    }),
    [visible, onVisibleChange, measurements, targetRef],
  )

  return (
    <TooltipContext.Provider value={ctx}>{children}</TooltipContext.Provider>
  )
}

export function Target({
  children,
}: {
  children: (props: {ref: Context['targetRef']}) => React.ReactNode
}) {
  const {targetRef} = useContext(TooltipContext)

  return children({
    ref: targetRef,
  })
}

const TIP_SIZE = 12

export function Content({children}: {children: React.ReactNode}) {
  const {visible, onVisibleChange, targetMeasurements} =
    useContext(TooltipContext)
  const requestClose = useCallback(() => {
    onVisibleChange(false)
  }, [onVisibleChange])

  if (!visible || !targetMeasurements) return null

  return (
    <Portal>
      <Tooltip
        targetMeasurements={targetMeasurements}
        requestClose={requestClose}>
        {children}
      </Tooltip>
    </Portal>
  )
}

function Tooltip({
  children,
  requestClose,
  targetMeasurements,
}: {
  children: React.ReactNode
  requestClose: () => void
  targetMeasurements: Context['targetMeasurements']
}) {
  const t = useTheme()
  const [ready, setReady] = useState(false)
  const [measurements, setMeasurements] = useState<
    | {
        width: number
        height: number
      }
    | undefined
  >(undefined)
  const safe = useSafeAreaInsets()
  const coords = useMemo(() => {
    if (!targetMeasurements || !measurements)
      return {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        tipTop: 0,
        tipLeft: 0,
      }

    const win = Dimensions.get('window')
    const {width: ww, height: wh} = win
    const maxTop = safe.top
    const maxBottom = wh - safe.bottom
    const {width: cw, height: ch} = measurements
    const minLeft = a.px_xl.paddingLeft
    const maxLeft = ww - minLeft

    let top = targetMeasurements.y + targetMeasurements.height
    let left = Math.max(
      minLeft,
      targetMeasurements.x + targetMeasurements.width / 2 - cw / 2,
    )
    let tipTop = (TIP_SIZE / 2) * -1

    if (left + cw > maxLeft) {
      left -= left + cw - maxLeft
    }

    let tipLeft =
      targetMeasurements.x - left + targetMeasurements.width / 2 - TIP_SIZE / 2

    top += TIP_SIZE / 3

    return {
      top,
      bottom: top + ch,
      left,
      right: left + cw,
      tipTop,
      tipLeft,
    }
  }, [targetMeasurements, measurements, safe])

  const requestCloseWrapped = useCallback(() => {
    setReady(false)
    setMeasurements(undefined)
    requestClose()
  }, [requestClose])

  useOnInteract(
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
          opacity: ready ? 1 : 0,
          top: coords.top,
          left: coords.left,
        },
      ]}>
      {/* The triangle "tip" */}
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

      {/* The content itself */}
      <View
        style={[a.px_md, a.py_sm, a.rounded_sm, t.atoms.bg, t.atoms.shadow_sm]}
        onLayout={e => {
          setMeasurements({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })
          setReady(true)
        }}>
        {children}
      </View>
    </View>
  )
}
