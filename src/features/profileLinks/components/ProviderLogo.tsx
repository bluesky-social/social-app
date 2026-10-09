import {createElement} from 'react'

import {type Props as SVGIconProps} from '#/components/icons/common'
import {BigCartel} from '#/components/icons/community/BigCartel'
import {Boosty} from '#/components/icons/community/Boosty'
import {BuyMeACoffee} from '#/components/icons/community/BuyMeACoffee'
import {CashApp} from '#/components/icons/community/CashApp'
import {Etsy} from '#/components/icons/community/Etsy'
import {GoFundMe} from '#/components/icons/community/GoFundMe'
import {Gumroad} from '#/components/icons/community/Gumroad'
import {Indiegogo} from '#/components/icons/community/Indiegogo'
import {ItchIo} from '#/components/icons/community/ItchIo'
import {JustGiving} from '#/components/icons/community/JustGiving'
import {Kickstarter} from '#/components/icons/community/Kickstarter'
import {KoFi} from '#/components/icons/community/KoFi'
import {Liberapay} from '#/components/icons/community/Liberapay'
import {OpenCollective} from '#/components/icons/community/OpenCollective'
import {Patreon} from '#/components/icons/community/Patreon'
import {PayPal} from '#/components/icons/community/PayPal'
import {Redbubble} from '#/components/icons/community/Redbubble'
import {Stripe} from '#/components/icons/community/Stripe'
import {Substack} from '#/components/icons/community/Substack'
import {Venmo} from '#/components/icons/community/Venmo'
import {Vgen} from '#/components/icons/community/Vgen'
import {Globe_Stroke2_Corner0_Rounded as GlobeIcon} from '#/components/icons/Globe'
import {type SupportProvider, type SupportProviderLogoName} from '../providers'

const SUPPORT_PROVIDER_LOGOS: Record<SupportProviderLogoName, typeof KoFi> = {
  BigCartel,
  Boosty,
  BuyMeACoffee,
  CashApp,
  Etsy,
  GoFundMe,
  Gumroad,
  Indiegogo,
  ItchIo,
  JustGiving,
  Kickstarter,
  KoFi,
  Liberapay,
  OpenCollective,
  Patreon,
  PayPal,
  Redbubble,
  Stripe,
  Substack,
  Venmo,
  Vgen,
}

/**
 * The icon component for a link: the provider's logo for a support link, or
 * a globe for any other site. For slots that take a component, like
 * `ButtonIcon`.
 */
export function linkIcon(provider: SupportProvider | undefined) {
  return provider ? SUPPORT_PROVIDER_LOGOS[provider.logo] : GlobeIcon
}

export function ProviderLogo({
  provider,
  ...props
}: SVGIconProps & {provider: SupportProvider | undefined}) {
  // createElement so the lookup isn't read as defining a component in render
  return createElement(linkIcon(provider), props)
}
