import {utils} from '@bsky.app/alf'

import {logger} from '#/logger'

export const BLUE_HUE = 240
export const RED_HUE = 0
export const GREEN_HUE = 80

/**
 * Smooth progression of lightness "stops" for generating HSL colors.
 */
export const COLOR_STOPS = [
  0, 0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 0.95, 1,
]

export function generateScale(start: number, end: number) {
  const range = end - start
  return COLOR_STOPS.map(stop => {
    return start + range * stop
  })
}

export const defaultScale = generateScale(6, 100)
// dim shifted 6% lighter
export const dimScale = generateScale(12, 100)

/**
 * @deprecated use `utils.alpha` from `@bsky.app/alf` instead
 */
export const transparentifyColor = (color: string, alpha: number): string => {
  if (color.startsWith('hsl(')) {
    return 'hsla(' + color.slice('hsl('.length, -1) + `, ${alpha})`
  } else if (color.startsWith('rgb(')) {
    return 'rgba(' + color.slice('rgb('.length, -1) + `, ${alpha})`
  } else if (color.startsWith('#')) {
    if (color.length === 7) {
      const alphaHex = Math.round(alpha * 255).toString(16)
      return color.slice(0, 7) + alphaHex.padStart(2, alphaHex)
    } else if (color.length === 4) {
      const [r, g, b] = color.slice(1).split('')
      const alphaHex = Math.round(alpha * 255).toString(16)
      return `#${r.repeat(2)}${g.repeat(2)}${b.repeat(2)}${alphaHex.padStart(
        2,
        alphaHex,
      )}`
    }
  } else {
    logger.warn(`Could not make '${color}' transparent`)
  }
  return utils.alpha(color, alpha)
}

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
  try {
    const rgb = hexToRgb(hex)
    if (!rgb) return hex
    const {h, s, l} = rgbToHsl(rgb.r, rgb.g, rgb.b)
    const next = clamp(l + delta, 0, 100)
    const out = hslToRgb(h, s, next)
    return rgbToHex(out.r, out.g, out.b)
  } catch {
    return hex
  }
}

const HEX_PATTERN = /^([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

export function hexToRgb(
  hex: string,
): {r: number; g: number; b: number} | null {
  try {
    if (typeof hex !== 'string') return null
    const h = hex.startsWith('#') ? hex.slice(1) : hex
    if (!HEX_PATTERN.test(h)) return null
    const rgb = h.length === 8 ? h.slice(0, 6) : h
    const expanded =
      rgb.length === 3
        ? rgb
            .split('')
            .map(c => c + c)
            .join('')
        : rgb
    const num = parseInt(expanded, 16)
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    }
  } catch {
    return null
  }
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => clamp(Math.round(n), 0, 255)
  return `#${((1 << 24) + (c(r) << 16) + (c(g) << 8) + c(b))
    .toString(16)
    .slice(1)}`
}

/**
 * WCAG contrast ratio (1-21). Returns null for invalid hex inputs.
 *
 * @see https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export function contrastRatio(hexA: string, hexB: string): number | null {
  const rgbA = hexToRgb(hexA)
  const rgbB = hexToRgb(hexB)
  if (!rgbA || !rgbB) return null
  const luminanceA = relativeLuminance(rgbA)
  const luminanceB = relativeLuminance(rgbB)
  const lighter = Math.max(luminanceA, luminanceB)
  const darker = Math.min(luminanceA, luminanceB)
  return (lighter + 0.05) / (darker + 0.05)
}

function relativeLuminance({
  r,
  g,
  b,
}: {
  r: number
  g: number
  b: number
}): number {
  const toLinear = (channel: number) => {
    const normalized = channel / 255
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
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
