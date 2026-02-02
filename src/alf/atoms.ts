import {type StyleProp, type ViewStyle} from 'react-native'
import {atoms as baseAtoms} from '@bsky.app/alf'

import {CARD_ASPECT_RATIO} from '#/lib/constants'
import {native, platform, web} from '#/alf/util/platform'
import * as Layout from '#/components/Layout'

const EXP_CURVE = 'cubic-bezier(0.16, 1, 0.3, 1)'

export const atoms = {
  ...baseAtoms,

  h_full_vh: web({
    height: '100vh',
  }),

  /**
   * Used for the outermost components on screens, to ensure that they can fill
   * the screen and extend beyond.
   */
  util_screen_outer: [
    web({
      minHeight: '100vh',
    }),
    native({
      height: '100%',
    }),
  ] as StyleProp<ViewStyle>,

  /*
   * Theme-independent bg colors
   */
  bg_transparent: {
    backgroundColor: 'transparent',
  },

  /**
   * Aspect ratios
   */
  aspect_square: {
    aspectRatio: 1,
  },
  aspect_card: {
    aspectRatio: CARD_ASPECT_RATIO,
  },

  /*
   * Transition
   */
  transition_none: web({
    transitionProperty: 'none',
  }),
  transition_timing_default: web({
    transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
    transitionDuration: '100ms',
  }),
  transition_all: web({
    transitionProperty: 'all',
    transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
    transitionDuration: '100ms',
  }),
  transition_color: web({
    transitionProperty:
      'color, background-color, border-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
    transitionDuration: '100ms',
  }),
  transition_opacity: web({
    transitionProperty: 'opacity',
    transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
    transitionDuration: '100ms',
  }),
  transition_transform: web({
    transitionProperty: 'transform',
    transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
    transitionDuration: '100ms',
  }),
  transition_delay_50ms: web({
    transitionDelay: '50ms',
  }),

  /*
   * Animations
   */
  fade_in: web({
    animation: 'fadeIn ease-out 0.15s',
  }),
  fade_out: web({
    animation: 'fadeOut ease-out 0.15s',
    animationFillMode: 'forwards',
  }),
  zoom_in: web({
    animation: 'zoomIn ease-out 0.1s',
  }),
  zoom_out: web({
    animation: 'zoomOut ease-out 0.1s',
  }),
  slide_in_left: web({
    // exponential easing function
    animation: 'slideInLeft cubic-bezier(0.16, 1, 0.3, 1) 0.5s',
  }),
  slide_out_left: web({
    animation: 'slideOutLeft ease-in 0.15s',
    animationFillMode: 'forwards',
  }),
  // special composite animation for dialogs
  zoom_fade_in: web({
    animation: `zoomIn ${EXP_CURVE} 0.3s, fadeIn ${EXP_CURVE} 0.3s`,
  }),

  /**
   * {@link Layout.SCROLLBAR_OFFSET}
   */
  scrollbar_offset: platform({
    web: {
      transform: [
        {
          translateX: Layout.SCROLLBAR_OFFSET,
        },
      ],
    },
    native: {
      transform: [],
    },
  }) as {transform: Exclude<ViewStyle['transform'], string | undefined>},
} as const
