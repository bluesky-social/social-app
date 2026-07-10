import {planParts} from './planParts'

describe('planParts', () => {
  it('splits an evenly divisible size into full parts', () => {
    expect(planParts(20, 10)).toEqual([
      {partNumber: 1, offset: 0, size: 10},
      {partNumber: 2, offset: 10, size: 10},
    ])
  })

  it('puts the remainder in the last part', () => {
    expect(planParts(25, 10)).toEqual([
      {partNumber: 1, offset: 0, size: 10},
      {partNumber: 2, offset: 10, size: 10},
      {partNumber: 3, offset: 20, size: 5},
    ])
  })

  it('returns a single part when the file is smaller than a part', () => {
    expect(planParts(5, 10)).toEqual([{partNumber: 1, offset: 0, size: 5}])
  })

  it('returns no parts for a non-positive size', () => {
    expect(planParts(0, 10)).toEqual([])
  })

  it('covers the whole file with no gaps or overlaps', () => {
    const parts = planParts(1000, 128)
    expect(parts[0].offset).toBe(0)
    for (let i = 1; i < parts.length; i++) {
      expect(parts[i].offset).toBe(parts[i - 1].offset + parts[i - 1].size)
    }
    const last = parts[parts.length - 1]
    expect(last.offset + last.size).toBe(1000)
  })

  it('throws for a non-positive part size', () => {
    expect(() => planParts(100, 0)).toThrow()
  })
})
