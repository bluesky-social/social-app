import {type UriString} from '@atproto/syntax'

import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {getEmbedCreator, withCreator} from './at-card'

const uri = 'https://example.attie.site/' as UriString
const did = 'did:plc:4hodhjl2kposuchzvpiviwps'
const external = {uri, title: 'Site', description: ''}
const embed = {
  $type: 'app.bsky.embed.external',
  external: withCreator(external, did),
}

it('retains the creator through post validation and JSON round-trip', () => {
  const record = bsky.parse(app.bsky.feed.post, {
    $type: 'app.bsky.feed.post',
    text: uri,
    createdAt: '2026-09-23T00:00:00.000Z',
    embed,
  })
  expect(getEmbedCreator(JSON.parse(JSON.stringify(record)), uri)).toBe(did)
})

it('reads the creator from quote-post media rather than the quoted record', () => {
  expect(
    getEmbedCreator(
      {
        embed: {
          $type: 'app.bsky.embed.recordWithMedia',
          record: {creator: 'did:plc:other'},
          media: embed,
        },
      },
      uri,
    ),
  ).toBe(did)
})

it('does not borrow attribution from a different URL', () => {
  expect(getEmbedCreator({embed}, 'https://other.attie.site/')).toBeUndefined()
})

it.each([
  undefined,
  null,
  {},
  {embed: null},
  {embed: {external}},
  {
    embed: {
      $type: 'app.bsky.embed.external',
      external: {...external, creator: 'not-a-did'},
    },
  },
  {embed: {$type: 'app.bsky.embed.external', external}},
])(
  'handles old and malformed records without guessing an author: %p',
  record => {
    expect(getEmbedCreator(record, uri)).toBeUndefined()
  },
)

it.each([undefined, 'not-a-did', 'at://did:plc:abc'])(
  'does not persist invalid creator %p',
  creator => {
    expect(withCreator(external, creator)).not.toHaveProperty('creator')
  },
)
