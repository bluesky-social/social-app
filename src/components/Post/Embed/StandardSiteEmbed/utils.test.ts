import {type AppBskyEmbedExternal} from '@atproto/api'

import {isStandardSiteEmbed, isStandardSitePublicationEmbed} from './utils'

function makeView(
  partial: Record<string, unknown>,
): AppBskyEmbedExternal.ViewExternal {
  return {
    uri: 'https://example.com/post',
    title: 'title',
    description: 'description',
    ...partial,
  }
}

describe('isStandardSiteEmbed', () => {
  it('returns true when any associated ref is in the site.standard.* namespace', () => {
    const view = makeView({
      associatedRefs: [{uri: 'at://did:plc:abc/site.standard.publication/foo'}],
    })
    expect(isStandardSiteEmbed(view)).toBe(true)
  })

  it('returns false when no associated refs are in the site.standard.* namespace', () => {
    const view = makeView({
      associatedRefs: [{uri: 'at://did:plc:abc/app.bsky.feed.post/foo'}],
    })
    expect(isStandardSiteEmbed(view)).toBe(false)
  })

  it('returns falsy when associatedRefs is missing', () => {
    expect(isStandardSiteEmbed(makeView({}))).toBeFalsy()
  })
})

describe('isStandardSitePublicationEmbed', () => {
  it('returns true with at least one publication ref and no document refs', () => {
    const view = makeView({
      associatedRefs: [{uri: 'at://did:plc:abc/site.standard.publication/foo'}],
    })
    expect(isStandardSitePublicationEmbed(view)).toBe(true)
  })

  it('returns false when any ref is a document', () => {
    const view = makeView({
      associatedRefs: [
        {uri: 'at://did:plc:abc/site.standard.publication/foo'},
        {uri: 'at://did:plc:abc/site.standard.document/bar'},
      ],
    })
    expect(isStandardSitePublicationEmbed(view)).toBe(false)
  })

  it('returns false when there are no publication refs', () => {
    const view = makeView({
      associatedRefs: [{uri: 'at://did:plc:abc/site.standard.other/foo'}],
    })
    expect(isStandardSitePublicationEmbed(view)).toBe(false)
  })

  it('returns falsy for an empty associatedRefs array', () => {
    expect(isStandardSitePublicationEmbed(makeView({associatedRefs: []}))).toBe(
      false,
    )
  })

  it('returns falsy when associatedRefs is missing', () => {
    expect(isStandardSitePublicationEmbed(makeView({}))).toBeFalsy()
  })
})
