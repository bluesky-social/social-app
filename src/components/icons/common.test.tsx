import {render, renderHook, screen} from '@testing-library/react-native'

import {type Props, useCommonSVGProps} from '#/components/icons/common'
import {
  createMultiPathSVG,
  createSinglePathSVG,
  createSVG,
} from '#/components/icons/TEMPLATE'

jest.mock('#/alf', () => ({
  tokens: {gradients: {}},
  useTheme: () => ({palette: {primary_500: '#0085ff'}}),
}))
jest.mock('#/components/icons/nano', () => ({
  withNanoGlyph: (Icon: unknown) => Icon,
}))
jest.mock('react-native-svg', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    __esModule: true,
    default: View,
    Path: () => null,
    Circle: () => null,
    Rect: () => null,
  }
})

const wideViewBox = '0 0 24 7'

it.each<[string, Props, number, number]>([
  ['default width', {}, 20, (20 * 7) / 24],
  ['explicit width', {width: 48}, 48, 14],
  ['explicit height', {height: 14}, 48, 14],
  ['explicit pair', {width: 48, height: 21}, 48, 21],
  ['size token', {size: 'lg'}, 24, 7],
  ['size precedence', {size: 'lg', width: 48, height: 21}, 24, 7],
  ['numeric string', {height: '14'}, 48, 14],
  ['zero width', {width: 0}, 0, 0],
  ['zero height', {height: 0}, 0, 0],
])('resolves %s relative to the viewBox', (_name, props, width, height) => {
  const {result} = renderHook(() => useCommonSVGProps(props, wideViewBox))
  expect(result.current.width).toBeCloseTo(width)
  expect(result.current.height).toBeCloseTo(height)
  expect(result.current.viewBox).toBe(wideViewBox)
})

it('keeps square defaults and respects a caller viewBox over the factory default', () => {
  const {result, rerender} = renderHook(
    (props: Props) => useCommonSVGProps(props),
    {initialProps: {}},
  )
  expect(result.current).toMatchObject({width: 20, height: 20})

  rerender({viewBox: '-10, -20, 12, 24', height: 48})
  expect(result.current).toMatchObject({width: 24, height: 48})
})

it.each(['0 0 0 24', '0 0 24 -1', '0 0 24', '0 0 invalid 24'])(
  'uses a square ratio for invalid bounds: %s',
  viewBox => {
    const {result} = renderHook(() => useCommonSVGProps({viewBox, width: 32}))
    expect(result.current).toMatchObject({width: 32, height: 32})
  },
)

const factories = [
  [
    'single path',
    createSinglePathSVG({path: 'M0 0h24v7H0z', viewBox: wideViewBox}),
  ],
  [
    'multiple paths',
    createMultiPathSVG({paths: ['M0 0h24v7H0z'], viewBox: wideViewBox}),
  ],
  [
    'generated elements',
    createSVG({
      elements: [{type: 'path', d: 'M0 0h24v7H0z'}],
      viewBox: wideViewBox,
    }),
  ],
] as const

it.each(factories)('renders resolved SVG dimensions for %s', (_name, Icon) => {
  const {rerender} = render(<Icon testID="icon" width={48} />)
  expect(screen.getByTestId('icon').props).toMatchObject({
    width: 48,
    height: 14,
    viewBox: wideViewBox,
  })
  expect(screen.getByTestId('icon').props.size).toBeUndefined()

  rerender(<Icon testID="icon" height={21} />)
  expect(screen.getByTestId('icon').props).toMatchObject({
    width: 72,
    height: 21,
  })

  rerender(<Icon testID="icon" height={21} viewBox="0 0 24 12" />)
  expect(screen.getByTestId('icon').props).toMatchObject({
    width: 42,
    height: 21,
    viewBox: '0 0 24 12',
  })
})
