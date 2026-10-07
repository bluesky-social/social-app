import {forwardRef, memo, useEffect, useEffectEvent} from 'react'
import {act, render} from '@testing-library/react-native'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'

type Props = {value: number; onRead: (value: number) => void}

/** Stands in for a subscription that an effect sets up once, on mount. */
const listeners = new Set<() => void>()
afterEach(() => listeners.clear())

/**
 * Renders `Component` with a new prop, then fires the callback it subscribed
 * on mount. Returns the values the callback saw.
 */
function readAfterRerender(Component: React.ComponentType<Props>) {
  const onRead = jest.fn()
  const {rerender} = render(<Component value={1} onRead={onRead} />)
  rerender(<Component value={2} onRead={onRead} />)
  act(() => {
    for (const listener of listeners) listener()
  })
  return onRead.mock.calls
}

/* Jest runs React Compiler, so this one is compiled as the app's are. */
function PlainEffectEvent({value, onRead}: Props) {
  const read = useEffectEvent(() => onRead(value))
  useEffect(() => {
    listeners.add(read)
  }, [])
  return null
}

function UncompiledEffectEvent({value, onRead}: Props) {
  'use no memo'
  const read = useEffectEvent(() => onRead(value))
  useEffect(() => {
    listeners.add(read)
  }, [])
  return null
}

/* With a compare function, memo() renders the component as a child fiber. */
const MemoCompareEffectEvent = memo(
  function MemoCompareEffectEvent({value, onRead}: Props) {
    const read = useEffectEvent(() => onRead(value))
    useEffect(() => {
      listeners.add(read)
    }, [])
    return null
  },
  (prev, next) => prev.value === next.value,
)

const MemoEffectEvent = memo(function MemoEffectEvent({value, onRead}: Props) {
  const read = useEffectEvent(() => onRead(value))
  useEffect(() => {
    listeners.add(read)
  }, [])
  return null
})

const ForwardRefEffectEvent = forwardRef<unknown, Props>(
  function ForwardRefEffectEvent({value, onRead}, _ref) {
    const read = useEffectEvent(() => onRead(value))
    useEffect(() => {
      listeners.add(read)
    }, [])
    return null
  },
)

const MemoNonReactive = memo(function MemoNonReactive({value, onRead}: Props) {
  const read = useNonReactiveCallback(() => onRead(value))
  useEffect(() => {
    listeners.add(read)
  }, [read])
  return null
})

const ForwardRefNonReactive = forwardRef<unknown, Props>(
  function ForwardRefNonReactive({value, onRead}, _ref) {
    const read = useNonReactiveCallback(() => onRead(value))
    useEffect(() => {
      listeners.add(read)
    }, [read])
    return null
  },
)

describe('useEffectEvent', () => {
  test.each([
    ['a function component', PlainEffectEvent],
    ['a function component React Compiler skips', UncompiledEffectEvent],
    ['memo() with a compare function', MemoCompareEffectEvent],
  ])('sees the latest props in %s', (_, Component) => {
    expect(readAfterRerender(Component)).toEqual([[2]])
  })

  /*
   * React 19.2 never updates a useEffectEvent in these, so it keeps the first
   * render's closure (react/react#35187, fixed in React 19.3). If this starts
   * passing, React has the fix, and `useNonReactiveCallback`'s advice to
   * prefer it there can go.
   */
  test.failing.each([
    ['memo()', MemoEffectEvent],
    ['forwardRef()', ForwardRefEffectEvent],
  ])('sees the latest props in %s, but not on React 19.2', (_, Component) => {
    expect(readAfterRerender(Component)).toEqual([[2]])
  })
})

describe('useNonReactiveCallback', () => {
  test.each([
    ['memo()', MemoNonReactive],
    ['forwardRef()', ForwardRefNonReactive],
  ])('sees the latest props in %s', (_, Component) => {
    expect(readAfterRerender(Component)).toEqual([[2]])
  })
})
