/*
 * The apps the post share sheet can send a post to. This file is the single
 * source of truth: app.config.js loads it at build time to declare the iOS
 * schemes and Android packages we're allowed to detect, so it must not import
 * anything and must only use TypeScript that Node can strip (no enums or
 * namespaces). Adding a scheme or package needs a native build; other edits
 * ship over the air.
 */

export type ShareContent = {
  /** The public bsky.app link to the post. */
  url: string
  /** Subject line, for apps that take one (email, Reddit). */
  title: string
}

type GetShareUrl = (content: ShareContent) => string

export type IOSSharePlatform = {
  /**
   * Checked with `canOpenURL` and declared in `LSApplicationQueriesSchemes`,
   * which allows at most 50. Also opens the app for `copyAndOpen`.
   */
  scheme: string
} & (
  | {getShareUrl: GetShareUrl; copyAndOpen?: never}
  | {
      getShareUrl?: never
      /**
       * Copy the link and open the app, so the person pastes it. For apps with
       * no link that opens them with text filled in, since iOS can't send to
       * one app's share screen directly.
       */
      copyAndOpen: true
    }
)

export type AndroidSharePlatform =
  | {
      /** Any one installed counts. Declared in the manifest's `<queries>`. */
      packages: string[]
      scheme?: never
      getShareUrl: GetShareUrl
      directShare?: never
    }
  | {
      packages?: never
      /**
       * For system handlers with no fixed package, like `sms` and `mailto`.
       * Checked with `canOpenURL`.
       */
      scheme: string
      getShareUrl: GetShareUrl
      directShare?: never
    }
  | {
      packages: string[]
      scheme?: never
      getShareUrl?: never
      /**
       * Send the link to the app's own share screen. For apps with no link
       * that opens them with text filled in.
       */
      directShare: true
    }

export type SharePlatform = {
  /** Stable key, used in analytics and remote config. */
  id: string
  /** Brand name, not translated. */
  label: string
  /** Omitted when the app isn't supported on that OS. */
  ios?: IOSSharePlatform
  android?: AndroidSharePlatform
}

const enc = encodeURIComponent

/**
 * In default display order, by where people share posts today. Germ isn't
 * listed yet: it has no link or share screen that accepts text.
 */
const CATALOG = [
  {
    id: 'messages',
    label: 'Messages',
    ios: {
      scheme: 'sms',
      getShareUrl: ({url}) => `sms:&body=${enc(url)}`,
    },
    android: {
      scheme: 'sms',
      getShareUrl: ({url}) => `sms:?body=${enc(url)}`,
    },
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    ios: {
      scheme: 'whatsapp',
      getShareUrl: ({url}) => `whatsapp://send?text=${enc(url)}`,
    },
    android: {
      packages: ['com.whatsapp', 'com.whatsapp.w4b'],
      directShare: true,
    },
  },
  {
    id: 'discord',
    label: 'Discord',
    // No link fills in a message on iOS
    ios: {
      scheme: 'discord',
      copyAndOpen: true,
    },
    android: {
      packages: ['com.discord'],
      directShare: true,
    },
  },
  {
    id: 'telegram',
    label: 'Telegram',
    ios: {
      scheme: 'tg',
      getShareUrl: ({url}) => `https://t.me/share/url?url=${enc(url)}`,
    },
    android: {
      // Direct share, since the t.me link may not open Telegram X
      packages: ['org.telegram.messenger', 'org.thunderdog.challegram'],
      directShare: true,
    },
  },
  {
    id: 'signal',
    label: 'Signal',
    // No link fills in a message on iOS
    ios: {
      scheme: 'sgnl',
      copyAndOpen: true,
    },
    android: {
      packages: ['org.thoughtcrime.securesms'],
      directShare: true,
    },
  },
  {
    id: 'email',
    label: 'Email',
    ios: {
      scheme: 'mailto',
      getShareUrl: ({url, title}) =>
        `mailto:?subject=${enc(title)}&body=${enc(url)}`,
    },
    android: {
      scheme: 'mailto',
      getShareUrl: ({url, title}) =>
        `mailto:?subject=${enc(title)}&body=${enc(url)}`,
    },
  },
  {
    id: 'gmail',
    label: 'Gmail',
    ios: {
      scheme: 'googlegmail',
      getShareUrl: ({url, title}) =>
        `googlegmail:///co?subject=${enc(title)}&body=${enc(url)}`,
    },
    android: {
      packages: ['com.google.android.gm'],
      directShare: true,
    },
  },
  {
    id: 'facebook',
    label: 'Facebook',
    // The sharer.php link is reported to open the feed and drop the link
    ios: {
      scheme: 'fb',
      copyAndOpen: true,
    },
    android: {
      packages: ['com.facebook.katana'],
      directShare: true,
    },
  },
  {
    id: 'messenger',
    label: 'Messenger',
    // The fb-messenger://share link is undocumented and reported to fail on send
    ios: {
      scheme: 'fb-messenger',
      copyAndOpen: true,
    },
    android: {
      packages: ['com.facebook.orca'],
      directShare: true,
    },
  },
  {
    id: 'line',
    label: 'LINE',
    ios: {
      scheme: 'line',
      getShareUrl: ({url}) => `https://line.me/R/share?text=${enc(url)}`,
    },
    android: {
      packages: ['jp.naver.line.android'],
      getShareUrl: ({url}) => `https://line.me/R/share?text=${enc(url)}`,
    },
  },
  {
    id: 'snapchat',
    label: 'Snapchat',
    ios: {
      scheme: 'snapchat',
      getShareUrl: ({url}) =>
        `https://snapchat.com/scan?attachmentUrl=${enc(url)}`,
    },
    android: {
      packages: ['com.snapchat.android'],
      getShareUrl: ({url}) =>
        `https://snapchat.com/scan?attachmentUrl=${enc(url)}`,
    },
  },
  {
    id: 'reddit',
    label: 'Reddit',
    ios: {
      scheme: 'reddit',
      getShareUrl: ({url, title}) =>
        `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(title)}`,
    },
    android: {
      packages: ['com.reddit.frontpage'],
      getShareUrl: ({url, title}) =>
        `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(title)}`,
    },
  },
  {
    id: 'x',
    label: 'X',
    ios: {
      // Undocumented scheme; the x.com intent link is reported to open a login page
      scheme: 'twitter',
      getShareUrl: ({url}) => `twitter://post?message=${enc(url)}`,
    },
    android: {
      // twitter://post opens a blank composer on Android
      packages: ['com.twitter.android'],
      getShareUrl: ({url}) => `https://x.com/intent/post?text=${enc(url)}`,
    },
  },
  {
    id: 'threads',
    label: 'Threads',
    ios: {
      scheme: 'barcelona',
      getShareUrl: ({url}) =>
        `https://www.threads.com/intent/post?text=${enc(url)}`,
    },
    android: {
      packages: ['com.instagram.barcelona'],
      getShareUrl: ({url}) =>
        `https://www.threads.com/intent/post?text=${enc(url)}`,
    },
  },
] as const satisfies readonly SharePlatform[]

export type SharePlatformId = (typeof CATALOG)[number]['id']

/**
 * Every share platform, in default display order.
 */
export const SHARE_PLATFORMS: readonly (SharePlatform & {
  id: SharePlatformId
})[] = CATALOG

export function getSharePlatform(id: SharePlatformId): SharePlatform {
  const platform = SHARE_PLATFORMS.find(p => p.id === id)
  if (!platform) throw new Error(`Unknown share platform: ${id}`)
  return platform
}

/**
 * What the native builds must declare so the app can detect these apps. Used
 * by app.config.js.
 */
export function getNativeQueries(): {
  iosSchemes: string[]
  androidPackages: string[]
  androidSchemes: string[]
} {
  return {
    iosSchemes: unique(
      SHARE_PLATFORMS.flatMap(p => (p.ios ? [p.ios.scheme] : [])),
    ),
    androidPackages: unique(
      SHARE_PLATFORMS.flatMap(p => p.android?.packages ?? []),
    ),
    androidSchemes: unique(
      SHARE_PLATFORMS.flatMap(p =>
        p.android?.scheme ? [p.android.scheme] : [],
      ),
    ),
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}
