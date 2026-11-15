import {createProgressAggregator} from './aggregateProgress'

describe('createProgressAggregator', () => {
  it('sums bytes across parts against the total', () => {
    const progress: number[] = []
    const report = createProgressAggregator(100, p => progress.push(p))

    report(1, 50)
    report(2, 25)
    expect(progress).toEqual([0.5, 0.75])
  })

  it('overwrites a part running count rather than adding it', () => {
    const progress: number[] = []
    const report = createProgressAggregator(100, p => progress.push(p))

    report(1, 20)
    report(1, 40)
    expect(progress).toEqual([0.2, 0.4])
  })

  it('clamps to 1', () => {
    const progress: number[] = []
    const report = createProgressAggregator(100, p => progress.push(p))

    report(1, 150)
    expect(progress).toEqual([1])
  })

  it('reports 0 when the total is 0', () => {
    const progress: number[] = []
    const report = createProgressAggregator(0, p => progress.push(p))

    report(1, 10)
    expect(progress).toEqual([0])
  })
})
