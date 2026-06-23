/**
 * Eurosky brand-string rebrand.
 *
 * "Bluesky" in upstream copy means three different things:
 *   1. our app brand            -> rebrand to "Eurosky"
 *   2. the network / AT Protocol -> KEEP (factually it is still Bluesky/atproto)
 *   3. proper nouns / other products / legal docs / trademarks -> KEEP
 *
 * Only sense (1) is rebranded. The judgement is made ONCE, in English, as a
 * curated list of Lingui message IDs (`APP_BRAND_MSGIDS`). Lingui generates
 * the same ID for a given source string in EVERY locale catalog, and the
 * brand name "Bluesky" is not localized in translations, so a guarded
 * in-entry word swap is correct in every language with zero per-language
 * work and zero translated maps to maintain.
 *
 * Mechanism: a single chokepoint. `installRebrand(i18n)` wraps the catalog
 * loader so that, for curated entries only, "Bluesky Social" then "Bluesky"
 * become "Eurosky" (Social handled first so we never get "Eurosky Social").
 * Nothing else is touched - any entry NOT in the list passes through
 * verbatim, so network/legal strings stay factually intact by omission and
 * a newly-added upstream string is safe by default until curated.
 *
 * This is the only file (plus a 2-line import in i18n.ts / i18n.web.ts)
 * involved in the rebrand. No component or screen file is edited.
 *
 * Out of scope here (handled by asset/config, not strings): the Eurosky+
 * wordmark/logo, package.json name, app.config.js native names, and any
 * brand text not wrapped in Lingui.
 */

import {type I18n, type Messages as LinguiMessages} from '@lingui/core'

import {BRAND} from '#/config/brand'

/**
 * Curated app-brand message IDs. Each comment is the English source so the
 * list is reviewable without cross-referencing the catalog.
 *
 * REVIEW NOTE: a handful of these are arguable (app vs network sense) - see
 * docs / the session summary. They are included as the conservative
 * user-facing choice; moving any line down into KEEP_MSGIDS reverts just
 * that string with no other change.
 */
const APP_BRAND_MSGIDS = new Set<string>([
  '4bbQsQ', // Your contact firstAuthorName is on Bluesky
  'AETlrv', // profileName joined Bluesky using a starter pack timeAgoString ago
  'AgLgDA', // Your contact firstAuthorLink is on Bluesky
  'RbsMSV', // This will irreversibly delete your Bluesky account <0>currentHandle</0>... (review: account)
  'UuBuVb', // 0plural# people have joined Bluesky via this starter pack!
  'Wf4SRR', // You joined Bluesky timeAgoString ago
  'ehdCS5', // profileName joined Bluesky timeAgoString ago
  's3c7j6', // Invite name to join Bluesky
  'vsdeY2', // You joined Bluesky using a starter pack timeAgoString ago
  '0ssEYu', // You are accessing Bluesky from a region that legally requires...
  'xZFNnS', // Unfortunately, your declared age indicates that you are not old enough... Bluesky
  'QciFed', // Unfortunately, the birthdate you have saved... too young to access Bluesky
  'rSHUvw', // You are currently unable to access Bluesky's Age Assurance flow...
  'R06uT6', // We have partnered with KWS to handle age verification... continue using Bluesky
  '6P/eQF', // Use your account email address... in case KWS or Bluesky needs to contact you (review)
  'oweDNs', // ...certain features on Bluesky must remain restricted...
  'nPMed1', // Due to laws in your region, certain features on Bluesky are currently restricted...
  'GiVeqq', // An illustration depicting user avatars flowing... into the Bluesky app
  'SVUrGc', // Bluesky helps friends find each other by creating an encoded digital fingerprint...
  'VOnIGP', // I consent to Bluesky using my contacts for mutual friend discovery...
  'Ovodxo', // You'll need to go to the System Settings for Bluesky and give permission...
  'AoMjEA', // Held by Bluesky for 7 days to prevent abuse, then deleted
  'TFSknO', // Bluesky is more fun with friends. Do you want to invite some of yours?
  'hOIn4s', // I'm on Bluesky as 0 - come find me! https://bsky.app/download
  '8Dlt5o', // You must be at least 13 years old to use Bluesky. Read our Terms of Service...
  '0SmFVL', // Tap below to allow Bluesky to access your GPS location...
  'zUCFyf', // Unable to access location... enable location services for Bluesky
  'UGGtmB', // ...continue enjoying all the features of Bluesky.
  'E8ogPW', // Your email has not yet been verified... all the features of Bluesky.
  'QfDITI', // Leaving Bluesky
  'WqbUOH', // A screenshot of the post composer... "Bluesky has drafts now!!!"
  'dKRV7a', // Post it to Bluesky or share anywhere. (group chats announcement)
  'pYv2lK', // ...let them scan the code to join you on Bluesky. (invite friends announcement)
  'BZUP5P', // Bluesky needs camera access to scan QR codes from other profiles. (invite scanner)
  'CFvtZB', // Please use the Bluesky mobile app to scan a QR code. (invite scanner, web)
  'PlEImx', // Bluesky is more fun with friends! Import your contacts...
  'KYLfP6', // An mockup of a iPhone showing the Bluesky app open to the profile...
  'GT08QB', // Bluesky will proactively verify notable and authentic accounts.
  'nx5zbz', // Announcing verification on Bluesky
  'e/MhYH', // An illustration showing that Bluesky selects trusted verifiers...
  '+BFXYm', // We're introducing a new layer of verification on Bluesky...
  'uuX9os', // A screenshot of a post... "testing Bluesky's latest feature too!"
  'ixfarI', // Streaming on Twitch? Set your live status on Bluesky to add a badge...
  'PiFjQA', // Sign in to Bluesky or create a new account
  'nO0I9e', // Tap to acknowledge... and continue using Bluesky
  'Pddc2S', // Bluesky is better with friends!
  'TtIdRW', // Bluesky will choose a set of recommended accounts...
  'N142Sr', // Share this starter pack and help people join your community on Bluesky.
  'J9OB+F', // Learn more about verification on Bluesky
  'C5mG5F', // ...These trusted verifiers are selected by Bluesky.
  'c0B9fT', // ...everything else happening on Bluesky.
  'M9NMWw', // Our moderators have reviewed reports and decided to disable your access to chats on Bluesky.
  '60qGwF', // The Bluesky web application
  'NXGB4m', // Verifications on Bluesky work differently than on other platforms...
  'GrdP9a', // Customizes your Bluesky experience
  'hU9en/', // Bluesky is more fun with friends
  'yTwTOo', // Find your friends on Bluesky by verifying your phone number...
  'X9LAzL', // A collection of popular feeds you can find on Bluesky, including News... (review: feed names)
  'l01hMM', // No ads, no invasive tracking... Bluesky respects your time and attention.
  'GCueFe', // An illustration of several Bluesky posts alongside repost, like, and comment icons
  'Hbpkge', // ...disconnect your Bluesky account from Germ DM...
  'aUjjfa', // Find posts, users, and feeds on Bluesky
  'Q/GqNS', // ...use your new password when you sign in to Bluesky from now on.
  'YowO0o', // Bluesky stores your contacts as encoded data...
  'FObjSw', // There's been a rush of new users to Bluesky!...
  'KBdkDa', // Join Bluesky
  'YdrHT+', // Download Bluesky
  '3K+Q5A', // The experience is better in the app. Download Bluesky now...
  'WMvWWe', // Opens flow to create a new Bluesky account
  '72qArr', // Opens flow to sign in to your existing Bluesky account
  't5KS8P', // Learn more about Bluesky (review: splash link to bluesky.com)
  'N9+Gul', // Read the Bluesky blog (review: splash link to bluesky.com)
  'aBX1qv', // This content is not viewable without a Bluesky account.
  'u9cCQU', // Bluesky will not show your profile and posts to logged-out users...
  '+lYa0i', // Note: Bluesky is an open and public network... the Bluesky app and website...
  'lvYkpV', // Learn more about what is public on Bluesky.
  'jPKBV3', // ...no longer be visible to other Bluesky users (Deactivate dialog)
  '1bmUMg', // ...no longer be visible to other Bluesky users (Delete dialog)
])

/**
 * Documentation of the deliberately-EXCLUDED entries (network / protocol /
 * legal-doc / other-product / trademark sense). Listed so the "why is this
 * still Bluesky" question is answered in one place. These are NOT processed;
 * they appear here only as a comment.
 *
 *   '7A9u1j'  Bluesky                              (ServerInput - the PDS provider)
 *   'Q6q9G+'  Bluesky is an open network...        (network/protocol)
 *   '2sNIH6'  Bluesky is an open network...host    (network/protocol)
 *   'BKWeBU'  ...violations of Bluesky's community guidelines...   (policy doc)
 *   'tBlmFu'  ...violations of Bluesky's community guidelines...   (policy doc)
 *   'QPZ2Bk'  ...first seen by Bluesky on <date>   (appview/network indexing)
 *   'f4olkV'  Bluesky cannot confirm... claimed date (appview/network)
 *   'dMRRI+'  Bluesky+ icons                       (product/subscription name)
 *   'E1Imji'  Bluesky+                             (product/subscription name)
 *   'oaQ0RU'  Bluesky Classic(TM)                  (trademark / app-icon variant)
 *   '7+c6/U'  ...sign in to other Bluesky clients  (network ecosystem)
 *   'u7I+xA'  ...sent to Bluesky's moderation service (the real Bluesky-run
 *             labeler at moderation.bsky.app; keep until we run our own -
 *             pairs with the literal in useModerationCauseDescription.ts)
 *   '0CnYjF'  Read the Bluesky Terms of Service    (legal doc name)
 *   'SVSh8N'  Read the Bluesky Privacy Policy      (legal doc name)
 *   'f6UtWw'  ...Bluesky Social Terms of Service   (legal entity + doc)
 *   'TXVWpp'  Bluesky Social Terms of Service      (legal entity + doc)
 *   'kuhbOb'  See jobs at Bluesky                  (Bluesky PBC the company)
 */

const BLUESKY_SOCIAL = /Bluesky Social\b/g
const BLUESKY = /\bBluesky\b/g

function rebrandString(s: string): string {
  if (s.indexOf('Bluesky') === -1) return s
  // "Bluesky Social" first so the brand never becomes "<name> Social".
  return s.replace(BLUESKY_SOCIAL, BRAND.name).replace(BLUESKY, BRAND.name)
}

/**
 * Lingui compiled values are string | Array | nested object (ICU
 * plural/select). Only string leaves are free message text - placeholder
 * tuples and selector keys are structure and never contain the brand word,
 * so a recursive string-leaf swap is safe. Returns a new value; the source
 * catalog object is not mutated.
 */
function rebrandValue(v: unknown): unknown {
  if (typeof v === 'string') return rebrandString(v)
  if (Array.isArray(v)) return v.map(rebrandValue)
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(v)) {
      out[k] = rebrandValue((v as Record<string, unknown>)[k])
    }
    return out
  }
  return v
}

type AnyMessages = Record<string, unknown>

/**
 * Apply the rebrand to a single locale catalog. Only curated IDs are
 * transformed; everything else is passed through by reference. Public
 * surface is Lingui's Messages; we widen internally to walk the values.
 */
export function rebrandMessages(messages: LinguiMessages): LinguiMessages {
  const out: AnyMessages = {...(messages as AnyMessages)}
  for (const id of APP_BRAND_MSGIDS) {
    if (id in out) out[id] = rebrandValue(out[id])
  }
  return out as LinguiMessages
}

/**
 * Single chokepoint. Wrap the i18n catalog loaders once so every locale
 * (loaded lazily, in any order, on web and native) is rebranded with no
 * per-call-site edits. Idempotent.
 */
export function installRebrand(i18n: I18n): void {
  const tagged = i18n as I18n & {__euroskyRebrand?: boolean}
  if (tagged.__euroskyRebrand) return
  tagged.__euroskyRebrand = true

  const origLoadAndActivate = i18n.loadAndActivate.bind(i18n)
  i18n.loadAndActivate = (options: Parameters<I18n['loadAndActivate']>[0]) =>
    origLoadAndActivate({
      ...options,
      messages: rebrandMessages(options.messages),
    })

  const origLoad = i18n.load.bind(i18n) as (...args: unknown[]) => void
  i18n.load = (a: unknown, b?: unknown) => {
    if (typeof a === 'string') {
      return origLoad(a, rebrandMessages(b as LinguiMessages))
    }
    // object form: i18n.load({ en: messages, ... })
    const all = a as Record<string, LinguiMessages>
    const out: Record<string, LinguiMessages> = {}
    for (const locale of Object.keys(all)) {
      out[locale] = rebrandMessages(all[locale])
    }
    return origLoad(out)
  }
}
