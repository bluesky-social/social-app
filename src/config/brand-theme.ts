/**
 * Brand theme configuration - palette + gradients.
 *
 * Sibling to `src/config/brand.ts` (service / brand-string config). Strategy:
 * keep every ALF *atom* (spacing, radius, type scale, button shape) on
 * `@bsky.app/alf` and override only the colour palette + gradients. That is
 * enough for a distinct identity without forking the design system, and it
 * means exactly two upstream files carry a 2-line redirect to this module
 * (`src/alf/themes.ts`, `src/alf/tokens.ts`) - every other upstream file stays
 * untouched, so it can never conflict on merge.
 *
 * Raw colour values live in `src/config/brand-colors.json` (the one source
 * shared with the native build in app.config.js and the web pre-boot codegen).
 * This module composes them into ALF `Palette`s. Export symbol names
 * (BRAND_PALETTE etc.) are brand-agnostic, so a rebrand only changes the JSON.
 *
 * ---------------------------------------------------------------------------
 * HOW THE LOOK IS CHOSEN
 *
 * Two swappable axes (from the mu brand kit, `mu-brandguidelines.pdf`):
 *   NEUTRAL  - the contrast_ (background -> text) ramp. Near-white base
 *              (#f7f7f2) up to ink (#212121); the clean monochrome UI.
 *   ACCENT   - the primary_ ramp. Every themed affordance (buttons, links,
 *              toggles, focus rings, spinners) derives from this. The kit
 *              ships three interchangeable families (pink / blue / orange);
 *              `brand-colors.json#accents` holds them and `#defaultAccent`
 *              picks the one this build ships.
 *
 * `buildPalettes(accentKey)` composes neutral + a chosen accent at runtime,
 * which is what a per-user accent picker uses; the module-level
 * BRAND_PALETTE / BRAND_SUBDUED_PALETTE are just `buildPalettes(DEFAULT_ACCENT)`.
 * ---------------------------------------------------------------------------
 */

import {
  DEFAULT_PALETTE,
  DEFAULT_SUBDUED_PALETTE,
  type Palette,
} from '@bsky.app/alf'

import brandColors from '#/config/brand-colors.json'

type ContrastRamp = Pick<
  Palette,
  | 'contrast_0'
  | 'contrast_25'
  | 'contrast_50'
  | 'contrast_100'
  | 'contrast_200'
  | 'contrast_300'
  | 'contrast_400'
  | 'contrast_500'
  | 'contrast_600'
  | 'contrast_700'
  | 'contrast_800'
  | 'contrast_900'
  | 'contrast_950'
  | 'contrast_975'
  | 'contrast_1000'
>

type PrimaryRamp = Pick<
  Palette,
  | 'primary_25'
  | 'primary_50'
  | 'primary_100'
  | 'primary_200'
  | 'primary_300'
  | 'primary_400'
  | 'primary_500'
  | 'primary_600'
  | 'primary_700'
  | 'primary_800'
  | 'primary_900'
  | 'primary_950'
  | 'primary_975'
>

/**
 * NEUTRAL (contrast_ ramp). contrast_0 stays pure white; contrast_25 is the mu
 * base off-white; contrast_950 = ink.
 *
 * !! SYNC: ALF derives the page background from this ramp (light = contrast_0,
 * dark = contrast_1000, dim = subdued contrast_1000). The static <style> blocks
 * in web/index.html + bskyweb/templates/base.html hardcode the same body
 * backgrounds (they can't import TS) - they are regenerated from the same JSON
 * by `pnpm brand:sync-web`, so edit brand-colors.json and re-run that, never
 * the HTML by hand.
 */
const muNeutral = brandColors.neutral

/**
 * Subdued variant for the `dim` theme. ALF builds `dim` from
 * invertPalette(SUBDUED), so its background is this ramp's contrast_1000. The
 * deep end is lifted to a soft-black (#1A1A1A) instead of pure #000000 - that
 * lift is the entire reason `dim` looks softer than `dark`.
 */
const muNeutralSubdued: ContrastRamp = {
  ...muNeutral,
  ...brandColors.neutralSubduedOverrides,
}

/**
 * ACCENT families (the primary_ ramp). ALF pins *_500 across its light/dark
 * inversion and uses primary_500 as the solid-button fill / link colour, so
 * each ramp anchors _500 on the family's link/accent tone with the bright tint
 * higher on the ramp. This is the curated set a per-user accent picker chooses
 * from; `DEFAULT_ACCENT` is what this build ships.
 */
export const ACCENTS = brandColors.accents as Record<string, PrimaryRamp>
export type AccentKey = keyof typeof brandColors.accents
export const DEFAULT_ACCENT = brandColors.defaultAccent as AccentKey

function composeWith(
  base: Palette,
  neutral: ContrastRamp,
  accent: PrimaryRamp,
): Palette {
  return {
    ...base,
    ...neutral,
    ...accent,
  }
}

/**
 * Compose the default + subdued palettes for a given accent family. The
 * module-level palettes below use DEFAULT_ACCENT; a runtime accent picker calls
 * this with the user's choice and feeds the result to ALF via `themesOverride`.
 */
export function buildPalettes(accentKey: AccentKey): {
  default: Palette
  subdued: Palette
} {
  const accent = ACCENTS[accentKey]
  return {
    default: composeWith(DEFAULT_PALETTE, muNeutral, accent),
    subdued: composeWith(DEFAULT_SUBDUED_PALETTE, muNeutralSubdued, accent),
  }
}

const defaultPalettes = buildPalettes(DEFAULT_ACCENT)
export const BRAND_PALETTE: Palette = defaultPalettes.default
export const BRAND_SUBDUED_PALETTE: Palette = defaultPalettes.subdued

/**
 * Gradient overrides for `src/alf/tokens.ts`. Mostly decorative (avatar
 * fallbacks, occasional accent fills). The `primary` gradient is pink to
 * match the selected accent; the named gradients each stay within a single
 * brand family (pink / blue / orange) per the "don't mix colours" rule, while
 * giving default avatars some variety across the palette.
 */
export const BRAND_GRADIENTS = {
  primary: {
    values: [
      [0, '#FFBDF2'],
      [1, '#DB4AA6'],
    ],
    hover_value: '#E66AB9',
  },
  sky: {
    values: [
      [0, '#87D1E8'],
      [1, '#4796C7'],
    ],
    hover_value: '#4796C7',
  },
  midnight: {
    values: [
      [0, '#471A3D'],
      [1, '#DB4AA6'],
    ],
    hover_value: '#75295E',
  },
  sunrise: {
    values: [
      [0, '#FFE8D6'],
      [0.6, '#FF8F36'],
      [1, '#F2571F'],
    ],
    hover_value: '#FF8F36',
  },
  sunset: {
    values: [
      [0, '#DB4AA6'],
      [1, '#FFBDF2'],
    ],
    hover_value: '#E66AB9',
  },
  summer: {
    values: [
      [0, '#FF8F36'],
      [0.5, '#FFA86A'],
      [1, '#FFD3B5'],
    ],
    hover_value: '#FF8F36',
  },
  nordic: {
    values: [
      [0, '#1A5470'],
      [1, '#87D1E8'],
    ],
    hover_value: '#4796C7',
  },
  bonfire: {
    values: [
      [0, '#853600'],
      [0.5, '#F2571F'],
      [1, '#FF8F36'],
    ],
    hover_value: '#F2571F',
  },
} as const
