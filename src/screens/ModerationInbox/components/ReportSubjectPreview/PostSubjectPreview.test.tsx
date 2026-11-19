import {AtUri} from '@atproto/syntax'
import {type ModerationOpts, type ModerationUI} from '@bsky/sdk/moderation'
import {setupI18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {render, screen} from '@testing-library/react-native'

import {PostSubjectPreview} from './PostSubjectPreview'

jest.unmock('multiformats/cid')

const did = 'did:plc:abcdefghijklmnopqrstuvwx'
const uri = new AtUri(`at://${did}/app.bsky.feed.post/3example`)
const subject = {
  $type: 'com.atproto.repo.strongRef',
  uri: uri.toString(),
  cid: 'bafyreif5n5m2ol4zppdwjwfcq36xsoqoxn2k2bnaineijucvhkpmh6of2q',
} as const
const record = {
  $type: 'app.bsky.feed.post',
  createdAt: '2026-01-01T12:00:00.000Z',
  langs: ['en'],
  text: 'Example reported post',
}
const i18n = setupI18n({locale: 'en', messages: {en: {}}})
let mockPostQuery: {data?: unknown; isPending: boolean; isSuccess: boolean}
let mockOpts: ModerationOpts
let mockProfile: unknown

jest.mock('#/state/queries/post', () => ({usePostQuery: () => mockPostQuery}))
jest.mock('#/state/queries/profile', () => ({useProfileQuery: () => ({})}))
jest.mock('#/state/preferences/moderation-opts', () => ({
  useModerationOpts: () => mockOpts,
}))
jest.mock('#/state/session', () => ({
  useSession: () => ({
    hasSession: true,
    currentAccount: {did: 'did:plc:reporter'},
  }),
}))
jest.mock(
  '#/screens/ModerationInbox/components/hooks/useSubjectPreviewProfile',
  () => ({
    useSubjectPreviewProfile: () => ({
      query: {isPending: false},
      opts: mockOpts,
      profile: mockProfile,
    }),
  }),
)
jest.mock('#/alf', () => {
  const atoms = new Proxy({}, {get: () => ({})})
  return {atoms, useTheme: () => ({atoms})}
})
jest.mock('#/components/Typography', () => ({
  Text: jest.requireActual<typeof import('react-native')>('react-native').Text,
}))
jest.mock('#/components/Loader', () => ({Loader: () => null}))
jest.mock('#/components/Button', () => ({ButtonText: () => null}))
jest.mock('#/components/Link', () => ({Link: () => null}))
jest.mock('#/components/moderation/PostAlerts', () => ({
  PostAlerts: () => null,
}))
jest.mock('#/components/moderation/ContentHider', () => {
  const {Text, View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    ContentHider: ({
      modui,
      children,
    }: {
      modui?: ModerationUI
      children: React.ReactNode
    }) => <View>{modui?.blur ? <Text>Content hidden</Text> : children}</View>,
  }
})

beforeEach(() => {
  mockPostQuery = {isPending: false, isSuccess: false}
  mockProfile = undefined
  mockOpts = {
    userDid: 'did:plc:reporter',
    prefs: {
      adultContentEnabled: true,
      labels: {},
      labelers: [],
      mutedWords: [],
      hiddenPosts: [],
    },
  }
})

function renderPreview(snapshot: unknown) {
  return render(
    <I18nProvider i18n={i18n}>
      <PostSubjectPreview
        report={{subject, record: snapshot as never}}
        uri={uri}
        subjectLabel="Post"
        allowReportRecordSnapshot
      />
    </I18nProvider>,
  )
}

describe('PostSubjectPreview', () => {
  it('shows the record returned by getReport when AppView cannot return the post', () => {
    renderPreview(record)
    expect(screen.getByText('“Example reported post”')).toBeTruthy()
    expect(screen.queryByText('Post unavailable')).toBeNull()
    expect(screen.queryByTestId('moderationInboxOpenPost')).toBeNull()
  })

  it('keeps the old unavailable preview when there is no usable snapshot', () => {
    renderPreview(undefined)
    expect(screen.getByText('Post unavailable')).toBeTruthy()
  })

  it.each([
    ['the same URI', uri.toString(), undefined, true],
    ['a different record revision', uri.toString(), 'different-cid', false],
    [
      'a different URI',
      'at://did:plc:aaaaaaaaaaaaaaaaaaaaaaaa/app.bsky.feed.post/other',
      undefined,
      false,
    ],
  ])('applies a live label only to %s', (_name, labelUri, cid, hidden) => {
    const labeler = 'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa'
    mockOpts.prefs.labelers = [{did: labeler, labels: {}}]
    mockPostQuery = {
      data: {
        cid: 'different-cid',
        record,
        labels: [
          {
            src: labeler,
            uri: labelUri,
            cid,
            val: '!hide',
            cts: record.createdAt,
          },
        ],
      },
      isPending: false,
      isSuccess: true,
    }
    renderPreview(record)
    expect(screen.queryByText('Content hidden') !== null).toBe(hidden)
  })

  it('respects muted words when showing the snapshot', () => {
    mockOpts.prefs.mutedWords = [{value: 'reported post', targets: ['content']}]
    renderPreview(record)
    expect(screen.getByText('Content hidden')).toBeTruthy()
    expect(screen.queryByText('“Example reported post”')).toBeNull()
  })

  it('hides the snapshot when the viewer blocked the author', () => {
    mockProfile = {
      did,
      handle: 'example.bsky.social',
      viewer: {blocking: 'at://block'},
    }
    renderPreview(record)
    expect(screen.getByText('Content hidden')).toBeTruthy()
  })

  it('applies self-labels to the rendered text without an author profile', () => {
    mockOpts.labelDefs = {
      [did]: [
        {
          identifier: 'sensitive',
          severity: 'alert',
          blurs: 'content',
          configurable: true,
          defaultSetting: 'hide',
          flags: [],
          behaviors: {content: {contentView: 'blur'}},
          locales: [],
        },
      ],
    }
    renderPreview({
      ...record,
      labels: {
        $type: 'com.atproto.label.defs#selfLabels',
        values: [{val: 'sensitive'}],
      },
    })
    expect(screen.getByText('Content hidden')).toBeTruthy()
    expect(screen.queryByText('“Example reported post”')).toBeNull()
  })

  it('shows text for a media-only adult self-label', () => {
    mockOpts.prefs.adultContentEnabled = false
    renderPreview({
      ...record,
      labels: {
        $type: 'com.atproto.label.defs#selfLabels',
        values: [{val: 'porn'}],
      },
    })
    expect(screen.getByText('“Example reported post”')).toBeTruthy()
  })

  it('respects posts hidden by the viewer', () => {
    mockOpts.prefs.hiddenPosts = [uri.toString()]
    renderPreview(record)
    expect(screen.getByText('Content hidden')).toBeTruthy()
  })
})
