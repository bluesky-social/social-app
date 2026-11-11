import {type l} from '@atproto/lex'

import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {
  getActivityPostView,
  getArticleExternalView,
  getPublicationBodyThemeColors,
  getPublicationExternalView,
} from './externalViews'
import {
  createActivity,
  createArticleView,
  createPostView,
  createPublicationView,
  createSubjectGroup,
  documentUri,
  publicationUri,
  recordCid,
} from './testFixtures'
import {activityCollections} from './types'

jest.unmock('multiformats/cid')

describe('hydrated external views', () => {
  it('retains article metadata, pinned references and supplied profiles without reconstructing records', () => {
    const article = createArticleView({
      readingTime: 7,
      updatedAt: '2026-09-10T11:30:00.000Z',
    })
    const external = getArticleExternalView(createActivity({view: article}))
    expect(external).toMatchObject({
      uri: article.uri,
      thumb: article.image,
      title: article.title,
      description: article.description,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      readingTime: 7,
      source: {
        uri: article.publisher?.uri,
        title: article.publisher?.title,
        icon: article.publisher?.logo,
      },
    })
    expect(external?.associatedRefs).toBe(article.associatedRefs)
    expect(external?.associatedProfiles).toBe(article.associatedProfiles)
    expect(external?.associatedRefs).toEqual([
      {uri: documentUri, cid: recordCid},
    ])
  })

  it('adapts publication hex themes using the shared Explore conversion', () => {
    const publication = createPublicationView({
      theme: {accent: '#123456', accentForeground: '#fedcba'},
    })
    const external = getPublicationExternalView(
      createActivity({
        collection: activityCollections.subscription,
        view: publication,
      }),
    )
    expect(external?.source?.theme).toMatchObject({
      accentRGB: {r: 18, g: 52, b: 86},
      accentForegroundRGB: {r: 254, g: 220, b: 186},
    })
    expect(external?.associatedRefs).toBe(publication.associatedRefs)
    expect(external?.associatedProfiles).toBe(publication.associatedProfiles)
    expect(external?.associatedRefs).toEqual([
      {uri: publicationUri, cid: recordCid},
    ])
    expect(external && getPublicationBodyThemeColors(external)).toEqual({
      custom: true,
      accent: '#123456',
      accentForeground: '#fedcba',
    })
    expect(
      getPublicationBodyThemeColors({
        uri: 'https://example.com',
        title: '',
        description: '',
      }),
    ).toBeUndefined()
  })

  it('uses only the actual post media and preserves the supplied external object', () => {
    const post = createPostView()
    const activity = createActivity({
      collection: activityCollections.share,
      view: post,
    })
    if (!bsky.isType(app.bsky.embed.external.view, post.embed))
      throw new Error('Expected external fixture')
    const embed = post.embed
    expect(getActivityPostView(activity)).toBe(post)
    expect(getArticleExternalView(activity)).toBe(embed.external)
    post.embed = {
      $type: 'app.bsky.embed.recordWithMedia#view',
      media: embed,
      record: {
        $type: 'app.bsky.embed.record#view',
        record: {
          $type: 'app.bsky.embed.record#viewNotFound',
          uri: 'at://did:plc:quoted/app.bsky.feed.post/quote',
          notFound: true,
        },
      },
    }
    expect(getArticleExternalView(activity)).toBe(embed.external)
    post.embed = {...post.embed.record, $type: 'app.bsky.embed.record#view'}
    expect(getArticleExternalView(activity)).toBeUndefined()
  })

  it.each([
    'javascript:alert(1)',
    'ftp://example.com',
    'https://user:password@example.com',
    'not a URL',
  ])('omits unsafe hydrated article and publication links (%s)', uri => {
    const target = uri as app.bsky.embed.external.ViewArticle['uri']
    expect(
      getArticleExternalView(
        createActivity({view: createArticleView({uri: target})}),
      ),
    ).toBeUndefined()
    expect(
      getPublicationExternalView(
        createActivity({view: createPublicationView({uri: target})}),
      ),
    ).toBeUndefined()
    const article = createArticleView({
      publisher: createPublicationView({uri: target}),
    })
    expect(
      getArticleExternalView(createActivity({view: article}))?.source,
    ).toBeUndefined()
  })

  it('safely omits unknown and missing views instead of manufacturing content', () => {
    const activity = createActivity({
      collection: activityCollections.recommendation,
    })
    expect(getArticleExternalView(activity)).toBeUndefined()
    expect(getActivityPostView(activity)).toBeUndefined()
    activity.view = {
      $type: 'example.future#view' as l.Unknown$Type,
    }
    expect(getArticleExternalView(activity)).toBeUndefined()
    expect(getPublicationExternalView(activity)).toBeUndefined()
  })

  it('adapts the supplied subject without turning unhydrated group references into posts', () => {
    const group = createSubjectGroup(
      [
        createActivity({
          collection: activityCollections.recommendation,
          did: 'did:plc:one',
        }),
        createActivity({
          collection: activityCollections.recommendation,
          did: 'did:plc:two',
        }),
      ],
      {
        uri: documentUri,
        viewerState: {subscribed: false},
        view: createArticleView(),
      },
    )
    expect(getArticleExternalView(group.subject)?.title).toBe('An article')
    expect(getActivityPostView(group.activities[0])).toBeUndefined()
    group.subject.viewBskyPost = createPostView()
    expect(getActivityPostView(group.subject)).toBeUndefined()
  })
})
