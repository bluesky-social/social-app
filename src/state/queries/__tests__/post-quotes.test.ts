import {describe, expect, it, jest} from '@jest/globals'

import {buildGetQuotesParams, RQKEY} from '#/state/queries/post-quotes'

jest.mock('#/state/session', () => ({
  useAppviewClient: jest.fn(),
}))
jest.mock('#/analytics', () => ({
  useAnalytics: jest.fn(),
}))

const uri = 'at://did:plc:alice/app.bsky.feed.post/3abc'

describe('buildGetQuotesParams', () => {
  it('omits the sort key when sort is unset', () => {
    const params = buildGetQuotesParams({uri})
    expect('sort' in params).toBe(false)
    expect(params).toEqual({uri, limit: 30, cursor: undefined})
  })

  it('includes sort when set', () => {
    expect(buildGetQuotesParams({uri, sort: 'top'})).toMatchObject({
      sort: 'top',
    })
    expect(buildGetQuotesParams({uri, sort: 'latest'})).toMatchObject({
      sort: 'latest',
    })
  })

  it('passes cursor and limit through', () => {
    expect(buildGetQuotesParams({uri, cursor: 'abc', sort: 'top'})).toEqual({
      uri,
      limit: 30,
      cursor: 'abc',
      sort: 'top',
    })
  })
})

describe('RQKEY', () => {
  it('includes the sort so toggling fetches a fresh list', () => {
    expect(RQKEY(uri, 'top')).not.toEqual(RQKEY(uri, 'latest'))
  })

  it('defaults to latest', () => {
    expect(RQKEY(uri)).toEqual(RQKEY(uri, 'latest'))
    expect(RQKEY(uri)).toEqual(['post-quotes', uri, 'latest'])
  })
})
