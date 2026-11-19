import {AtUri} from '@atproto/syntax'
import {type ModerationOpts, type ModerationUI} from '@bsky/sdk/moderation'
import {setupI18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {render, screen} from '@testing-library/react-native'

import * as externalModeration from '#/lib/moderation/moderateExternalView'
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

function renderPreview(snapshot: unknown, allowReportRecordSnapshot = true) {
  return render(
    <I18nProvider i18n={i18n}>
      <PostSubjectPreview
        report={{subject, record: snapshot as never}}
        uri={uri}
        subjectLabel="Post"
        allowReportRecordSnapshot={allowReportRecordSnapshot}
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

  it('does not substitute a later post revision for the returned record', () => {
    mockPostQuery = {
      data: {cid: 'different-cid', record: {...record, text: 'Newer text'}},
      isPending: false,
      isSuccess: true,
    }
    renderPreview(record)
    expect(screen.getByText('“Example reported post”')).toBeTruthy()
    expect(screen.queryByText('“Newer text”')).toBeNull()
  })

  it('applies record-URI labels from a newer AppView version', () => {
    const labeler = 'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa'
    mockOpts.prefs.labelers = [{did: labeler, labels: {}}]
    mockPostQuery = {
      data: {
        cid: 'different-cid',
        record,
        labels: [
          {
            src: labeler,
            uri: uri.toString(),
            val: '!hide',
            cts: record.createdAt,
          },
        ],
      },
      isPending: false,
      isSuccess: true,
    }
    renderPreview(record)
    expect(screen.getByText('Content hidden')).toBeTruthy()
  })

  it('does not apply labels for a different URI or record version', () => {
    const labeler = 'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa'
    mockOpts.prefs.labelers = [{did: labeler, labels: {}}]
    mockPostQuery = {
      data: {
        cid: 'different-cid',
        record,
        labels: [
          {
            src: labeler,
            uri: uri.toString(),
            cid: 'different-cid',
            val: '!hide',
            cts: record.createdAt,
          },
          {
            src: labeler,
            uri: 'at://did:plc:aaaaaaaaaaaaaaaaaaaaaaaa/app.bsky.feed.post/other',
            val: '!hide',
            cts: record.createdAt,
          },
        ],
      },
      isPending: false,
      isSuccess: true,
    }
    renderPreview(record)
    expect(screen.getByText('“Example reported post”')).toBeTruthy()
  })

  it('does not use reporter snapshots in the owner-action preview', () => {
    renderPreview(record, false)
    expect(screen.getByText('Post unavailable')).toBeTruthy()
  })

  it('respects muted words when showing the snapshot', () => {
    mockOpts.prefs.mutedWords = [{value: 'reported post', targets: ['content']}]
    renderPreview(record)
    expect(screen.getByText('Content hidden')).toBeTruthy()
    expect(screen.queryByText('“Example reported post”')).toBeNull()
  })

  it('includes record self-labels in the moderation decision', () => {
    const spy = jest.spyOn(externalModeration, 'moderateExternalView')
    renderPreview({
      ...record,
      labels: {
        $type: 'com.atproto.label.defs#selfLabels',
        values: [{val: 'porn'}],
      },
    })
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        labels: [expect.objectContaining({src: did, val: 'porn'})],
      }),
      mockOpts,
    )
    spy.mockRestore()
  })

  it('respects posts hidden by the viewer', () => {
    mockOpts.prefs.hiddenPosts = [uri.toString()]
    renderPreview(record)
    expect(screen.getByText('Content hidden')).toBeTruthy()
  })
})
