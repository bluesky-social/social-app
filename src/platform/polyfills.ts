import 'fast-text-encoding'

/*
 * React Native installs abort-controller@3 as its AbortController global. That
 * package predates AbortSignal.reason and AbortSignal.throwIfAborted(), while
 * newer libraries such as @atproto/lex-client expect the modern DOM API.
 *
 * Patch the shared prototype once so every signal - including signals created
 * by dependencies - has browser-compatible abort behavior. The reason is
 * stored before dispatching the abort event so listeners can read it
 * synchronously, and the first abort reason wins as required by the DOM spec.
 */
const abortReasons = new WeakMap<AbortSignal, unknown>()
const abortSignalPrototype = AbortSignal.prototype as AbortSignal & {
  readonly reason?: unknown
  throwIfAborted?: () => void
}

function createDefaultAbortReason(): unknown {
  if (typeof DOMException !== 'undefined') {
    return new DOMException('This operation was aborted', 'AbortError')
  }
  const error = new Error('This operation was aborted')
  error.name = 'AbortError'
  return error
}

if (!('reason' in abortSignalPrototype)) {
  const originalAbort = AbortController.prototype.abort

  Object.defineProperty(AbortController.prototype, 'abort', {
    configurable: true,
    writable: true,
    value: function abort(this: AbortController, reason?: unknown) {
      const signal = this.signal
      if (!signal.aborted) {
        abortReasons.set(
          signal,
          reason === undefined ? createDefaultAbortReason() : reason,
        )
      }
      try {
        originalAbort.call(this)
      } catch (error) {
        if (!signal.aborted) abortReasons.delete(signal)
        throw error
      }
    },
  })

  Object.defineProperty(AbortSignal.prototype, 'reason', {
    configurable: true,
    get(this: AbortSignal) {
      if (!this.aborted) return undefined
      let reason = abortReasons.get(this)
      if (reason === undefined) {
        reason = createDefaultAbortReason()
        abortReasons.set(this, reason)
      }
      return reason
    },
  })
}

if (typeof abortSignalPrototype.throwIfAborted !== 'function') {
  Object.defineProperty(AbortSignal.prototype, 'throwIfAborted', {
    configurable: true,
    writable: true,
    value: function throwIfAborted(this: AbortSignal) {
      if (!this.aborted) return
      throw (this as AbortSignal & {readonly reason: unknown}).reason
    },
  })
}

export {}
