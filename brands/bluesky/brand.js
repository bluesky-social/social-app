// @ts-check
/**
 * Bluesky brand config — the default brand. Recreates upstream behavior
 * exactly. Read by `app.config.js` at native-build time and by the runtime
 * brand registry at `src/brand/registry.ts`.
 *
 * @type {import('../types').BrandConfig}
 */
const brand = {
  id: 'bluesky',
  name: 'Bluesky',
  slug: 'bluesky',
  scheme: 'bluesky',
  spokenName: 'Blue Sky',
  owner: 'blueskysocial',
  bundleId: 'xyz.blueskyweb.app',
  androidPackage: 'xyz.blueskyweb.app',
  iosAppGroup: 'group.app.bsky',
  primaryColor: '#006AFF',
  splashColor: '#006AFF',
  splashColorDark: '#002861',
  webHost: 'bsky.app',
  associatedDomains: [
    'applinks:bsky.app',
    'applinks:staging.bsky.app',
    'appclips:bsky.app',
    'appclips:go.bsky.app',
  ],
  contactsPermission:
    'I agree to allow Bluesky to use my contacts for friend discovery until I opt out.',
  appExtensions: [
    {
      targetName: 'Share-with-Bluesky',
      bundleSuffix: 'Share-with-Bluesky',
      includeAppGroupEntitlement: true,
    },
    {
      targetName: 'BlueskyNSE',
      bundleSuffix: 'BlueskyNSE',
      includeAppGroupEntitlement: true,
    },
    {
      targetName: 'BlueskyClip',
      bundleSuffix: 'AppClip',
      includeAppGroupEntitlement: false,
    },
  ],
}

module.exports = brand
