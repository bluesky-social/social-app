/**
 * Type definitions shared by `brands/<id>/brand.js` files. The native build
 * (app.config.js) and the runtime brand registry both depend on this shape.
 */

export type BrandAppExtension = {
  targetName: string
  bundleSuffix: string
  includeAppGroupEntitlement: boolean
}

export type BrandConfig = {
  id: string
  name: string
  slug: string
  scheme: string
  spokenName: string
  owner: string
  bundleId: string
  androidPackage: string
  iosAppGroup: string
  primaryColor: string
  splashColor: string
  splashColorDark: string
  webHost: string
  associatedDomains: string[]
  contactsPermission: string
  appExtensions: BrandAppExtension[]
  splashOnlyWordmark?: boolean
  useTextJoinLabel?: boolean
}
