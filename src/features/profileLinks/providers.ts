import {definitelyUrl} from '#/lib/strings/url-helpers'
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
import {Venmo} from '#/components/icons/community/Venmo'
import {Vgen} from '#/components/icons/community/Vgen'

export type SupportProvider = {
  name: string
  Icon: typeof KoFi
  /**
   * Registrable domain, or a specific host like `buy.stripe.com`. Matches the
   * domain itself and its subdomains only, so `ko-fi.com.example.net` does not
   * count as Ko-fi.
   */
  domain: string
  /**
   * For providers that share a domain with non-support pages.
   */
  pathPrefix?: string
}

/**
 * Recognized support platforms, matching the logos in
 * `assets/icons/community/`. Adult platforms are excluded per T&S.
 */
export const SUPPORT_PROVIDERS: SupportProvider[] = [
  {name: 'Big Cartel', Icon: BigCartel, domain: 'bigcartel.com'},
  {name: 'Boosty', Icon: Boosty, domain: 'boosty.to'},
  {name: 'Buy Me a Coffee', Icon: BuyMeACoffee, domain: 'buymeacoffee.com'},
  {name: 'Cash App', Icon: CashApp, domain: 'cash.app'},
  {name: 'Etsy', Icon: Etsy, domain: 'etsy.com'},
  {name: 'GoFundMe', Icon: GoFundMe, domain: 'gofundme.com'},
  {name: 'Gumroad', Icon: Gumroad, domain: 'gumroad.com'},
  {name: 'Indiegogo', Icon: Indiegogo, domain: 'indiegogo.com'},
  {name: 'itch.io', Icon: ItchIo, domain: 'itch.io'},
  {name: 'JustGiving', Icon: JustGiving, domain: 'justgiving.com'},
  {name: 'Kickstarter', Icon: Kickstarter, domain: 'kickstarter.com'},
  {name: 'Ko-fi', Icon: KoFi, domain: 'ko-fi.com'},
  {name: 'Liberapay', Icon: Liberapay, domain: 'liberapay.com'},
  {
    name: 'Open Collective',
    Icon: OpenCollective,
    domain: 'opencollective.com',
  },
  {name: 'Patreon', Icon: Patreon, domain: 'patreon.com'},
  {name: 'PayPal', Icon: PayPal, domain: 'paypal.me'},
  {
    name: 'PayPal',
    Icon: PayPal,
    domain: 'paypal.com',
    pathPrefix: '/paypalme/',
  },
  {name: 'Redbubble', Icon: Redbubble, domain: 'redbubble.com'},
  {name: 'Stripe', Icon: Stripe, domain: 'buy.stripe.com'},
  {name: 'Stripe', Icon: Stripe, domain: 'donate.stripe.com'},
  {name: 'Venmo', Icon: Venmo, domain: 'venmo.com'},
  {name: 'VGen', Icon: Vgen, domain: 'vgen.co'},
]

/**
 * Normalizes user input like `patreon.com/name` into an https URL, or returns
 * null if it isn't a usable web link.
 */
export function normalizeProfileLinkUrl(input: string): string | null {
  return definitelyUrl(input.trim())
}

/**
 * Sites that can't be added as profile links. Adult-content platforms are
 * excluded from the beta; T&S owns the full list.
 */
export const BLOCKED_DOMAINS = ['onlyfans.com', 'fansly.com']

function parseWebUrl(url: string): URL | undefined {
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed
    }
  } catch {}
  return undefined
}

/**
 * True for the domain itself and its subdomains, never for lookalikes.
 */
function hostMatchesDomain(host: string, domain: string) {
  return host === domain || host.endsWith(`.${domain}`)
}

/**
 * True when the URL points at a specific account or page on the provider, not
 * its homepage. Accounts live either on a subdomain (`name.itch.io`) or in the
 * path (`ko-fi.com/name`).
 */
function isAccountUrl(parsed: URL, provider: SupportProvider) {
  const host = parsed.hostname.toLowerCase()
  const path = parsed.pathname.toLowerCase().replace(/\/+$/, '')
  if (provider.pathPrefix) {
    const prefix = provider.pathPrefix.replace(/\/+$/, '')
    return path.startsWith(`${prefix}/`)
  }
  const isAccountSubdomain =
    host !== provider.domain && host !== `www.${provider.domain}`
  return isAccountSubdomain || path.length > 0
}

/**
 * The recognized support platform a link points to, if any. A bare provider
 * homepage never counts, so it never gets the green button.
 */
export function getSupportProvider(url: string): SupportProvider | undefined {
  const parsed = parseWebUrl(url)
  if (!parsed) return undefined
  const host = parsed.hostname.toLowerCase()
  return SUPPORT_PROVIDERS.find(
    provider =>
      hostMatchesDomain(host, provider.domain) &&
      isAccountUrl(parsed, provider),
  )
}

export function isBlockedProfileLink(url: string): boolean {
  const parsed = parseWebUrl(url)
  if (!parsed) return false
  const host = parsed.hostname.toLowerCase()
  return BLOCKED_DOMAINS.some(domain => hostMatchesDomain(host, domain))
}

export function getLinkHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export type LinkInputValidation = {
  /** Canonical https URL, or null if the input isn't a usable link. */
  url: string | null
  provider: SupportProvider | undefined
  isEmpty: boolean
  isBlocked: boolean
}

/** Checks what a person typed into the link field. */
export function validateLinkInput(input: string): LinkInputValidation {
  const trimmed = input.trim()
  const url = trimmed ? normalizeProfileLinkUrl(trimmed) : null
  return {
    url,
    provider: url ? getSupportProvider(url) : undefined,
    isEmpty: trimmed.length === 0,
    isBlocked: !!url && isBlockedProfileLink(url),
  }
}
