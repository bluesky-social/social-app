import {formatTime} from '../formatTime'

describe('formatTime', () => {
  it('formats seconds as minutes and seconds', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(65)).toBe('1:05')
  })

  it('rounds fractional seconds', () => {
    expect(formatTime(12.5)).toBe('0:13')
  })

  it('handles an unknown duration', () => {
    expect(formatTime(NaN)).toBe('--')
  })
})
