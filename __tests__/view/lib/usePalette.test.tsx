import {renderHook} from '../../../jest/test-utils'
import {usePalette} from '../../../src/view/lib/hooks/usePalette'

describe('usePalette', () => {
  it('returns the correct palette colors and styles for a given color name', () => {
    const {result} = renderHook(() => usePalette('primary'))
    expect(result.current).toEqual({
      colors: {
        background: '#0085ff',
        backgroundLight: '#52acfe',
        border: '#0062bd',
        icon: '#0062bd',
        text: '#ffffff',
        textLight: '#bfe1ff',
        textInverted: '#0085ff',
        link: '#bfe1ff',
      },
      view: {
        backgroundColor: '#0085ff',
      },
      btn: {
        backgroundColor: '#52acfe',
      },
      border: {
        borderColor: '#0062bd',
      },
      text: {
        color: '#ffffff',
      },
      textLight: {
        color: '#bfe1ff',
      },
      textInverted: {
        color: '#0085ff',
      },
      link: {
        color: '#bfe1ff',
      },
    })
  })
})
