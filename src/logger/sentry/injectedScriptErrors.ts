import {type ErrorEvent, type Exception, type StackFrame} from '@sentry/browser'

/**
 * Mechanism type prefix that `browserApiErrorsIntegration` gives errors thrown
 * from the callbacks it wraps, e.g. `auto.browser.browserapierrors.setTimeout`.
 */
const WRAPPED_API_MECHANISM_PREFIX = 'auto.browser.browserapierrors.'

/**
 * Filenames that point at no script of ours: code with no URL (injected,
 * `eval`ed, or run by automation tooling) and engine builtins.
 */
const FOREIGN_FILENAMES = new Set([
  '',
  '<anonymous>',
  'native',
  '[native code]',
])

function isForeignFrame(frame: StackFrame): boolean {
  return FOREIGN_FILENAMES.has(frame.filename ?? '')
}

function isInjectedScriptException(exception: Exception): boolean {
  if (!exception.mechanism?.type.startsWith(WRAPPED_API_MECHANISM_PREFIX)) {
    return false
  }

  const frames = exception.stacktrace?.frames
  if (!frames?.length) {
    return false
  }

  /*
   * Sentry orders frames oldest first, so `frames[0]` is the SDK's own
   * wrapper and everything after it ran inside the wrapped callback.
   */
  return frames.slice(1).every(isForeignFrame)
}

/**
 * `browserApiErrorsIntegration` wraps `setTimeout`, `setInterval`,
 * `requestAnimationFrame` and `addEventListener` for the whole page, so it also
 * wraps the callbacks of scripts we did not ship: in-app browsers, extensions,
 * headless crawlers. When one of those callbacks throws, the error is reported
 * to us as unhandled, with nothing of ours in the stack and nothing we can fix.
 *
 * An event is one of these when a wrapped callback threw and no frame inside
 * that callback is ours. Those frames have no URL: `<anonymous>` on V8, and
 * missing altogether on WebKit, where the wrapper can be the only frame. A
 * callback of ours always has a frame with our bundle's URL inside the wrapper,
 * and so does our code called by an injected script, so those are kept. So are
 * events with no stack to judge.
 */
export function isInjectedScriptError(event: ErrorEvent): boolean {
  return event.exception?.values?.some(isInjectedScriptException) ?? false
}

/**
 * `beforeSend` filter for the web Sentry setup. See
 * {@link isInjectedScriptError}.
 */
export function dropInjectedScriptErrors(event: ErrorEvent): ErrorEvent | null {
  return isInjectedScriptError(event) ? null : event
}
