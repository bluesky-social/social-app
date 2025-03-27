import {
  Platform,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from 'react-native'

import * as tokens from '#/alf/tokens'
import {ios, native, platform, web} from '#/alf/util/platform'
import * as Layout from '#/components/Layout'

export const atoms = {
  debug: {
    borderColor: 'red',
    borderWidth: 1,
  },

  /*
   * Positioning
   */
  fixed: {
    position: Platform.select({web: 'fixed', native: 'absolute'}) as 'absolute',
  },
  absolute: {
    position: 'absolute',
  },
  relative: {
    position: 'relative',
  },
  sticky: web({
    position: 'sticky',
  }),
  inset_0: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  top_0: {
    top: 0,
  },
  right_0: {
    right: 0,
  },
  bottom_0: {
    bottom: 0,
  },
  left_0: {
    left: 0,
  },
  z_10: {
    zIndex: 10,
  },
  z_20: {
    zIndex: 20,
  },
  z_30: {
    zIndex: 30,
  },
  z_40: {
    zIndex: 40,
  },
  z_50: {
    zIndex: 50,
  },

  overflow_hidden: {
    overflow: 'hidden',
  },
  /**
   * @platform web
   */
  overflow_auto: web({
    overflow: 'auto',
  }),

  /*
   * Width & Height
   */
  w_full: {
    width: '100%',
  },
  h_full: {
    height: '100%',
  },
  h_full_vh: web({
    height: '100vh',
  }),
  max_w_full: {
    maxWidth: '100%',
  },
  max_h_full: {
    maxHeight: '100%',
  },

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

  /*
   * Border radius
   */
  rounded_0: {
    borderRadius: 0,
  },
  rounded_2xs: {
    borderRadius: tokens.borderRadius._2xs,
  },
  rounded_xs: {
    borderRadius: tokens.borderRadius.xs,
  },
  rounded_sm: {
    borderRadius: tokens.borderRadius.sm,
  },
  rounded_md: {
    borderRadius: tokens.borderRadius.md,
  },
  rounded_lg: {
    borderRadius: tokens.borderRadius.lg,
  },
  rounded_full: {
    borderRadius: tokens.borderRadius.full,
  },

  /*
   * Flex
   */
  gap_0: {
    gap: 0,
  },
  gap_2xs: {
    gap: tokens.space._2xs,
  },
  gap_xs: {
    gap: tokens.space.xs,
  },
  gap_sm: {
    gap: tokens.space.sm,
  },
  gap_md: {
    gap: tokens.space.md,
  },
  gap_lg: {
    gap: tokens.space.lg,
  },
  gap_xl: {
    gap: tokens.space.xl,
  },
  gap_2xl: {
    gap: tokens.space._2xl,
  },
  gap_3xl: {
    gap: tokens.space._3xl,
  },
  gap_4xl: {
    gap: tokens.space._4xl,
  },
  gap_5xl: {
    gap: tokens.space._5xl,
  },
  flex: {
    display: 'flex',
  },
  flex_col: {
    flexDirection: 'column',
  },
  flex_row: {
    flexDirection: 'row',
  },
  flex_col_reverse: {
    flexDirection: 'column-reverse',
  },
  flex_row_reverse: {
    flexDirection: 'row-reverse',
  },
  flex_wrap: {
    flexWrap: 'wrap',
  },
  flex_nowrap: {
    flexWrap: 'nowrap',
  },
  flex_0: {
    flex: web('0 0 auto') || (native(0) as number),
  },
  flex_1: {
    flex: 1,
  },
  flex_grow: {
    flexGrow: 1,
  },
  flex_shrink: {
    flexShrink: 1,
  },
  flex_shrink_0: {
    flexShrink: 0,
  },
  justify_start: {
    justifyContent: 'flex-start',
  },
  justify_center: {
    justifyContent: 'center',
  },
  justify_between: {
    justifyContent: 'space-between',
  },
  justify_end: {
    justifyContent: 'flex-end',
  },
  align_center: {
    alignItems: 'center',
  },
  align_start: {
    alignItems: 'flex-start',
  },
  align_end: {
    alignItems: 'flex-end',
  },
  align_baseline: {
    alignItems: 'baseline',
  },
  align_stretch: {
    alignItems: 'stretch',
  },
  self_auto: {
    alignSelf: 'auto',
  },
  self_start: {
    alignSelf: 'flex-start',
  },
  self_end: {
    alignSelf: 'flex-end',
  },
  self_center: {
    alignSelf: 'center',
  },
  self_stretch: {
    alignSelf: 'stretch',
  },
  self_baseline: {
    alignSelf: 'baseline',
  },

  /*
   * Text
   */
  text_left: {
    textAlign: 'left',
  },
  text_center: {
    textAlign: 'center',
  },
  text_right: {
    textAlign: 'right',
  },
  text_2xs: {
    fontSize: tokens.fontSize._2xs,
    letterSpacing: tokens.TRACKING,
  },
  text_xs: {
    fontSize: tokens.fontSize.xs,
    letterSpacing: tokens.TRACKING,
  },
  text_sm: {
    fontSize: tokens.fontSize.sm,
    letterSpacing: tokens.TRACKING,
  },
  text_md: {
    fontSize: tokens.fontSize.md,
    letterSpacing: tokens.TRACKING,
  },
  text_lg: {
    fontSize: tokens.fontSize.lg,
    letterSpacing: tokens.TRACKING,
  },
  text_xl: {
    fontSize: tokens.fontSize.xl,
    letterSpacing: tokens.TRACKING,
  },
  text_2xl: {
    fontSize: tokens.fontSize._2xl,
    letterSpacing: tokens.TRACKING,
  },
  text_3xl: {
    fontSize: tokens.fontSize._3xl,
    letterSpacing: tokens.TRACKING,
  },
  text_4xl: {
    fontSize: tokens.fontSize._4xl,
    letterSpacing: tokens.TRACKING,
  },
  text_5xl: {
    fontSize: tokens.fontSize._5xl,
    letterSpacing: tokens.TRACKING,
  },
  leading_tight: {
    lineHeight: 1.15,
  },
  leading_snug: {
    lineHeight: 1.3,
  },
  leading_normal: {
    lineHeight: 1.5,
  },
  tracking_normal: {
    letterSpacing: tokens.TRACKING,
  },
  font_normal: {
    fontWeight: tokens.fontWeight.normal,
  },
  font_bold: {
    fontWeight: tokens.fontWeight.bold,
  },
  font_heavy: {
    fontWeight: tokens.fontWeight.heavy,
  },
  italic: {
    fontStyle: 'italic',
  },

  /*
   * Border
   */
  border_0: {
    borderWidth: 0,
  },
  border_t_0: {
    borderTopWidth: 0,
  },
  border_b_0: {
    borderBottomWidth: 0,
  },
  border_l_0: {
    borderLeftWidth: 0,
  },
  border_r_0: {
    borderRightWidth: 0,
  },
  border: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  border_t: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  border_b: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  border_l: {
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  border_r: {
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  border_transparent: {
    borderColor: 'transparent',
  },
  curve_circular: ios({
    borderCurve: 'circular',
  }),
  curve_continuous: ios({
    borderCurve: 'continuous',
  }),

  /*
   * Shadow
   */
  shadow_sm: {
    shadowRadius: 8,
    shadowOpacity: 0.1,
    elevation: 8,
  },
  shadow_md: {
    shadowRadius: 16,
    shadowOpacity: 0.1,
    elevation: 16,
  },
  shadow_lg: {
    shadowRadius: 32,
    shadowOpacity: 0.1,
    elevation: 24,
  },

  /*
   * Padding
   */
  p_0: {
    padding: 0,
  },
  p_2xs: {
    padding: tokens.space._2xs,
  },
  p_xs: {
    padding: tokens.space.xs,
  },
  p_sm: {
    padding: tokens.space.sm,
  },
  p_md: {
    padding: tokens.space.md,
  },
  p_lg: {
    padding: tokens.space.lg,
  },
  p_xl: {
    padding: tokens.space.xl,
  },
  p_2xl: {
    padding: tokens.space._2xl,
  },
  p_3xl: {
    padding: tokens.space._3xl,
  },
  p_4xl: {
    padding: tokens.space._4xl,
  },
  p_5xl: {
    padding: tokens.space._5xl,
  },
  px_0: {
    paddingLeft: 0,
    paddingRight: 0,
  },
  px_2xs: {
    paddingLeft: tokens.space._2xs,
    paddingRight: tokens.space._2xs,
  },
  px_xs: {
    paddingLeft: tokens.space.xs,
    paddingRight: tokens.space.xs,
  },
  px_sm: {
    paddingLeft: tokens.space.sm,
    paddingRight: tokens.space.sm,
  },
  px_md: {
    paddingLeft: tokens.space.md,
    paddingRight: tokens.space.md,
  },
  px_lg: {
    paddingLeft: tokens.space.lg,
    paddingRight: tokens.space.lg,
  },
  px_xl: {
    paddingLeft: tokens.space.xl,
    paddingRight: tokens.space.xl,
  },
  px_2xl: {
    paddingLeft: tokens.space._2xl,
    paddingRight: tokens.space._2xl,
  },
  px_3xl: {
    paddingLeft: tokens.space._3xl,
    paddingRight: tokens.space._3xl,
  },
  px_4xl: {
    paddingLeft: tokens.space._4xl,
    paddingRight: tokens.space._4xl,
  },
  px_5xl: {
    paddingLeft: tokens.space._5xl,
    paddingRight: tokens.space._5xl,
  },
  py_0: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  py_2xs: {
    paddingTop: tokens.space._2xs,
    paddingBottom: tokens.space._2xs,
  },
  py_xs: {
    paddingTop: tokens.space.xs,
    paddingBottom: tokens.space.xs,
  },
  py_sm: {
    paddingTop: tokens.space.sm,
    paddingBottom: tokens.space.sm,
  },
  py_md: {
    paddingTop: tokens.space.md,
    paddingBottom: tokens.space.md,
  },
  py_lg: {
    paddingTop: tokens.space.lg,
    paddingBottom: tokens.space.lg,
  },
  py_xl: {
    paddingTop: tokens.space.xl,
    paddingBottom: tokens.space.xl,
  },
  py_2xl: {
    paddingTop: tokens.space._2xl,
    paddingBottom: tokens.space._2xl,
  },
  py_3xl: {
    paddingTop: tokens.space._3xl,
    paddingBottom: tokens.space._3xl,
  },
  py_4xl: {
    paddingTop: tokens.space._4xl,
    paddingBottom: tokens.space._4xl,
  },
  py_5xl: {
    paddingTop: tokens.space._5xl,
    paddingBottom: tokens.space._5xl,
  },
  pt_0: {
    paddingTop: 0,
  },
  pt_2xs: {
    paddingTop: tokens.space._2xs,
  },
  pt_xs: {
    paddingTop: tokens.space.xs,
  },
  pt_sm: {
    paddingTop: tokens.space.sm,
  },
  pt_md: {
    paddingTop: tokens.space.md,
  },
  pt_lg: {
    paddingTop: tokens.space.lg,
  },
  pt_xl: {
    paddingTop: tokens.space.xl,
  },
  pt_2xl: {
    paddingTop: tokens.space._2xl,
  },
  pt_3xl: {
    paddingTop: tokens.space._3xl,
  },
  pt_4xl: {
    paddingTop: tokens.space._4xl,
  },
  pt_5xl: {
    paddingTop: tokens.space._5xl,
  },
  pb_0: {
    paddingBottom: 0,
  },
  pb_2xs: {
    paddingBottom: tokens.space._2xs,
  },
  pb_xs: {
    paddingBottom: tokens.space.xs,
  },
  pb_sm: {
    paddingBottom: tokens.space.sm,
  },
  pb_md: {
    paddingBottom: tokens.space.md,
  },
  pb_lg: {
    paddingBottom: tokens.space.lg,
  },
  pb_xl: {
    paddingBottom: tokens.space.xl,
  },
  pb_2xl: {
    paddingBottom: tokens.space._2xl,
  },
  pb_3xl: {
    paddingBottom: tokens.space._3xl,
  },
  pb_4xl: {
    paddingBottom: tokens.space._4xl,
  },
  pb_5xl: {
    paddingBottom: tokens.space._5xl,
  },
  pl_0: {
    paddingLeft: 0,
  },
  pl_2xs: {
    paddingLeft: tokens.space._2xs,
  },
  pl_xs: {
    paddingLeft: tokens.space.xs,
  },
  pl_sm: {
    paddingLeft: tokens.space.sm,
  },
  pl_md: {
    paddingLeft: tokens.space.md,
  },
  pl_lg: {
    paddingLeft: tokens.space.lg,
  },
  pl_xl: {
    paddingLeft: tokens.space.xl,
  },
  pl_2xl: {
    paddingLeft: tokens.space._2xl,
  },
  pl_3xl: {
    paddingLeft: tokens.space._3xl,
  },
  pl_4xl: {
    paddingLeft: tokens.space._4xl,
  },
  pl_5xl: {
    paddingLeft: tokens.space._5xl,
  },
  pr_0: {
    paddingRight: 0,
  },
  pr_2xs: {
    paddingRight: tokens.space._2xs,
  },
  pr_xs: {
    paddingRight: tokens.space.xs,
  },
  pr_sm: {
    paddingRight: tokens.space.sm,
  },
  pr_md: {
    paddingRight: tokens.space.md,
  },
  pr_lg: {
    paddingRight: tokens.space.lg,
  },
  pr_xl: {
    paddingRight: tokens.space.xl,
  },
  pr_2xl: {
    paddingRight: tokens.space._2xl,
  },
  pr_3xl: {
    paddingRight: tokens.space._3xl,
  },
  pr_4xl: {
    paddingRight: tokens.space._4xl,
  },
  pr_5xl: {
    paddingRight: tokens.space._5xl,
  },

  /*
   * Margin
   */
  m_0: {
    margin: 0,
  },
  m_2xs: {
    margin: tokens.space._2xs,
  },
  m_xs: {
    margin: tokens.space.xs,
  },
  m_sm: {
    margin: tokens.space.sm,
  },
  m_md: {
    margin: tokens.space.md,
  },
  m_lg: {
    margin: tokens.space.lg,
  },
  m_xl: {
    margin: tokens.space.xl,
  },
  m_2xl: {
    margin: tokens.space._2xl,
  },
  m_3xl: {
    margin: tokens.space._3xl,
  },
  m_4xl: {
    margin: tokens.space._4xl,
  },
  m_5xl: {
    margin: tokens.space._5xl,
  },
  m_auto: {
    margin: 'auto',
  },
  mx_0: {
    marginLeft: 0,
    marginRight: 0,
  },
  mx_2xs: {
    marginLeft: tokens.space._2xs,
    marginRight: tokens.space._2xs,
  },
  mx_xs: {
    marginLeft: tokens.space.xs,
    marginRight: tokens.space.xs,
  },
  mx_sm: {
    marginLeft: tokens.space.sm,
    marginRight: tokens.space.sm,
  },
  mx_md: {
    marginLeft: tokens.space.md,
    marginRight: tokens.space.md,
  },
  mx_lg: {
    marginLeft: tokens.space.lg,
    marginRight: tokens.space.lg,
  },
  mx_xl: {
    marginLeft: tokens.space.xl,
    marginRight: tokens.space.xl,
  },
  mx_2xl: {
    marginLeft: tokens.space._2xl,
    marginRight: tokens.space._2xl,
  },
  mx_3xl: {
    marginLeft: tokens.space._3xl,
    marginRight: tokens.space._3xl,
  },
  mx_4xl: {
    marginLeft: tokens.space._4xl,
    marginRight: tokens.space._4xl,
  },
  mx_5xl: {
    marginLeft: tokens.space._5xl,
    marginRight: tokens.space._5xl,
  },
  mx_auto: {
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  my_0: {
    marginTop: 0,
    marginBottom: 0,
  },
  my_2xs: {
    marginTop: tokens.space._2xs,
    marginBottom: tokens.space._2xs,
  },
  my_xs: {
    marginTop: tokens.space.xs,
    marginBottom: tokens.space.xs,
  },
  my_sm: {
    marginTop: tokens.space.sm,
    marginBottom: tokens.space.sm,
  },
  my_md: {
    marginTop: tokens.space.md,
    marginBottom: tokens.space.md,
  },
  my_lg: {
    marginTop: tokens.space.lg,
    marginBottom: tokens.space.lg,
  },
  my_xl: {
    marginTop: tokens.space.xl,
    marginBottom: tokens.space.xl,
  },
  my_2xl: {
    marginTop: tokens.space._2xl,
    marginBottom: tokens.space._2xl,
  },
  my_3xl: {
    marginTop: tokens.space._3xl,
    marginBottom: tokens.space._3xl,
  },
  my_4xl: {
    marginTop: tokens.space._4xl,
    marginBottom: tokens.space._4xl,
  },
  my_5xl: {
    marginTop: tokens.space._5xl,
    marginBottom: tokens.space._5xl,
  },
  my_auto: {
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  mt_0: {
    marginTop: 0,
  },
  mt_2xs: {
    marginTop: tokens.space._2xs,
  },
  mt_xs: {
    marginTop: tokens.space.xs,
  },
  mt_sm: {
    marginTop: tokens.space.sm,
  },
  mt_md: {
    marginTop: tokens.space.md,
  },
  mt_lg: {
    marginTop: tokens.space.lg,
  },
  mt_xl: {
    marginTop: tokens.space.xl,
  },
  mt_2xl: {
    marginTop: tokens.space._2xl,
  },
  mt_3xl: {
    marginTop: tokens.space._3xl,
  },
  mt_4xl: {
    marginTop: tokens.space._4xl,
  },
  mt_5xl: {
    marginTop: tokens.space._5xl,
  },
  mt_auto: {
    marginTop: 'auto',
  },
  mb_0: {
    marginBottom: 0,
  },
  mb_2xs: {
    marginBottom: tokens.space._2xs,
  },
  mb_xs: {
    marginBottom: tokens.space.xs,
  },
  mb_sm: {
    marginBottom: tokens.space.sm,
  },
  mb_md: {
    marginBottom: tokens.space.md,
  },
  mb_lg: {
    marginBottom: tokens.space.lg,
  },
  mb_xl: {
    marginBottom: tokens.space.xl,
  },
  mb_2xl: {
    marginBottom: tokens.space._2xl,
  },
  mb_3xl: {
    marginBottom: tokens.space._3xl,
  },
  mb_4xl: {
    marginBottom: tokens.space._4xl,
  },
  mb_5xl: {
    marginBottom: tokens.space._5xl,
  },
  mb_auto: {
    marginBottom: 'auto',
  },
  ml_0: {
    marginLeft: 0,
  },
  ml_2xs: {
    marginLeft: tokens.space._2xs,
  },
  ml_xs: {
    marginLeft: tokens.space.xs,
  },
  ml_sm: {
    marginLeft: tokens.space.sm,
  },
  ml_md: {
    marginLeft: tokens.space.md,
  },
  ml_lg: {
    marginLeft: tokens.space.lg,
  },
  ml_xl: {
    marginLeft: tokens.space.xl,
  },
  ml_2xl: {
    marginLeft: tokens.space._2xl,
  },
  ml_3xl: {
    marginLeft: tokens.space._3xl,
  },
  ml_4xl: {
    marginLeft: tokens.space._4xl,
  },
  ml_5xl: {
    marginLeft: tokens.space._5xl,
  },
  ml_auto: {
    marginLeft: 'auto',
  },
  mr_0: {
    marginRight: 0,
  },
  mr_2xs: {
    marginRight: tokens.space._2xs,
  },
  mr_xs: {
    marginRight: tokens.space.xs,
  },
  mr_sm: {
    marginRight: tokens.space.sm,
  },
  mr_md: {
    marginRight: tokens.space.md,
  },
  mr_lg: {
    marginRight: tokens.space.lg,
  },
  mr_xl: {
    marginRight: tokens.space.xl,
  },
  mr_2xl: {
    marginRight: tokens.space._2xl,
  },
  mr_3xl: {
    marginRight: tokens.space._3xl,
  },
  mr_4xl: {
    marginRight: tokens.space._4xl,
  },
  mr_5xl: {
    marginRight: tokens.space._5xl,
  },
  mr_auto: {
    marginRight: 'auto',
  },

  /*
   * Pointer events & user select
   */
  pointer_events_none: {
    pointerEvents: 'none',
  },
  pointer_events_auto: {
    pointerEvents: 'auto',
  },
  user_select_none: {
    userSelect: 'none',
  },
  user_select_text: {
    userSelect: 'text',
  },
  user_select_all: {
    userSelect: 'all',
  },
  outline_inset_1: {
    outlineOffset: '-1px',
  } as StyleProp<ViewStyle>,

  /*
   * Text decoration
   */
  underline: {
    textDecorationLine: 'underline',
  },
  strike_through: {
    textDecorationLine: 'line-through',
  },

  /*
   * Display
   */
  hidden: {
    display: 'none',
  },

  /*
   * Transition
   */
  transition_none: web({
    transitionProperty: 'none',
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
   * Animaations
   */
  fade_in: web({
    animation: 'fadeIn ease-out 0.15s',
  }),
  fade_out: web({
    animation: 'fadeOut ease-out 0.15s',
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
    animation: 'zoomIn ease-out 0.1s, fadeIn ease-out 0.1s',
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
