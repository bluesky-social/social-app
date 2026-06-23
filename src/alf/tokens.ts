import {tokens} from '@bsky.app/alf'

// Eurosky fork: gradients are overridden in src/config/eurosky-theme.ts.
import {BRAND_GRADIENTS} from '#/config/brand-theme'

export * from '@bsky.app/alf/dist/tokens'

// Eurosky fork: minimum font size for text inputs.
// Mobile browsers auto-zoom when a focused input renders below 16px,
// so inputs never go under this size.
export const inputMinFontSize = 16

export const color = {
  temp_purple: tokens.labelerColor.purple,
  temp_purple_dark: tokens.labelerColor.purple_dark,
} as const

// Upstream gradient defs kept verbatim (merge-friendly); Eurosky overrides
// are merged in below so there are no duplicate keys in a single literal.
const UPSTREAM_GRADIENTS = {
  primary: {
    values: [
      [0, '#054CFF'],
      [0.4, '#1085FE'],
      [0.6, '#1085FE'],
      [1, '#59B9FF'],
    ],
    hover_value: '#1085FE',
  },
  sky: {
    values: [
      [0, '#0A7AFF'],
      [1, '#59B9FF'],
    ],
    hover_value: '#0A7AFF',
  },
  midnight: {
    values: [
      [0, '#022C5E'],
      [1, '#4079BC'],
    ],
    hover_value: '#022C5E',
  },
  sunrise: {
    values: [
      [0, '#4E90AE'],
      [0.4, '#AEA3AB'],
      [0.8, '#E6A98F'],
      [1, '#F3A84C'],
    ],
    hover_value: '#AEA3AB',
  },
  sunset: {
    values: [
      [0, '#6772AF'],
      [0.6, '#B88BB6'],
      [1, '#FFA6AC'],
    ],
    hover_value: '#B88BB6',
  },
  summer: {
    values: [
      [0, '#FF6A56'],
      [0.3, '#FF9156'],
      [1, '#FFDD87'],
    ],
    hover_value: '#FF9156',
  },
  nordic: {
    values: [
      [0, '#083367'],
      [1, '#9EE8C1'],
    ],
    hover_value: '#3A7085',
  },
  bonfire: {
    values: [
      [0, '#203E4E'],
      [0.4, '#755B62'],
      [0.8, '#CD7765'],
      [1, '#EF956E'],
    ],
    hover_value: '#755B62',
  },
} as const

// Eurosky fork: override every gradient with the brand ramps. Separate
// merge (not a same-literal spread) so there's no duplicate-key (TS2783).
export const gradients = {
  ...UPSTREAM_GRADIENTS,
  ...BRAND_GRADIENTS,
} as const
