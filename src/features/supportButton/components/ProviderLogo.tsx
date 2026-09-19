import {createElement} from 'react'

import {type Props as SVGIconProps} from '#/components/icons/common'
import {Heart2_Filled_Stroke2_Corner0_Rounded as Heart} from '#/components/icons/Heart2'
import {getProviderLogo} from '../logos'
import {type SupportProvider} from '../types'

/**
 * The provider's glyph when we have one, otherwise the heart. Rendered through
 * the standard icon props so callers color and size it like any other icon.
 */
export function ProviderLogo({
  provider,
  ...props
}: SVGIconProps & {
  provider: SupportProvider | null
}) {
  // createElement (not JSX) so the compiler lint doesn't read the lookup as
  // defining a new component during render
  return createElement(getProviderLogo(provider?.id) ?? Heart, props)
}

/**
 * Picks the icon component for a provider, for slots that take a component
 * rather than an element (e.g. `ButtonIcon`).
 */
export function providerIcon(provider: SupportProvider | null) {
  return getProviderLogo(provider?.id) ?? Heart
}
