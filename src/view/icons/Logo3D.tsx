import Svg, {Path, type PathProps, type SvgProps} from 'react-native-svg'

import {useTheme} from '#/alf'
import {MU_LOGO_3D} from '#/config/eurosky-logo'

/**
 * 3D / extruded mu wordmark for hero + marketing surfaces (the welcome modal).
 * A deep accent silhouette is drawn behind a brighter accent face, offset
 * up-and-left, for the drop-shadow look. Both tones default to the active
 * accent ramp so the mark follows the brand colour and reads on any theme bg.
 */
const ratio = MU_LOGO_3D.ratio

export function Logo3D({
  faceFill,
  shadowFill,
  ...rest
}: {
  faceFill?: PathProps['fill']
  shadowFill?: PathProps['fill']
} & SvgProps) {
  const t = useTheme()
  // @ts-ignore it's fiiiiine
  const size = parseInt(rest.width || 140)
  const _face = faceFill || t.palette.primary_400
  const _shadow = shadowFill || t.palette.primary_900

  return (
    <Svg
      fill="none"
      viewBox={MU_LOGO_3D.viewBox}
      {...rest}
      width={size}
      height={Number(size) * ratio}>
      <Path fill={_shadow} d={MU_LOGO_3D.shadowPath} />
      <Path fill={_face} d={MU_LOGO_3D.facePath} />
    </Svg>
  )
}
