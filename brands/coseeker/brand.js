// @ts-check
/**
 * CoSeeker brand — clone of k4m2a's monochrome visual identity, served at
 * coseeker.com. Fill in the native-build TODOs before shipping a native app.
 * Mirrors the shape consumed by `app.config.js` at native build time.
 *
 * @type {import('../types').BrandConfig}
 */
const brand = {
  id: 'coseeker',
  name: 'CoSeeker',
  slug: 'coseeker',
  // TODO: deep-link scheme — must be unique to this app (no spaces/punctuation)
  scheme: 'coseeker',
  spokenName: 'CoSeeker',
  // TODO: EAS account that owns the build
  owner: 'TODO-eas-owner',
  // TODO: iOS bundle identifier — must be unique and registered in App Store Connect
  bundleId: 'TODO.coseeker.app',
  // TODO: Android package name — convention: reverse-DNS, must be unique on Play
  androidPackage: 'TODO.coseeker.app',
  // TODO: iOS App Group id used by the share extension and NSE
  iosAppGroup: 'group.TODO.coseeker',
  // Brand is monochrome: black mark on white in light mode, white on black in dark.
  primaryColor: '#000000',
  splashColor: '#FFFFFF',
  splashColorDark: '#000000',
  webHost: 'coseeker.com',
  associatedDomains: [
    // TODO: applinks for Universal Links + appclips entries if used
    // 'applinks:coseeker.com',
  ],
  contactsPermission:
    'I agree to allow CoSeeker to use my contacts for friend discovery until I opt out.',
  appExtensions: [
    // TODO: only include extensions that exist in this brand's native project.
    // Bluesky has share/NSE/AppClip; remove what you don't ship.
    {
      targetName: 'Share-with-CoSeeker',
      bundleSuffix: 'Share-with-CoSeeker',
      includeAppGroupEntitlement: true,
    },
  ],
  splashOnlyWordmark: true,
  useTextJoinLabel: true,
}

module.exports = brand
