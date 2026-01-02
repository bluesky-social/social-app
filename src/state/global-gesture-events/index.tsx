import {createContext, useContext, useMemo, useRef, useState} from 'react'
import {type StyleProp, View, type ViewStyle} from 'react-native'
import {
  Gesture,
  GestureDetector,
  type GestureStateChangeEvent,
  type GestureUpdateEvent,
  type PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler'
import EventEmitter from 'eventemitter3'

export type GlobalGestureEvents = {
  begin: GestureStateChangeEvent<PanGestureHandlerEventPayload>
  update: GestureUpdateEvent<PanGestureHandlerEventPayload>
  end: GestureStateChangeEvent<PanGestureHandlerEventPayload>
  finalize: GestureStateChangeEvent<PanGestureHandlerEventPayload>
}

const Context = createContext<{
  events: EventEmitter<GlobalGestureEvents>
  register: () => void
  unregister: () => void
}>({
  events: new EventEmitter<GlobalGestureEvents>(),
  register: () => {},
  unregister: () => {},
})
Context.displayName = 'GlobalGestureEventsContext'

export function GlobalGestureEventsProvider({
  children,
  style,
}: {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const refCount = useRef(0)
  const events = useMemo(() => new EventEmitter<GlobalGestureEvents>(), [])
  const [enabled, setEnabled] = useState(false)
  const ctx = useMemo(
    () => ({
      events,
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
    }),
    [events, setEnabled],
  )
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
      <GestureDetector gesture={gesture}>
        <View collapsable={false} style={style}>
          {children}
        </View>
      </GestureDetector>
    </Context.Provider>
  )
}

export function useGlobalGestureEvents() {
  return useContext(Context)
}
