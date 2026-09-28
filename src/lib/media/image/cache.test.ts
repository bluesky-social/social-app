import '#/lib/media/image/testSetup'

import {makeDirectoryAsync, moveAsync} from 'expo-file-system/legacy'
import {nanoid} from 'nanoid/non-secure'

import {
  getImageCacheDirectory,
  joinPath,
  moveIfNecessary,
} from '#/lib/media/image/cache'
import {IS_NATIVE} from '#/env'

jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///cache/',
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  moveAsync: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('nanoid/non-secure', () => ({
  nanoid: jest.fn(() => 'unique-id'),
}))

beforeEach(() => {
  jest.clearAllMocks()
})

it.each([
  ['file:///cache', 'bsky-composer'],
  ['file:///cache/', 'bsky-composer'],
  ['file:///cache', '/bsky-composer'],
  ['file:///cache/', '/bsky-composer'],
])('joins cache paths with exactly one slash (%s, %s)', (parent, child) => {
  expect(joinPath(parent, child)).toBe('file:///cache/bsky-composer')
})

it('uses the composer cache on native and no cache on web', () => {
  expect(getImageCacheDirectory()).toBe(
    IS_NATIVE ? 'file:///cache/bsky-composer' : null,
  )
  expect(getImageCacheDirectory()).toBe(getImageCacheDirectory())
})

it.each([
  'file:///temporary.jpg',
  '/temporary.jpg',
  'data:image/jpeg;base64,AAAA',
  'blob:fake-image',
])(
  'moves uncached output on native without normalizing the source (%s)',
  async from => {
    const output = await moveIfNecessary(from)
    if (IS_NATIVE) {
      expect(output).toBe('file:///cache/bsky-composer/unique-id')
      expect(nanoid).toHaveBeenCalledWith(36)
      expect(makeDirectoryAsync).toHaveBeenCalledWith(
        'file:///cache/bsky-composer',
        {
          intermediates: true,
        },
      )
      expect(moveAsync).toHaveBeenCalledWith({from, to: output})
      expect(
        jest.mocked(makeDirectoryAsync).mock.invocationCallOrder[0],
      ).toBeLessThan(jest.mocked(moveAsync).mock.invocationCallOrder[0])
    } else {
      expect(output).toBe(from)
      expect(nanoid).not.toHaveBeenCalled()
      expect(makeDirectoryAsync).not.toHaveBeenCalled()
      expect(moveAsync).not.toHaveBeenCalled()
    }
  },
)

it('leaves already cached output in place', async () => {
  const from = 'file:///cache/bsky-composer/already-cached'
  expect(await moveIfNecessary(from)).toBe(from)
  expect(makeDirectoryAsync).not.toHaveBeenCalled()
  expect(moveAsync).not.toHaveBeenCalled()
  expect(nanoid).not.toHaveBeenCalled()
})

if (IS_NATIVE) {
  it('waits for directory creation before moving', async () => {
    let finishDirectory!: () => void
    jest
      .mocked(makeDirectoryAsync)
      .mockImplementationOnce(
        () => new Promise(resolve => (finishDirectory = resolve)),
      )
    const moving = moveIfNecessary('file:///temporary.jpg')
    expect(moveAsync).not.toHaveBeenCalled()
    finishDirectory()
    await moving
    expect(moveAsync).toHaveBeenCalledTimes(1)
  })

  it('propagates directory creation failures without moving', async () => {
    jest
      .mocked(makeDirectoryAsync)
      .mockRejectedValueOnce(new Error('mkdir failed'))
    await expect(moveIfNecessary('file:///temporary.jpg')).rejects.toThrow(
      'mkdir failed',
    )
    expect(moveAsync).not.toHaveBeenCalled()
  })

  it('propagates move failures rather than returning an unusable path', async () => {
    jest.mocked(moveAsync).mockRejectedValueOnce(new Error('move failed'))
    await expect(moveIfNecessary('file:///temporary.jpg')).rejects.toThrow(
      'move failed',
    )
  })
}
