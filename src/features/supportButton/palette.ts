import {useTheme} from '#/alf'

/**
 * The Support button is one locked color everywhere it appears. Nothing here
 * is configurable by the creator - consistency is what makes the green button
 * recognizable (and moderatable) across the whole network.
 *
 * Dark themes mirror the palette scale (positive_600 becomes a light green),
 * so the button picks its step per theme to land on the same deep green. The
 * tints rely on that mirroring instead: positive_25 is a pale wash in light
 * mode and a deep one in dark mode, which is exactly what we want.
 */
export function useSupportPalette() {
  const t = useTheme()
  const light = t.name === 'light'
  return {
    bg: light ? t.palette.positive_600 : t.palette.positive_400,
    bgHover: light ? t.palette.positive_700 : t.palette.positive_300,
    fg: t.palette.white,
    tintBg: t.palette.positive_25,
    tintBorder: t.palette.positive_100,
    tintText: t.palette.positive_700,
  }
}
