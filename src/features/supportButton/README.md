# Support button (CTA v1 prototype)

Prototype for [CTA Button v1](https://linear.app/blueskyweb/project/cta-button-v1-ec6630741743).
Lets a creator attach a green **Support** button to their profile and posts
that links out to a payment page they already run (Ko-fi, Patreon, ...).
Bluesky takes no cut and holds no money.

## Design decisions baked in

- **One verb, one color.** `Support` only, always the same green. Creators
  pick the destination, nothing else. See `SupportPill` and `palette.ts`.
- **Any link is allowed, but it has to be a link that works.** Creators point
  the button wherever they take payments. Providers in `providers.ts` are
  recognized for their logo; anything else gets the heart. Validation happens
  when Save is pressed, not while typing (typing `ko-fi` is invalid until the
  `.com` lands): text that isn't a URL gets "That doesn't look like a link",
  and a URL the link preview service can't fetch gets "We couldn't reach this
  link" with the button turning into **Save anyway**. The second one is soft
  because some providers (Cash App) block scrapers.
- **Provider logos as the trust mark.** A recognized provider's glyph replaces
  the heart on the button, in the card header, in the interstitial and next to
  "Recognized" while typing (`logos.ts`, generated from the SVGs Darrin
  collected). Providers without a logo keep the heart.
- **Interstitial on the profile button.** Tapping Support on a profile opens
  `SupportInterstitial` first: you're leaving Bluesky, the provider handles
  payment, no refunds via Bluesky, plus a report link.
- **Profile placement is under the bio, not beside Follow.** Follow is about
  the relationship; Support is about money. It's a compact pill ("Support on
  Ko-fi", or just "Support" for an unrecognized link) that sits inline with
  the Germ DM chip at the same height.
- **The card is a normal link card plus the button.** `SupportEmbedCard` has
  the same anatomy as `ExternalEmbed` (thumbnail, title, description, domain)
  with the green Support button appended. A card shows for a recognized
  provider, or when the link is exactly the author's saved Support link. Because
  the card already shows the destination, body and button open the provider
  directly; only the profile button goes through the interstitial.

## Version B: social proof

Version B (branch `darrin/cta-prototype-v2`) adds one thing on top of A: a
**"Supported by"** row showing who in your own network supports the creator,
as stacked avatars plus "Supported by A, B, and N others". It appears in two
places, sized to fit each:

- **Post card** - a compact row (20pt faces) just above the green button, so
  the social proof lands right before the ask.
- **Interstitial** - a regular row (30pt faces) under the title, before the
  leaving-Bluesky copy.

The row is modeled on the profile's "Followed by" line so it reads as the same
kind of fact, and it renders nothing when there's no one to show - an empty
state would only undercut the button.

**Data is a stand-in.** Bluesky never sees the payment, so there is no real
supporter list. `SupportedBy` reads the creator's known followers (people you
follow who also follow them) and presents them as supporters. That gives real
faces from your network for design review; swap `useSupporters` for a real
source when one exists.

## Surfaces

| Surface | Component | Wired in |
| --- | --- | --- |
| Post embed card | `SupportEmbedCard` | `components/Post/Embed/index.tsx` (`link` case) |
| Social proof (B) | `SupportedBy` | inside `SupportEmbedCard` and `SupportInterstitial` |
| Composer preview | `SupportEmbedCard preview` | `view/com/composer/ExternalEmbed.tsx` |
| Profile | `ProfileSupportButton` | `screens/Profile/Header/ProfileHeaderStandard.tsx` (owner tap opens the sheet) |
| Add / edit / remove | `SupportLinkDialog` | opened from the "Support button" row in `EditProfileDialog.tsx` and from your own profile button |

## Data (prototype only)

There's no lexicon yet. `storage.ts` keeps links in device storage keyed by
DID (`device.supportLinks`). For demos, a profile with no saved link but a
recognized provider URL in its bio shows the button anyway. Any post whose
link card points at a recognized provider renders as a Support card.

Swap `storage.ts` for a record-backed query when the data model lands; the
UI only touches `useSupportLink` / `useMySupportLink`.
