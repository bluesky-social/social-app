import React from 'react'
import type {ViewProps} from 'react-native'
import TestRenderer from 'react-test-renderer'
import {jest, test, expect} from '@jest/globals'

import {createTheme} from '../theme'
import {createSystem} from '../system'

jest.mock('react-native', () => ({
  Dimensions: {
    get: () => ({width: 0, height: 0}),
    addEventListener() {},
  },
  StyleSheet: {
    create(style: any) {
      return style
    },
  },
}))

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

const {ThemeProvider, useTheme, useStyle, useStyles, styled} = createSystem({
  theme,
})

function Root(props: React.PropsWithChildren<{}>) {
  return <ThemeProvider theme="theme">{props.children}</ThemeProvider>
}

test('useTheme', () => {
  function Component() {
    const theme = useTheme()
    return <>{JSON.stringify(theme)}</>
  }

  const dom = TestRenderer.create(
    <Root>
      <Component />
    </Root>,
  )
  const json = JSON.parse(dom.toJSON() as unknown as string)

  expect(json.themeName).toEqual('theme')
  expect(json.theme).toBeTruthy()
  expect(Object.keys(json.themes)).toEqual(['theme'])
})

test('useStyle', () => {
  function Component() {
    const style = useStyle({color: 'red'})
    return <>{JSON.stringify(style)}</>
  }

  const dom = TestRenderer.create(
    <Root>
      <Component />
    </Root>,
  )
  const json = JSON.parse(dom.toJSON() as unknown as string)

  expect(json.color).toEqual('red')
})

test('useStyles', () => {
  function Component() {
    const {text} = useStyles({
      text: {color: 'red'},
    })
    return <>{JSON.stringify(text)}</>
  }

  const dom = TestRenderer.create(
    <Root>
      <Component />
    </Root>,
  )
  const json = JSON.parse(dom.toJSON() as unknown as string)

  expect(json.color).toEqual('red')
})

test('styled', () => {
  function Component(props: ViewProps) {
    return <>{JSON.stringify(props)}</>
  }
  const Box = styled(Component, {
    color: 'theme',
  })

  const dom = TestRenderer.create(
    <Root>
      <Box color="red" id="foo" style={{padding: 10}} />
    </Root>,
  )
  const json = JSON.parse(dom.toJSON() as unknown as string)

  expect(json.style).toEqual([{color: 'red'}, {padding: 10}])
  expect(json.id).toEqual('foo')
})

test('types', () => {
  function Component(props: ViewProps & {foo: boolean}) {
    // @ts-expect-error
    const {foo} = useStyles({
      text: {color: 'red'},
    })
    // just need a way to use `foo`
    return <React.Fragment key={foo}>{JSON.stringify(props)}</React.Fragment>
  }
  const Box = styled(Component, {
    id: true,
    // @ts-expect-error
    color: true,
  })

  TestRenderer.create(
    <Root>
      {/* @ts-expect-error */}
      <Box color="red" id="foo" style={{padding: 10}}>
        <Component foo />
      </Box>
    </Root>,
  )
})
