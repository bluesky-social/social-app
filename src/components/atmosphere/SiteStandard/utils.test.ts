import {type app, type com, site} from '#/lexicons'
import {
  getPublicationTheme,
  isStandardSiteDocumentUri,
  isStandardSiteEmbed,
  isStandardSitePublicationUri,
} from './utils'

const CID = 'bafyreicl6ujc6ncfktctxxroxognfn7d2fqavvrryoc2lv6m4i6hpbkfti'

function ref(collection: string): com.atproto.repo.strongRef.Main {
  return {uri: `at://did:plc:abc/${collection}/foo`, cid: CID}
}

function makeArticle(
  partial: Partial<app.bsky.embed.external.ViewArticle> = {},
): app.bsky.embed.external.ViewArticle {
  return {
    uri: 'https://example.com/post',
    title: 'title',
    description: 'description',
    ...partial,
  }
}

describe('isStandardSiteEmbed', () => {
  it('returns true when any associated ref is in the site.standard namespace', () => {
    expect(
      isStandardSiteEmbed(
        makeArticle({
          associatedRefs: [ref(site.standard.publication.$type)],
        }),
      ),
    ).toBe(true)
  })

  it('returns false for unrelated associated refs', () => {
    expect(
      isStandardSiteEmbed(
        makeArticle({associatedRefs: [ref('app.bsky.feed.post')]}),
      ),
    ).toBe(false)
  })

  it('returns falsy when associatedRefs is missing', () => {
    expect(isStandardSiteEmbed(makeArticle())).toBeFalsy()
  })
})

describe('StandardSite record refs', () => {
  it('matches the exact document collection', () => {
    expect(isStandardSiteDocumentUri(ref(site.standard.document.$type))).toBe(
      true,
    )
    expect(
      isStandardSiteDocumentUri(ref(`${site.standard.document.$type}.other`)),
    ).toBe(false)
  })

  it('matches the exact publication collection', () => {
    expect(
      isStandardSitePublicationUri(ref(site.standard.publication.$type)),
    ).toBe(true)
    expect(
      isStandardSitePublicationUri(
        ref(`${site.standard.publication.$type}.other`),
      ),
    ).toBe(false)
  })
})

describe('getPublicationTheme', () => {
  function publication(
    theme?: app.bsky.embed.external.ViewArticlePublicationTheme,
  ): app.bsky.embed.external.ViewArticlePublication {
    return {
      uri: 'https://example.com',
      title: 'Publication',
      description: '',
      theme,
    }
  }

  it('reads and normalizes the new hex colors', () => {
    const theme = {accent: '#123456', accentForeground: '#fff'}
    expect(getPublicationTheme(publication(theme))).toEqual({
      accent: '#123456',
      accentForeground: '#ffffff',
    })
  })

  it('keeps theme colors opaque so the contrast check matches the rendering', () => {
    expect(
      getPublicationTheme(
        publication({accent: '#12345600', accentForeground: '#ffffffff'}),
      ),
    ).toEqual({accent: '#123456', accentForeground: '#ffffff'})
  })

  it.each([
    undefined,
    {},
    {accent: '#123456'},
    {accent: 'invalid', accentForeground: '#ffffff'},
    {accent: '#123456', accentForeground: '#nope'},
  ])('keeps ALF defaults for an absent or invalid pair: %j', theme => {
    expect(getPublicationTheme(publication(theme))).toBeUndefined()
  })
})
