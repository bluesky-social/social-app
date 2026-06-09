/**
 * mu theme configuration.
 *
 * Single source of truth for the palette + gradients. Sibling to
 * `src/config/eurosky.ts` (service / brand-string config). Strategy: keep
 * every ALF *atom* (spacing, radius, type scale, button shape) on
 * `@bsky.app/alf` and override only the colour palette + gradients. That is
 * enough for a distinct identity without forking the design system, and it
 * means exactly two upstream files carry a 2-line redirect to this module
 * (`src/alf/themes.ts`, `src/alf/tokens.ts`) - every other file upstream
 * touches stays untouched, so it can never conflict on merge.
 *
 * Export symbol names (EUROSKY_PALETTE etc.) are kept verbatim purely so
 * those two redirect files don't have to change - the *contents* are the mu
 * brand.
 *
 * ---------------------------------------------------------------------------
 * HOW THE LOOK IS CHOSEN
 *
 * The mu brand kit (`mu-brand-package/mu-brandguidelines.pdf`) ships a neutral
 * base ramp plus THREE interchangeable accent families - pink, blue, orange -
 * and instructs picking one primary per design ("Try not to mix colours
 * together"). The identity is therefore built from two swappable axes:
 *
 *   NEUTRAL  - the contrast_ (background -> text) ramp. mu's near-white base
 *              (#f7f7f2) up to ink (#212121); carries the clean monochrome UI.
 *   ACCENT   - the primary_ ramp. Every themed affordance (buttons, links,
 *              toggles, focus rings, spinners) derives from this. All three
 *              brand families are defined below; the SELECTOR picks one.
 *
 * To switch mu's primary colour (e.g. pink -> blue), edit the one line in the
 * SELECTOR block and reload - nothing else. All three ramps are kept here
 * permanently so the alternatives are self-documenting and the swap stays a
 * one-word edit.
 * ---------------------------------------------------------------------------
 */

import {
  DEFAULT_PALETTE,
  DEFAULT_SUBDUED_PALETTE,
  type Palette,
} from '@bsky.app/alf'

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

// ---------------------------------------------------------------------------
// NEUTRAL preset (the contrast_ ramp) - mu base colours
// ---------------------------------------------------------------------------

/**
 * mu base ramp, verbatim from the brand kit's neutral tonal scale. Near-white
 * #f7f7f2 page surface up to ink #212121 for heading text. contrast_0 stays
 * pure white (components that need a true white surface); contrast_25 is the
 * mu base background; contrast_950 = ink.
 *
 * !! SYNC: ALF derives the page background from this ramp - light bg =
 * contrast_0 (#FFFFFF), dark bg = this.contrast_1000 (#000000), dim bg =
 * muNeutralSubdued.contrast_1000 (#1A1A1A). `web/index.html`'s static <style>
 * hardcodes those same body backgrounds (it can't import TS); if you change
 * contrast_0 / contrast_1000 here (or the subdued deep end), update the
 * html.theme--{light,dark,dim} background-color + --background in
 * web/index.html too, or a scroll/header seam reappears.
 */
const muNeutral: ContrastRamp = {
  contrast_0: '#FFFFFF',
  contrast_25: '#F7F7F2', // mu base off-white
  contrast_50: '#EDEBE5',
  contrast_100: '#E0DED9',
  contrast_200: '#C5C4BF',
  contrast_300: '#ABAAA6',
  contrast_400: '#92918E',
  contrast_500: '#797876',
  contrast_600: '#62615F',
  contrast_700: '#4B4A49',
  contrast_800: '#353535',
  contrast_900: '#2A2A2A',
  contrast_950: '#212121', // mu ink
  contrast_975: '#141414',
  contrast_1000: '#000000',
}

/**
 * Subdued variant for the `dim` theme. ALF builds `dim` from
 * invertPalette(SUBDUED), so its background is this ramp's contrast_1000. The
 * deep end is lifted to a soft-black (#1A1A1A) instead of pure #000000 - that
 * lift is the entire reason `dim` looks softer than `dark` (mirrors how
 * upstream's DEFAULT_SUBDUED lifts contrast_1000). Light steps stay equal to
 * muNeutral so only the darkness of dark surfaces changes.
 *
 * !! SYNC: contrast_1000 here = the dim body background hardcoded in
 * web/index.html + bskyweb/templates/base.html (html.theme--dim). Change one,
 * change the others.
 */
const muNeutralSubdued: ContrastRamp = {
  ...muNeutral,
  contrast_900: '#242424',
  contrast_950: '#1F1F1F',
  contrast_975: '#1C1C1C',
  contrast_1000: '#1A1A1A', // dim background - soft black, not pure black
}

// ---------------------------------------------------------------------------
// ACCENT presets (the primary_ ramp) - mu's three brand families
// ---------------------------------------------------------------------------

/**
 * ALF pins *_500 across its light/dark inversion (see invertPalette in
 * @bsky.app/alf), and uses primary_500 as the solid-button fill / link
 * colour. So each ramp anchors _500 on the brand family's designated
 * link/accent tone (~60-65% lightness) - readable on both the near-white base
 * and the inverted near-black one - with the bright brand tint sitting higher
 * on the ramp. Steps are the brand tonal scales verbatim; the few endpoints
 * the kit does not provide are interpolated.
 */
const pinkAccent: PrimaryRamp = {
  primary_25: '#FFEDFC',
  primary_50: '#FFD9F6',
  primary_100: '#FFBDF2', // brand pink primary tint
  primary_200: '#F8A2DF',
  primary_300: '#EF86CB',
  primary_400: '#E66AB9',
  primary_500: '#DB4AA6', // brand pink link/anchor
  primary_600: '#C04293',
  primary_700: '#A73981',
  primary_800: '#8D316F',
  primary_900: '#75295E',
  primary_950: '#5E224D',
  primary_975: '#471A3D', // brand pink deep
}

const blueAccent: PrimaryRamp = {
  primary_25: '#D1F2FA',
  primary_50: '#B9E7F4',
  primary_100: '#A1DCEE',
  primary_200: '#87D1E8', // brand blue primary tint
  primary_300: '#72BDDD',
  primary_400: '#5CA9D2',
  primary_500: '#4796C7', // brand blue link/anchor
  primary_600: '#3E88B5',
  primary_700: '#357BA3',
  primary_800: '#2C6E92',
  primary_900: '#236181',
  primary_950: '#1A5470', // brand blue deep
  primary_975: '#123D50',
}

const orangeAccent: PrimaryRamp = {
  primary_25: '#FFE8D6',
  primary_50: '#FFD3B5',
  primary_100: '#FFBE92',
  primary_200: '#FFA86A',
  primary_300: '#FF8F36', // brand orange primary tint
  primary_400: '#F9742B',
  primary_500: '#F2571F', // brand orange link/anchor
  primary_600: '#DB5019',
  primary_700: '#C54A12',
  primary_800: '#AF430B',
  primary_900: '#9A3D05',
  primary_950: '#853600', // brand orange deep
  primary_975: '#6E2C00',
}

const ACCENTS = {
  pink: pinkAccent,
  blue: blueAccent,
  orange: orangeAccent,
} as const

// ===========================================================================
//  ▼▼▼  SELECTOR - this is the entire "which colour" decision.  Edit, reload.
// ===========================================================================

const ACCENT: PrimaryRamp = ACCENTS.pink // ACCENTS.blue | ACCENTS.orange

// ===========================================================================
//  ▲▲▲  Everything below is mechanical composition - no decisions here.
// ===========================================================================

function compose(base: Palette, neutral: ContrastRamp): Palette {
  return {
    ...base,
    ...neutral,
    ...ACCENT,
  }
}

export const EUROSKY_PALETTE: Palette = compose(DEFAULT_PALETTE, muNeutral)
export const EUROSKY_SUBDUED_PALETTE: Palette = compose(
  DEFAULT_SUBDUED_PALETTE,
  muNeutralSubdued,
)

/**
 * Gradient overrides for `src/alf/tokens.ts`. Mostly decorative (avatar
 * fallbacks, occasional accent fills). The `primary` gradient is pink to
 * match the selected accent; the named gradients each stay within a single
 * brand family (pink / blue / orange) per the "don't mix colours" rule, while
 * giving default avatars some variety across the palette.
 */
export const EUROSKY_GRADIENTS = {
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
