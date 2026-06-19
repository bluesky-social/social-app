import {BrandLogo} from './BrandLogo'
import {type Props, useCommonSVGProps} from './common'

/**
 * mu brand mark. For mu the symbol and the wordmark are one and the same, so
 * `Mark` and `Full` both render the shared brand logo via <BrandLogo>; `Mark`
 * sits in a square box (icon-style), `Full` is aspect-correct.
 */
export function Mark(props: Props) {
  const {fill, size, style} = useCommonSVGProps(props)
  return (
    <BrandLogo variant="mark" size={size} square fill={fill} style={style} />
  )
}

export function Full(
  props: Omit<Props, 'fill' | 'size' | 'height'> & {
    markFill?: Props['fill']
    textFill?: Props['fill']
  },
) {
  const {fill, size, style} = useCommonSVGProps(props)

  return (
    <BrandLogo
      variant="mark"
      size={size}
      fill={props.markFill ?? props.textFill ?? fill}
      style={style}
    />
  )
}
