import {compressImage as compressNatively} from '@bsky.app/expo-bluesky-image-compressor'

import {compressToFit} from '#/lib/media/image/compressToFit'
import {ImageMissingError} from '#/lib/media/image/errors'

const mockMissingFiles = new Set<string>()

jest.mock('expo-file-system', () => ({
  File: class {
    uri: string
    constructor(mockUri: string) {
      this.uri = mockUri
    }
    get exists() {
      return !mockMissingFiles.has(this.uri)
    }
  },
}))
jest.mock('@bsky.app/expo-bluesky-image-compressor', () => ({
  compressImage: jest.fn(),
}))
jest.mock('#/lib/media/image/cache', () => ({
  moveIfNecessary: jest.fn((path: string) => Promise.resolve(path)),
}))
jest.mock('#/lib/media/image/compressWithManipulator', () => ({
  compressWithManipulator: jest.fn(),
}))
jest.mock('#/analytics/features', () => ({
  Features: {ImageUploadsNativeCompressionEnable: 'native'},
  features: {isOn: () => true},
}))
jest.mock('#/logger', () => ({logger: {debug: jest.fn()}}))

const opts = {maxDimension: 2000, maxSize: 1_000_000}

function source(path: string) {
  return {path, width: 4000, height: 3000, mime: 'image/jpeg'}
}

beforeEach(() => {
  mockMissingFiles.clear()
  jest.mocked(compressNatively).mockResolvedValue({
    uri: 'file:///cache/out.jpg',
    width: 2000,
    height: 1500,
    size: 500_000,
    quality: 90,
  })
})

it('throws ImageMissingError when the file is gone', async () => {
  mockMissingFiles.add('file:///composer/gone')

  await expect(
    compressToFit(source('file:///composer/gone'), opts),
  ).rejects.toBeInstanceOf(ImageMissingError)
  expect(compressNatively).not.toHaveBeenCalled()
})

it('checks bare paths as file URIs', async () => {
  mockMissingFiles.add('file:///composer/gone')

  await expect(
    compressToFit(source('/composer/gone'), opts),
  ).rejects.toBeInstanceOf(ImageMissingError)
})

it('compresses files that exist', async () => {
  const res = await compressToFit(source('file:///composer/here'), opts)

  expect(compressNatively).toHaveBeenCalledWith('file:///composer/here', {
    maxDimension: 2000,
    maxBytes: 1_000_000,
  })
  expect(res.path).toBe('file:///cache/out.jpg')
})

it('leaves non-file URIs to the compressor', async () => {
  mockMissingFiles.add('content://media/1')

  await compressToFit(source('content://media/1'), opts)

  expect(compressNatively).toHaveBeenCalled()
})
