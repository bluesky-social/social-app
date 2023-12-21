import {TextStyle} from 'react-native'
import * as tokens from '#/alf/tokens'

const gap = Object.keys(tokens.space).reduce((acc, key) => {
  const k = key as tokens.Space
  acc[k] = {
    gap: tokens.space[k],
  }
  return acc
}, {} as Record<tokens.Space, {gap: number}>)

const fontSize = Object.keys(tokens.fontSize).reduce((acc, key) => {
  const k = key as tokens.FontSize
  acc[k] = {
    fontSize: tokens.fontSize[k],
    lineHeight: tokens.fontSize[k],
  }
  return acc
}, {} as Record<tokens.FontSize, {fontSize: number; lineHeight: number}>)

const lineHeight = Object.keys(tokens.lineHeight).reduce((acc, key) => {
  const k = key as tokens.LineHeight
  acc[k] = {
    lineHeight: tokens.lineHeight[k],
  }
  return acc
}, {} as Record<tokens.LineHeight, {lineHeight: string}>)

const fontWeight = Object.keys(tokens.fontWeight).reduce((acc, key) => {
  const k = key as tokens.FontWeight
  acc[k] = {
    fontWeight: tokens.fontWeight[k],
  }
  return acc
}, {} as Record<tokens.FontWeight, {fontWeight: TextStyle['fontWeight']}>)

const radius = Object.keys(tokens.borderRadius).reduce((acc, key) => {
  const k = key as tokens.BorderRadius
  acc[k] = {
    borderRadius: tokens.borderRadius[k],
  }
  return acc
}, {} as Record<tokens.BorderRadius, {borderRadius: number}>)

const padding = Object.keys(tokens.space).reduce(
  (acc, key) => {
    const k = key as tokens.Space
    const value = tokens.space[k]
    return {
      pa: {
        ...acc.pa,
        [k]: {
          paddingTop: value,
          paddingBottom: value,
          paddingLeft: value,
          paddingRight: value,
        },
      },
      px: {
        ...acc.px,
        [k]: {
          paddingLeft: value,
          paddingRight: value,
        },
      },
      py: {
        ...acc.py,
        [k]: {
          paddingTop: value,
          paddingBottom: value,
        },
      },
      pt: {
        ...acc.pt,
        [k]: {
          paddingTop: value,
        },
      },
      pb: {
        ...acc.pb,
        [k]: {
          paddingBottom: value,
        },
      },
      pl: {
        ...acc.pl,
        [k]: {
          paddingLeft: value,
        },
      },
      pr: {
        ...acc.pr,
        [k]: {
          paddingRight: value,
        },
      },
    }
  },
  {} as {
    pa: Record<
      tokens.Space,
      {
        paddingTop: number
        paddingBottom: number
        paddingLeft: number
        paddingRight: number
      }
    >
    px: Record<
      tokens.Space,
      {
        paddingLeft: number
        paddingRight: number
      }
    >
    py: Record<
      tokens.Space,
      {
        paddingTop: number
        paddingBottom: number
      }
    >
    pt: Record<
      tokens.Space,
      {
        paddingTop: number
      }
    >
    pb: Record<
      tokens.Space,
      {
        paddingBottom: number
      }
    >
    pl: Record<
      tokens.Space,
      {
        paddingLeft: number
      }
    >
    pr: Record<
      tokens.Space,
      {
        paddingRight: number
      }
    >
  },
)

const margin = Object.keys(tokens.space).reduce(
  (acc, key) => {
    const k = key as tokens.Space
    const value = tokens.space[k]
    return {
      pa: {
        ...acc.pa,
        [k]: {
          marginTop: value,
          marginBottom: value,
          marginLeft: value,
          marginRight: value,
        },
      },
      px: {
        ...acc.px,
        [k]: {
          marginLeft: value,
          marginRight: value,
        },
      },
      py: {
        ...acc.py,
        [k]: {
          marginTop: value,
          marginBottom: value,
        },
      },
      pt: {
        ...acc.pt,
        [k]: {
          marginTop: value,
        },
      },
      pb: {
        ...acc.pb,
        [k]: {
          marginBottom: value,
        },
      },
      pl: {
        ...acc.pl,
        [k]: {
          marginLeft: value,
        },
      },
      pr: {
        ...acc.pr,
        [k]: {
          marginRight: value,
        },
      },
    }
  },
  {} as {
    pa: Record<
      tokens.Space,
      {
        marginTop: number
        marginBottom: number
        marginLeft: number
        marginRight: number
      }
    >
    px: Record<
      tokens.Space,
      {
        marginLeft: number
        marginRight: number
      }
    >
    py: Record<
      tokens.Space,
      {
        marginTop: number
        marginBottom: number
      }
    >
    pt: Record<
      tokens.Space,
      {
        marginTop: number
      }
    >
    pb: Record<
      tokens.Space,
      {
        marginBottom: number
      }
    >
    pl: Record<
      tokens.Space,
      {
        marginLeft: number
      }
    >
    pr: Record<
      tokens.Space,
      {
        marginRight: number
      }
    >
  },
)

export const styles = {
  radius,
  padding,
  margin,
  font: {
    ...fontSize,
    ...fontWeight,
    ...lineHeight,
  },
  flex: {
    gap,
    row: {
      flexDirection: 'row',
    },
    wrap: {
      flexWrap: 'wrap',
    },
    one: {
      flex: 1,
    },
    two: {
      flex: 2,
    },
    three: {
      flex: 3,
    },
    alignCenter: {
      alignItems: 'center',
    },
    justifyCenter: {
      justifyContent: 'center',
    },
    justifyBetween: {
      justifyContent: 'space-between',
    },
    justifyEnd: {
      justifyContent: 'flex-end',
    },
  },
  pos: {
    abs: {
      position: 'absolute',
    },
    rel: {
      position: 'relative',
    },
    cover: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
  },
} as const
