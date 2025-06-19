import {logger} from '#/logger'

export const BLUE_HUE = 211
export const RED_HUE = 346
export const GREEN_HUE = 152

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

export function transparentifyColor(color: string, alpha: number) {
  if (color.startsWith('hsl(')) {
    return 'hsla(' + color.slice('hsl('.length, -1) + `, ${alpha})`
  } else if (color.startsWith('rgb(')) {
    return 'rgba(' + color.slice('rgb('.length, -1) + `, ${alpha})`
  } else if (color.startsWith('#')) {
    if (color.length === 7) {
      const alphaHex = Math.round(alpha * 255).toString(16)
      // Per MDN: If there is only one number, it is duplicated: e means ee
      // https://developer.mozilla.org/en-US/docs/Web/CSS/hex-color
      return color.slice(0, 7) + alphaHex.padStart(2, alphaHex)
    } else if (color.length === 4) {
      // convert to 6-digit hex before adding alpha
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
  return color
}
