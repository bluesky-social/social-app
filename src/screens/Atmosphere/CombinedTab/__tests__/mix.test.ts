import {type ActivityRow} from '#/screens/Atmosphere/ActivityTab/rows'
import {type ForYouItem} from '#/screens/Atmosphere/ForYouTab/useAtmosphereRecommendedActivityQuery'
import {type CombinedRow, mixCombinedPages, seededRandom} from '../mix'

const activity = (uri: string) =>
  ({
    kind: 'card',
    key: uri,
    content: {type: 'article', view: {uri}},
  }) as unknown as ActivityRow

const recommendation = (uri: string) =>
  ({reqId: 'req', content: {type: 'article', view: {uri}}}) as ForYouItem

const describeRows = (rows: CombinedRow[]) =>
  rows.map(row => {
    switch (row.kind) {
      case 'activity':
        return row.row.key
      case 'recommended':
        return `${row.eyebrow ? 'mixed' : 'tail'}:${row.item.content.view.uri}`
      case 'recommendedHeader':
        return row.caughtUp ? 'header:caughtUp' : 'header'
      case 'interstitial':
        return `interstitial:${row.interstitial.key}`
    }
  })

const recommendations = ['r1', 'r2', 'r3', 'r4'].map(recommendation)
/** Always the shortest gap, 3 activity rows. */
const random = () => 0

describe('mixCombinedPages', () => {
  it('mixes recommendations into activity, skipping ones already shown', () => {
    const {pages} = mixCombinedPages({
      activityPages: [['a1', 'a2', 'r2', 'a3', 'a4', 'a5', 'a6'].map(activity)],
      recommendations,
      isLastPage: false,
      random,
    })
    expect(describeRows(pages[0])).toEqual([
      'a1',
      'a2',
      'r2',
      'mixed:r1',
      'a3',
      'a4',
      'a5',
      'mixed:r3',
      'a6',
    ])
  })

  it('keeps earlier pages unchanged when another page loads', () => {
    const first = [['a1', 'a2', 'a3', 'a4'].map(activity)]
    const before = mixCombinedPages({
      activityPages: first,
      recommendations,
      isLastPage: false,
      random,
    })
    const after = mixCombinedPages({
      activityPages: [...first, ['a5', 'a6', 'a7'].map(activity)],
      recommendations,
      isLastPage: false,
      random,
    })
    expect(after.pages[0]).toEqual(before.pages[0])
    expect(describeRows(after.pages[1])).toEqual(['a5', 'a6', 'mixed:r2', 'a7'])
  })

  it('follows the end of activity with the remaining recommendations', () => {
    const {pages, recommendedItems} = mixCombinedPages({
      activityPages: [['a1', 'a2', 'a3', 'a4'].map(activity)],
      recommendations,
      isLastPage: true,
      random,
    })
    expect(describeRows(pages[0])).toEqual([
      'a1',
      'a2',
      'a3',
      'mixed:r1',
      'a4',
      'header:caughtUp',
      'tail:r2',
      'tail:r3',
      'tail:r4',
    ])
    expect(recommendedItems).toEqual(recommendations)
  })

  it('shows only recommendations without activity', () => {
    const {pages} = mixCombinedPages({
      activityPages: [[]],
      recommendations: recommendations.slice(0, 2),
      isLastPage: true,
      random,
    })
    expect(describeRows(pages[0])).toEqual(['header', 'tail:r1', 'tail:r2'])
  })

  it('places interstitials at fixed slots', () => {
    const {pages} = mixCombinedPages({
      activityPages: [['a1', 'a2', 'a3', 'a4'].map(activity)],
      recommendations: [],
      interstitials: [{key: 'photos', type: 'popularPhotos'}],
      isLastPage: false,
      random,
    })
    expect(describeRows(pages[0])).toEqual([
      'a1',
      'a2',
      'a3',
      'interstitial:photos',
      'a4',
    ])
  })

  it('spaces recommendations 3 to 10 activity rows apart, repeatably', () => {
    const mix = () =>
      mixCombinedPages({
        activityPages: [Array.from({length: 200}, (_, i) => activity(`a${i}`))],
        recommendations: Array.from({length: 40}, (_, i) =>
          recommendation(`r${i}`),
        ),
        isLastPage: false,
        random: seededRandom('req'),
      }).pages[0]
    const rows = mix()
    const gaps: number[] = []
    let run = 0
    for (const row of rows) {
      if (row.kind === 'activity') run++
      else if (row.kind === 'recommended') {
        gaps.push(run)
        run = 0
      }
    }
    expect(gaps.length).toBeGreaterThan(15)
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(3)
    expect(Math.max(...gaps)).toBeLessThanOrEqual(10)
    expect(new Set(gaps).size).toBeGreaterThan(3)
    expect(mix()).toEqual(rows)
  })
})
