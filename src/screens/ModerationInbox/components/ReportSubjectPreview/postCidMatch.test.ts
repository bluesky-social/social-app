import {jsonToLex} from '@atproto/lex'

import {type app} from '#/lexicons'
import {postCidMatch} from './postCidMatch'

jest.unmock('multiformats/cid')

// CIDs generated from the strings "example post", "example image", and
// "example other"; they do not reference real records or blobs.
const POST_CID = 'bafyreif5n5m2ol4zppdwjwfcq36xsoqoxn2k2bnaineijucvhkpmh6of2q'
const IMAGE_CID = 'bafkreianqx226hqn7ievapyl3mlzvohtprbclnb5iqvdvepftq6ijg6jty'
const OTHER_CID = 'bafkreididtw63y3m2jzoh6yp4uinvvqhel5ruvoruvr4d4wkrwvfjn4tnu'

const blob = (cid: string, mimeType = 'image/jpeg') => ({
  $type: 'blob',
  ref: {$link: cid},
  mimeType,
  size: 123,
})

const images = {
  $type: 'app.bsky.embed.images',
  images: [
    {image: blob(OTHER_CID), alt: ''},
    {image: blob(IMAGE_CID), alt: ''},
  ],
}
const video = {
  $type: 'app.bsky.embed.video',
  video: blob(IMAGE_CID, 'video/mp4'),
  captions: [{lang: 'en', file: blob(OTHER_CID, 'text/vtt')}],
}
const gallery = {
  $type: 'app.bsky.embed.gallery',
  items: [
    {
      $type: 'app.bsky.embed.gallery#image',
      image: blob(IMAGE_CID),
      alt: '',
      aspectRatio: {width: 1, height: 1},
    },
  ],
}
const external = {
  $type: 'app.bsky.embed.external',
  external: {
    uri: 'https://example.com/',
    title: 'Example',
    description: '',
    thumb: blob(IMAGE_CID),
  },
}
const quote = {
  $type: 'app.bsky.embed.record',
  record: {
    uri: 'at://did:plc:abcdefghijklmnopqrstuvwx/app.bsky.feed.post/3k2',
    cid: OTHER_CID,
  },
}
const withQuote = (media: unknown) => ({
  $type: 'app.bsky.embed.recordWithMedia',
  record: quote,
  media,
})
const post = (embed?: unknown) =>
  ({
    cid: POST_CID,
    record: jsonToLex({
      $type: 'app.bsky.feed.post',
      text: 'Current text',
      createdAt: '2026-01-01T00:00:00.000Z',
      ...(embed ? {embed} : {}),
    }),
  }) as Pick<app.bsky.feed.defs.PostView, 'cid' | 'record'>

describe('postCidMatch', () => {
  it('accepts the post record CID', () => {
    expect(postCidMatch(post(), POST_CID)).toBe('record')
  })

  it.each([
    ['images', images],
    ['video', video],
    ['gallery', gallery],
    ['external thumbnail', external],
    ['quoted post with images', withQuote(images)],
    ['quoted post with video', withQuote(video)],
    ['quoted post with gallery', withQuote(gallery)],
    ['quoted post with external thumbnail', withQuote(external)],
  ])('matches a blob in %s', (_name, embed) => {
    expect(postCidMatch(post(embed), IMAGE_CID)).toBe('embed')
  })

  it('matches a video caption blob', () => {
    expect(postCidMatch(post(video), OTHER_CID)).toBe('embed')
  })

  it('supports legacy image blob references', () => {
    const legacy = {
      $type: 'app.bsky.embed.images',
      images: [{image: {cid: IMAGE_CID, mimeType: 'image/jpeg'}, alt: ''}],
    }
    expect(postCidMatch(post(legacy), IMAGE_CID)).toBe('embed')
  })

  it('does not treat a quoted record CID as the current post', () => {
    expect(postCidMatch(post(quote), OTHER_CID)).toBeUndefined()
    expect(postCidMatch(post(withQuote(video)), POST_CID)).toBe('record')
    expect(postCidMatch(post(withQuote(external)), OTHER_CID)).toBeUndefined()
  })

  it('rejects unrelated, absent, and malformed embeds', () => {
    expect(postCidMatch(post(images), 'unrelated')).toBeUndefined()
    expect(postCidMatch(post(), IMAGE_CID)).toBeUndefined()
    expect(
      postCidMatch(post({$type: 'app.bsky.embed.images'}), IMAGE_CID),
    ).toBeUndefined()
    expect(
      postCidMatch(post({$type: 'example.unknown', cid: IMAGE_CID}), IMAGE_CID),
    ).toBeUndefined()
  })
})
