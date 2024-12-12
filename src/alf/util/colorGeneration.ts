export const BLUE_HUE = 45
export const RED_HUE = 45
export const GREEN_HUE = 45

export const COLOR_STOPS = [
  0, 0.05, 0.2, 0.3, 0.3, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 0.95, 1,
]

export function generateScale(start: number, end: number) {
  const range = end - start
  return COLOR_STOPS.map(stop => {
    return start + range * stop
  })
}

export const defaultScale = generateScale(6, 100)
export const dimScale = generateScale(0, 45)
