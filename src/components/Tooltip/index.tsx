import {
  useMemo,
  useRef,
  createContext,
  useContext,
  useState,
  isValidElement,
} from 'react'
import {View, Modal, Dimensions, Pressable} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import flattenReactChildren from 'react-keyed-flatten-children'

import {Portal} from '#/components/Portal'
import {atoms as a, useTheme} from '#/alf'

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
  targetElement: any
}

const TooltipContext = createContext<Context>({
  visible: false,
  onVisibleChange: () => {},
  targetMeasurements: undefined,
  targetRef: {current: null},
  targetElement: null,
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
      targetElement: flattenReactChildren(children).find(child => {
        if (isValidElement(child) && child.type === Target) {
          return true
        }
      }),
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
  const t = useTheme()
  const {visible, onVisibleChange, targetMeasurements, targetElement} =
    useContext(TooltipContext)
  const [ready, setReady] = useState(false)
  const [measurements, setMeasurements] = useState<
    | {
        width: number
        height: number
      }
    | undefined
  >(undefined)
  const safe = useSafeAreaInsets()

  const requestClose = () => {
    onVisibleChange(false)
    setReady(false)
    setMeasurements(undefined)
  }

  const {positionTop, contentLeft, tipTop, tipLeft} = useMemo(() => {
    if (!targetMeasurements || !measurements)
      return {
        positionTop: 0,
        contentLeft: 0,
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

    let positionTop = targetMeasurements.y + targetMeasurements.height
    let contentLeft = Math.max(
      minLeft,
      targetMeasurements.x + targetMeasurements.width / 2 - cw / 2,
    )
    let tipTop = (TIP_SIZE / 2) * -1
    let tipLeft =
      targetMeasurements.x + targetMeasurements.width / 2 - TIP_SIZE / 2

    if (contentLeft + cw > maxLeft) {
      contentLeft -= contentLeft + cw - maxLeft
    }

    positionTop += TIP_SIZE / 3

    return {
      positionTop,
      contentLeft,
      tipTop,
      tipLeft,
    }
  }, [targetMeasurements, measurements, safe])

  if (!visible || !targetMeasurements) return null

  return (
    <Portal>
      <Modal
        transparent
        onRequestClose={() => {}} // TODO
        style={[a.absolute, a.inset_0]}>
        {/* Backdrop */}
        <Pressable
          style={[
            a.absolute,
            a.inset_0,
            t.atoms.bg,
            {
              opacity: 0.4,
            },
          ]}
          onPress={requestClose}
        />

        {/* Replica of the target element */}
        <View
          style={[
            a.absolute,
            {
              top: targetMeasurements.y,
              left: targetMeasurements.x,
              height: targetMeasurements.height,
              width: targetMeasurements.width,
            },
          ]}>
          {targetElement}
        </View>

        {/* Outer content container */}
        <View
          style={[
            a.absolute,
            a.align_start,
            {
              opacity: ready ? 1 : 0,
              top: positionTop,
              left: 0,
              right: 0,
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
                top: tipTop,
                left: tipLeft,
              },
            ]}
          />

          {/* The content itself */}
          <View
            style={[
              a.px_md,
              a.py_sm,
              a.rounded_sm,
              t.atoms.bg,
              t.atoms.shadow_sm,
              {
                maxWidth: 200,
                left: contentLeft,
              },
            ]}
            onLayout={e => {
              setReady(true)
              setMeasurements({
                width: e.nativeEvent.layout.width,
                height: e.nativeEvent.layout.height,
              })
            }}>
            {children}
          </View>
        </View>
      </Modal>
    </Portal>
  )
}
