import '#/lib/media/image/testSetup'

import {type ImageManipulatorContext} from 'expo-image-manipulator'

jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///cache/',
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  moveAsync: jest.fn().mockResolvedValue(undefined),
}))

it('imports and runs the production compressor without loading the app UI graph', async () => {
  jest.resetModules()

  /*
   * Only the Expo renderer/filesystem are faked. In particular, do not mock
   * gallery, picker, or any app module: a transitive UI import must be visible.
   */
  const {ImageManipulator} =
    require('expo-image-manipulator') as typeof import('expo-image-manipulator')
  jest.mocked(ImageManipulator.manipulate).mockImplementation(
    () =>
      ({
        resize: jest.fn(),
        renderAsync: jest.fn().mockResolvedValue({
          saveAsync: jest.fn().mockResolvedValue({
            uri: 'data:image/jpeg;base64,AAAA',
            base64: 'AAAA',
            width: 10,
            height: 10,
          }),
          release: jest.fn(),
        }),
        release: jest.fn(),
      }) as unknown as ImageManipulatorContext,
  )

  const {compressImage} =
    require('#/lib/media/image/compress') as typeof import('#/lib/media/image/compress')
  expect(jest.isMockFunction(compressImage)).toBe(false)

  const appModules = () =>
    Object.keys(require.cache)
      .filter(path => path.startsWith(`${process.cwd()}/src/`))
      .map(path => path.slice(`${process.cwd()}/src/`.length))
      .sort()

  const allowedModules = [
    'env/common.ts',
    require.resolve('#/env').endsWith('.web.ts')
      ? 'env/index.web.ts'
      : 'env/index.ts',
    'lib/media/image/cache.ts',
    'lib/media/image/compress.ts',
    'lib/media/image-manipulator.ts',
    'lib/media/util.ts',
  ]
  expect(appModules()).toContain('lib/media/image/compress.ts')
  expect(appModules().filter(path => !allowedModules.includes(path))).toEqual(
    [],
  )

  await expect(
    compressImage(
      {
        alt: '',
        source: {
          id: 'image',
          path: 'fake-source',
          width: 10,
          height: 10,
          mime: 'image/png',
        },
      },
      {maxDimension: 10, maxSize: 3},
    ),
  ).resolves.toMatchObject({mime: 'image/jpeg', size: 3})

  /* Exercise lazy imports too, not just the compressor's module initialization. */
  expect(appModules()).toEqual(allowedModules.sort())
})
