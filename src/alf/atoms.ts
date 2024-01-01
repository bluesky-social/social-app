import {TextStyle} from 'react-native'
import * as tokens from '#/alf/tokens'

const gap = Object.keys(tokens.space).reduce((acc, key) => {
  const k = key as tokens.Space
  acc[`gap_${k}`] = {
    gap: tokens.space[k],
  }
  return acc
}, {} as Record<`gap_${tokens.Space}`, {gap: number}>)

const fontSize = Object.keys(tokens.fontSize).reduce((acc, key) => {
  const k = key as tokens.FontSize
  acc[`text_${k}`] = {
    fontSize: tokens.fontSize[k],
    lineHeight: tokens.fontSize[k],
  }
  return acc
}, {} as Record<`text_${tokens.FontSize}`, {fontSize: number; lineHeight: number}>)

const lineHeight = Object.keys(tokens.lineHeight).reduce((acc, key) => {
  const k = key as tokens.LineHeight
  acc[`leading_${k}`] = {
    lineHeight: tokens.lineHeight[k],
  }
  return acc
}, {} as Record<`leading_${tokens.LineHeight}`, {lineHeight: number}>)

const fontWeight = Object.keys(tokens.fontWeight).reduce((acc, key) => {
  const k = key as tokens.FontWeight
  acc[`font_${k}`] = {
    fontWeight: tokens.fontWeight[k] as TextStyle['fontWeight'],
  }
  return acc
}, {} as Record<`font_${tokens.FontWeight}`, {fontWeight: TextStyle['fontWeight']}>)

const radius = Object.keys(tokens.borderRadius).reduce((acc, key) => {
  const k = key as tokens.BorderRadius
  acc[`rounded_${k}`] = {
    borderRadius: tokens.borderRadius[k],
  }
  return acc
}, {} as Record<`rounded_${tokens.BorderRadius}`, {borderRadius: number}>)

const padding = Object.keys(tokens.space).reduce(
  (acc, key) => {
    const k = key as tokens.Space
    const value = tokens.space[k]
    return {
      ...acc,
      [`p_${k}`]: {
        padding: value,
      },
      [`px_${k}`]: {
        paddingLeft: value,
        paddingRight: value,
      },
      [`py_${k}`]: {
        paddingTop: value,
        paddingBottom: value,
      },
      [`pt_${k}`]: {
        paddingTop: value,
      },
      [`pb_${k}`]: {
        paddingBottom: value,
      },
      [`pl_${k}`]: {
        paddingLeft: value,
      },
      [`pr_${k}`]: {
        paddingRight: value,
      },
    }
  },
  {} as Record<
    `${'p' | 'px' | 'py' | 'pt' | 'pb' | 'pl' | 'pr'}_${tokens.Space}`,
    {
      padding?: number
      paddingLeft?: number
      paddingRight?: number
      paddingTop?: number
      paddingBottom?: number
    }
  >,
)

const margin = Object.keys(tokens.space).reduce(
  (acc, key) => {
    const k = key as tokens.Space
    const value = tokens.space[k]
    return {
      ...acc,
      [`m_${k}`]: {
        margin: value,
      },
      [`mx_${k}`]: {
        margin: value,
        marginRight: value,
      },
      [`my_${k}`]: {
        marginTop: value,
        marginBottom: value,
      },
      [`mt_${k}`]: {
        marginTop: value,
      },
      [`mb_${k}`]: {
        marginBottom: value,
      },
      [`ml_${k}`]: {
        margin: value,
      },
      [`mr_${k}`]: {
        marginRight: value,
      },
    }
  },
  {} as Record<
    `${'m' | 'mx' | 'my' | 'mt' | 'mb' | 'ml' | 'mr'}_${tokens.Space}`,
    {
      margin?: number
      marginLeft?: number
      marginRight?: number
      marginTop?: number
      marginBottom?: number
    }
  >,
)

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

  ...radius,

  /*
   * Spacing
   */
  ...padding,
  ...margin,

  /*
   * Flex
   */
  ...gap,
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
  ...fontSize,
  ...lineHeight,
  ...fontWeight,

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
   * Width
   */
  w_full: {
    width: '100%',
  },
  h_full: {
    height: '100%',
  },
} as const
