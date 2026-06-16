// @ts-check
/**
 * MDParivaar brand — Madhyasth Darshan community.
 * Visual brand: saffron `#CD7233` from the MD icon SVG, monochrome
 * white-on-saffron mark.
 *
 * @type {import('../types').BrandConfig}
 */
const brand = {
  id: 'mdparivaar',
  name: 'MDParivaar',
  slug: 'mdparivaar',
  scheme: 'mdparivaar',
  spokenName: 'M D Parivaar',
  // TODO: real EAS owner once the build is wired up
  owner: 'TODO-eas-owner',
  // TODO: register a unique iOS bundle id and Android package
  bundleId: 'TODO.mdparivaar.app',
  androidPackage: 'TODO.mdparivaar.app',
  iosAppGroup: 'group.TODO.mdparivaar',
  // Saffron primary (sampled from the icon background); splash matches the
  // logo's white-on-saffron design.
  primaryColor: '#CD7233',
  splashColor: '#FFFFFF',
  splashColorDark: '#150D0A',
  // TODO: deep-link / universal-link host
  webHost: 'TODO.mdparivaar.example',
  associatedDomains: [
    // TODO: 'applinks:TODO.mdparivaar.example',
  ],
  contactsPermission:
    'I agree to allow MDParivaar to use my contacts for friend discovery until I opt out.',
  appExtensions: [
    // TODO: include the share extension once the native target exists.
    // {
    //   targetName: 'Share-with-MDParivaar',
    //   bundleSuffix: 'Share-with-MDParivaar',
    //   includeAppGroupEntitlement: true,
    // },
  ],
  useTextJoinLabel: true,
}

module.exports = brand
