import {type ActivityRow} from '#/screens/Atmosphere/ActivityTab/rows'
import {type ForYouItem} from '#/screens/Atmosphere/ForYouTab/useAtmosphereRecommendedActivityQuery'
import {type CombinedRow, mixCombinedPages} from '../mix'

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

describe('mixCombinedPages', () => {
  it('mixes recommendations into activity, skipping ones already shown', () => {
    const {pages} = mixCombinedPages({
      activityPages: [['a1', 'a2', 'r2', 'a3', 'a4', 'a5'].map(activity)],
      recommendations,
      isLastPage: false,
    })
    expect(describeRows(pages[0])).toEqual([
      'a1',
      'a2',
      'mixed:r1',
      'r2',
      'a3',
      'a4',
      'a5',
      'mixed:r3',
    ])
  })

  it('keeps earlier pages unchanged when another page loads', () => {
    const first = [['a1', 'a2', 'a3'].map(activity)]
    const before = mixCombinedPages({
      activityPages: first,
      recommendations,
      isLastPage: false,
    })
    const after = mixCombinedPages({
      activityPages: [...first, ['a4', 'a5', 'a6'].map(activity)],
      recommendations,
      isLastPage: false,
    })
    expect(after.pages[0]).toEqual(before.pages[0])
    expect(describeRows(after.pages[1])).toEqual(['a4', 'a5', 'a6', 'mixed:r2'])
  })

  it('follows the end of activity with the remaining recommendations', () => {
    const {pages, recommendedItems} = mixCombinedPages({
      activityPages: [['a1', 'a2', 'a3'].map(activity)],
      recommendations,
      isLastPage: true,
    })
    expect(describeRows(pages[0])).toEqual([
      'a1',
      'a2',
      'mixed:r1',
      'a3',
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
    })
    expect(describeRows(pages[0])).toEqual(['header', 'tail:r1', 'tail:r2'])
  })

  it('places interstitials at fixed slots', () => {
    const {pages} = mixCombinedPages({
      activityPages: [['a1', 'a2', 'a3', 'a4'].map(activity)],
      recommendations: [],
      interstitials: [{key: 'photos', type: 'popularPhotos'}],
      isLastPage: false,
    })
    expect(describeRows(pages[0])).toEqual([
      'a1',
      'a2',
      'a3',
      'interstitial:photos',
      'a4',
    ])
  })
})
