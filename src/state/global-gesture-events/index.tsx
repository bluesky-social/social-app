import {createContext, useContext, useMemo, useRef, useState} from 'react'
import {type StyleProp, View, type ViewStyle} from 'react-native'
import {
  GestureDetector,
  type PanGestureActiveEvent,
  type PanGestureEvent,
  usePanGesture,
} from 'react-native-gesture-handler'
import {EventEmitter} from 'eventemitter3'

export type GlobalGestureEvents = {
  begin: PanGestureEvent
  update: PanGestureActiveEvent
  end: PanGestureActiveEvent & {canceled: boolean}
  finalize: PanGestureEvent & {canceled: boolean}
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
  const gesture = usePanGesture({
    runOnJS: true,
    enabled,
    onBegin: e => {
      events.emit('begin', e)
    },
    onUpdate: e => {
      events.emit('update', e)
    },
    onDeactivate: e => {
      events.emit('end', e)
    },
    onFinalize: e => {
      events.emit('finalize', e)
    },
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
