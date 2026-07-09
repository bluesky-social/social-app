import 'fast-text-encoding'

// Hermes does not support AbortSignal.timeout() or AbortSignal.prototype.throwIfAborted(),
// both used by @atproto/oauth-client and @atproto-labs packages.
// https://github.com/facebook/react-native/issues/42042
if (typeof AbortSignal.timeout !== 'function') {
  AbortSignal.timeout = (ms: number) => {
    const controller = new AbortController()
    setTimeout(() => controller.abort(new Error('TimeoutError')), ms)
    return controller.signal
  }
}
if (typeof AbortSignal.prototype.throwIfAborted !== 'function') {
  AbortSignal.prototype.throwIfAborted = function () {
    if (this.aborted) {
      throw this.reason ?? new Error('AbortError')
    }
  }
}

export {}
