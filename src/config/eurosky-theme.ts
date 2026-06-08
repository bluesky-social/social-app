/**
 * Eurosky theme configuration.
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
 * ---------------------------------------------------------------------------
 * HOW THE LOOK IS CHOSEN
 *
 * The identity is built from two independent, swappable axes:
 *
 *   NEUTRAL  - the contrast_ (background -> text) ramp. This is what carries
 *              the monochrome brand feel: warm cream + ink vs upstream's
 *              cool blue-grey.
 *   ACCENT   - the primary_ ramp. Every themed affordance (buttons, links,
 *              toggles, focus rings, spinners) is derived from this with no
 *              per-component overrides.
 *
 * To A/B a different look, edit the two lines in the SELECTOR block below and
 * reload - nothing else. The presets are kept here permanently so the
 * alternatives are self-documenting and the swap stays a one-word edit.
 * ---------------------------------------------------------------------------
 */

import {
  DEFAULT_PALETTE,
  DEFAULT_SUBDUED_PALETTE,
  type Palette,
} from '@bsky.app/alf'

/**
 * Raw Eurosky brand colours, names taken verbatim from
 * `branding/eurosky-brandguidelines.md` section 2.
 */
export const EUROSKY_BRAND = {
  cotton: '#F7F6F2', // main background
  stoneLight: '#ECEAE5', // subtle bg / dividers
  stoneMid: '#E0DDD8', // slightly darker bg / borders
  ink: '#1A1A1A', // text, primary CTAs, logo
  charcoal: '#6B6965', // muted text (website CSS --charcoal, not the kit's warm grey)
  accentBlueBrand: '#9AC2FF', // landing-page accent - too pale for body-text contrast
  accentYellow: '#F7D204', // highlight accent -> `yellow` slot
  accentGreen: '#02BC60', // success / positive accent
  /**
   * Saturated mid-blue. Not in the printed kit, but the readable
   * counterpart of the pale brand blue: ALF pins *_500 across its
   * light/dark inversion (see invertPalette in @bsky.app/alf), so the
   * primary_500 anchor must clear contrast on BOTH the cotton background
   * and the inverted near-black one. #9AC2FF cannot; this can.
   */
  linkBlue: '#0087E2',
} as const

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
// NEUTRAL presets (the contrast_ ramp)
// ---------------------------------------------------------------------------

/**
 * Warm cream-to-ink ramp, replacing upstream's cool blue-greys. This is the
 * monochrome brand identity per the guidelines ("Eurosky uses a primarily
 * monochrome colour palette ... for the logo, typography and UI"); the brand
 * is carried here, NOT by tinting CTAs.
 *
 * contrast_0 stays pure white (components that need a true white surface),
 * contrast_25 = cotton (page bg), contrast_950 = ink (heading text).
 *
 * !! SYNC: ALF derives the page background from this ramp - light bg =
 * contrast_0, dark bg = this.contrast_1000, dim bg =
 * euroskyWarmContrastSubdued.contrast_1000. `web/index.html`'s static
 * <style> hardcodes those same body backgrounds (it can't import TS); if
 * you change contrast_0 / contrast_1000 here (or the subdued deep end),
 * update the html.theme--{light,dark,dim} background-color + --background
 * in web/index.html too, or a scroll/header seam reappears.
 */
const euroskyWarmContrast: ContrastRamp = {
  contrast_0: '#FFFFFF',
  contrast_25: EUROSKY_BRAND.cotton, // #F7F6F2
  contrast_50: EUROSKY_BRAND.stoneLight, // #ECEAE5
  contrast_100: EUROSKY_BRAND.stoneMid, // #E0DDD8
  contrast_200: '#C7C5C0',
  contrast_300: '#ACAAA5',
  contrast_400: '#908E89',
  contrast_500: EUROSKY_BRAND.charcoal, // #6B6965
  contrast_600: '#555350',
  contrast_700: '#3F3D3B',
  contrast_800: '#2A2826',
  contrast_900: '#1F1D1B',
  contrast_950: EUROSKY_BRAND.ink, // #1A1A1A
  contrast_975: '#0F0F0E',
  contrast_1000: '#000000',
}

/**
 * Subdued variant of the warm ramp, used for the `dim` theme. ALF builds
 * `dim` from invertPalette(SUBDUED), so its background is this ramp's
 * contrast_1000 (and its near-bg layers are 975/950). The deep end is
 * lifted to a warm soft-black instead of pure #000000 - that lift is the
 * entire reason `dim` looks softer than `dark` (mirrors how upstream's
 * DEFAULT_SUBDUED lifts contrast_1000 to #151D28). Light steps stay equal
 * to the default ramp so only the "dimness" of dark surfaces changes.
 *
 * !! SYNC: contrast_1000 here = the dim body background hardcoded in
 * web/index.html (html.theme--dim). Change one, change the other.
 */
const euroskyWarmContrastSubdued: ContrastRamp = {
  ...euroskyWarmContrast,
  contrast_900: '#2C2A24',
  contrast_950: '#232118',
  contrast_975: '#1B1914',
  contrast_1000: '#15130E', // dim background - warm soft-black, not pure black
}

type NeutralPreset = {default: ContrastRamp; subdued: ContrastRamp} | null

/**
 * `blueskyStock: null` = keep whatever contrast ramps the upstream base
 * palettes ship (cool blue-grey), which already differ default-vs-subdued
 * so dark/dim stay distinct. `euroskyWarm` supplies its own pair so the
 * dark/dim distinction survives the override.
 */
const NEUTRALS: Record<string, NeutralPreset> = {
  euroskyWarm: {
    default: euroskyWarmContrast,
    subdued: euroskyWarmContrastSubdued,
  },
  blueskyStock: null,
}

// ---------------------------------------------------------------------------
// ACCENT presets (the primary_ ramp)
// ---------------------------------------------------------------------------

/**
 * Blue accent, anchored on the readable brand link blue (#0087E2 at _500).
 * The pale brand blue (#9AC2FF) lives high on the ramp as the bright tint.
 */
const blueAccent: PrimaryRamp = {
  primary_25: '#F2F8FE',
  primary_50: '#E3F1FD',
  primary_100: '#C1E1FB',
  primary_200: '#93CCF8',
  primary_300: '#57B0F2',
  primary_400: '#1F97EA',
  primary_500: EUROSKY_BRAND.linkBlue, // #0087E2 - reads on cotton AND dark
  primary_600: '#0072C2',
  primary_700: '#005C9C',
  primary_800: '#00497C',
  primary_900: '#00375D',
  primary_950: '#002844',
  primary_975: '#001B30',
}

/**
 * Green accent. The raw brand green (#02BC60) is light/saturated and fails
 * text contrast on cotton (~1.9:1), so it is NOT pinned at _500 - it lives
 * at _400 as the bright brand tint, and _500 is anchored on a readable
 * deep green so links/affordances stay legible on light AND dark (the same
 * *_500-is-pinned constraint that governs the blue anchor).
 */
const greenAccent: PrimaryRamp = {
  primary_25: '#ECFDF3',
  primary_50: '#D3F8E0',
  primary_100: '#A8F0C4',
  primary_200: '#6FE3A0',
  primary_300: '#38D07D',
  primary_400: EUROSKY_BRAND.accentGreen, // #02BC60 - bright brand tint
  primary_500: '#0A7F45', // readable deep green - reads on cotton AND dark
  primary_600: '#0A6B3B',
  primary_700: '#095731',
  primary_800: '#074326',
  primary_900: '#05331D',
  primary_950: '#042414',
  primary_975: '#03190E',
}

const ACCENTS = {
  blue: blueAccent,
  green: greenAccent,
} as const

// ===========================================================================
//  ▼▼▼  SELECTOR - this is the entire "which look" decision.  Edit, reload.
// ===========================================================================

const NEUTRAL: NeutralPreset = NEUTRALS.euroskyWarm // NEUTRALS.blueskyStock
const ACCENT: PrimaryRamp = ACCENTS.green // ACCENTS.blue

// ===========================================================================
//  ▲▲▲  Everything below is mechanical composition - no decisions here.
// ===========================================================================

/**
 * Green semantic ("positive"/success) scale, anchored on the brand green.
 * Independent of the ACCENT axis - success is green even when primary is
 * blue. Kept stable so success states don't shift when A/B-ing accents.
 */
const euroskyPositive: Pick<
  Palette,
  | 'positive_25'
  | 'positive_50'
  | 'positive_100'
  | 'positive_200'
  | 'positive_300'
  | 'positive_400'
  | 'positive_500'
  | 'positive_600'
  | 'positive_700'
  | 'positive_800'
  | 'positive_900'
  | 'positive_950'
  | 'positive_975'
> = {
  positive_25: '#ECFDF5',
  positive_50: '#D1FAE5',
  positive_100: '#A7F3D0',
  positive_200: '#6EE7B7',
  positive_300: '#34D399',
  positive_400: '#0AD075',
  positive_500: EUROSKY_BRAND.accentGreen, // #02BC60
  positive_600: '#01A052',
  positive_700: '#017A3E',
  positive_800: '#015C2F',
  positive_900: '#013D20',
  positive_950: '#002915',
  positive_975: '#001A0D',
}

function compose(base: Palette, neutral: ContrastRamp | null): Palette {
  return {
    ...base,
    ...(neutral ?? {}),
    ...ACCENT,
    ...euroskyPositive,
    yellow: EUROSKY_BRAND.accentYellow,
  }
}

export const EUROSKY_PALETTE: Palette = compose(
  DEFAULT_PALETTE,
  NEUTRAL?.default ?? null,
)
export const EUROSKY_SUBDUED_PALETTE: Palette = compose(
  DEFAULT_SUBDUED_PALETTE,
  NEUTRAL?.subdued ?? null,
)

/**
 * Gradient overrides for `src/alf/tokens.ts`. Mostly decorative (avatar
 * fallbacks, occasional accent fills). The `primary` gradient is monochrome
 * so default avatars read as brand ink, not a saturated blue/green that
 * would fight whichever ACCENT is selected.
 */
export const EUROSKY_GRADIENTS = {
  primary: {
    values: [
      [0, EUROSKY_BRAND.ink],
      [0.4, EUROSKY_BRAND.charcoal],
      [0.6, EUROSKY_BRAND.charcoal],
      [1, EUROSKY_BRAND.stoneMid],
    ],
    hover_value: EUROSKY_BRAND.charcoal,
  },
  sky: {
    values: [
      [0, EUROSKY_BRAND.linkBlue],
      [1, EUROSKY_BRAND.accentBlueBrand], // #9AC2FF
    ],
    hover_value: EUROSKY_BRAND.linkBlue,
  },
  midnight: {
    values: [
      [0, EUROSKY_BRAND.ink],
      [1, EUROSKY_BRAND.charcoal],
    ],
    hover_value: EUROSKY_BRAND.ink,
  },
  sunrise: {
    values: [
      [0, EUROSKY_BRAND.ink],
      [0.4, EUROSKY_BRAND.accentYellow],
      [0.8, '#FFE874'],
      [1, '#FFFAD7'],
    ],
    hover_value: EUROSKY_BRAND.accentYellow,
  },
  sunset: {
    values: [
      [0, EUROSKY_BRAND.accentBlueBrand],
      [0.6, EUROSKY_BRAND.accentYellow],
      [1, '#FFFAD7'],
    ],
    hover_value: EUROSKY_BRAND.accentYellow,
  },
  summer: {
    values: [
      [0, EUROSKY_BRAND.accentYellow],
      [0.3, '#FFE874'],
      [1, '#FFFAD7'],
    ],
    hover_value: '#FFE874',
  },
  nordic: {
    values: [
      [0, EUROSKY_BRAND.ink],
      [1, EUROSKY_BRAND.cotton],
    ],
    hover_value: EUROSKY_BRAND.charcoal,
  },
  bonfire: {
    values: [
      [0, EUROSKY_BRAND.ink],
      [0.4, EUROSKY_BRAND.accentBlueBrand],
      [0.8, EUROSKY_BRAND.accentYellow],
      [1, EUROSKY_BRAND.cotton],
    ],
    hover_value: EUROSKY_BRAND.accentYellow,
  },
} as const
