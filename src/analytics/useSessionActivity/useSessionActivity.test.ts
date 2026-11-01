import {createElement, StrictMode} from 'react'
import uuid from 'react-native-uuid'
import {renderHook} from '@testing-library/react-native'
import {Editor} from '@tiptap/core'
import {Document} from '@tiptap/extension-document'
import {Paragraph} from '@tiptap/extension-paragraph'
import {Text} from '@tiptap/extension-text'
import {JSDOM} from 'jsdom'

import {getSessionId, readSessionRecord} from '#/analytics/identifiers/session'
import {useSessionActivity as useNativeSessionActivity} from '#/analytics/useSessionActivity/index'
import {
  observeSessionActivity,
  useSessionActivity,
} from '#/analytics/useSessionActivity/index.web'
import {device} from '#/storage'

let mockRaw: string | undefined
jest.mock('#/env', () => ({IS_NATIVE: false}))
jest.mock('#/lib/appState', () => ({onAppStateChange: jest.fn()}))
jest.mock('react-native-uuid', () => ({
  __esModule: true,
  default: {v4: jest.fn(() => 'rotated')},
}))
jest.mock('#/storage', () => ({
  device: {
    getRaw: jest.fn(() => mockRaw),
    set: jest.fn((_key, data) => {
      mockRaw = JSON.stringify({data})
    }),
  },
}))
jest.mock('#/analytics/identifiers/sessionStorage', () =>
  jest.requireActual('#/analytics/identifiers/sessionStorage/index.web'),
)

const NOW = new Date('2026-09-22T12:00:00Z').getTime()
const TTL = 30 * 60 * 1e3
const INPUT_EVENTS = [
  'keydown',
  'pointerdown',
  'click',
  'beforeinput',
  'input',
  'scroll',
  'popstate',
] as const
let focused: boolean
let visible: DocumentVisibilityState
let cleanup: (() => void) | undefined
let trustedEvent: Event | undefined
let listeners: Map<string, EventListener>

/** JSDOM cannot generate trusted input or scroll events. */
function send(type: string, target: EventTarget = window, trusted = true) {
  const EventClass =
    type === 'click'
      ? dom.window.MouseEvent
      : type === 'beforeinput' || type === 'input'
        ? dom.window.InputEvent
        : dom.window.Event
  const event = new EventClass(type)
  trustedEvent = trusted ? event : undefined
  target.dispatchEvent(event)
  trustedEvent = undefined
}

/** Exercise the composer's actual editor dependencies with controlled DOM events. */
function createEditor(onUpdate: () => void) {
  const element = document.createElement('div')
  document.body.append(element)
  return new Editor({
    element,
    extensions: [Document, Paragraph, Text],
    content: '<p></p>',
    injectCSS: false,
    onUpdate,
  })
}

/** Use a separate DOM so Expo's native Jest setup keeps its own globals. */
const dom = new JSDOM('<!doctype html><html><body></body></html>')
const domGlobals = {
  window: dom.window,
  document: dom.window.document,
  innerHeight: dom.window.innerHeight,
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
}
const originalGlobals = Object.keys(domGlobals).map(
  key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const,
)
beforeAll(() => {
  for (const [key, value] of Object.entries(domGlobals)) {
    Object.defineProperty(globalThis, key, {value, configurable: true})
  }
})
afterAll(() => {
  for (const [key, descriptor] of originalGlobals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor)
    else Reflect.deleteProperty(globalThis, key)
  }
  dom.window.close()
})

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(NOW)
  jest.clearAllMocks()
  mockRaw = JSON.stringify({data: {id: 'original', lastEventAt: NOW}})
  focused = true
  visible = 'visible'
  jest.spyOn(document, 'hasFocus').mockImplementation(() => focused)
  jest
    .spyOn(document, 'visibilityState', 'get')
    .mockImplementation(() => visible)
  listeners = new Map()
  const add = window.addEventListener.bind(window)
  const remove = window.removeEventListener.bind(window)
  jest
    .spyOn(window, 'addEventListener')
    .mockImplementation((name, listener, options) => {
      if (!listener) return
      const wrapped: EventListener = event => {
        const input = new Proxy(event, {
          get: (target, key) =>
            key === 'isTrusted'
              ? event === trustedEvent
              : Reflect.get(target, key, target),
        })
        if (typeof listener === 'function') listener(input)
        else listener.handleEvent(input)
      }
      listeners.set(name, wrapped)
      add(name, wrapped, options)
    })
  jest
    .spyOn(window, 'removeEventListener')
    .mockImplementation((name, listener, options) => {
      if (!listener) return
      remove(name, listeners.get(name) ?? listener, options)
      listeners.delete(name)
    })
})
afterEach(() => {
  cleanup?.()
  cleanup = undefined
  document.body.innerHTML = ''
  jest.restoreAllMocks()
  jest.useRealTimers()
})

it.each(['hidden', 'unfocused'])(
  'does not renew on %s startup or passive rerenders',
  state => {
    visible = state === 'hidden' ? 'hidden' : 'visible'
    focused = state === 'hidden'
    jest.setSystemTime(NOW + TTL)
    const view = renderHook(useSessionActivity)
    cleanup = view.unmount
    view.rerender({})
    expect(getSessionId()).toBe('original')
    for (const event of [...INPUT_EVENTS, 'focus', 'visibilitychange'])
      send(event)
    expect(device.set).not.toHaveBeenCalled()
    expect(readSessionRecord()?.lastEventAt).toBe(NOW)
  },
)

it.each(['focus-first', 'visibility-first'])(
  'gates and deduplicates a return (%s)',
  order => {
    focused = false
    visible = 'hidden'
    cleanup = observeSessionActivity()
    jest.setSystemTime(NOW + TTL)
    if (order === 'focus-first') {
      focused = true
      send('focus')
      expect(getSessionId()).toBe('original')
      visible = 'visible'
      send('visibilitychange', document)
    } else {
      visible = 'visible'
      send('visibilitychange', document)
      expect(getSessionId()).toBe('original')
      focused = true
      send('focus')
    }
    expect(getSessionId()).toBe('rotated')
    send('focus')
    send('visibilitychange', document)
    expect(uuid.v4).toHaveBeenCalledTimes(1)
  },
)

it.each(['focus', 'visibilitychange', 'pageshow'])(
  'checks a %s return even if suspension delivered no departure event',
  type => {
    cleanup = observeSessionActivity()
    jest.setSystemTime(NOW + TTL)
    send(type)
    expect(getSessionId()).toBe('rotated')
    send(type)
    expect(uuid.v4).toHaveBeenCalledTimes(1)
  },
)

it('does not count a late background/blur notification as new activity', () => {
  cleanup = observeSessionActivity()
  jest.setSystemTime(NOW + TTL * 5)
  focused = false
  send('blur')
  visible = 'hidden'
  send('visibilitychange', document)
  expect(readSessionRecord()?.lastEventAt).toBe(NOW)
  expect(device.set).toHaveBeenCalledTimes(1)
  visible = 'visible'
  focused = true
  send('focus')
  expect(getSessionId()).toBe('rotated')
})

it.each(INPUT_EVENTS)(
  'rotates before %s metadata is captured, keeping old snapshots intact',
  type => {
    cleanup = observeSessionActivity()
    const target = document.createElement('div')
    document.body.append(target)
    const snapshots = [{sessionId: getSessionId()}]
    const captureMetric = () => snapshots.push({sessionId: getSessionId()})
    // Even an earlier document capture listener is below window capture.
    document.addEventListener(type, captureMetric, true)
    jest.setSystemTime(NOW + TTL)
    send(type, target)
    expect(snapshots).toEqual([{sessionId: 'original'}, {sessionId: 'rotated'}])
    document.removeEventListener(type, captureMetric, true)
  },
)

describe.each(['click', 'beforeinput', 'input'])(
  '%s without pointerdown or keydown',
  type => {
    it.each([TTL - 1, TTL, TTL + 1])(
      'renews or rotates at %d ms before target handling',
      elapsed => {
        cleanup = observeSessionActivity()
        const target = document.createElement(
          type === 'click' ? 'button' : 'textarea',
        )
        document.body.append(target)
        const snapshots = [{sessionId: getSessionId()}]
        target.addEventListener(type, () =>
          snapshots.push({sessionId: getSessionId()}),
        )
        jest.mocked(device.set).mockClear()
        jest.setSystemTime(NOW + elapsed)
        send(type, target)
        const id = elapsed < TTL ? 'original' : 'rotated'
        expect(snapshots).toEqual([{sessionId: 'original'}, {sessionId: id}])
        expect(readSessionRecord()).toEqual({id, lastEventAt: NOW + elapsed})
        expect(device.set).toHaveBeenCalledTimes(1)
        expect(uuid.v4).toHaveBeenCalledTimes(elapsed < TTL ? 0 : 1)
      },
    )
  },
)

it.each([
  ['pointerdown', 'click'],
  ['keydown', 'beforeinput', 'input'],
  ['beforeinput', 'input'],
])('throttles the entire %j interaction sequence', (...events) => {
  cleanup = observeSessionActivity()
  jest.mocked(device.getRaw).mockClear()
  jest.mocked(device.set).mockClear()
  jest.setSystemTime(NOW + TTL)
  for (const type of events) {
    send(type)
    jest.setSystemTime(Date.now() + 100)
  }
  expect(device.getRaw).toHaveBeenCalledTimes(1)
  expect(device.set).toHaveBeenCalledTimes(1)
  expect(uuid.v4).toHaveBeenCalledTimes(1)
  expect(jest.getTimerCount()).toBe(0)
})

it('rotates before RN Web PressResponder handles a click-only activation', () => {
  const PressResponder = jest.requireActual<
    new (config: {onPress: () => void; onPressStart: () => void}) => {
      getEventHandlers(): {onClick: (event: MouseEvent) => void}
      reset(): void
    }
  >('react-native-web/dist/cjs/modules/usePressEvents/PressResponder')
  cleanup = observeSessionActivity()
  const snapshots = [{sessionId: getSessionId()}]
  const onPressStart = jest.fn()
  const responder = new PressResponder({
    onPress: () => snapshots.push({sessionId: getSessionId()}),
    onPressStart,
  })
  const button = document.createElement('button')
  document.body.append(button)
  button.addEventListener('click', responder.getEventHandlers().onClick)
  jest.setSystemTime(NOW + TTL)
  send('click', button)
  expect(onPressStart).not.toHaveBeenCalled()
  expect(snapshots).toEqual([{sessionId: 'original'}, {sessionId: 'rotated'}])
  responder.reset()
})

it.each(['beforeinput', 'input'])(
  'rotates before a Tiptap update triggered by %s',
  type => {
    cleanup = observeSessionActivity()
    const snapshots = [{sessionId: getSessionId()}]
    const editor = createEditor(() =>
      snapshots.push({sessionId: getSessionId()}),
    )
    try {
      editor.setOptions({
        editorProps: {
          handleDOMEvents: {
            [type]: () => {
              editor.commands.insertContent('entered text')
              return true
            },
          },
        },
      })
      jest.setSystemTime(NOW + TTL)
      send(type, editor.view.dom)
      expect(editor.getText()).toBe('entered text')
      expect(snapshots).toEqual([
        {sessionId: 'original'},
        {sessionId: 'rotated'},
      ])
    } finally {
      editor.destroy()
    }
  },
)

it('does not count programmatic Tiptap updates as activity', () => {
  cleanup = observeSessionActivity()
  const snapshots: string[] = []
  const editor = createEditor(() => snapshots.push(getSessionId()))
  try {
    jest.mocked(device.set).mockClear()
    jest.setSystemTime(NOW + TTL)
    editor.commands.setContent('<p>controlled content</p>', true)
    expect(snapshots).toEqual(['original'])
    expect(device.set).not.toHaveBeenCalled()
    expect(readSessionRecord()?.lastEventAt).toBe(NOW)
  } finally {
    editor.destroy()
  }
})

it('ignores programmatic values, element.click(), and script-dispatched input', () => {
  cleanup = observeSessionActivity()
  const field = document.createElement('textarea')
  const button = document.createElement('button')
  document.body.append(field, button)
  jest.mocked(device.set).mockClear()
  jest.setSystemTime(NOW + TTL)
  field.value = 'controlled content'
  button.click()
  send('beforeinput', field, false)
  send('input', field, false)
  expect(device.set).not.toHaveBeenCalled()
  expect(getSessionId()).toBe('original')
})

it('ignores synthetic events', () => {
  cleanup = observeSessionActivity()
  jest.setSystemTime(NOW + TTL)
  for (const type of INPUT_EVENTS) {
    send(type, window, false)
  }
  expect(getSessionId()).toBe('original')
  expect(device.set).toHaveBeenCalledTimes(1)
})

it.each(['scroll', 'input'])(
  'throttles storage reads and writes before recording frequent %s events',
  type => {
    cleanup = observeSessionActivity()
    jest.mocked(device.getRaw).mockClear()
    jest.mocked(device.set).mockClear()
    for (let i = 1; i <= 150; i++) {
      jest.setSystemTime(NOW + i * 100)
      send(type)
      const recordings = Math.floor((i * 100) / 5_000)
      expect(device.getRaw).toHaveBeenCalledTimes(recordings)
      expect(device.set).toHaveBeenCalledTimes(recordings)
    }
    expect(jest.getTimerCount()).toBe(0)
    jest.advanceTimersByTime(TTL * 2)
    expect(device.getRaw).toHaveBeenCalledTimes(3)
    expect(device.set).toHaveBeenCalledTimes(3)
  },
)

it.each([0, 4_999, 5_000, 5_001])(
  'checks the local throttle before storage at %d ms',
  elapsed => {
    cleanup = observeSessionActivity()
    jest.mocked(device.getRaw).mockClear()
    jest.mocked(device.set).mockClear()
    jest.setSystemTime(NOW + elapsed)
    send('scroll')
    expect(device.getRaw).toHaveBeenCalledTimes(elapsed < 5_000 ? 0 : 1)
    expect(device.set).toHaveBeenCalledTimes(elapsed < 5_000 ? 0 : 1)
  },
)

it('can expire less than five seconds early relative to throttled activity', () => {
  cleanup = observeSessionActivity()
  jest.setSystemTime(NOW + 4_999)
  send('scroll')
  expect(readSessionRecord()?.lastEventAt).toBe(NOW)
  expect(device.set).toHaveBeenCalledTimes(1)
  jest.setSystemTime(NOW + TTL)
  send('focus')
  expect(getSessionId()).toBe('rotated')
})

it.each(['keydown', 'click', 'beforeinput', 'input'])(
  'uses local throttle time without caching the shared ID during %s',
  type => {
    cleanup = observeSessionActivity()
    jest.mocked(device.getRaw).mockClear()
    jest.mocked(device.set).mockClear()
    jest.setSystemTime(NOW + 4_500)
    mockRaw = JSON.stringify({data: {id: 'other-tab', lastEventAt: Date.now()}})
    send(type)
    expect(device.getRaw).not.toHaveBeenCalled()
    expect(device.set).not.toHaveBeenCalled()
    // Metrics still adopt the other tab's ID even inside the activity throttle.
    expect(getSessionId()).toBe('other-tab')
    jest.setSystemTime(NOW + 5_000)
    send(type)
    expect(device.set).toHaveBeenCalledWith(['analyticsSession'], {
      id: 'other-tab',
      lastEventAt: Date.now(),
    })
  },
)

it('bypasses the local throttle after clock rollback', () => {
  cleanup = observeSessionActivity()
  jest.setSystemTime(NOW - 1)
  send('keydown')
  expect(device.getRaw).toHaveBeenCalledTimes(2)
  expect(device.set).toHaveBeenCalledTimes(2)
  expect(readSessionRecord()).toEqual({id: 'original', lastEventAt: NOW - 1})
  expect(uuid.v4).not.toHaveBeenCalled()
})

it('counts nested scrolls without preceding keyboard or pointer input', () => {
  cleanup = observeSessionActivity()
  const outer = document.createElement('div')
  const nested = document.createElement('div')
  outer.append(nested)
  document.body.append(outer)
  for (let minute = 1; minute <= 40; minute++) {
    jest.setSystemTime(NOW + minute * 60_000)
    send('scroll', nested)
  }
  expect(getSessionId()).toBe('original')
  expect(readSessionRecord()?.lastEventAt).toBe(NOW + 40 * 60_000)
})

it('ignores blur and unfocused scroll without renewing activity', () => {
  cleanup = observeSessionActivity()
  jest.advanceTimersByTime(5_000)
  send('keydown')
  expect(jest.getTimerCount()).toBe(0)
  jest.advanceTimersByTime(100)
  focused = false
  send('blur')
  expect(readSessionRecord()?.lastEventAt).toBe(NOW + 5_000)
  expect(jest.getTimerCount()).toBe(0)
  send('scroll')
  expect(jest.getTimerCount()).toBe(0)
})

it('ignores blur even if hasFocus has not updated yet', () => {
  cleanup = observeSessionActivity()
  jest.advanceTimersByTime(5_000)
  send('keydown')
  send('blur')
  expect(readSessionRecord()?.lastEventAt).toBe(NOW + 5_000)
  expect(jest.getTimerCount()).toBe(0)
  jest.setSystemTime(NOW + 5_000 + TTL)
  send('focus')
  expect(getSessionId()).toBe('rotated')
})

it('ignores element focus changes and returns from page cache using wall-clock time', () => {
  cleanup = observeSessionActivity()
  jest.setSystemTime(NOW + TTL)
  send('focus', document)
  expect(getSessionId()).toBe('original')
  send('pagehide')
  expect(device.set).toHaveBeenCalledTimes(1)
  send('pageshow')
  expect(getSessionId()).toBe('rotated')
})

it('cleans up all capture/passive listeners across Strict Mode and remounts', () => {
  const first = renderHook(useSessionActivity, {
    wrapper: ({children}) => createElement(StrictMode, null, children),
  })
  expect([...listeners.keys()]).toEqual([
    ...INPUT_EVENTS,
    'focus',
    'visibilitychange',
    'pageshow',
  ])
  for (const [, , options] of jest.mocked(window.addEventListener).mock.calls) {
    expect(options).toEqual({capture: true, passive: true})
  }
  jest.advanceTimersByTime(5_000)
  send('keydown')
  expect(jest.getTimerCount()).toBe(0)
  first.unmount()
  expect(listeners.size).toBe(0)
  expect(jest.getTimerCount()).toBe(0)
  expect(readSessionRecord()?.lastEventAt).toBe(NOW + 5_000)
  jest.setSystemTime(NOW + TTL + 5_000)
  for (const type of INPUT_EVENTS) send(type)
  expect(getSessionId()).toBe('original')
  const second = renderHook(useSessionActivity)
  cleanup = second.unmount
  expect(getSessionId()).toBe('rotated')
  const writes = jest.mocked(device.set).mock.calls.length
  for (const type of INPUT_EVENTS) send(type)
  expect(device.set).toHaveBeenCalledTimes(writes)
})

it('keeps the default/native hook free of DOM access', () => {
  const visibility = jest.spyOn(document, 'visibilityState', 'get')
  renderHook(useNativeSessionActivity).unmount()
  expect(visibility).not.toHaveBeenCalled()
  expect(window.addEventListener).not.toHaveBeenCalled()
  expect(device.set).not.toHaveBeenCalled()
})
