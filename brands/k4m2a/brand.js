// @ts-check
/**
 * k4m2a brand — placeholder scaffolding. Fill in TODOs before shipping.
 * Mirrors the shape consumed by `app.config.js` at native build time.
 *
 * @type {import('../types').BrandConfig}
 */
const brand = {
  id: 'k4m2a',
  // TODO: brand display name shown in app stores and CFBundleName
  name: 'k4m2a',
  slug: 'k4m2a',
  // TODO: deep-link scheme — must be unique to this app (no spaces/punctuation)
  scheme: 'k4m2a',
  // TODO: VoiceOver-friendly spoken name
  spokenName: 'k4m2a',
  // TODO: EAS account that owns the build
  owner: 'TODO-eas-owner',
  // TODO: iOS bundle identifier — must be unique and registered in App Store Connect
  bundleId: 'TODO.k4m2a.app',
  // TODO: Android package name — convention: reverse-DNS, must be unique on Play
  androidPackage: 'TODO.k4m2a.app',
  // TODO: iOS App Group id used by the share extension and NSE
  iosAppGroup: 'group.TODO.k4m2a',
  // Brand is monochrome: black mark on white in light mode, white on black in dark.
  primaryColor: '#000000',
  splashColor: '#FFFFFF',
  splashColorDark: '#000000',
  // TODO: deep-link / universal-link host (no scheme prefix)
  webHost: 'TODO.example.com',
  associatedDomains: [
    // TODO: applinks for Universal Links + appclips entries if used
    // 'applinks:TODO.example.com',
  ],
  // TODO: contacts permission string shown in iOS prompt
  contactsPermission:
    'I agree to allow k4m2a to use my contacts for friend discovery until I opt out.',
  appExtensions: [
    // TODO: only include extensions that exist in this brand's native project.
    // Bluesky has share/NSE/AppClip; remove what you don't ship.
    {
      targetName: 'Share-with-k4m2a',
      bundleSuffix: 'Share-with-k4m2a',
      includeAppGroupEntitlement: true,
    },
  ],
  splashOnlyWordmark: true,
  useTextJoinLabel: true,
}

module.exports = brand
