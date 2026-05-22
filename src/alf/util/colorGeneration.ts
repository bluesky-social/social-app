import {utils} from '@bsky.app/alf'

export const BLUE_HUE = 211

/**
 * @deprecated use `utils.alpha` from `@bsky.app/alf` instead
 */
export const transparentifyColor = utils.alpha

/**
 * Lighten a hex color by `amount` percentage points of HSL lightness (0-100).
 */
export function lighten(hex: string, amount: number): string {
  return adjustLightness(hex, amount)
}

/**
 * Darken a hex color by `amount` percentage points of HSL lightness (0-100).
 */
export function darken(hex: string, amount: number): string {
  return adjustLightness(hex, -amount)
}

function adjustLightness(hex: string, delta: number): string {
  const {r, g, b} = hexToRgb(hex)
  const {h, s, l} = rgbToHsl(r, g, b)
  const next = clamp(l + delta, 0, 100)
  const out = hslToRgb(h, s, next)
  return rgbToHex(out.r, out.g, out.b)
}

function hexToRgb(hex: string): {r: number; g: number; b: number} {
  const h = hex.replace('#', '')
  const expanded =
    h.length === 3
      ? h
          .split('')
          .map(c => c + c)
          .join('')
      : h
  const num = parseInt(expanded, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => clamp(Math.round(n), 0, 255)
  return `#${((1 << 24) + (c(r) << 16) + (c(g) << 8) + c(b))
    .toString(16)
    .slice(1)}`
}

function rgbToHsl(
  r: number,
  g: number,
  b: number,
): {h: number; s: number; l: number} {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }
  return {h: h * 360, s: s * 100, l: l * 100}
}

function hslToRgb(
  h: number,
  s: number,
  l: number,
): {r: number; g: number; b: number} {
  h /= 360
  s /= 100
  l /= 100
  if (s === 0) {
    const v = l * 255
    return {r: v, g: v, b: v}
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const f = (t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  return {
    r: f(h + 1 / 3) * 255,
    g: f(h) * 255,
    b: f(h - 1 / 3) * 255,
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}
