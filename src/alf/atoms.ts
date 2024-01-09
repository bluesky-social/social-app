import * as tokens from '#/alf/tokens'

export const atoms = {
  /*
   * Positioning
   */
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
  gap_xxs: {
    gap: tokens.space.xxs,
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
  gap_xxl: {
    gap: tokens.space.xxl,
  },
  flex: {
    display: 'flex',
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
  text_xxs: {
    fontSize: tokens.fontSize.xxs,
    lineHeight: tokens.fontSize.xxs,
  },
  text_xs: {
    fontSize: tokens.fontSize.xs,
    lineHeight: tokens.fontSize.xs,
  },
  text_sm: {
    fontSize: tokens.fontSize.sm,
    lineHeight: tokens.fontSize.sm,
  },
  text_md: {
    fontSize: tokens.fontSize.md,
    lineHeight: tokens.fontSize.md,
  },
  text_lg: {
    fontSize: tokens.fontSize.lg,
    lineHeight: tokens.fontSize.lg,
  },
  text_xl: {
    fontSize: tokens.fontSize.xl,
    lineHeight: tokens.fontSize.xl,
  },
  text_xxl: {
    fontSize: tokens.fontSize.xxl,
    lineHeight: tokens.fontSize.xxl,
  },
  leading_tight: {
    lineHeight: 1.25,
  },
  leading_normal: {
    lineHeight: 1.5,
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
   * Padding
   */
  p_xxs: {
    padding: tokens.space.xxs,
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
  p_xxl: {
    padding: tokens.space.xxl,
  },
  px_xxs: {
    paddingLeft: tokens.space.xxs,
    paddingRight: tokens.space.xxs,
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
  px_xxl: {
    paddingLeft: tokens.space.xxl,
    paddingRight: tokens.space.xxl,
  },
  py_xxs: {
    paddingTop: tokens.space.xxs,
    paddingBottom: tokens.space.xxs,
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
  py_xxl: {
    paddingTop: tokens.space.xxl,
    paddingBottom: tokens.space.xxl,
  },
  pt_xxs: {
    paddingTop: tokens.space.xxs,
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
  pt_xxl: {
    paddingTop: tokens.space.xxl,
  },
  pb_xxs: {
    paddingBottom: tokens.space.xxs,
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
  pb_xxl: {
    paddingBottom: tokens.space.xxl,
  },
  pl_xxs: {
    paddingLeft: tokens.space.xxs,
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
  pl_xxl: {
    paddingLeft: tokens.space.xxl,
  },
  pr_xxs: {
    paddingRight: tokens.space.xxs,
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
  pr_xxl: {
    paddingRight: tokens.space.xxl,
  },

  /*
   * Margin
   */
  m_xxs: {
    margin: tokens.space.xxs,
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
  m_xxl: {
    margin: tokens.space.xxl,
  },
  mx_xxs: {
    marginLeft: tokens.space.xxs,
    marginRight: tokens.space.xxs,
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
  mx_xxl: {
    marginLeft: tokens.space.xxl,
    marginRight: tokens.space.xxl,
  },
  my_xxs: {
    marginTop: tokens.space.xxs,
    marginBottom: tokens.space.xxs,
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
  my_xxl: {
    marginTop: tokens.space.xxl,
    marginBottom: tokens.space.xxl,
  },
  mt_xxs: {
    marginTop: tokens.space.xxs,
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
  mt_xxl: {
    marginTop: tokens.space.xxl,
  },
  mb_xxs: {
    marginBottom: tokens.space.xxs,
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
  mb_xxl: {
    marginBottom: tokens.space.xxl,
  },
  ml_xxs: {
    marginLeft: tokens.space.xxs,
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
  ml_xxl: {
    marginLeft: tokens.space.xxl,
  },
  mr_xxs: {
    marginRight: tokens.space.xxs,
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
  mr_xxl: {
    marginRight: tokens.space.xxl,
  },
} as const
