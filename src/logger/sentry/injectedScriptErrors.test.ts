import {describe, expect, test} from '@jest/globals'
import {type ErrorEvent, type StackFrame} from '@sentry/browser'

import {
  dropInjectedScriptErrors,
  isInjectedScriptError,
} from '#/logger/sentry/injectedScriptErrors'

/** The SDK's own `sentryWrapped`, which lives in our bundle. */
const wrapper: StackFrame = {
  filename: 'https://bsky.app/static/js/index-3f9a1c.js',
  function: 'n',
}

/** A frame of ours, called inside the wrapped callback. */
const ours: StackFrame = {
  filename: 'https://bsky.app/static/js/index-3f9a1c.js',
  function: 'r',
}

/** A frame from a script with no URL, the way V8 reports one. */
function anonymous(fn: string): StackFrame {
  return {filename: '<anonymous>', function: fn}
}

function wrappedEvent(
  frames: StackFrame[] | undefined,
  mechanism = 'auto.browser.browserapierrors.setTimeout',
): ErrorEvent {
  return {
    type: undefined,
    exception: {
      values: [
        {
          type: 'TypeError',
          value: "Failed to construct 'URL': Invalid URL",
          mechanism: {type: mechanism, handled: false},
          stacktrace: frames && {frames},
        },
      ],
    },
  }
}

describe('isInjectedScriptError', () => {
  test('detects a wrapped callback whose frames are all anonymous', () => {
    // Chrome on Linux, from an injected snapshot script
    expect(
      isInjectedScriptError(
        wrappedEvent([
          wrapper,
          anonymous('handlePageLoad'),
          anonymous('giveSnapshot'),
          anonymous('NodeList.forEach'),
          anonymous('?'),
        ]),
      ),
    ).toBe(true)
  })

  test('detects a wrapper that is the only frame', () => {
    // WebKit drops frames that have no URL, which leaves just the wrapper
    expect(isInjectedScriptError(wrappedEvent([wrapper]))).toBe(true)
  })

  test('detects native frames inside the callback', () => {
    expect(
      isInjectedScriptError(
        wrappedEvent([wrapper, {filename: '[native code]', function: 'map'}]),
      ),
    ).toBe(true)
  })

  test.each([
    'auto.browser.browserapierrors.setTimeout',
    'auto.browser.browserapierrors.setInterval',
    'auto.browser.browserapierrors.requestAnimationFrame',
    'auto.browser.browserapierrors.addEventListener',
  ])('detects errors captured by %s', mechanism => {
    expect(
      isInjectedScriptError(
        wrappedEvent([wrapper, anonymous('onTick')], mechanism),
      ),
    ).toBe(true)
  })

  test('keeps an error thrown by a callback of ours', () => {
    expect(isInjectedScriptError(wrappedEvent([wrapper, ours]))).toBe(false)
  })

  test('keeps our code called from an injected script', () => {
    expect(
      isInjectedScriptError(
        wrappedEvent([wrapper, anonymous('handlePageLoad'), ours]),
      ),
    ).toBe(false)
  })

  test.each([
    'auto.browser.global_handlers.onerror',
    'auto.browser.global_handlers.onunhandledrejection',
    'generic',
  ])('keeps errors captured by %s', mechanism => {
    expect(
      isInjectedScriptError(
        wrappedEvent([wrapper, anonymous('onTick')], mechanism),
      ),
    ).toBe(false)
  })

  test('keeps events with no stack to judge', () => {
    expect(isInjectedScriptError(wrappedEvent(undefined))).toBe(false)
    expect(isInjectedScriptError(wrappedEvent([]))).toBe(false)
  })

  test('keeps events with no exception', () => {
    expect(
      isInjectedScriptError({type: undefined, message: 'bug report'}),
    ).toBe(false)
  })

  test('judges the thrown error, not its linked causes', () => {
    const cause = {
      type: 'Error',
      value: 'cause',
      mechanism: {type: 'chained', handled: false},
      stacktrace: {frames: [anonymous('inject')]},
    }

    // causes come first, the thrown error last
    const [thrown] = wrappedEvent([wrapper, ours]).exception?.values ?? []
    expect(
      isInjectedScriptError({
        type: undefined,
        exception: {values: [cause, thrown]},
      }),
    ).toBe(false)
  })
})

describe('dropInjectedScriptErrors', () => {
  test('drops injected script errors', () => {
    expect(dropInjectedScriptErrors(wrappedEvent([wrapper]))).toBeNull()
  })

  test('passes other events through untouched', () => {
    const event = wrappedEvent([wrapper, ours])

    expect(dropInjectedScriptErrors(event)).toBe(event)
  })
})
