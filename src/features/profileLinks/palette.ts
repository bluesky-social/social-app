import {useTheme} from '#/alf'

/**
 * The support green, which is the same everywhere it appears so people learn
 * what it means.
 *
 * Dark themes mirror the palette scale (positive_600 becomes a light green),
 * so the button picks its step per theme to land on the same deep green. The
 * tints rely on that mirroring instead: positive_25 is a pale wash in light
 * mode and a deep one in dark mode.
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
