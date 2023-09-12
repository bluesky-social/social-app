import {describe, it, expect} from '@jest/globals'

import {create} from '../lib'

const theme = create({
  tokens: {
    space: {
      s: 10,
      m: 16,
      l: 24,
    },
    color: {
      primary: 'tomato',
    },
    fontSize: {
      s: 14,
      m: 16,
      l: 18,
    },
  },
  properties: {
    c: ['color'],
    px: ['paddingLeft', 'paddingRight'],
    fs: ['fontSize'],
  },
  macros: {
    font(value: 'inter' | 'mono') {
      return {
        fontFamily: value === 'inter' ? 'Inter' : 'Roboto Mono',
      }
    },
  },
  breakpoints: {
    gtPhone: 640,
  },
})

describe('style: basic', () => {
  it('works with configured properties', () => {
    const styles = theme.style({
      color: 'primary',
      paddingVertical: 's',
      fontSize: 'm',
    })

    expect(styles).toEqual({
      color: theme.config.tokens.color.primary,
      paddingTop: theme.config.tokens.space.s,
      paddingBottom: theme.config.tokens.space.s,
      fontSize: theme.config.tokens.fontSize.m,
    })
  })

  it('works with user-defined properties', () => {
    const styles = theme.style({
      c: 'primary',
      px: 's',
      fontSize: 'm',
    })

    expect(styles).toEqual({
      color: theme.config.tokens.color.primary,
      paddingLeft: theme.config.tokens.space.s,
      paddingRight: theme.config.tokens.space.s,
      fontSize: theme.config.tokens.fontSize.m,
    })
  })
})

describe('pick', () => {
  it('works', () => {
    const {styles, props} = theme.pick({
      c: 'primary',
      gtPhone: {
        px: 'm',
      },
      accessibilityLabel: 'hello',
    })

    expect(styles).toEqual({
      default: {
        c: 'primary',
      },
      gtPhone: {
        px: 'm',
      },
    })
    expect(props).toEqual({
      accessibilityLabel: 'hello',
    })
  })
})

describe('getActiveBreakpoints', () => {
  it('works', () => {
    const activeBreakpoints = theme.getActiveBreakpoints({
      width: 1000,
    })

    expect(activeBreakpoints).toEqual({
      active: ['default', 'gtPhone'],
      current: 'gtPhone',
    })
  })
})

describe('applyBreakpoints', () => {
  it('works', () => {})
})
