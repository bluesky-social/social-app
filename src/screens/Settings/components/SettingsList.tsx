import React from 'react'

import * as Button from '#/components/Button'
import {Link, LinkProps} from '#/components/Link'

export function LinkItem({style, ...props}: LinkProps) {
  return <Link style={[style]} {...props} />
}

export function ItemIcon(
  props: React.ComponentProps<typeof Button.ButtonIcon>,
) {
  return <Button.ButtonIcon {...props} />
}

export function ItemText({
  // eslint-disable-next-line react/prop-types
  style,
  ...props
}: React.ComponentProps<typeof Button.ButtonText>) {
  return <Button.ButtonText style={[style]} {...props} />
}
