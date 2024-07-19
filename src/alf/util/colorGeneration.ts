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
