import {useMemo} from 'react'
import {StyleProp, TextStyle} from 'react-native'
import mixColors from 'mix-css-color'
import {rgb as compareContrast} from 'wcag-contrast'

import {useTheme} from '#/alf'

export function useDynamicColor({enabled} = {enabled: false}) {
  const t = useTheme()

  const color = enabled
    ? getDynamicColor(t.name !== 'light', t.palette.primary_500)
    : t.palette.primary_500

  return useMemo(
    () =>
      ({
        color,
        textDecorationColor: color,
      } satisfies StyleProp<TextStyle>),
    [color],
  )
}

// the goal is to return a blue color that should be an acceptable constrast with
// the background color. the default blue is rgb(16, 131, 254)
// we want to color mix it with the background color
// and flip to whiteish if it's going to be unacceptable low contrast
const BASE_COLOR_LIGHT = 'rgb(16, 131, 254)'
const BASE_COLOR_DARK = 'rgb(32, 139, 254)'
function getDynamicColor(dark: boolean, themeColor: string) {
  const baseColor = dark ? BASE_COLOR_DARK : BASE_COLOR_LIGHT
  const blendedColor = mixColors(baseColor, themeColor, 75)
  debugColorContrast(
    blendedColor,
    // for debug, we simulate the linear gradient on the profile
    mixColors(themeColor, '#ffffff', 30),
  )
  let [h, s, l] = blendedColor.hsla
  return `hsl(${h}, ${s}%, ${l * 1.1}%)`
}

function debugColorContrast(
  foreground: ReturnType<typeof mixColors>,
  background: ReturnType<typeof mixColors>,
) {
  const score = getContrastScore(foreground, background)
  console.log(
    `%c ${score > 4.5 ? 'PASS' : 'FAIL'}: ${Math.trunc(score * 10) / 10} `,
    `color: ${foreground.hex}; background: ${background.hex}`,
  )
}

function getContrastScore(
  foreground: ReturnType<typeof mixColors>,
  background: ReturnType<typeof mixColors>,
) {
  const [r1, g1, b1] = foreground.rgba
  const [r2, g2, b2] = background.rgba
  return compareContrast([r1, g1, b1], [r2, g2, b2])
}
