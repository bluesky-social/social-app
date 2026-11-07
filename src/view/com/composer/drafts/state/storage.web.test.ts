const mockRecords = new Map<IDBValidKey, unknown>()

jest.mock('idb-keyval', () => ({
  createStore: jest.fn(() => ({})),
  del: jest.fn((key: IDBValidKey) => {
    mockRecords.delete(key)
    return Promise.resolve()
  }),
  get: jest.fn((key: IDBValidKey) => Promise.resolve(mockRecords.get(key))),
  keys: jest.fn(() => Promise.resolve(Array.from(mockRecords.keys()))),
  set: jest.fn((key: IDBValidKey, value: unknown) => {
    mockRecords.set(key, value)
    return Promise.resolve()
  }),
}))

jest.mock('./logger', () => ({
  logger: {debug: jest.fn(), error: jest.fn(), warn: jest.fn()},
}))

import {
  getMediaMetadata,
  listMediaArtifacts,
  saveMediaToLocal,
  touchMediaMetadata,
} from './storage.web'

beforeEach(() => {
  mockRecords.clear()
})

test('saves account-owned pending metadata with web media', async () => {
  const originalFetch = global.fetch
  const fetchMock: jest.MockedFunction<typeof fetch> = jest
    .fn()
    .mockResolvedValueOnce(new Response(new Blob(['image']), {status: 200}))
  global.fetch = fetchMock

  try {
    await saveMediaToLocal('image:new', 'blob:new', {
      accountDid: 'did:plc:alice',
      deviceId: 'device-id',
      state: 'pending',
      now: 1000,
    })

    await expect(getMediaMetadata('image:new')).resolves.toMatchObject({
      localRefPath: 'image:new',
      accountDid: 'did:plc:alice',
      deviceId: 'device-id',
      createdAt: new Date(1000).toISOString(),
      lastTouchedAt: new Date(1000).toISOString(),
      state: 'pending',
    })
    await expect(listMediaArtifacts()).resolves.toHaveLength(1)
  } finally {
    global.fetch = originalFetch
  }
})

test('adds metadata to a legacy web record without replacing its blob', async () => {
  const blob = new Blob(['legacy'])
  const createdAt = new Date(500).toISOString()
  mockRecords.set('image:legacy', {blob, createdAt})

  await touchMediaMetadata('image:legacy', {
    accountDid: 'did:plc:alice',
    deviceId: 'device-id',
    state: 'committed',
    now: 1000,
  })

  expect(mockRecords.get('image:legacy')).toMatchObject({blob})
  await expect(getMediaMetadata('image:legacy')).resolves.toMatchObject({
    createdAt,
    state: 'committed',
  })
})
