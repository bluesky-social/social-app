import {type Client} from '@atproto/lex'
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import {isNetworkError} from '#/lib/strings/errors'
import {matchXrpcError} from '#/lib/xrpc-error'
import {useAppviewClient, useChatClient, useSession} from '#/state/session'
import {type ComposerState} from '#/view/com/composer/state/composer'
import {useAnalytics} from '#/analytics'
import {getDeviceId} from '#/analytics/identifiers'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {composerStateToDraft, draftViewToSummary} from './api'
import {logger} from './logger'
import {
  prepareDraftMediaOperation,
  serializeDraftMediaOperation,
} from './mediaLock'
import {reconcileDraftMedia} from './reconciliation'
import * as storage from './storage'

function draftsQueryKey(accountDid: string | undefined) {
  return ['drafts', accountDid]
}

/** Fetch every server page before returning an authoritative inventory. */
export async function fetchCompleteDraftInventory(
  client: Client,
  expectedAccountDid?: string,
): Promise<app.bsky.draft.defs.DraftView[]> {
  const drafts: app.bsky.draft.defs.DraftView[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  do {
    if (expectedAccountDid && client.did !== expectedAccountDid) {
      throw new Error('Account changed during draft inventory')
    }
    const data = await client.call(app.bsky.draft.getDrafts, {
      cursor,
      limit: 100,
    })
    if (expectedAccountDid && client.did !== expectedAccountDid) {
      throw new Error('Account changed during draft inventory')
    }
    drafts.push(...data.drafts)
    cursor = data.cursor || undefined
    if (cursor) {
      if (seenCursors.has(cursor)) {
        throw new Error('Draft inventory returned a repeated cursor')
      }
      seenCursors.add(cursor)
    }
  } while (cursor)

  return drafts
}

export async function reconcileCompleteInventory(
  client: Client,
  accountDid: string,
) {
  const drafts = await fetchCompleteDraftInventory(client, accountDid)
  return reconcileDraftMedia({drafts, accountDid})
}

const scheduledReconciliations = new Map<string, Promise<void>>()

function scheduleDraftMediaReconciliation(client: Client, accountDid: string) {
  if (scheduledReconciliations.has(accountDid)) return

  const operation = reconcileCompleteInventory(client, accountDid)
    .then(() => undefined)
    .catch(error => {
      if (!isNetworkError(error)) {
        logger.error('Failed to reconcile draft media', {safeMessage: error})
      }
    })
    .finally(() => {
      scheduledReconciliations.delete(accountDid)
    })
  scheduledReconciliations.set(accountDid, operation)
}

/** Hook to list all drafts for the current account. */
export function useDraftsQuery() {
  const client = useAppviewClient()
  const {currentAccount} = useSession()
  const ax = useAnalytics()
  const accountDid = currentAccount?.did

  return useInfiniteQuery({
    queryKey: draftsQueryKey(accountDid),
    queryFn: async () => {
      if (!accountDid) throw new Error('Cannot load drafts without an account')

      const drafts = await fetchCompleteDraftInventory(client, accountDid)
      try {
        await reconcileDraftMedia({drafts, accountDid})
      } catch (error) {
        logger.error('Failed to reconcile draft media after inventory', {
          safeMessage: error,
        })
      }

      return {
        cursor: undefined,
        drafts: drafts.map(view =>
          draftViewToSummary({
            view,
            analytics: ax,
          }),
        ),
      }
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: () => undefined,
    enabled: !!accountDid,
  })
}

export async function loadDraftMedia(
  draft: app.bsky.draft.defs.Draft,
): Promise<{loadedMedia: Map<string, string>}> {
  const loadedMedia = new Map<string, string>()
  if (draft.deviceId && draft.deviceId !== getDeviceId()) {
    return {loadedMedia}
  }

  for (const post of draft.posts) {
    for (const img of post.embedImages ?? []) {
      try {
        loadedMedia.set(
          img.localRef.path,
          await storage.loadMediaFromLocal(img.localRef.path),
        )
      } catch (error) {
        logger.error('Failed to load draft image', {safeMessage: error})
      }
    }
    for (const item of post.embedGallery?.items ?? []) {
      if (!bsky.isType(app.bsky.draft.defs.draftEmbedImage, item)) continue
      try {
        loadedMedia.set(
          item.localRef.path,
          await storage.loadMediaFromLocal(item.localRef.path),
        )
      } catch (error) {
        logger.error('Failed to load draft gallery image', {safeMessage: error})
      }
    }
    for (const vid of post.embedVideos ?? []) {
      try {
        loadedMedia.set(
          vid.localRef.path,
          await storage.loadMediaFromLocal(vid.localRef.path),
        )
      } catch (error) {
        logger.error('Failed to load draft video', {safeMessage: error})
      }
    }
  }

  return {loadedMedia}
}

export async function saveDraft({
  client,
  chatClient,
  accountDid,
  composerState,
  existingDraftId,
}: {
  client: Client
  chatClient: Client
  accountDid: string
  composerState: ComposerState
  existingDraftId?: string
}): Promise<{draftId: string; localRefPaths: Map<string, string>}> {
  const {draft, localRefPaths} = await composerStateToDraft(
    {appviewClient: client, chatClient},
    composerState,
  )

  logger.debug('saving draft', {
    existingDraftId,
    localRefPathCount: localRefPaths.size,
  })

  await prepareDraftMediaOperation(localRefPaths.keys(), async () => {
    await storage.ensureMediaCachePopulated()
    for (const [localRefPath, sourcePath] of localRefPaths) {
      const ownership = {
        accountDid,
        deviceId: getDeviceId() ?? 'unknown',
        state: 'pending' as const,
      }
      if (storage.mediaExists(localRefPath)) {
        await storage.touchMediaMetadata(localRefPath, ownership)
      } else {
        await storage.saveMediaToLocal(localRefPath, sourcePath, ownership)
      }
    }
  })

  let draftId: string
  if (existingDraftId) {
    await client.call(app.bsky.draft.updateDraft, {
      draft: {id: existingDraftId, draft},
    })
    draftId = existingDraftId
  } else {
    const data = await client.call(app.bsky.draft.createDraft, {draft})
    draftId = data.id
  }

  return {draftId, localRefPaths}
}

export function useSaveDraftMutation() {
  const client = useAppviewClient()
  const chatClient = useChatClient()
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()
  const accountDid = currentAccount?.did

  return useMutation({
    mutationFn: async ({
      composerState,
      existingDraftId,
    }: {
      composerState: ComposerState
      existingDraftId?: string
    }): Promise<{draftId: string; localRefPaths: Map<string, string>}> => {
      if (!accountDid) throw new Error('Cannot save a draft without an account')
      return saveDraft({
        client,
        chatClient,
        accountDid,
        composerState,
        existingDraftId,
      })
    },
    onSuccess: async ({draftId, localRefPaths}) => {
      if (!accountDid) return
      try {
        await serializeDraftMediaOperation(async () => {
          for (const localRefPath of localRefPaths.keys()) {
            await storage.touchMediaMetadata(localRefPath, {
              accountDid,
              deviceId: getDeviceId() ?? 'unknown',
              state: 'committed',
            })
          }
        })
      } catch (error) {
        logger.error('Failed to commit saved draft media metadata', {
          safeMessage: error,
        })
      }

      logger.debug('draft save complete', {draftId})
      await queryClient.invalidateQueries({
        queryKey: draftsQueryKey(accountDid),
      })
      scheduleDraftMediaReconciliation(client, accountDid)
    },
    onError: error => {
      if (matchXrpcError(error, app.bsky.draft.createDraft)) {
        logger.error('Draft limit reached', {safeMessage: error.message})
      } else if (!isNetworkError(error)) {
        logger.error('Could not create draft (reason unknown)', {
          safeMessage: error,
        })
      }
    },
  })
}

export function useDeleteDraftMutation() {
  const client = useAppviewClient()
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()
  const accountDid = currentAccount?.did

  return useMutation({
    mutationFn: async ({draftId}: {draftId: string; draft: unknown}) => {
      await client.call(app.bsky.draft.deleteDraft, {id: draftId})
    },
    onSuccess: async () => {
      if (!accountDid) return
      await queryClient.invalidateQueries({
        queryKey: draftsQueryKey(accountDid),
      })
      scheduleDraftMediaReconciliation(client, accountDid)
    },
  })
}

export function useCleanupPublishedDraftMutation() {
  const client = useAppviewClient()
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()
  const accountDid = currentAccount?.did

  return useMutation({
    mutationFn: async ({
      draftId,
      originalLocalRefs,
    }: {
      draftId: string
      originalLocalRefs: Set<string>
    }) => {
      logger.debug('cleaning up published draft', {
        draftId,
        mediaFileCount: originalLocalRefs.size,
      })
      await client.call(app.bsky.draft.deleteDraft, {id: draftId})
    },
    onSuccess: async () => {
      if (!accountDid) return
      await queryClient.invalidateQueries({
        queryKey: draftsQueryKey(accountDid),
      })
      scheduleDraftMediaReconciliation(client, accountDid)
    },
    onError: error => {
      if (!isNetworkError(error)) {
        logger.warn('Failed to clean up published draft', {
          safeMessage: error,
        })
      }
    },
  })
}
