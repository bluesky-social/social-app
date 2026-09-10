import {hasActivityV2DebugParam} from './debug'

describe('ActivityV2 debug mode', () => {
  it('requires the debug URL parameter', () => {
    expect(hasActivityV2DebugParam('?debug')).toBe(true)
    expect(hasActivityV2DebugParam('?before=one&debug&after=two')).toBe(true)
    expect(hasActivityV2DebugParam('?before=one')).toBe(false)
    expect(hasActivityV2DebugParam('')).toBe(false)
  })
})
