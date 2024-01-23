import * as tokens from '#/alf/tokens'

export const atoms = {
  /*
   * Positioning
   */
  fixed: {
    position: 'fixed',
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

  /*
   * Width
   */
  w_full: {
    width: '100%',
  },
  h_full: {
    height: '100%',
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
  flex_wrap: {
    flexWrap: 'wrap',
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

  /*
   * Text
   */
  text_center: {
    textAlign: 'center',
  },
  text_right: {
    textAlign: 'right',
  },
  text_2xs: {
    fontSize: tokens.fontSize._2xs,
  },
  text_xs: {
    fontSize: tokens.fontSize.xs,
  },
  text_sm: {
    fontSize: tokens.fontSize.sm,
  },
  text_md: {
    fontSize: tokens.fontSize.md,
  },
  text_lg: {
    fontSize: tokens.fontSize.lg,
  },
  text_xl: {
    fontSize: tokens.fontSize.xl,
  },
  text_2xl: {
    fontSize: tokens.fontSize._2xl,
  },
  text_3xl: {
    fontSize: tokens.fontSize._3xl,
  },
  text_4xl: {
    fontSize: tokens.fontSize._4xl,
  },
  text_5xl: {
    fontSize: tokens.fontSize._5xl,
  },
  leading_tight: {
    lineHeight: 1.15,
  },
  leading_snug: {
    lineHeight: 1.25,
  },
  leading_normal: {
    lineHeight: 1.5,
  },
  font_normal: {
    fontWeight: tokens.fontWeight.normal,
  },
  font_bold: {
    fontWeight: tokens.fontWeight.semibold,
  },

  /*
   * Border
   */
  border: {
    borderWidth: 1,
  },
  border_t: {
    borderTopWidth: 1,
  },
  border_b: {
    borderBottomWidth: 1,
  },

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
} as const
