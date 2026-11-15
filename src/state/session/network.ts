import {emitNetworkConfirmed, emitNetworkLost} from '#/state/events'

/*
 * Captured once at module load so the wrapper below is immune to later
 * monkey-patching of globalThis.fetch.
 */
const realFetch = globalThis.fetch

/**
 * Fetch wrapper that reports network reachability to the app-wide event bus.
 * Any resolved response (including HTTP errors) confirms the network is up; a
 * thrown error (DNS failure, timeout, offline) reports it as lost.
 */
export const networkAwareFetch: typeof fetch = async (...args) => {
  try {
    const res = await realFetch(...args)
    emitNetworkConfirmed()
    return res
  } catch (e) {
    emitNetworkLost()
    throw e
  }
}
