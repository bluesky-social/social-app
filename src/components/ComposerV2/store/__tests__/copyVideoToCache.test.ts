import {expect, jest, test} from '@jest/globals'

const mockFiles: Array<{
  uri: string
  exists: boolean
  copy: jest.Mock
  delete: jest.Mock
}> = []
jest.mock('expo-file-system', () => ({
  Paths: {cache: {uri: 'file:///cache/'}},
  File: jest.fn((...parts: Array<string | {uri: string}>) => {
    const uri = parts
      .map(part => (typeof part === 'string' ? part : part.uri))
      .join('')
    const file = {
      uri,
      exists: true,
      copy: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => {
        file.exists = false
      }),
    }
    mockFiles.push(file)
    return file
  }),
}))

import {copyVideoToCache} from '#/components/ComposerV2/store/utils/copyVideoToCache'

test('copies to a simple cache name and releases only the copy, once', async () => {
  const durable = 'file:///docs/bsky-draft-media/video%253Avideo%252Fmp4'
  const copy = await copyVideoToCache({uri: durable, mimeType: 'image/gif'})

  const [destination, source] = mockFiles
  expect(source.uri).toBe(durable)
  expect(source.copy).toHaveBeenCalledWith(destination)
  expect(copy.uri).toBe(destination.uri)
  expect(copy.uri).toMatch(/^file:\/\/\/cache\/composer-v2-video-[\w-]+\.gif$/)

  copy.release()
  copy.release()
  expect(destination.delete).toHaveBeenCalledTimes(1)
  expect(source.delete).not.toHaveBeenCalled()
})

test('omits the extension for an unknown MIME type', async () => {
  mockFiles.length = 0
  const copy = await copyVideoToCache({uri: 'file:///durable'})
  expect(copy.uri).toMatch(/^file:\/\/\/cache\/composer-v2-video-[\w-]+$/)
})
