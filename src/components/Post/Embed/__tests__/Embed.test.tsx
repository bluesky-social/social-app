import {render} from '@testing-library/react-native'

import {type VideoFeedFeedbackAttribution} from '#/lib/media/video/feedFeedback'
import {type app} from '#/lexicons'
import {Embed} from '../index'

const mockVideoEmbed = jest.fn<void, [unknown]>()
jest.mock('../VideoEmbed', () => ({
  VideoEmbed: (props: unknown) => {
    mockVideoEmbed(props)
    return null
  },
}))
jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  useTheme: () => ({atoms: new Proxy({}, {get: () => ({})})}),
}))
jest.mock('#/state/preferences/moderation-opts', () => ({
  useModerationOpts: () => undefined,
}))
jest.mock('@tanstack/react-query', () => ({useQueryClient: () => ({})}))
jest.mock('#/components/moderation/ContentHider', () => ({
  ContentHider: ({
    children,
  }: {
    children: React.ReactNode | ((state: {active: boolean}) => React.ReactNode)
  }) => (typeof children === 'function' ? children({active: false}) : children),
}))
jest.mock('#/components/images/Gallery', () => ({
  GalleryBleed: ({children}: {children: React.ReactNode}) => children,
}))
jest.mock('#/view/com/util/Link', () => ({
  Link: ({children}: {children: React.ReactNode}) => children,
}))
jest.mock('#/view/com/util/PostMeta', () => ({PostMeta: () => null}))
jest.mock('#/components/SubtleHover', () => ({SubtleHover: () => null}))
// Siblings this test doesn't render, kept out of the module graph.
jest.mock('#/state/queries/profile', () => ({}))
jest.mock('#/state/session', () => ({}))
jest.mock('#/components/Post/Embed/AtCard', () => ({}))
jest.mock('#/components/Post/Embed/AtCard/providers', () => ({}))
jest.mock('#/components/Post/Embed/StandardSiteEmbed', () => ({}))
jest.mock('#/components/Post/Embed/StandardSiteEmbed/utils', () => ({}))
jest.mock('#/components/StarterPack/StarterPackCard', () => ({}))
jest.mock('#/components/RichText', () => ({}))
jest.mock('#/components/moderation/PostAlerts', () => ({}))
jest.mock('../ChatInviteEmbed', () => ({}))
jest.mock('../ExternalEmbed', () => ({}))
jest.mock('../FeedEmbed', () => ({}))
jest.mock('../ImageEmbed', () => ({}))
jest.mock('../ListEmbed', () => ({}))
jest.mock('../PostPlaceholder', () => ({}))
jest.mock('#/screens/PostThread/components/ThreadItemPostNumber', () => ({
  POST_NUMBER_INLINE_OFFSET: 0,
  ThreadItemPostNumber: () => null,
  useHasThreadItemPostNumber: () => false,
}))

const video = {
  $type: 'app.bsky.embed.video#view',
  cid: 'cid',
  playlist: 'https://video.example/playlist.m3u8',
  thumbnail: 'https://video.example/thumbnail.jpg',
}
const QUOTED = 'at://did:plc:quoted/app.bsky.feed.post/media'
const quoteEmbed = {
  $type: 'app.bsky.embed.record#view',
  record: {
    $type: 'app.bsky.embed.record#viewRecord',
    uri: QUOTED,
    cid: 'quoted-cid',
    author: {did: 'did:plc:quoted', handle: 'quoted.test'},
    value: {
      $type: 'app.bsky.feed.post',
      text: '',
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    embeds: [video],
    indexedAt: '2025-01-01T00:00:00.000Z',
  },
} as app.bsky.feed.defs.PostView['embed']

it('keeps the outer feed item attribution for quoted videos', () => {
  const attribution: VideoFeedFeedbackAttribution = {
    item: 'at://did:plc:outer/app.bsky.feed.post/outer',
    feedContext: 'ctx|with|pipes',
    reqId: 'req',
  }
  render(<Embed embed={quoteEmbed} videoFeedbackAttribution={attribution} />)

  expect(mockVideoEmbed).toHaveBeenCalledTimes(1)
  expect(mockVideoEmbed.mock.calls[0][0]).toMatchObject({
    post: {uri: QUOTED},
    feedbackAttribution: attribution,
  })
})
