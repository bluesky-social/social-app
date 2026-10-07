// the global mock stubs out CID parsing, which the icon fixture needs
jest.unmock('multiformats/cid')

import {parseCid} from '@atproto/lex'
import {describe, expect, it, jest} from '@jest/globals'

import {
  parseProfileRecordLinks,
  truncateTitle,
  withProfileRecordLinks,
} from './record'

const icon = {
  $type: 'blob' as const,
  ref: parseCid('bafkreibq3lmclwphfiidatqr3jkvwrrxpcj3k27kb2zyx4gd4wngevqmta'),
  mimeType: 'image/png',
  size: 1024,
}

describe('parseProfileRecordLinks', () => {
  it('reads links and the Germ position', () => {
    expect(
      parseProfileRecordLinks({
        displayName: 'Kat',
        betaLinks: [
          {uri: 'https://ko-fi.com/kat', title: 'Tip jar'},
          {uri: 'https://example.com'},
        ],
        betaLinksGermIndex: 1,
      }),
    ).toEqual({
      links: [
        {url: 'https://ko-fi.com/kat', title: 'Tip jar'},
        {url: 'https://example.com'},
      ],
      germIndex: 1,
    })
  })

  it('returns nothing for records without links', () => {
    expect(parseProfileRecordLinks({displayName: 'Kat'})).toEqual({
      links: [],
      germIndex: 0,
    })
    expect(parseProfileRecordLinks(undefined)).toEqual({
      links: [],
      germIndex: 0,
    })
  })

  it('skips entries that are not usable links', () => {
    const {links} = parseProfileRecordLinks({
      betaLinks: [
        'not an object',
        {uri: 42},
        {uri: 'javascript:alert(1)'},
        {uri: 'https://onlyfans.com/kat'},
        {uri: 'https://bit.ly/kat'},
        {uri: 'https://example.com'},
        {uri: 'https://example.com/'},
        {uri: 'ok.example'},
      ],
    })
    expect(links).toEqual([
      {url: 'https://example.com'},
      {url: 'https://ok.example/'},
    ])
  })

  it('caps the number of links', () => {
    const {links} = parseProfileRecordLinks({
      betaLinks: Array.from({length: 15}, (_, i) => ({
        uri: `https://example.com/${i}`,
      })),
    })
    expect(links).toHaveLength(10)
  })

  it('reads stored icons, skipping ones that are not images', () => {
    const {links} = parseProfileRecordLinks({
      betaLinks: [
        {uri: 'https://a.example', icon},
        {uri: 'https://b.example', icon: {...icon, mimeType: 'text/html'}},
        {uri: 'https://c.example', icon: 'not a blob'},
      ],
    })
    expect(links).toEqual([
      {url: 'https://a.example', icon},
      {url: 'https://b.example'},
      {url: 'https://c.example'},
    ])
  })

  it('ignores an invalid Germ position', () => {
    expect(parseProfileRecordLinks({betaLinksGermIndex: -1}).germIndex).toBe(0)
    expect(parseProfileRecordLinks({betaLinksGermIndex: 1.5}).germIndex).toBe(0)
  })
})

describe('truncateTitle', () => {
  it('cuts long titles to the limit', () => {
    expect(truncateTitle('x'.repeat(40))).toBe('x'.repeat(30))
  })

  it('never splits an emoji', () => {
    const title = 'x'.repeat(29) + '🛍️🛍️'
    expect(truncateTitle(title)).toBe('x'.repeat(29) + '🛍️')
  })
})

describe('withProfileRecordLinks', () => {
  it('writes links while keeping the rest of the record', () => {
    expect(
      withProfileRecordLinks(
        {displayName: 'Kat', description: 'Hi'},
        {
          links: [
            {url: 'https://ko-fi.com/kat', title: 'Tip jar'},
            {url: 'https://example.com/'},
          ],
          germIndex: 1,
        },
      ),
    ).toEqual({
      displayName: 'Kat',
      description: 'Hi',
      betaLinks: [
        {uri: 'https://ko-fi.com/kat', title: 'Tip jar'},
        {uri: 'https://example.com/'},
      ],
      betaLinksGermIndex: 1,
    })
  })

  it('removes the fields when there are no links', () => {
    expect(
      withProfileRecordLinks(
        {
          displayName: 'Kat',
          betaLinks: [{uri: 'https://example.com/'}],
          betaLinksGermIndex: 1,
        },
        {links: [], germIndex: 0},
      ),
    ).toEqual({displayName: 'Kat'})
  })

  it('keeps a stored icon', () => {
    const data = {links: [{url: 'https://example.com/', icon}], germIndex: 0}
    expect(parseProfileRecordLinks(withProfileRecordLinks({}, data))).toEqual(
      data,
    )
  })

  it('round-trips through the parser', () => {
    const data = {
      links: [{url: 'https://ko-fi.com/kat', title: 'Tip jar'}],
      germIndex: 0,
    }
    expect(parseProfileRecordLinks(withProfileRecordLinks({}, data))).toEqual(
      data,
    )
  })
})
