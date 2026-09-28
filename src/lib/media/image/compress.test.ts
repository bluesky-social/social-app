import '#/lib/media/image/testSetup'

import {makeDirectoryAsync, moveAsync} from 'expo-file-system/legacy'
import {
  ImageManipulator,
  type ImageManipulatorContext,
  type ImageResult,
  type SaveOptions,
} from 'expo-image-manipulator'
import {nanoid} from 'nanoid/non-secure'

import {compressImage} from '#/lib/media/image/compress'
import {type ComposerImage} from '#/state/gallery'
import {IS_NATIVE} from '#/env'

jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///cache/',
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  moveAsync: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('nanoid/non-secure', () => ({nanoid: jest.fn()}))

const source: ComposerImage = {
  alt: 'Alt text',
  source: {
    id: 'source-id',
    path: 'file:///original.png',
    width: 6000,
    height: 3001,
    mime: 'image/png',
  },
}

function fakeRenderer(
  result: (
    options: SaveOptions,
    index: number,
  ) => Partial<ImageResult> = () => ({}),
) {
  const renders: {
    resize: jest.Mock<void, [Pick<ImageResult, 'width' | 'height'>]>
    release: jest.Mock
    image: {
      saveAsync: jest.Mock<Promise<ImageResult>, [SaveOptions]>
      release: jest.Mock
    }
  }[] = []

  jest.mocked(ImageManipulator.manipulate).mockImplementation(() => {
    const index = renders.length + 1
    const resize = jest.fn<void, [Pick<ImageResult, 'width' | 'height'>]>()
    const image = {
      saveAsync: jest.fn((options: SaveOptions) =>
        Promise.resolve().then(() => ({
          uri: `file:///rendered-${index}.jpg`,
          ...resize.mock.calls[0][0],
          base64: 'AAAA',
          ...result(options, index),
        })),
      ),
      release: jest.fn(),
    }
    const context = {
      resize,
      release: jest.fn(),
      renderAsync: jest.fn().mockResolvedValue(image),
    }
    renders.push({...context, image})
    return context as unknown as ImageManipulatorContext
  })

  return renders
}

function qualities(renders: ReturnType<typeof fakeRenderer>) {
  return renders.map(render => render.image.saveAsync.mock.calls[0][0].compress)
}

beforeEach(() => {
  jest.clearAllMocks()
  let id = 0
  jest.mocked(nanoid).mockImplementation(() => `cached-${++id}`)
})

it('searches through full JPEG quality, preserves input and returns rendered metadata', async () => {
  const renders = fakeRenderer(() => ({width: 1999, height: 999}))
  const policy = Object.freeze({maxDimension: 2000, maxSize: 3})
  const before = JSON.parse(JSON.stringify(source))

  const output = await compressImage(source, policy)

  expect(qualities(renders)).toEqual([0.51, 0.76, 0.89, 0.95, 0.98, 1])
  expect(output).toEqual({
    path: IS_NATIVE
      ? 'file:///cache/bsky-composer/cached-6'
      : 'file:///rendered-6.jpg',
    width: 1999,
    height: 999,
    mime: 'image/jpeg',
    size: 3,
  })
  expect(source).toEqual(before)
  for (const render of renders) {
    expect(render.resize).toHaveBeenCalledWith({width: 2000, height: 1000})
    expect(render.image.saveAsync).toHaveBeenCalledWith({
      compress: expect.any(Number),
      format: 'jpeg',
      base64: true,
    })
    expect(render.release).toHaveBeenCalledTimes(1)
    expect(render.image.release).toHaveBeenCalledTimes(1)
  }
  expect(ImageManipulator.manipulate).toHaveBeenCalledTimes(6)
  expect(ImageManipulator.manipulate).toHaveBeenCalledWith(source.source.path)
  expect(moveAsync).toHaveBeenCalledTimes(IS_NATIVE ? 6 : 0)
  expect(makeDirectoryAsync).toHaveBeenCalledTimes(IS_NATIVE ? 6 : 0)
})

it('prefers the transformed source without reapplying crop operations', async () => {
  const renders = fakeRenderer()
  const transformed = {
    path: 'file:///cropped.png',
    width: 3333,
    height: 6000,
    mime: 'image/png',
  }

  await compressImage(
    {
      ...source,
      transformed,
      manips: {crop: {originX: 1, originY: 2, width: 3333, height: 6000}},
    },
    {maxDimension: 2000, maxSize: 3},
  )

  expect(ImageManipulator.manipulate).toHaveBeenCalledWith(transformed.path)
  expect(ImageManipulator.manipulate).not.toHaveBeenCalledWith(
    source.source.path,
  )
  expect(renders[0].resize).toHaveBeenCalledWith({width: 1111, height: 2000})
})

it.each([
  {width: 50, height: 100},
  {width: 100, height: 50},
  {width: 100, height: 100},
])('does not upscale $width x $height', async dimensions => {
  const renders = fakeRenderer()
  await compressImage(
    {...source, source: {...source.source, ...dimensions}},
    {maxDimension: 100, maxSize: 3},
  )
  expect(renders[0].resize).toHaveBeenCalledWith(dimensions)
})

it('keeps the last fitting result and only moves accepted renders', async () => {
  const renders = fakeRenderer(options => ({
    base64: options.compress! <= 0.7 ? 'AAAA' : 'AAAAAAAA',
  }))

  const output = await compressImage(source, {maxDimension: 2000, maxSize: 3})

  expect(qualities(renders)).toEqual([0.51, 0.76, 0.64, 0.7, 0.73, 0.72, 0.71])
  expect(output.path).toBe(
    IS_NATIVE
      ? 'file:///cache/bsky-composer/cached-3'
      : 'file:///rendered-4.jpg',
  )
  expect(moveAsync).toHaveBeenCalledTimes(IS_NATIVE ? 3 : 0)
  if (IS_NATIVE) {
    expect(jest.mocked(moveAsync).mock.calls.map(([{from}]) => from)).toEqual([
      'file:///rendered-1.jpg',
      'file:///rendered-3.jpg',
      'file:///rendered-4.jpg',
    ])
  }
})

it('reduces dimensions by 0.8 rather than rendering at quality 13', async () => {
  const renders = fakeRenderer((_options, index) => ({
    base64: index <= 2 ? 'AAAAAAAA' : 'AAAA',
  }))
  const policy = Object.freeze({maxDimension: 2001, maxSize: 3})
  await compressImage(source, policy)

  expect(qualities(renders)).toEqual([
    0.51, 0.26, 0.51, 0.76, 0.89, 0.95, 0.98, 1,
  ])
  expect(renders.map(render => render.resize.mock.calls[0][0])).toEqual([
    {width: 2001, height: 1000},
    {width: 2001, height: 1000},
    ...Array(6).fill({width: 1600, height: 800}),
  ])
  expect(policy.maxDimension).toBe(2001)
})

it.each(['AAAAAAAA', undefined, ''])(
  'stops after four dimension attempts for oversized or missing base64 (%s)',
  async base64 => {
    const renders = fakeRenderer(() => ({base64}))
    await expect(
      compressImage(source, {maxDimension: 4000, maxSize: 3}),
    ).rejects.toThrow('Unable to compress image')

    expect(qualities(renders)).toEqual([
      0.51, 0.26, 0.51, 0.26, 0.51, 0.26, 0.51, 0.26,
    ])
    expect(renders.map(render => render.resize.mock.calls[0][0].width)).toEqual(
      [4000, 4000, 3200, 3200, 2560, 2560, 2048, 2048],
    )
    expect(moveAsync).not.toHaveBeenCalled()
    expect(makeDirectoryAsync).not.toHaveBeenCalled()
  },
)

it('propagates render errors and releases the manipulator context', async () => {
  const release = jest.fn()
  jest.mocked(ImageManipulator.manipulate).mockReturnValue({
    resize: jest.fn(),
    renderAsync: jest.fn().mockRejectedValue(new Error('render failed')),
    release,
  } as unknown as ImageManipulatorContext)

  await expect(
    compressImage(source, {maxDimension: 2000, maxSize: 3}),
  ).rejects.toThrow('render failed')
  expect(release).toHaveBeenCalledTimes(1)
  expect(moveAsync).not.toHaveBeenCalled()
})

it('propagates save errors and releases both native handles', async () => {
  const renders = fakeRenderer(() => {
    throw new Error('save failed')
  })
  await expect(
    compressImage(source, {maxDimension: 2000, maxSize: 3}),
  ).rejects.toThrow('save failed')
  expect(renders[0].release).toHaveBeenCalledTimes(1)
  expect(renders[0].image.release).toHaveBeenCalledTimes(1)
  expect(moveAsync).not.toHaveBeenCalled()
})
