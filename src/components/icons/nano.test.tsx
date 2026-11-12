import {act, render, screen} from '@testing-library/react-native'

import {glyphMaps} from '#/components/icons/glyphMaps'
import {createSinglePathSVG} from '#/components/icons/TEMPLATE'

type IntegrityListener = (
  issue: {family: string; fontFamily: string},
  status: 'found' | 'resolved',
) => void

let mockIntegrityListener: IntegrityListener | undefined

jest.mock('#/alf', () => ({
  tokens: {gradients: {}},
  useTheme: () => ({palette: {primary_500: '#0085ff'}}),
}))
jest.mock('react-native-nano-icons', () => {
  const {createElement} = jest.requireActual<typeof import('react')>('react')
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    createNanoIconSet: () =>
      function MockNanoIcon({name}: {name: string}) {
        return createElement(Text, null, `glyph:${name}`)
      },
    addFontIntegrityListener: (listener: IntegrityListener) => {
      mockIntegrityListener = listener
      return () => {}
    },
  }
})

const glyph = 'Accessibility_Stroke2_Corner2_Rounded'
const Icon = createSinglePathSVG({path: 'M0 0h24v24H0z', glyph})

/*
 * Icons are hidden from screen readers, so every query has to opt into hidden
 * elements.
 */
const hidden = {includeHiddenElements: true}

function reportFont(family: string, status: 'found' | 'resolved') {
  act(() => {
    mockIntegrityListener!({family, fontFamily: 'icons-test'}, status)
  })
}

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('withNanoGlyph', () => {
  it('renders the SVG icon while its font is missing from the binary', () => {
    render(<Icon testID="icon" />)
    expect(screen.getByText(`glyph:${glyph}`, hidden)).toBeTruthy()

    reportFont(glyphMaps.ui.m.f, 'found')
    expect(screen.queryByText(`glyph:${glyph}`, hidden)).toBeNull()
    expect(screen.getByTestId('icon', hidden)).toBeTruthy()
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('render with react-native-svg'),
    )

    reportFont(glyphMaps.ui.m.f, 'resolved')
    expect(screen.getByText(`glyph:${glyph}`, hidden)).toBeTruthy()
  })

  it('keeps the glyph when a different font is missing', () => {
    render(<Icon />)

    reportFont(glyphMaps.brands.m.f, 'found')
    expect(screen.getByText(`glyph:${glyph}`, hidden)).toBeTruthy()

    reportFont(glyphMaps.brands.m.f, 'resolved')
  })
})
