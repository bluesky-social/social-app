/**
 * Brand logo - adapter over the generated artifact
 * (brand-logo.generated.json, produced from assets/brand/*.svg by
 * scripts/gen-logo.mjs).
 *
 * The in-app <BrandLogo> renders these SVGs via SvgXml. Logos are themed with a
 * tiny convention (see gen-logo.mjs):
 *   - `fill="currentColor"`        -> the primary tint (<BrandLogo> `fill` prop)
 *   - `fill="theme:<paletteKey>"`  -> substituted from the active ALF palette at
 *                                     render, so a multi-tone logo follows the
 *                                     accent picker.
 *
 * Roles fall back so a brand only has to ship `mark.svg`; richer brands add
 * `wordmark`/`lockup`/`hero`/`icon`. There is no separate 3D structure any more:
 * a dimensional logo is just `hero.svg` with two `theme:` tones.
 */
import generated from '#/config/brand-logo.generated.json'

export type LogoVariant = 'mark' | 'wordmark' | 'lockup' | 'hero' | 'icon'

type LogoAsset = {viewBox: string; ratio: number; xml: string}

const ROLES = generated as Record<string, LogoAsset>

/**
 * Fallback chain per role. The first role that exists wins; `mark` always
 * exists (gen-logo enforces it), so every lookup resolves.
 */
const FALLBACKS: Record<LogoVariant, LogoVariant[]> = {
  mark: ['mark'],
  wordmark: ['wordmark', 'mark'],
  lockup: ['lockup', 'wordmark', 'mark'],
  hero: ['hero', 'lockup', 'mark'],
  icon: ['icon', 'mark'],
}

export function getLogo(variant: LogoVariant = 'mark'): LogoAsset {
  for (const role of FALLBACKS[variant]) {
    const asset = ROLES[role]
    if (asset) return asset
  }
  return ROLES.mark
}

/**
 * Replace `theme:<paletteKey>` fills with the palette's colours. Unknown keys
 * fall back to `currentColor` (so the SvgXml `color`/`fill` still applies).
 */
export function substituteLogoColors(
  xml: string,
  palette: Record<string, string>,
): string {
  return xml.replace(
    /theme:([A-Za-z0-9_]+)/g,
    (_: string, key: string) => palette[key] ?? 'currentColor',
  )
}
