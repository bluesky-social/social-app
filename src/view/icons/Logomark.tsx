import LogomarkSvg from '../../../assets/icons/logomark.svg'
import type {PathProps, SvgProps} from 'react-native-svg'
import {IS_WEB} from '#/env'

import {usePalette} from '#/lib/hooks/usePalette'

const ratio = 54 / 61

export function Logomark({
  fill,
  ...rest
}: {fill?: PathProps['fill']} & SvgProps) {
  const pal = usePalette('default')
  // @ts-ignore it's fiiiiine
  const size = parseInt(rest.width || 32)

  const SvgImport: any = LogomarkSvg
  const isUrl = typeof SvgImport === 'string'

  if (IS_WEB && isUrl) {
    // Render <img> on web when SVG import resolves to a URL
    // @ts-ignore
    return (
      <img
        src={SvgImport}
        width={size}
        height={Number(size) * ratio}
        style={{ display: 'block' }}
        alt="Bluesky"
        // @ts-ignore
        {...(rest as any)}
      />
    )
  }

  return (
    // @ts-ignore
    <LogomarkSvg
      width={size}
      height={Number(size) * ratio}
      fill={fill || pal.text.color}
      {...rest}
    />
  )
}
