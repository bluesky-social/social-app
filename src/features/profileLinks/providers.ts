import {definitelyUrl} from '#/lib/strings/url-helpers'

/**
 * A generated icon in `#/components/icons/community`. Kept as a name so this
 * module stays free of native imports.
 */
export type SupportProviderLogoName =
  | 'BigCartel'
  | 'Boosty'
  | 'Booth'
  | 'BuyMeACoffee'
  | 'CashApp'
  | 'Chuffed'
  | 'Crowdfundr'
  | 'Donorbox'
  | 'Etsy'
  | 'Fourthwall'
  | 'Givebutter'
  | 'GiveSendGo'
  | 'GoFundMe'
  | 'Gumroad'
  | 'Indiegogo'
  | 'Inprint'
  | 'ItchIo'
  | 'JustGiving'
  | 'Kickstarter'
  | 'KoFi'
  | 'Liberapay'
  | 'OpenCollective'
  | 'Patreon'
  | 'PayPal'
  | 'PixivFanbox'
  | 'Redbubble'
  | 'Skeb'
  | 'Stripe'
  | 'Substack'
  | 'Throne'
  | 'Venmo'
  | 'Vgen'
  | 'Zeffy'

export type SupportProvider = {
  name: string
  logo: SupportProviderLogoName
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
  {name: 'Big Cartel', logo: 'BigCartel', domain: 'bigcartel.com'},
  {name: 'Boosty', logo: 'Boosty', domain: 'boosty.to'},
  {name: 'BOOTH', logo: 'Booth', domain: 'booth.pm'},
  {name: 'Buy Me a Coffee', logo: 'BuyMeACoffee', domain: 'buymeacoffee.com'},
  {name: 'Cash App', logo: 'CashApp', domain: 'cash.app'},
  {
    name: 'Chuffed',
    logo: 'Chuffed',
    domain: 'chuffed.org',
    pathPrefix: '/campaign/',
  },
  {
    name: 'Chuffed',
    logo: 'Chuffed',
    domain: 'chuffed.org',
    pathPrefix: '/project/',
  },
  {name: 'Crowdfundr', logo: 'Crowdfundr', domain: 'crowdfundr.com'},
  {name: 'Donorbox', logo: 'Donorbox', domain: 'donorbox.org'},
  {name: 'Etsy', logo: 'Etsy', domain: 'etsy.com'},
  {name: 'Fourthwall', logo: 'Fourthwall', domain: 'fourthwall.com'},
  {name: 'Givebutter', logo: 'Givebutter', domain: 'givebutter.com'},
  {name: 'GiveSendGo', logo: 'GiveSendGo', domain: 'givesendgo.com'},
  {name: 'GoFundMe', logo: 'GoFundMe', domain: 'gofundme.com'},
  {name: 'Gumroad', logo: 'Gumroad', domain: 'gumroad.com'},
  {name: 'Indiegogo', logo: 'Indiegogo', domain: 'indiegogo.com'},
  {
    name: 'INPRNT',
    logo: 'Inprint',
    domain: 'inprnt.com',
    pathPrefix: '/gallery/',
  },
  {name: 'itch.io', logo: 'ItchIo', domain: 'itch.io'},
  {name: 'JustGiving', logo: 'JustGiving', domain: 'justgiving.com'},
  {name: 'Kickstarter', logo: 'Kickstarter', domain: 'kickstarter.com'},
  {name: 'Ko-fi', logo: 'KoFi', domain: 'ko-fi.com'},
  {name: 'Liberapay', logo: 'Liberapay', domain: 'liberapay.com'},
  {
    name: 'Open Collective',
    logo: 'OpenCollective',
    domain: 'opencollective.com',
  },
  {name: 'Patreon', logo: 'Patreon', domain: 'patreon.com'},
  {
    name: 'PayPal',
    logo: 'PayPal',
    domain: 'paypal.com',
    pathPrefix: '/paypalme/',
  },
  {name: 'PayPal', logo: 'PayPal', domain: 'paypal.me'},
  {name: 'pixivFANBOX', logo: 'PixivFanbox', domain: 'fanbox.cc'},
  {name: 'Redbubble', logo: 'Redbubble', domain: 'redbubble.com'},
  {name: 'Skeb', logo: 'Skeb', domain: 'skeb.jp'},
  {name: 'Stripe', logo: 'Stripe', domain: 'buy.stripe.com'},
  {name: 'Stripe', logo: 'Stripe', domain: 'donate.stripe.com'},
  {name: 'Substack', logo: 'Substack', domain: 'substack.com'},
  {name: 'Throne', logo: 'Throne', domain: 'throne.com'},
  {name: 'Venmo', logo: 'Venmo', domain: 'venmo.com'},
  {name: 'VGen', logo: 'Vgen', domain: 'vgen.co'},
  {name: 'Zeffy', logo: 'Zeffy', domain: 'zeffy.com'},
]

/**
 * Normalizes user input like `patreon.com/name` into an https URL, or returns
 * null if it isn't a usable web link.
 */
export function normalizeProfileLinkUrl(input: string): string | null {
  return definitelyUrl(input.trim())
}

/**
 * Sites that can't be added as profile links: adult-content platforms, and
 * file and link hosts T&S has seen used the same way as shorteners. T&S owns
 * the full list.
 */
export const BLOCKED_DOMAINS = [
  'aceimg.in',
  'fansly.com',
  'onlyfans.com',
  'onlylinks.cc',
  'slicedrve.in',
  'vdey.in',
  'videy.at',
  'videy.lt',
  'videy.my',
]

/**
 * General-purpose URL shorteners, which hide where a link goes. Per T&S, most
 * taps on adult links from profiles went through one. A brand's own short
 * links (youtu.be, amzn.to) only lead to that brand, so they aren't listed.
 */
export const SHORTENER_DOMAINS = [
  'acel.me',
  'adf.ly',
  'bit.ly',
  'bitly.com',
  'bl.ink',
  'buff.ly',
  'clck.ru',
  'cutt.ly',
  'fc-lc.xyz',
  'goo.gl',
  'goto.now',
  'is.gd',
  'link2.fm',
  'ln.run',
  'lnk.ua',
  'lnkd.in',
  'n9.cl',
  'ow.ly',
  'psee.io',
  'rb.gy',
  'rebrand.ly',
  'rg.by',
  's.id',
  'short.do',
  'short.gy',
  'shorten.as',
  'shorten.ee',
  'shorten.is',
  'shorten.so',
  'shorten.tv',
  'shorten.world',
  'shorter.me',
  'shortn.icu',
  'shorturl.at',
  'shorturl.lt',
  'shorturl.ly',
  'slnt.to',
  'smarturl.lt',
  'smarturl.my',
  'sprl.me',
  'sw.run',
  't.co',
  't.ly',
  'tiny.cc',
  'tinyurl.com',
  'urlr.me',
  'v.gd',
  'x.gd',
  'zig.ht',
]

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

/** Plain http links can be tampered with on the way, so only https is allowed. */
export function isInsecureLink(url: string): boolean {
  return parseWebUrl(url)?.protocol === 'http:'
}

export function isShortenerLink(url: string): boolean {
  const parsed = parseWebUrl(url)
  if (!parsed) return false
  const host = parsed.hostname.toLowerCase()
  return SHORTENER_DOMAINS.some(domain => hostMatchesDomain(host, domain))
}

/** A link the way people type it, without the scheme. */
export function formatLinkUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')
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
  isShortener: boolean
  isInsecure: boolean
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
    isShortener: !!url && isShortenerLink(url),
    // typing more can't fix an http scheme, so flag it before the host is done
    isInsecure: /^http:/i.test(trimmed) || (!!url && isInsecureLink(url)),
  }
}
