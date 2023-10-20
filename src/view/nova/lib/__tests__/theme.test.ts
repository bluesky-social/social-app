import type {ViewProps} from 'react-native'
import {describe, test, expect} from '@jest/globals'

import {createTheme} from '../theme'

const theme = createTheme({
  tokens: {
    space: {
      s: 4,
      m: 8,
      l: 16,
    },
    color: {
      theme: 'tomato',
      text: 'black',
    },
  },
  properties: {
    px: ['paddingLeft', 'paddingRight'],
  },
  macros: {
    caps: (_: boolean) => ({textTransform: 'uppercase'}),
  },
  breakpoints: {
    gtPhone: 640,
    gtTablet: 1024,
  },
})

describe('non-style props', () => {
  test('e.g. className', () => {
    const {styles, props} = theme.style<ViewProps>(
      {
        id: 'foo',
      },
      [],
    )

    expect(styles).toEqual({})
    expect(props).toEqual({
      id: 'foo',
    })
  })
})

describe('properties', () => {
  test('standard', () => {
    const {styles} = theme.style(
      {
        color: 'blue',
      },
      [],
    )

    expect(styles).toEqual({
      color: 'blue',
    })
  })

  test('custom', () => {
    const {styles} = theme.style(
      {
        px: 20,
      },
      [],
    )

    expect(styles).toEqual({
      paddingLeft: 20,
      paddingRight: 20,
    })
  })

  test('undefined values', () => {
    const {styles} = theme.style(
      {
        px: undefined,
      },
      [],
    )

    expect(styles).toEqual({})
  })
})

describe('tokens', () => {
  test('match', () => {
    const {styles} = theme.style(
      {
        color: 'theme',
        paddingTop: 's',
      },
      [],
    )

    expect(styles).toEqual({
      color: 'tomato',
      paddingTop: 4,
    })
  })

  test('no match', () => {
    const {styles} = theme.style(
      {
        color: 'blue',
        paddingTop: 20,
      },
      [],
    )

    expect(styles).toEqual({
      color: 'blue',
      paddingTop: 20,
    })
  })
})

describe('macros', () => {
  test('truthy', () => {
    const {styles} = theme.style(
      {
        caps: true,
      },
      [],
    )

    expect(styles).toEqual({
      textTransform: 'uppercase',
    })
  })

  test('falsy', () => {
    const {styles} = theme.style(
      {
        caps: false,
      },
      [],
    )

    expect(styles).toEqual({})
  })
})

describe('breakpoints', () => {
  test('applies', () => {
    const {styles} = theme.style(
      {
        paddingTop: 's',
        gtPhone: {
          paddingTop: 'm',
        },
      },
      ['gtPhone'],
    )

    expect(styles).toEqual({
      paddingTop: 8,
    })
  })

  test('not applies', () => {
    const {styles} = theme.style(
      {
        paddingTop: 's',
        gtPhone: {
          paddingTop: 'm',
        },
      },
      [],
    )

    expect(styles).toEqual({
      paddingTop: 4,
    })
  })

  test('applies in order, asc', () => {
    const {styles} = theme.style(
      {
        paddingTop: 's',
        gtPhone: {
          paddingTop: 'm',
        },
        gtTablet: {
          paddingTop: 'l',
        },
      },
      ['gtTablet', 'gtPhone'],
    )

    expect(styles).toEqual({
      paddingTop: 16,
    })
  })

  test('applies in order even if defined in reverse', () => {
    const theme = createTheme({
      tokens: {
        space: {
          s: 4,
        },
      },
      breakpoints: {
        // reverse order
        gtTablet: 1024,
        gtPhone: 640,
      },
    })

    const {styles} = theme.style(
      {
        paddingTop: 20,
        gtTablet: {
          paddingTop: 30,
        },
        gtPhone: {
          paddingTop: 25,
        },
      },
      ['gtTablet', 'gtPhone'],
    )

    expect(styles).toEqual({
      paddingTop: 30,
    })
  })
})

describe('utils', () => {
  test('getActiveBreakpoints', () => {
    const breakpoints = theme.getActiveBreakpoints({width: 1000})
    expect(breakpoints).toEqual({
      current: 'gtPhone',
      active: ['gtPhone'],
    })
  })
})

describe('types', () => {
  const theme = createTheme({
    tokens: {
      space: {
        s: 4,
      },
      color: {
        theme: 'tomato',
      },
    },
    properties: {
      px: ['paddingLeft', 'paddingRight'],
    },
    macros: {
      caps: (_: boolean) => ({textTransform: 'uppercase'}),
    },
    breakpoints: {
      gtPhone: 640,
    },
  })

  test('style', () => {
    theme.style(
      {
        // @ts-expect-error
        color: false,
        px: 20,
        // @ts-expect-error
        caps: 1,
      },
      [],
    )

    theme.style(
      {},
      // @ts-expect-error
      ['taco'],
    )
  })
})
