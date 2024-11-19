import Svg, {Path, PathProps, SvgProps} from 'react-native-svg'

import {usePalette} from '#/lib/hooks/usePalette'

const ratio = 54 / 61

export function Logomark({
  fill,
  ...rest
}: {fill?: PathProps['fill']} & SvgProps) {
  const pal = usePalette('default')
  // @ts-ignore it's fiiiiine
  const size = parseInt(rest.width || 32)

  return (
    <Svg
      fill="none"
      viewBox="0 0 61 54"
      {...rest}
      width={size}
      height={Number(size) * ratio}>
      <Path
        fill={fill || pal.text.color}
        d="M13.223 3.602C20.215 8.832 27.738 19.439 30.5 25.13c2.762-5.691 10.284-16.297 17.278-21.528C52.824-.172 61-3.093 61 6.2c0 1.856-1.068 15.59-1.694 17.82-2.178 7.752-10.112 9.73-17.17 8.532 12.337 2.092 15.475 9.021 8.697 15.95-12.872 13.159-18.5-3.302-19.943-7.52-.264-.773-.388-1.135-.39-.827-.002-.308-.126.054-.39.827-1.442 4.218-7.071 20.679-19.943 7.52-6.778-6.929-3.64-13.858 8.697-15.95-7.058 1.197-14.992-.78-17.17-8.532C1.068 21.79 0 8.056 0 6.2 0-3.093 8.176-.172 13.223 3.602Z"
      />
    </Svg>
  )
}
