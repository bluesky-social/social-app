import React from 'react'
import Svg, {Path} from 'react-native-svg'

import {Props, useCommonSVGProps} from '#/components/icons/common'

export const IconTemplate_Stroke2_Corner0_Rounded = React.forwardRef(
  function LogoImpl(props: Props, ref) {
    const {fill, size, style, ...rest} = useCommonSVGProps(props)

    return (
      <Svg
        fill="none"
        {...rest}
        // @ts-ignore it's fiiiiine
        ref={ref}
        viewBox="0 0 24 24"
        width={size}
        height={size}
        style={[style]}>
        <Path
          fill={fill}
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4.062 11h2.961c.103-2.204.545-4.218 1.235-5.77.06-.136.123-.269.188-.399A8.007 8.007 0 0 0 4.062 11ZM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Zm0 2c-.227 0-.518.1-.868.432-.354.337-.719.872-1.047 1.61-.561 1.263-.958 2.991-1.06 4.958h5.95c-.102-1.967-.499-3.695-1.06-4.958-.328-.738-.693-1.273-1.047-1.61C12.518 4.099 12.227 4 12 4Zm4.977 7c-.103-2.204-.545-4.218-1.235-5.77a9.78 9.78 0 0 0-.188-.399A8.006 8.006 0 0 1 19.938 11h-2.961Zm-2.003 2H9.026c.101 1.966.498 3.695 1.06 4.958.327.738.692 1.273 1.046 1.61.35.333.641.432.868.432.227 0 .518-.1.868-.432.354-.337.719-.872 1.047-1.61.561-1.263.958-2.991 1.06-4.958Zm.58 6.169c.065-.13.128-.263.188-.399.69-1.552 1.132-3.566 1.235-5.77h2.961a8.006 8.006 0 0 1-4.384 6.169Zm-7.108 0a9.877 9.877 0 0 1-.188-.399c-.69-1.552-1.132-3.566-1.235-5.77H4.062a8.006 8.006 0 0 0 4.384 6.169Z"
        />
      </Svg>
    )
  },
)

export function createSinglePathSVG({path}: {path: string}) {
  return React.forwardRef<Svg, Props>(function LogoImpl(props, ref) {
    const {fill, size, style, gradient, ...rest} = useCommonSVGProps(props)

    return (
      <Svg
        fill="none"
        {...rest}
        ref={ref}
        viewBox="0 0 24 24"
        width={size}
        height={size}
        style={[style]}>
        {gradient}
        <Path fill={fill} fillRule="evenodd" clipRule="evenodd" d={path} />
      </Svg>
    )
  })
}

export function createMultiPathSVG({paths}: {paths: string[]}) {
  return React.forwardRef<Svg, Props>(function LogoImpl(props, ref) {
    const {fill, size, style, gradient, ...rest} = useCommonSVGProps(props)

    return (
      <Svg
        fill="none"
        {...rest}
        ref={ref}
        viewBox="0 0 24 24"
        width={size}
        height={size}
        style={[style]}>
        {gradient}
        {paths.map((path, i) => (
          <Path
            key={i}
            fill={fill}
            fillRule="evenodd"
            clipRule="evenodd"
            d={path}
          />
        ))}
      </Svg>
    )
  })
}
