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

export const colors = {
  white: '#FFFFFF',
  black: '#000000',

  contrast_0: `hsl(${BLUE_HUE}, 20%, ${defaultScale[14]}%)`,
  contrast_25: `hsl(${BLUE_HUE}, 20%, ${defaultScale[13]}%)`,
  contrast_50: `hsl(${BLUE_HUE}, 20%, ${defaultScale[12]}%)`,
  contrast_100: `hsl(${BLUE_HUE}, 20%, ${defaultScale[11]}%)`,
  contrast_200: `hsl(${BLUE_HUE}, 20%, ${defaultScale[10]}%)`,
  contrast_300: `hsl(${BLUE_HUE}, 20%, ${defaultScale[9]}%)`,
  contrast_400: `hsl(${BLUE_HUE}, 20%, ${defaultScale[8]}%)`,
  contrast_500: `hsl(${BLUE_HUE}, 20%, ${defaultScale[7]}%)`,
  contrast_600: `hsl(${BLUE_HUE}, 24%, ${defaultScale[6]}%)`,
  contrast_700: `hsl(${BLUE_HUE}, 24%, ${defaultScale[5]}%)`,
  contrast_800: `hsl(${BLUE_HUE}, 28%, ${defaultScale[4]}%)`,
  contrast_900: `hsl(${BLUE_HUE}, 28%, ${defaultScale[3]}%)`,
  contrast_950: `hsl(${BLUE_HUE}, 28%, ${defaultScale[2]}%)`,
  contrast_975: `hsl(${BLUE_HUE}, 28%, ${defaultScale[1]}%)`,
  contrast_1000: `hsl(${BLUE_HUE}, 28%, ${defaultScale[0]}%)`,

  primary_25: `hsl(${BLUE_HUE}, 99%, 97%)`,
  primary_50: `hsl(${BLUE_HUE}, 99%, 95%)`,
  primary_100: `hsl(${BLUE_HUE}, 99%, 90%)`,
  primary_200: `hsl(${BLUE_HUE}, 99%, 80%)`,
  primary_300: `hsl(${BLUE_HUE}, 99%, 70%)`,
  primary_400: `hsl(${BLUE_HUE}, 99%, 60%)`,
  primary_500: `hsl(${BLUE_HUE}, 99%, 53%)`,
  primary_600: `hsl(${BLUE_HUE}, 99%, 42%)`,
  primary_700: `hsl(${BLUE_HUE}, 99%, 34%)`,
  primary_800: `hsl(${BLUE_HUE}, 99%, 26%)`,
  primary_900: `hsl(${BLUE_HUE}, 99%, 18%)`,
  primary_950: `hsl(${BLUE_HUE}, 99%, 10%)`,
  primary_975: `hsl(${BLUE_HUE}, 99%, 7%)`,

  green_25: `hsl(${GREEN_HUE}, 82%, 97%)`,
  green_50: `hsl(${GREEN_HUE}, 82%, 95%)`,
  green_100: `hsl(${GREEN_HUE}, 82%, 90%)`,
  green_200: `hsl(${GREEN_HUE}, 82%, 80%)`,
  green_300: `hsl(${GREEN_HUE}, 82%, 70%)`,
  green_400: `hsl(${GREEN_HUE}, 82%, 60%)`,
  green_500: `hsl(${GREEN_HUE}, 82%, 50%)`,
  green_600: `hsl(${GREEN_HUE}, 82%, 42%)`,
  green_700: `hsl(${GREEN_HUE}, 82%, 34%)`,
  green_800: `hsl(${GREEN_HUE}, 82%, 26%)`,
  green_900: `hsl(${GREEN_HUE}, 82%, 18%)`,
  green_950: `hsl(${GREEN_HUE}, 82%, 10%)`,
  green_975: `hsl(${GREEN_HUE}, 82%, 7%)`,

  red_25: `hsl(${RED_HUE}, 91%, 97%)`,
  red_50: `hsl(${RED_HUE}, 91%, 95%)`,
  red_100: `hsl(${RED_HUE}, 91%, 90%)`,
  red_200: `hsl(${RED_HUE}, 91%, 80%)`,
  red_300: `hsl(${RED_HUE}, 91%, 70%)`,
  red_400: `hsl(${RED_HUE}, 91%, 60%)`,
  red_500: `hsl(${RED_HUE}, 91%, 50%)`,
  red_600: `hsl(${RED_HUE}, 91%, 42%)`,
  red_700: `hsl(${RED_HUE}, 91%, 34%)`,
  red_800: `hsl(${RED_HUE}, 91%, 26%)`,
  red_900: `hsl(${RED_HUE}, 91%, 18%)`,
  red_950: `hsl(${RED_HUE}, 91%, 10%)`,
  red_975: `hsl(${RED_HUE}, 91%, 7%)`,
} as const
