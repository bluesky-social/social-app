import {jsonToLex} from '@atproto/lex'
import {AtUri} from '@atproto/syntax'
import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {render} from '@testing-library/react-native'

import {type app, type tools} from '#/lexicons'
import {PostSubjectPreview} from './PostSubjectPreview'

jest.unmock('multiformats/cid')

const POST_CID = 'bafyreie5737gdxlw5i64vzichcalba3z2v5n6icifvx5xytvske7mr3hpm'
const BLOB_CID = 'bafkreibme22gw2h7y2h7tg2fhqotaqjucnbc24deqo72b6mkl2egezxhvy'
const OTHER_CID = 'bafkreieq5jui4j25lacwomsqgjeswwl3y5zcdrresptwgmfylxo2depppq'
const DID = 'did:plc:abcdefghijklmnopqrstuvwx'
const URI = `at://${DID}/app.bsky.feed.post/3k2`

let mockPost: app.bsky.feed.defs.PostView | undefined
const mockModeratePost = jest.fn((..._args: unknown[]) => ({ui: () => ({})}))

jest.mock('@bsky/sdk/moderation', () => ({
  moderatePost: (...args: unknown[]) => mockModeratePost(...args),
  moderateProfile: jest.fn(),
}))
jest.mock('#/state/preferences/moderation-opts', () => ({
  useModerationOpts: () => ({}),
}))
jest.mock('#/state/queries/post', () => ({
  usePostQuery: () => ({
    data: mockPost,
    isPending: false,
    isSuccess: !!mockPost,
  }),
}))
jest.mock('#/state/queries/profile', () => ({
  useProfileQuery: () => ({data: undefined}),
}))
jest.mock('#/state/session', () => ({
  useSession: () => ({hasSession: true, currentAccount: {did: DID}}),
}))
jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  useTheme: () => ({atoms: {text_contrast_medium: {}}}),
}))
jest.mock('#/components/Button', () => ({
  ButtonText:
    jest.requireActual<typeof import('react-native')>('react-native').Text,
}))
jest.mock('#/components/Link', () => ({
  Link: jest.requireActual<typeof import('react-native')>('react-native').Text,
}))
jest.mock('#/components/Loader', () => ({Loader: () => null}))
jest.mock('#/components/moderation/ContentHider', () => ({
  ContentHider: ({children}: {children: React.ReactNode}) => children,
}))
jest.mock('#/components/moderation/PostAlerts', () => ({
  PostAlerts: () => null,
}))
jest.mock('#/components/Typography', () => ({
  Text: jest.requireActual<typeof import('react-native')>('react-native').Text,
}))

const record = (text: string, embed?: unknown) =>
  jsonToLex({
    $type: 'app.bsky.feed.post',
    text,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...(embed ? {embed} : {}),
  })

const video = {
  $type: 'app.bsky.embed.video',
  video: {
    $type: 'blob',
    ref: {$link: BLOB_CID},
    mimeType: 'video/mp4',
    size: 123,
  },
}

function renderPreview(cid: string, snapshot?: unknown, removed = false) {
  const report = {
    subject: {$type: 'com.atproto.repo.strongRef', uri: URI, cid},
    record: snapshot,
  } as unknown as Pick<
    tools.ozone.inbox.getReport.$OutputBody['report'],
    'subject' | 'record'
  >
  return render(
    <I18nProvider i18n={i18n}>
      <PostSubjectPreview
        report={report}
        uri={new AtUri(URI)}
        subjectLabel="Post"
        allowOwnRecordSnapshot
        enforcement={removed ? {state: 'removed'} : undefined}
      />
    </I18nProvider>,
  )
}

beforeAll(() => i18n.loadAndActivate({locale: 'en', messages: {}}))
beforeEach(() => {
  mockModeratePost.mockClear()
  mockPost = {
    cid: POST_CID,
    record: record('Current text', video),
  } as app.bsky.feed.defs.PostView
})

it('shows the current moderated post when its video matches, even if a snapshot is present', () => {
  const screen = renderPreview(BLOB_CID, record('Old text'))
  expect(screen.getByText('“Current text”')).toBeTruthy()
  expect(screen.queryByText('“Old text”')).toBeNull()
  expect(screen.getByText('Current version of post')).toBeTruthy()
  expect(screen.getByText('Open post')).toBeTruthy()
  expect(mockModeratePost).toHaveBeenCalledWith(mockPost, {})
})

it('preserves record CID matches without the current-version note', () => {
  const screen = renderPreview(POST_CID)
  expect(screen.getByText('“Current text”')).toBeTruthy()
  expect(screen.queryByText('Current version of post')).toBeNull()
})

it('does not show an unrelated current post', () => {
  const screen = renderPreview(OTHER_CID)
  expect(screen.getByText('Post unavailable')).toBeTruthy()
  expect(screen.queryByText('“Current text”')).toBeNull()
  expect(screen.queryByText('Open post')).toBeNull()
})

it('does not open removed content even when its video matches', () => {
  const screen = renderPreview(BLOB_CID, undefined, true)
  expect(screen.getByText('“Current text”')).toBeTruthy()
  expect(screen.queryByText('Open post')).toBeNull()
})
