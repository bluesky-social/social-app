import {getDeviceId} from '#/analytics/identifiers'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {logger} from './logger'
import {
  isDraftMediaRefProtected,
  serializeDraftMediaOperation,
} from './mediaLock'
import * as storage from './storage'

export const DRAFT_MEDIA_GRACE_PERIOD_MS = 24 * 60 * 60 * 1000

export type DraftMediaReconciliationResult = {
  migrated: number
  retained: number
  deleted: number
}

function extractLocalRefs(draft: app.bsky.draft.defs.Draft): Set<string> {
  const refs = new Set<string>()
  for (const post of draft.posts) {
    for (const image of post.embedImages ?? []) {
      refs.add(image.localRef.path)
    }
    for (const item of post.embedGallery?.items ?? []) {
      if (bsky.isType(app.bsky.draft.defs.draftEmbedImage, item)) {
        refs.add(item.localRef.path)
      }
    }
    for (const video of post.embedVideos ?? []) {
      refs.add(video.localRef.path)
    }
  }
  return refs
}

function isOldEnoughToDelete(lastTouchedAt: string, now: number): boolean {
  const touchedAt = new Date(lastTouchedAt).getTime()
  return (
    Number.isFinite(touchedAt) && now - touchedAt >= DRAFT_MEDIA_GRACE_PERIOD_MS
  )
}

/**
 * Reconcile local media against a complete, authoritative server inventory.
 * Callers must not pass a partial page of drafts.
 */
export function reconcileDraftMedia({
  drafts,
  accountDid,
  now = Date.now(),
}: {
  drafts: app.bsky.draft.defs.DraftView[]
  accountDid: string
  now?: number
}): Promise<DraftMediaReconciliationResult> {
  return serializeDraftMediaOperation(async () => {
    const currentDeviceId = getDeviceId()
    const metadataDeviceId = currentDeviceId ?? 'unknown'
    const roots = new Set<string>()

    for (const view of drafts) {
      if (!view.draft.deviceId || view.draft.deviceId === currentDeviceId) {
        for (const ref of extractLocalRefs(view.draft)) {
          roots.add(ref)
        }
      }
    }

    await storage.ensureMediaCachePopulated()
    const artifacts = await storage.listMediaArtifacts()
    const artifactsByRef = new Map(
      artifacts.map(artifact => [artifact.localRefPath, artifact]),
    )
    let migrated = 0
    let deleted = 0

    for (const localRefPath of roots) {
      const artifact = artifactsByRef.get(localRefPath)
      if (!artifact) continue

      if (!artifact.metadata) {
        await storage.touchMediaMetadata(localRefPath, {
          accountDid,
          deviceId: metadataDeviceId,
          state: 'committed',
          now,
          createdAt: artifact.fileCreatedAt,
        })
        migrated++
      } else if (artifact.metadata.accountDid === accountDid) {
        await storage.touchMediaMetadata(localRefPath, {
          accountDid,
          deviceId: artifact.metadata.deviceId || metadataDeviceId,
          state: 'committed',
          now,
        })
      }
    }

    for (const artifact of artifacts) {
      if (roots.has(artifact.localRefPath)) continue
      if (isDraftMediaRefProtected(artifact.localRefPath)) continue
      if (!artifact.metadata) continue
      if (artifact.metadata.accountDid !== accountDid) continue
      if (!isOldEnoughToDelete(artifact.metadata.lastTouchedAt, now)) continue

      /*
       * Re-read immediately before deletion. A save may have touched the ref
       * since the directory inventory was built; the shared lock also keeps
       * save preparation from interleaving with this sweep.
       */
      const latest = await storage.getMediaMetadata(artifact.localRefPath)
      if (
        isDraftMediaRefProtected(artifact.localRefPath) ||
        !latest ||
        latest.accountDid !== accountDid ||
        !isOldEnoughToDelete(latest.lastTouchedAt, now)
      ) {
        continue
      }

      try {
        await storage.deleteMediaFromLocal(artifact.localRefPath)
        deleted++
      } catch (error) {
        logger.error('Failed to delete unreferenced draft media', {
          safeMessage: error,
        })
      }
    }

    const result = {
      migrated,
      retained: artifacts.length - deleted,
      deleted,
    }
    logger.debug('Draft media reconciliation complete', result)
    return result
  })
}
