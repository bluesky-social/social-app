# Asset licensing

The [MIT license](./LICENSE) in this repository covers our source code. It does not cover
every file in the tree.

Some of the images, icons, fonts, and brand assets here are licensed to Bluesky Social PBC
by third parties, or are our trademarks, or are third-party trademarks. We cannot pass those
rights on to you. This document identifies them.

We should have written this down sooner. If you have already forked this repository and
shipped one of the assets listed below, we are not treating that as bad faith on your part —
the repository did not tell you, and that is our fault. Please work through the
[If you are forking](#if-you-are-forking) checklist when you can.

Assets are scoped by directory wherever possible, so that adding a file to a carved-out
directory does not require an edit here. Individual paths are listed only where an asset does
not sit in a dedicated directory.

**The rule:** if a file is listed in this document, the MIT license does not grant you rights
to it. Everything in [Section 6](#6-third-party-assets-you-may-redistribute) is redistributable
on its own terms, which travel with the files.

---

## 1. Commissioned artwork — licensed to Bluesky only

**`assets/illustrations/`**

The landing-screen illustration, in light and dark variants, used by
`src/view/com/auth/SplashScreen.tsx` (`illustration-mobile.png` and
`illustration-mobile-dark.png`).

This artwork was commissioned by Bluesky Social PBC from illustrator Owen D. Pomery, through
his agent Brilliant Artists Ltd. Copyright remains with the artist. Our license is limited to
Bluesky's own products and channels, it is exclusive to us, and it does not permit us to
sublicense the artwork or to distribute modified versions of it.

**If you are forking this repository, replace these files.** They are not available for
third-party licensing while our license runs, so please do not contact the artist or his agent
to request permission — the answer is constrained by our agreement, not by their willingness.
See [`assets/illustrations/README.md`](./assets/illustrations/README.md).

## 2. Licensed icon system — not ours to pass on

**`assets/icons/` (top level), and the icon glyphs in `bskyembed/assets/`**

The user-interface glyphs at the top level of `assets/icons/`, plus copies of several in
`bskyembed/assets/`, come from the Central icon system by Iconists (David & Storm GbR). Bluesky
Social PBC licenses these icons for use in our own products. **That license is for our own use.
It does not include the right to pass any rights to the icons on to you.**

This is not us telling you that you cannot use these icons. It is us telling you that any right
you have to use them has to come from Iconists rather than from us, and that you should not
assume our MIT license gave you one. Licenses are available directly from
[iconists.co](https://iconists.co), and there are good openly licensed alternatives if you would
rather not buy one.

This section covers every file at the top level of `assets/icons/` **except** those named
elsewhere in this document — specifically `logomark.svg`, `newskie.svg`, `verifiedCheck.svg`,
`verifierCheck.svg`, `starterPack.svg`, `starterPack_stroke2_corner0_rounded.svg`, `custom_logo_japan.svg`,
`apple_logo.svg`, and `android_logo.svg`. The `assets/icons/flags/` and `assets/icons/community/`
subdirectories are covered by [Section 6](#6-third-party-assets-you-may-redistribute) and
[Section 5](#5-third-party-trademarks) respectively.

See [`assets/icons/README.md`](./assets/icons/README.md).

## 3. Bluesky trademarks and brand assets

Our name, logo, butterfly mark, logotype, and app icons are trademarks of Bluesky Social PBC.
They are not licensed to you under the MIT license or by this document. Use of them is governed
by our [Trademark Policy](https://bsky.social/about/support/trademarks) and [Brand Guidelines](https://bsky.social/about/support/branding).

You may refer to Bluesky by name to describe interoperability or origin — for example, "a client
for Bluesky," or "based on the Bluesky app." You may not use our marks as the identity of your
own product or service, or in any way likely to suggest that Bluesky publishes, endorses, or
supports it.

- `assets/app-icons/` — all iOS and Android app icon variants, including the `.icon` bundles
- `assets/favicon.png`
- `assets/logo.png`
- `assets/default-avatar.png`
- `assets/icon-android-foreground.png`
- `assets/icon-android-monochrome.png`
- `assets/icon-android-notification.png`
- `assets/splash/splash.png`
- `assets/splash/splash-dark.png`
- `assets/splash/android-splash-logo-white.png`
- `assets/icons/logomark.svg`
- `assets/icons/newskie.svg`
- `assets/icons/verifiedCheck.svg`
- `assets/icons/verifierCheck.svg`
- `assets/icons/starterPack.svg`, `assets/icons/starterPack_stroke2_corner0_rounded.svg`
- `bskyembed/assets/logo.svg`
- `bskyembed/assets/logo_full_name.svg`
- `bskyweb/static/favicon.png`, `favicon-16x16.png`, `favicon-32x32.png`
- `bskyweb/static/apple-touch-icon.png`
- `bskyweb/static/safari-pinned-tab.svg`
- `bskyweb/static/social-card-default.png`, `bskyweb/static/social-card-default-gradient.png`
- `bskyweb/embedr-static/favicon.png`, `favicon-16x16.png`, `favicon-32x32.png`
- `modules/BlueskyClip/Images.xcassets/AppIcon.appiconset/`
- Inline vector path data in `src/view/icons/Logo.tsx` and `src/view/icons/Logotype.tsx`

We are not asking anyone to remove these files from the repository. They are here because the
app needs them to build. Replacing them is a forker's responsibility, not ours.

## 4. Community and contest artwork — credited, but not ours to license

These are third-party artworks that appear in the app with attribution. We hold no license that
lets us pass rights to them on to you.

- `assets/kawaii.png`, `assets/kawaii_smol.png` — logo by
  [@sawaratsuki.bsky.social](https://bsky.app/profile/sawaratsuki.bsky.social), shown as an
  opt-in variant and credited in `src/view/shell/Drawer.tsx` and
  `src/view/shell/desktop/RightNav.tsx`
- `assets/icons/custom_logo_japan.svg` — the winning entry from the Bluesky Japan logo contest,
  created by a contest entrant

Replace these if you fork. If you want to use them, that is a conversation with the artist,
not with us.

## 5. Third-party trademarks

These marks belong to other companies. We include them to identify their services in our UI —
sign-in buttons, store badges, and links to third-party applications. We are neither granting
nor withholding permission, because it is not ours to give. Your use of them rests on your own
nominative-use basis or on permission from the mark owner.

- `assets/icons/apple_logo.svg` — Apple Inc.
- `assets/icons/android_logo.svg` — Google LLC
- `assets/icons/community/` — Leaflet, Offprint, pckt (`pckt.svg`, `pckt-full.svg`),
  Standard.site, and Germ Network (`germ_logo.webp`)

Apple's and Google's marks in particular carry their own brand guidelines governing size,
spacing, and permitted contexts. If you ship a sign-in button or a store badge, follow theirs,
not ours.

## 6. Third-party assets you may redistribute

These are licensed on terms that permit redistribution. Nothing in this document restricts them.
Their license text travels with the files, and you must keep it there.

| Asset | Path | License | Notice |
|---|---|---|---|
| Inter typeface | `assets/fonts/inter/` | SIL Open Font License 1.1 | [`OFL.txt`](./assets/fonts/inter/OFL.txt) |
| Inter typeface (OG card service) | `bskyogcard/src/assets/fonts/` | SIL Open Font License 1.1 | [`README.md`](./bskyogcard/src/assets/fonts/README.md) |
| country-flag-icons | `assets/icons/flags/` | MIT, © @catamphetamine | [`README.md`](./assets/icons/flags/README.md) |
| Material Icons | `bskyweb/static/media/MaterialIcons.*.ttf` | Apache License 2.0 | [`NOTICE.md`](./NOTICE.md) |

Build output under `bskyweb/static/media/` also contains compiled Inter files. They are the same
OFL-licensed typeface, emitted by the web build.

**One thing to watch on Inter:** OFL 1.1 includes a Reserved Font Name provision. If you modify
or subset the font, the result cannot be distributed under the name "Inter."

See [`NOTICE.md`](./NOTICE.md) for the consolidated third-party notices.

## 7. Product imagery — treat as not licensed to you

**`assets/images/`**

Product illustration and announcement imagery — onboarding value-prop art, chat backgrounds,
feature announcement graphics, and similar.

**Treat everything in this directory as outside the MIT license and not licensed for your use.**
Some of it is commissioned work. Rather than have you guess file by file which is which, we are
drawing the line at the directory.

If you are forking, replace these or ship without them.
See [`assets/images/README.md`](./assets/images/README.md).

---

## If you are forking

You have our blessing to fork this application. To do it cleanly:

1. **Replace `assets/illustrations/`.** Commissioned artwork, licensed to Bluesky only. See
   [Section 1](#1-commissioned-artwork--licensed-to-bluesky-only).
2. **Source your own UI icons.** The glyph set in `assets/icons/` is licensed to us for our own
   use. See [Section 2](#2-licensed-icon-system--not-ours-to-pass-on).
3. **Replace `assets/images/`.** Treat as not licensed to you. See
   [Section 7](#7-product-imagery--treat-as-not-licensed-to-you).
4. **Replace the Bluesky marks** listed in [Section 3](#3-bluesky-trademarks-and-brand-assets) —
   app icons, favicons, logo files, and the inline logo paths in `src/view/icons/`.
5. **Replace or remove the community artwork** in
   [Section 4](#4-community-and-contest-artwork--credited-but-not-ours-to-license).
6. **Check your own position on the third-party marks** in
   [Section 5](#5-third-party-trademarks).
7. **Keep the license notices** for the assets in
   [Section 6](#6-third-party-assets-you-may-redistribute).
8. **Change your branding, support links, and analytics** as described in the
   [Forking guidelines](./README.md#forking-guidelines).

This list is about licensing. The [Forking guidelines](./README.md#forking-guidelines) in the
README cover the rest of what makes a fork clearly distinguishable from Bluesky, which matters
both for your users and for app store review.

## Questions

If something in this repository looks like it should be on this list and is not, or if you are
unsure whether an asset is covered, open an issue or email us and we will sort it out. We would
much rather answer the question than have someone guess.

---

*Last reviewed: August 2026. This document describes the licensing position of assets in this
repository. It is not a grant of rights, and it does not modify the [MIT license](./LICENSE) as
it applies to source code.*
