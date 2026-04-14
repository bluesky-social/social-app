/*
 * Quick-react analytics helpers.
 *
 * Events never carry a raw postUri — only a truncated SHA-256 hash of it.
 */

import {Platform} from 'react-native'

import {type AnalyticsContextType, type Metrics} from '#/analytics'
import {
  EVENT_BAR_OPEN,
  EVENT_REMOVE,
  EVENT_SELECT,
} from '#/features/quickReact/constants'
import {
  type AnalyticsLogContext,
  type BarOpenPayload,
  type FlagVariant,
  type ReactionEmoji,
  type ReactionEntryPoint,
  type ReactionSurface,
  type RemovePayload,
  type SelectPayload,
} from '#/features/quickReact/types'

/*
 * Minimal pure-JS SHA-256 (FIPS 180-4). Used only for hashing postUri for
 * analytics, not for any security-sensitive purpose.
 */
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
])

function rotr(n: number, x: number): number {
  return ((x >>> n) | (x << (32 - n))) >>> 0
}

function sha256(bytes: Uint8Array): Uint8Array {
  const H = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
    0x1f83d9ab, 0x5be0cd19,
  ])
  const l = bytes.length
  const withPad = new Uint8Array(Math.ceil((l + 9) / 64) * 64)
  withPad.set(bytes)
  withPad[l] = 0x80
  // length in bits as big-endian 64-bit int
  const bitLen = l * 8
  const view = new DataView(withPad.buffer)
  view.setUint32(withPad.length - 4, bitLen >>> 0, false)
  view.setUint32(withPad.length - 8, Math.floor(bitLen / 0x100000000), false)

  const W = new Uint32Array(64)
  for (let chunk = 0; chunk < withPad.length; chunk += 64) {
    for (let i = 0; i < 16; i++) {
      W[i] = view.getUint32(chunk + i * 4, false)
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(7, W[i - 15]) ^ rotr(18, W[i - 15]) ^ (W[i - 15] >>> 3)
      const s1 = rotr(17, W[i - 2]) ^ rotr(19, W[i - 2]) ^ (W[i - 2] >>> 10)
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0
    }
    let [a, b, c, d, e, f, g, h] = H
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e)
      const ch = (e & f) ^ (~e & g)
      const temp1 = (h + S1 + ch + K[i] + W[i]) >>> 0
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a)
      const mj = (a & b) ^ (a & c) ^ (b & c)
      const temp2 = (S0 + mj) >>> 0
      h = g
      g = f
      f = e
      e = (d + temp1) >>> 0
      d = c
      c = b
      b = a
      a = (temp1 + temp2) >>> 0
    }
    H[0] = (H[0] + a) >>> 0
    H[1] = (H[1] + b) >>> 0
    H[2] = (H[2] + c) >>> 0
    H[3] = (H[3] + d) >>> 0
    H[4] = (H[4] + e) >>> 0
    H[5] = (H[5] + f) >>> 0
    H[6] = (H[6] + g) >>> 0
    H[7] = (H[7] + h) >>> 0
  }
  const out = new Uint8Array(32)
  const outView = new DataView(out.buffer)
  for (let i = 0; i < 8; i++) outView.setUint32(i * 4, H[i], false)
  return out
}

function utf8Encode(input: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(input)
  }
  // Fallback UTF-8 encoder
  const bytes: number[] = []
  for (let i = 0; i < input.length; i++) {
    let c = input.charCodeAt(i)
    if (c < 0x80) bytes.push(c)
    else if (c < 0x800) {
      bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f))
    } else if (c >= 0xd800 && c <= 0xdbff && i + 1 < input.length) {
      const c2 = input.charCodeAt(i + 1)
      const cp = 0x10000 + (((c & 0x3ff) << 10) | (c2 & 0x3ff))
      i++
      bytes.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 0x3f),
        0x80 | ((cp >> 6) & 0x3f),
        0x80 | (cp & 0x3f),
      )
    } else {
      bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f))
    }
  }
  return new Uint8Array(bytes)
}

function toHex(bytes: Uint8Array): string {
  const hex = '0123456789abcdef'
  let out = ''
  for (let i = 0; i < bytes.length; i++) {
    out += hex[bytes[i] >> 4] + hex[bytes[i] & 0xf]
  }
  return out
}

/**
 * Hash a post URI for privacy-safe analytics emission.
 * Returns the first 16 hex characters of SHA-256(uri).
 */
export function hashPostUri(uri: string): string {
  return toHex(sha256(utf8Encode(uri))).slice(0, 16)
}

export type AnalyticsSink = Pick<AnalyticsContextType, 'metric'>

export function logBarOpen(
  ax: AnalyticsSink,
  args: {
    postUri: string
    surface: ReactionSurface
    entryPoint: ReactionEntryPoint
    flagVariant: FlagVariant
    logContext: AnalyticsLogContext
  },
): void {
  const payload: BarOpenPayload = {
    uriHash: hashPostUri(args.postUri),
    surface: args.surface,
    entryPoint: args.entryPoint,
    flagVariant: args.flagVariant,
    logContext: args.logContext,
  }
  ax.metric('quickReaction:barOpen' as keyof Metrics, payload as never)
}

export function logSelect(
  ax: AnalyticsSink,
  args: {
    postUri: string
    emoji: ReactionEmoji
    surface: ReactionSurface
    entryPoint: ReactionEntryPoint
    flagVariant: FlagVariant
    logContext: AnalyticsLogContext
    isChange: boolean
    previousEmoji?: ReactionEmoji
  },
): void {
  const payload: SelectPayload = {
    uriHash: hashPostUri(args.postUri),
    emoji: args.emoji,
    surface: args.surface,
    entryPoint: args.entryPoint,
    flagVariant: args.flagVariant,
    logContext: args.logContext,
    isChange: args.isChange,
    previousEmoji: args.previousEmoji,
  }
  ax.metric('quickReaction:select' as keyof Metrics, payload as never)
}

export function logRemove(
  ax: AnalyticsSink,
  args: {
    postUri: string
    previousEmoji: ReactionEmoji
    surface: ReactionSurface
    entryPoint: ReactionEntryPoint
    flagVariant: FlagVariant
    logContext: AnalyticsLogContext
    removalMethod: 'retapSelected' | 'removeRow'
  },
): void {
  const payload: RemovePayload = {
    uriHash: hashPostUri(args.postUri),
    previousEmoji: args.previousEmoji,
    surface: args.surface,
    entryPoint: args.entryPoint,
    flagVariant: args.flagVariant,
    logContext: args.logContext,
    removalMethod: args.removalMethod,
  }
  ax.metric('quickReaction:remove' as keyof Metrics, payload as never)
}

// Re-export constants for callers that want the full event name
export {EVENT_BAR_OPEN, EVENT_REMOVE, EVENT_SELECT}

// Platform is imported here purely to encourage callers who want raw platform
// to pick it up from react-native rather than this file (kept for clarity).
export const __PLATFORM_OS = Platform.OS
