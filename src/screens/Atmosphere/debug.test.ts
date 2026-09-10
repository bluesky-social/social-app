import {hasAtmosphereDebugParam} from './debug'

describe('Atmosphere debug mode', () => {
  it('requires the debug URL parameter', () => {
    expect(hasAtmosphereDebugParam('?debug')).toBe(true)
    expect(hasAtmosphereDebugParam('?before=one&debug&after=two')).toBe(true)
    expect(hasAtmosphereDebugParam('?before=one')).toBe(false)
    expect(hasAtmosphereDebugParam('')).toBe(false)
  })
})
