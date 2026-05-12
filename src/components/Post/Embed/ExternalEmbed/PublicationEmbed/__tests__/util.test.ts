import {parseDidFromAtUri} from '#/components/Post/Embed/ExternalEmbed/PublicationEmbed/util'

describe('parseDidFromAtUri', () => {
  it('extracts a plc DID from a publication at-uri', () => {
    expect(
      parseDidFromAtUri('at://did:plc:abc123/site.standard.publication/3jx'),
    ).toBe('did:plc:abc123')
  })

  it('extracts a web DID', () => {
    expect(
      parseDidFromAtUri(
        'at://did:web:example.com/site.standard.publication/3jx',
      ),
    ).toBe('did:web:example.com')
  })

  it('returns undefined for non-at-uri strings', () => {
    expect(parseDidFromAtUri('https://example.com')).toBeUndefined()
  })

  it('returns undefined for empty / nullish input', () => {
    expect(parseDidFromAtUri('')).toBeUndefined()
    expect(parseDidFromAtUri(undefined)).toBeUndefined()
  })

  it('returns undefined when the authority is not a DID', () => {
    expect(
      parseDidFromAtUri('at://alice.bsky.social/site.standard.publication/3jx'),
    ).toBeUndefined()
  })
})
