/**
 * Brand logo - single source for the wordmark.
 *
 * The mu brand has no separate symbol: the wordmark "mu" IS the mark, so the
 * same glyph backs every logo surface (the in-app <Logo> / <Logotype> /
 * <Logomark>, the native Splash, and the web pre-boot splash).
 *
 * Geometry (the SVG path data + viewBox + aspect ratio) lives in
 * `src/config/brand-logo.json` so the web pre-boot codegen
 * (scripts/sync-brand-web.mjs) can read it without importing TS. This module
 * wraps that geometry with the brand gradient and the nullable-3D contract.
 *
 * `BRAND_LOGO` (the flat wordmark) is the canonical, REQUIRED asset.
 * `BRAND_LOGO_3D` is OPTIONAL: it is `null` when a brand ships no dimensional
 * logo, in which case <LogoHero> and the splash fall back to the flat wordmark
 * filled with the accent colour. mu ships a 3D wordmark, so it is set here.
 *
 * Export name kept generic (`BRAND_LOGO`) and re-exported as `BRAND_ICON` for
 * the two upstream-adjacent importers that read `.ratio`/`.viewBox`/`.path`,
 * so the redirect surface stays small.
 */

import logo from '#/config/brand-logo.json'

export const BRAND_LOGO = {
  viewBox: logo.flat.viewBox,
  /** height / width - the wordmark is wider than it is tall. */
  ratio: logo.flat.ratio,
  path: logo.flat.path,
  /** Stops for the `fill="sky"` gradient variant (marketing/splash only). */
  gradient: {
    stop0: '#ffbdf2', // pink primary tint
    stop1: '#db4aa6', // pink link/anchor
  },
} as const

/** Back-compat alias for upstream-adjacent importers (Logo.tsx, Splash.tsx). */
export const BRAND_ICON = BRAND_LOGO

/**
 * 3D / extruded wordmark for marketing + hero surfaces (e.g. the welcome
 * modal): a `shadow` silhouette drawn behind a lighter `face` offset
 * up-and-left, the two fills driven from the active accent ramp (deep tone
 * behind, bright tone in front).
 *
 * `null` when the brand has no dimensional logo - consumers fall back to the
 * flat wordmark. The explicit `| null` annotation is what makes that fallback
 * branch type-check regardless of whether this build happens to define it.
 */
type Logo3D = {
  viewBox: string
  ratio: number
  shadowPath: string
  facePath: string
}
export const BRAND_LOGO_3D: Logo3D | null = logo.dimensional
