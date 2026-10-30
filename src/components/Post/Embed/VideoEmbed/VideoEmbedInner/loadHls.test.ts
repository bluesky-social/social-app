const mockImportHls = jest.fn()

jest.mock('hls.js/dist/hls.min', () => ({
  __esModule: true,
  get default() {
    return mockImportHls()
  },
}))

function freshLoader() {
  let loadHls!: typeof import('./loadHls').loadHls
  jest.isolateModules(() => {
    loadHls = (require('./loadHls') as typeof import('./loadHls')).loadHls
  })
  return loadHls
}

beforeEach(() => {
  mockImportHls.mockReset()
})

it('does not import HLS until a consumer requests it', () => {
  freshLoader()
  expect(mockImportHls).not.toHaveBeenCalled()
})

it('shares in-flight imports and caches successful work', async () => {
  const Hls = class {}
  mockImportHls.mockReturnValue(Hls)
  const loadHls = freshLoader()
  const first = loadHls()
  const second = loadHls()
  expect(second).toBe(first)
  await expect(first).resolves.toBe(Hls)
  expect(loadHls()).toBe(first)
  expect(mockImportHls).toHaveBeenCalledTimes(1)
})

it('preserves the failure for all consumers and allows a later retry', async () => {
  const error = new Error(
    'Loading module https://cdn.example/hls-hash.js failed',
  )
  const Hls = class {}
  mockImportHls
    .mockImplementationOnce(() => {
      throw error
    })
    .mockReturnValue(Hls)
  const loadHls = freshLoader()
  const first = loadHls()
  const second = loadHls()
  expect(second).toBe(first)
  await expect(first).rejects.toBe(error)
  await expect(second).rejects.toBe(error)
  expect(mockImportHls).toHaveBeenCalledTimes(1)

  const retry = loadHls()
  expect(retry).not.toBe(first)
  expect(loadHls()).toBe(retry)
  await expect(retry).resolves.toBe(Hls)
  expect(mockImportHls).toHaveBeenCalledTimes(2)
})

it('does not automatically retry a permanently unavailable chunk', async () => {
  const error = new Error('Loading module failed')
  mockImportHls.mockImplementation(() => {
    throw error
  })
  const loadHls = freshLoader()
  await expect(loadHls()).rejects.toBe(error)
  await Promise.resolve()
  expect(mockImportHls).toHaveBeenCalledTimes(1)

  await expect(loadHls()).rejects.toBe(error)
  expect(mockImportHls).toHaveBeenCalledTimes(2)
})
