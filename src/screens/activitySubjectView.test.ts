import {type AssociatedRecords} from '#/state/queries/atmosphereActivityTypes'
import {createActivitySubjectView} from '#/screens/activitySubjectView'

const publicationUri =
  'at://did:plc:publisher/site.standard.publication/publication'
const documentUri = 'at://did:plc:author/site.standard.document/document'
const publicationCid = 'bafyreipublication'
const documentCid = 'bafyreidocument'
const iconCid = 'bafkreiicon'
const coverCid = 'bafkreicover'

describe('createActivitySubjectView', () => {
  it('creates a publication view', () => {
    const associatedRecords: AssociatedRecords = {
      [publicationUri]: {
        uri: publicationUri,
        cid: publicationCid,
        record: {
          $type: 'site.standard.publication',
          name: 'Brookie’s Blog',
          url: 'https://brookie.example',
          description: 'Notes from Brookie.',
          icon: {
            ref: {$link: iconCid},
            mimeType: 'image/png',
          },
          basicTheme: {
            accent: {r: 10, g: 20, b: 30},
            accentForeground: {r: 240, g: 241, b: 242},
            background: {r: 250, g: 250, b: 250},
            foreground: {r: 5, g: 6, b: 7},
          },
        },
      },
    }

    expect(
      createActivitySubjectView({
        uri: publicationUri,
        associatedRecords,
        actors: {
          'did:plc:publisher': {
            did: 'did:plc:publisher',
            handle: 'brookie.example',
            displayName: 'Brookie',
          },
        },
      }),
    ).toEqual({
      $type: 'app.bsky.embed.external#viewExternal',
      uri: 'https://brookie.example/',
      title: 'Brookie’s Blog',
      description: 'Notes from Brookie.',
      source: {
        $type: 'app.bsky.embed.external#viewExternalSource',
        uri: 'https://brookie.example/',
        icon: `https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:publisher/${iconCid}@png`,
        title: 'Brookie’s Blog',
        description: 'Notes from Brookie.',
        theme: {
          accentRGB: {r: 10, g: 20, b: 30},
          accentForegroundRGB: {r: 240, g: 241, b: 242},
          backgroundRGB: {r: 250, g: 250, b: 250},
          foregroundRGB: {r: 5, g: 6, b: 7},
        },
      },
      associatedRefs: [{uri: publicationUri, cid: publicationCid}],
      associatedProfiles: [
        {
          did: 'did:plc:publisher',
          handle: 'brookie.example',
          displayName: 'Brookie',
        },
      ],
    })
  })

  it('creates a document view with its publication source', () => {
    const associatedRecords: AssociatedRecords = {
      [documentUri]: {
        uri: documentUri,
        cid: documentCid,
        record: {
          $type: 'site.standard.document',
          site: publicationUri,
          path: '/posts/activity',
          title: 'Building an Activity Feed',
          description: 'How grouped activity works.',
          publishedAt: '2026-09-08T12:00:00.000Z',
          updatedAt: '2026-09-08T13:00:00.000Z',
          coverImage: {
            ref: {$link: coverCid},
            mimeType: 'image/jpeg',
          },
        },
      },
      [publicationUri]: {
        uri: publicationUri,
        cid: publicationCid,
        record: {
          $type: 'site.standard.publication',
          name: 'Brookie’s Blog',
          url: 'https://brookie.example',
          description: 'Notes from Brookie.',
        },
      },
    }

    expect(
      createActivitySubjectView({
        uri: documentUri,
        associatedRecords,
        actors: {
          'did:plc:author': {
            did: 'did:plc:author',
            handle: 'author.example',
          },
          'did:plc:publisher': {
            did: 'did:plc:publisher',
            handle: 'brookie.example',
          },
        },
      }),
    ).toEqual({
      $type: 'app.bsky.embed.external#viewExternal',
      uri: 'https://brookie.example/posts/activity',
      thumb: `https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:author/${coverCid}@jpeg`,
      title: 'Building an Activity Feed',
      description: 'How grouped activity works.',
      source: {
        $type: 'app.bsky.embed.external#viewExternalSource',
        uri: 'https://brookie.example/',
        icon: undefined,
        title: 'Brookie’s Blog',
        description: 'Notes from Brookie.',
        theme: undefined,
      },
      createdAt: '2026-09-08T12:00:00.000Z',
      updatedAt: '2026-09-08T13:00:00.000Z',
      associatedRefs: [
        {uri: documentUri, cid: documentCid},
        {uri: publicationUri, cid: publicationCid},
      ],
      associatedProfiles: [
        {did: 'did:plc:author', handle: 'author.example'},
        {did: 'did:plc:publisher', handle: 'brookie.example'},
      ],
    })
  })

  it('uses a filtered text preview when the description is empty', () => {
    const view = createActivitySubjectView({
      uri: documentUri,
      associatedRecords: {
        [documentUri]: {
          uri: documentUri,
          cid: documentCid,
          record: {
            $type: 'site.standard.document',
            site: 'https://writing.example',
            path: '/preview',
            title: 'A preview',
            description: '   ',
            textContent: 'First line\n\nSecond line',
            publishedAt: '2026-09-08T12:00:00.000Z',
          },
        },
      },
      actors: {},
    })

    expect(view?.description).toBe('First line Second line')
  })

  it('returns undefined for unavailable and unsupported subjects', () => {
    expect(
      createActivitySubjectView({
        uri: 'at://did:plc:author/social.grain.photo/photo',
        associatedRecords: {},
        actors: {},
      }),
    ).toBeUndefined()
  })
})
