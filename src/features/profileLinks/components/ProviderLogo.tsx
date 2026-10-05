import {createElement} from 'react'

import {type Props as SVGIconProps} from '#/components/icons/common'
import {Globe_Stroke2_Corner0_Rounded as GlobeIcon} from '#/components/icons/Globe'
import {type SupportProvider} from '../providers'

/**
 * The icon component for a link: the provider's logo for a support link, or
 * a globe for any other site. For slots that take a component, like
 * `ButtonIcon`.
 */
export function linkIcon(provider: SupportProvider | undefined) {
  return provider ? provider.Icon : GlobeIcon
}

export function ProviderLogo({
  provider,
  ...props
}: SVGIconProps & {provider: SupportProvider | undefined}) {
  // createElement so the lookup isn't read as defining a component in render
  return createElement(linkIcon(provider), props)
}
