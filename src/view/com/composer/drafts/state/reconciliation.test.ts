import {getDeviceId} from '#/analytics/identifiers'
import {type app} from '#/lexicons'
import {prepareDraftMediaOperation} from './mediaLock'
import {
  DRAFT_MEDIA_GRACE_PERIOD_MS,
  reconcileDraftMedia,
} from './reconciliation'
import * as storage from './storage'
import {type DraftMediaArtifact, type DraftMediaMetadata} from './storageTypes'

jest.mock('#/analytics/identifiers', () => ({
  getDeviceId: jest.fn(() => 'this-device'),
}))

jest.mock('./logger', () => ({
  logger: {debug: jest.fn(), error: jest.fn(), warn: jest.fn()},
}))

jest.mock('./storage', () => ({
  deleteMediaFromLocal: jest.fn(),
  ensureMediaCachePopulated: jest.fn(),
  getMediaMetadata: jest.fn(),
  listMediaArtifacts: jest.fn(),
  touchMediaMetadata: jest.fn(),
}))

const accountDid = 'did:plc:alice'
const now = Date.parse('2026-09-12T12:00:00.000Z')
let artifacts: Map<string, DraftMediaArtifact>

function metadata(
  localRefPath: string,
  overrides: Partial<DraftMediaMetadata> = {},
): DraftMediaMetadata {
  return {
    localRefPath,
    accountDid,
    deviceId: 'this-device',
    createdAt: new Date(now - DRAFT_MEDIA_GRACE_PERIOD_MS * 2).toISOString(),
    lastTouchedAt: new Date(
      now - DRAFT_MEDIA_GRACE_PERIOD_MS * 2,
    ).toISOString(),
    state: 'committed',
    ...overrides,
  }
}

function draftView(
  refs: string[],
  deviceId: string | undefined = 'this-device',
): app.bsky.draft.defs.DraftView {
  return {
    id: `draft-${refs.join('-')}`,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
    draft: {
      $type: 'app.bsky.draft.defs#draft',
      deviceId,
      posts: [
        {
          $type: 'app.bsky.draft.defs#draftPost',
          text: '',
          embedImages: refs.map(path => ({
            $type: 'app.bsky.draft.defs#draftEmbedImage',
            localRef: {
              $type: 'app.bsky.draft.defs#draftEmbedLocalRef',
              path,
            },
          })),
        },
      ],
    },
  } as app.bsky.draft.defs.DraftView
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(getDeviceId).mockReturnValue('this-device')
  artifacts = new Map()
  jest.mocked(storage.ensureMediaCachePopulated).mockResolvedValue(undefined)
  jest.mocked(storage.listMediaArtifacts).mockImplementation(() =>
    Promise.resolve(
      Array.from(artifacts.values()).map(artifact => ({
        ...artifact,
        metadata: artifact.metadata ? {...artifact.metadata} : undefined,
      })),
    ),
  )
  jest
    .mocked(storage.getMediaMetadata)
    .mockImplementation(ref =>
      Promise.resolve(
        artifacts.get(ref)?.metadata
          ? {...artifacts.get(ref)!.metadata!}
          : undefined,
      ),
    )
  jest.mocked(storage.touchMediaMetadata).mockImplementation((ref, options) => {
    const artifact = artifacts.get(ref)
    if (!artifact) throw new Error('missing media')
    const touchedAt = new Date(options.now ?? Date.now()).toISOString()
    artifact.metadata = {
      localRefPath: ref,
      accountDid: options.accountDid,
      deviceId: options.deviceId,
      createdAt:
        artifact.metadata?.createdAt ||
        options.createdAt ||
        artifact.fileCreatedAt ||
        touchedAt,
      lastTouchedAt: touchedAt,
      state: options.state,
    }
    return Promise.resolve()
  })
  jest.mocked(storage.deleteMediaFromLocal).mockImplementation(ref => {
    artifacts.delete(ref)
    return Promise.resolve()
  })
})

test('migrates referenced legacy media idempotently', async () => {
  const ref = 'image:legacy'
  const fileCreatedAt = new Date(now - 1000).toISOString()
  artifacts.set(ref, {localRefPath: ref, fileCreatedAt})
  const drafts = [draftView([ref])]

  const first = await reconcileDraftMedia({drafts, accountDid, now})
  const second = await reconcileDraftMedia({drafts, accountDid, now})

  expect(first).toMatchObject({migrated: 1, retained: 1, deleted: 0})
  expect(second).toMatchObject({migrated: 0, retained: 1, deleted: 0})
  expect(artifacts.get(ref)?.metadata).toMatchObject({
    accountDid,
    createdAt: fileCreatedAt,
    state: 'committed',
  })
})

test('retains current-device and device-less roots but ignores other-device roots', async () => {
  for (const ref of ['current', 'legacy', 'other-device']) {
    artifacts.set(ref, {localRefPath: ref, metadata: metadata(ref)})
  }

  const result = await reconcileDraftMedia({
    drafts: [
      draftView(['current']),
      draftView(['legacy'], undefined),
      draftView(['other-device'], 'another-device'),
    ],
    accountDid,
    now,
  })

  expect(result).toMatchObject({retained: 2, deleted: 1})
  expect(artifacts.has('current')).toBe(true)
  expect(artifacts.has('legacy')).toBe(true)
  expect(artifacts.has('other-device')).toBe(false)
})

test('only deletes stale unreferenced media owned by the current account', async () => {
  artifacts.set('other-account', {
    localRefPath: 'other-account',
    metadata: metadata('other-account', {accountDid: 'did:plc:bob'}),
  })
  artifacts.set('recent-pending', {
    localRefPath: 'recent-pending',
    metadata: metadata('recent-pending', {
      lastTouchedAt: new Date(now - 1000).toISOString(),
      state: 'pending',
    }),
  })
  artifacts.set('unowned', {localRefPath: 'unowned'})
  artifacts.set('stale-owned', {
    localRefPath: 'stale-owned',
    metadata: metadata('stale-owned'),
  })

  const result = await reconcileDraftMedia({drafts: [], accountDid, now})

  expect(result).toMatchObject({migrated: 0, retained: 3, deleted: 1})
  expect(storage.deleteMediaFromLocal).toHaveBeenCalledWith('stale-owned')
  expect(artifacts.has('other-account')).toBe(true)
  expect(artifacts.has('recent-pending')).toBe(true)
  expect(artifacts.has('unowned')).toBe(true)
})

test('does not delete a ref whose pending touch is waiting on reconciliation', async () => {
  const ref = 'image:retrying'
  const artifact = {localRefPath: ref, metadata: metadata(ref)}
  artifacts.set(ref, artifact)

  let releaseInventory!: () => void
  jest.mocked(storage.listMediaArtifacts).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        releaseInventory = () => resolve([artifact])
      }),
  )

  const reconciliation = reconcileDraftMedia({drafts: [], accountDid, now})
  while (!releaseInventory) await Promise.resolve()
  const pendingTouch = prepareDraftMediaOperation([ref], () =>
    Promise.resolve(),
  )
  releaseInventory()

  await reconciliation
  await pendingTouch

  expect(storage.deleteMediaFromLocal).not.toHaveBeenCalled()
  expect(artifacts.has(ref)).toBe(true)
})

test('keeps a shared ref until the final server reference is gone and grace expires', async () => {
  const ref = 'image:shared'
  artifacts.set(ref, {localRefPath: ref, metadata: metadata(ref)})

  await reconcileDraftMedia({
    drafts: [draftView([ref]), draftView([ref])],
    accountDid,
    now,
  })
  await reconcileDraftMedia({
    drafts: [draftView([ref])],
    accountDid,
    now: now + DRAFT_MEDIA_GRACE_PERIOD_MS,
  })

  expect(artifacts.has(ref)).toBe(true)

  await reconcileDraftMedia({
    drafts: [],
    accountDid,
    now: now + DRAFT_MEDIA_GRACE_PERIOD_MS * 2,
  })

  expect(artifacts.has(ref)).toBe(false)
})
