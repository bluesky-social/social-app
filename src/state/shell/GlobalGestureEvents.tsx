import {createContext, useContext, useMemo, useEffect, useRef, useState} from 'react'
import EventEmitter from 'eventemitter3'
import {
  GestureDetector,
  Gesture,
  GestureStateChangeEvent,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler'

const events = new EventEmitter<{
  begin: GestureStateChangeEvent<PanGestureHandlerEventPayload>
  update: GestureUpdateEvent<PanGestureHandlerEventPayload>
  end: GestureStateChangeEvent<PanGestureHandlerEventPayload>
  finalize: GestureStateChangeEvent<PanGestureHandlerEventPayload>
}>()

const Context = createContext<{
  register: () => void
  unregister: () => void
}>({
  register: () => {},
  unregister: () => {},
})

export function GlobalGestureEvents({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  const refCount = useRef(0)
  const [enabled, setEnabled] = useState(false)
  const ctx = useMemo(() => ({
    register() {
      refCount.current += 1
      if (refCount.current === 1) {
        setEnabled(true)
      }
    },
    unregister() {
      refCount.current -= 1
      if (refCount.current === 0) {
        setEnabled(false)
      }
    },
  }), [setEnabled])
  const gesture = Gesture.Pan()
    .runOnJS(true)
    .enabled(enabled)
    .simultaneousWithExternalGesture()
    .onBegin(e => {
      events.emit('begin', e)
    })
    .onUpdate(e => {
      events.emit('update', e)
    })
    .onEnd(e => {
      events.emit('end', e)
    })
    .onFinalize(e => {
      events.emit('finalize', e)
    })

  return (
    <Context.Provider value={ctx}>
      <GestureDetector gesture={gesture}>{children}</GestureDetector>
    </Context.Provider>
  )
}

export function useOnInteract(
  onInteract: (
    e: GestureStateChangeEvent<PanGestureHandlerEventPayload>,
  ) => void,
) {
  const ctx = useContext(Context)
  useEffect(() => {
    ctx.register()
    events.on('begin', onInteract)

    return () => {
      ctx.unregister()
      events.off('begin', onInteract)
    }
  }, [ctx, onInteract])
}
