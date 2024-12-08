import * as tokens from './tokens.js'

export const atoms = {
  block: {
    display: 'block',
  },
  inline_block: {
    display: 'inline-block',
  },
  inline: {
    display: 'inline',
  },
  /*
   * Positioning
   */
  fixed: {
    position: 'absolute',
  },
  absolute: {
    position: 'absolute',
  },
  relative: {
    position: 'relative',
  },
  inset_0: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  overflow_hidden: {
    overflow: 'hidden',
  },

  /*
   * Width
   */
  w_full: {
    width: '100%',
  },
  h_full: {
    height: '100%',
  },
  h_full_vh: {
    height: '100vh',
  },

  /*
   * Theme-independent bg colors
   */
  bg_transparent: {
    backgroundColor: 'transparent',
  },

  /*
   * Border radius
   */
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
  rounded_full: {
    borderRadius: tokens.borderRadius.full,
  },

  /*
   * Flex
   */
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
  flex_0: {
    flex: '0 0 auto',
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
    letterSpacing: 0.25,
  },
  text_xs: {
    fontSize: tokens.fontSize.xs,
    letterSpacing: 0.25,
  },
  text_sm: {
    fontSize: tokens.fontSize.sm,
    letterSpacing: 0.25,
  },
  text_md: {
    fontSize: tokens.fontSize.md,
    letterSpacing: 0.25,
  },
  text_lg: {
    fontSize: tokens.fontSize.lg,
    letterSpacing: 0.25,
  },
  text_xl: {
    fontSize: tokens.fontSize.xl,
    letterSpacing: 0.25,
  },
  text_2xl: {
    fontSize: tokens.fontSize._2xl,
    letterSpacing: 0.25,
  },
  text_3xl: {
    fontSize: tokens.fontSize._3xl,
    letterSpacing: 0.25,
  },
  text_4xl: {
    fontSize: tokens.fontSize._4xl,
    letterSpacing: 0.25,
  },
  text_5xl: {
    fontSize: tokens.fontSize._5xl,
    letterSpacing: 0.25,
  },
  leading_tight: {
    lineHeight: '1.15',
  },
  leading_snug: {
    lineHeight: '1.3',
  },
  leading_normal: {
    lineHeight: '1.5',
  },
  tracking_normal: {
    letterSpacing: 0,
  },
  tracking_wide: {
    letterSpacing: 0.25,
  },
  font_normal: {
    fontWeight: tokens.fontWeight.normal,
  },
  font_semibold: {
    fontWeight: tokens.fontWeight.semibold,
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
  mono: {
    fontFamily: 'monospace',
  },

  /*
   * Border
   */
  border_0: {
    borderWidth: '0px',
  },
  border: {
    borderWidth: '1px',
    borderStyle: 'solid',
  },
  border_t: {
    borderTopWidth: '1px',
    borderStyle: 'solid',
  },
  border_b: {
    borderBottomWidth: '1px',
    borderStyle: 'solid',
  },
  border_l: {
    borderLeftWidth: '1px',
    borderStyle: 'solid',
  },
  border_r: {
    borderRightWidth: '1px',
    borderStyle: 'solid',
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
   * Text decoration
   */
  underline: {
    textDecorationLine: 'underline',
  },
  strike_through: {
    textDecorationLine: 'line-through',
  },
} as const
