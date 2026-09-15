import {RichText} from '@bsky/sdk/richtext'

import {type ComposerState} from '#/view/com/composer/state/composer'
import {createVideoState, videoReducer} from '#/view/com/composer/state/video'
import {composerStateToDraft} from './api'

jest.mock('#/lib/api/resolve', () => ({resolveLink: jest.fn()}))
jest.mock('#/lib/media/manip', () => ({getImageDim: jest.fn()}))
jest.mock('#/state/queries/threadgate/util', () => ({
  threadgateAllowUISettingToAllowRecordValue: jest.fn(() => []),
}))
jest.mock('#/view/com/composer/state/composer', () => ({
  LEGACY_IMAGES_EMBED_MAX: 4,
}))
jest.mock('./storage', () => ({mediaExists: jest.fn()}))

jest.mock('#/analytics/identifiers', () => ({
  getDeviceId: jest.fn(() => 'device-id'),
}))

jest.mock('#/lib/deviceName', () => ({
  getDeviceName: jest.fn(() => 'Test device'),
}))

jest.mock('./logger', () => ({
  logger: {debug: jest.fn(), error: jest.fn(), warn: jest.fn()},
}))

function composerState(
  media: ComposerState['thread']['posts'][number]['embed']['media'],
): ComposerState {
  return {
    activePostIndex: 0,
    mutableNeedsFocusActive: false,
    isDirty: true,
    thread: {
      posts: [
        {
          id: 'post',
          richtext: new RichText({text: ''}),
          shortenedGraphemeLength: 0,
          labels: [],
          embed: {media, quote: undefined, link: undefined},
        },
      ],
      postgate: {
        $type: 'app.bsky.feed.postgate',
        post: 'at://did:plc:test/app.bsky.feed.post/test',
        createdAt: new Date(0).toISOString(),
      },
      threadgate: [],
    },
  } as ComposerState
}

test('image serialization reuses the ref assigned when the image entered the composer', async () => {
  const image = {
    alt: '',
    localRefPath: 'image:assigned-on-entry',
    source: {
      id: 'source',
      path: 'file:///image.jpg',
      width: 100,
      height: 100,
      mime: 'image/jpeg',
    },
  }
  const state = composerState({type: 'images', images: [image]})

  const first = await composerStateToDraft({} as never, state)
  const second = await composerStateToDraft({} as never, state)

  expect(Array.from(first.localRefPaths.keys())).toEqual([image.localRefPath])
  expect(Array.from(second.localRefPaths.keys())).toEqual([image.localRefPath])
})

test('video serialization reuses the ref assigned when the video entered the composer', async () => {
  const abortController = new AbortController()
  const initial = createVideoState(
    {uri: 'file:///video.mp4', mimeType: 'video/mp4'} as never,
    abortController,
    {} as never,
  )
  const video = videoReducer(initial, {
    type: 'compressing_to_uploading',
    video: {
      uri: 'file:///compressed.mp4',
      mimeType: 'video/mp4',
    } as never,
    compressionSkipped: false,
    signal: abortController.signal,
  })
  const state = composerState({type: 'video', video})

  const first = await composerStateToDraft({} as never, state)
  const second = await composerStateToDraft({} as never, state)

  expect(Array.from(first.localRefPaths.keys())).toEqual([initial.localRefPath])
  expect(Array.from(second.localRefPaths.keys())).toEqual([
    initial.localRefPath,
  ])
})
