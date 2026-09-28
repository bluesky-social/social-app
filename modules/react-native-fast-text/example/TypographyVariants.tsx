import {type TextProps} from '#/alf/typography'
import {Text} from '#/components/Typography'
import {Text as BaselineText} from './BaselineTypography'

/** Equal wrapper depth for all three variants; implementation sources differ. */
export function TypographyBefore(props: TextProps) {
  return <BaselineText {...props} />
}

export function TypographyWrapper(props: TextProps) {
  return <Text {...props} deopt />
}

export function TypographyFast(props: TextProps) {
  return <Text {...props} />
}
