import {ColorValue} from 'react-native'
import hslToRgb from 'hsl-to-rgb-for-reals'
import {rgb} from 'wcag-contrast'

export function compareAndContrast(
  compare: ColorValue | undefined,
  contrast: ColorValue | undefined,
) {
  let result = contrast

  if (compare && contrast) {
    const [, bgHue, bgSat, bgLuminance] =
      compare.toString().match(/hsl\((\d+), (\d+)%, ([\d\.]+)%\)/) || []
    const [, textHue, textSat, textLuminance] =
      contrast.toString().match(/hsl\((\d+), (\d+)%, ([\d\.]+)%\)/) || []
    const compareRgb = hslToRgb(
      parseInt(bgHue),
      parseInt(bgSat) / 100,
      parseInt(bgLuminance) / 100,
    )
    const contrastRgb = hslToRgb(
      parseInt(textHue),
      parseInt(textSat) / 100,
      parseInt(textLuminance) / 100,
    )
    const score = rgb(compareRgb, contrastRgb)
    if (score < 3) {
      result = `hsl(${textHue}, ${textSat}%, ${Math.abs(
        parseInt(textLuminance) - 100,
      )}%)`
    }
  }

  return result
}
