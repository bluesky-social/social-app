import {type BlobRef} from '@atproto/lex'

import {errorClass, type VideoTelemetry} from '#/lib/media/video/telemetry'
import {
  type VideoAbandonReason,
  type VideoRestartReason,
} from '#/lib/media/video/types'
import {type ComposerV2Plan} from '#/components/ComposerV2/planner'
import {
  type PostMediaImage,
  type PostMediaVideo,
  type PreparedImage,
  type PreparedVideo,
  type ResolvedSourceMetadata,
  type UploadDiagnostic,
  type UploadedCaption,
  type UploadRuntime,
  type UploadStatus,
} from '#/components/ComposerV2/store/types'
import {
  imageUploadDependencies,
  videoUploadDependencies,
} from '#/components/ComposerV2/store/uploadDependencies'
import {
  startImageUpload,
  startVideoUpload,
  type UploadAttempt,
  type UploadTask,
  type UploadWorkerOverrides,
} from '#/components/ComposerV2/store/uploads'
import {createRetainedCompressionCache} from '#/components/ComposerV2/store/utils/createRetainedCompressionCache'
import {type AnalyticsContextType} from '#/analytics'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

/**
 * What a current upload attempt tells its owner. The service has already
 * done its own bookkeeping (freed the id, retired compression, registered
 * telemetry) by the time one is delivered.
 */
export type MediaUploadUpdate =
  | {
      type: 'status'
      postId: string
      mediaId: string
      status: Exclude<UploadStatus, {state: 'failed'}>
    }
  | {
      type: 'failure'
      postId: string
      mediaId: string
      status: Extract<UploadStatus, {state: 'failed'}>
      diagnostic: UploadDiagnostic
    }
  | {
      type: 'source-metadata'
      postId: string
      mediaId: string
      metadata: ResolvedSourceMetadata
    }
  | {
      type: 'image-compression-result'
      postId: string
      mediaId: string
      prepared: PreparedImage
    }
  | {
      type: 'video-compression-result'
      postId: string
      mediaId: string
      prepared: PreparedVideo
    }
  | {
      type: 'caption-blobs'
      postId: string
      mediaId: string
      captions: UploadedCaption[]
    }
  | {type: 'video-blob'; postId: string; mediaId: string; blob: BlobRef}
  /** A worker threw while starting. The service rethrows after emitting. */
  | {type: 'start-failed'; postId: string; mediaId: string; cause: unknown}

/**
 * Runs eager media uploads for one composer session: attempt lifetimes,
 * retained video compression, and video telemetry identity. Callers decide
 * when to start and stop; every effect on the composition arrives through
 * `onUpdate`, and only from the attempt currently registered for that media.
 */
export type MediaUploads = {
  /**
   * Starts an attempt for this item. Does nothing while an attempt for the
   * id is running or after `destroy`. A synchronous worker throw cleans up
   * the registration, emits `start-failed` if the attempt is still current,
   * then rethrows.
   */
  start(args: {
    postId: string
    item: PostMediaImage | PostMediaVideo
    restartReason?: VideoRestartReason
  }): void
  /** Stops the running attempt. Retained compression stays for a retry. */
  cancel(args: {mediaId: string; abandoned?: VideoAbandonReason}): void
  /**
   * The item left the composition: cancels it and drops everything kept for
   * it. Captured plans can still report publication.
   */
  forget(args: {mediaId: string; abandoned?: VideoAbandonReason}): void
  /**
   * Reports the videos a successful write published, through the telemetry of
   * the attempt that uploaded each one. Call only after the writer succeeds,
   * never for an uncertain outcome. Videos are matched by the uploaded blob
   * the plan embeds, so later edits cannot misattribute them, and each
   * reports once. Publication already happened, so this works after `destroy`.
   */
  reportPublished(args: {plan: ComposerV2Plan}): void
  /**
   * Reports a write that was sent but may not have committed. Call only when
   * the writer rejects after dispatch, not for a precondition failure
   * (`ComposerV2WritePreconditionError`) or a 4xx refusal
   * (`ComposerV2WriteRejectedError`). The videos stay publishable, since
   * a later reconciliation may find the posts.
   */
  reportPublishUncertain(args: {plan: ComposerV2Plan; cause: unknown}): void
  /**
   * Cancels everything and drops retained state. Idempotent. Publication
   * reporting keeps working.
   */
  destroy(args?: {abandoned?: VideoAbandonReason}): void
}

/** The uploaded video blob a planned post record embeds, if any. */
function embeddedVideoBlob({
  embed,
}: {
  embed: ComposerV2Plan['posts'][number]['record']['embed']
}): BlobRef | undefined {
  if (bsky.isType(app.bsky.embed.video.main, embed)) return embed.video
  if (
    bsky.isType(app.bsky.embed.recordWithMedia.main, embed) &&
    bsky.isType(app.bsky.embed.video.main, embed.media)
  ) {
    return embed.media.video
  }
  return undefined
}

export function createMediaUploads({
  pdsClient,
  pdsUrl,
  metric,
  onUpdate,
  __uploadWorkers,
}: UploadRuntime & {
  /** The session's analytics sink for video telemetry and publication. */
  metric: AnalyticsContextType['metric']
  onUpdate: (update: MediaUploadUpdate) => void
  /**
   * Test-only worker seam; never selected implicitly in production. Wrap the
   * real worker to run it with fake dependencies.
   */
  __uploadWorkers?: UploadWorkerOverrides
}): MediaUploads {
  let destroyed = false
  /** Cancellation handles belong to the session, not its published snapshots. */
  const tasks = new Map<string, UploadTask>()
  /**
   * Telemetry for uploaded videos, keyed by their blob, until a write
   * publishes them. Weak keys drop entries whose blob nothing references.
   */
  const publishableVideos = new WeakMap<BlobRef, VideoTelemetry>()
  const compression = createRetainedCompressionCache()
  /**
   * The latest attempt's uploadId per video, linking restarts to it. Kept
   * across retries and caption restarts; cleared on forget and destroy.
   */
  const videoUploadIds = new Map<string, string>()

  function cancel({
    mediaId,
    abandoned,
  }: {
    mediaId: string
    abandoned?: VideoAbandonReason
  }) {
    const task = tasks.get(mediaId)
    tasks.delete(mediaId)
    task?.cancel({abandoned})
  }

  function start({
    postId,
    item,
    restartReason,
  }: {
    postId: string
    item: PostMediaImage | PostMediaVideo
    restartReason?: VideoRestartReason
  }) {
    const mediaId = item.id
    if (destroyed || tasks.has(mediaId)) return

    /*
     * Register ownership before invoking a worker. The real workers report
     * their first phase ('compressing' or 'validating') synchronously, before
     * their first await and before returning a handle. That report notifies
     * the owner, so callbacks must not close over an uninitialised task, and
     * cancellation can be requested before `started` is assigned.
     */
    let started: UploadTask | undefined
    let cancelled: {abandoned?: VideoAbandonReason} | undefined
    const registered: UploadTask = {
      cancel(options = {}) {
        cancelled = options
        started?.cancel(options)
      },
    }
    tasks.set(mediaId, registered)
    /* Calls from a worker the service has since retired or destroyed are ignored. */
    const isCurrent = () => !destroyed && tasks.get(mediaId) === registered
    const attempt: UploadAttempt = {
      reportStatus: ({status}) => {
        if (!isCurrent()) return
        if (status.state === 'uploaded') {
          tasks.delete(mediaId)
          compression.retire({mediaId})
        }
        onUpdate({type: 'status', postId, mediaId, status})
      },
      reportFailure: ({status, diagnostic}) => {
        if (!isCurrent()) return
        cancel({mediaId})
        /* Nothing can retry a failure that is not retryable. */
        if (!status.retryable) compression.retire({mediaId})
        onUpdate({type: 'failure', postId, mediaId, status, diagnostic})
      },
      setSourceMetadata: ({metadata}) => {
        if (isCurrent()) {
          onUpdate({type: 'source-metadata', postId, mediaId, metadata})
        }
      },
    }
    const runtime = {pdsClient, pdsUrl}
    try {
      started =
        item.kind === 'image'
          ? (__uploadWorkers?.startImageUpload ?? startImageUpload)({
              ...runtime,
              ...imageUploadDependencies,
              media: item,
              attempt: {
                ...attempt,
                setCompressionResult: ({prepared}) => {
                  if (isCurrent()) {
                    onUpdate({
                      type: 'image-compression-result',
                      postId,
                      mediaId,
                      prepared,
                    })
                  }
                },
              },
            })
          : (__uploadWorkers?.startVideoUpload ?? startVideoUpload)({
              ...runtime,
              ...videoUploadDependencies,
              media: item,
              metric,
              restart: restartReason && {
                reason: restartReason,
                previousUploadId: videoUploadIds.get(mediaId),
              },
              uploadedVideoTelemetry:
                item.videoBlob && publishableVideos.get(item.videoBlob),
              attempt: {
                ...attempt,
                setCompressionResult: ({prepared}) => {
                  if (isCurrent()) {
                    onUpdate({
                      type: 'video-compression-result',
                      postId,
                      mediaId,
                      prepared,
                    })
                  }
                },
                setCaptionBlobs: ({captions}) => {
                  if (isCurrent()) {
                    onUpdate({type: 'caption-blobs', postId, mediaId, captions})
                  }
                },
                acquireCompressedVideo: () => {
                  if (!isCurrent()) return undefined
                  return compression.lease({mediaId})
                },
                retainCompressedVideo: ({video, release}) => {
                  if (!isCurrent()) return undefined
                  return compression.retain({mediaId, video, release})
                },
                setVideoTelemetry: ({telemetry, blob}) => {
                  if (!isCurrent()) return
                  videoUploadIds.set(mediaId, telemetry.uploadId)
                  if (!blob) return
                  /*
                   * Register the telemetry before notifying the owner: a
                   * subscriber may restart this item, and the restart looks
                   * it up by blob.
                   */
                  publishableVideos.set(blob, telemetry)
                  compression.retire({mediaId})
                  onUpdate({type: 'video-blob', postId, mediaId, blob})
                },
              },
            })
      /*
       * The owner notified by that first report may remove the item or
       * destroy the session, cancelling `registered` while `started` is still
       * undefined. The ownership guards above already ignore the worker's
       * later reports, but only its own handle aborts it: without this, an
       * image would still be uploaded after compression and a video would go
       * on to compress and upload.
       */
      if (cancelled) started.cancel(cancelled)
    } catch (cause) {
      if (isCurrent()) {
        cancel({mediaId})
        onUpdate({type: 'start-failed', postId, mediaId, cause})
      }
      throw cause
    }
  }

  function forget({
    mediaId,
    abandoned,
  }: {
    mediaId: string
    abandoned?: VideoAbandonReason
  }) {
    cancel({mediaId, abandoned})
    compression.retire({mediaId})
    videoUploadIds.delete(mediaId)
  }

  function reportPublished({plan}: {plan: ComposerV2Plan}) {
    for (const post of plan.posts) {
      const blob = embeddedVideoBlob({embed: post.record.embed})
      const telemetry = blob && publishableVideos.get(blob)
      if (!blob || !telemetry) continue
      publishableVideos.delete(blob)
      telemetry.published()
    }
  }

  function reportPublishUncertain({
    plan,
    cause,
  }: {
    plan: ComposerV2Plan
    cause: unknown
  }) {
    const uploadIds: string[] = []
    for (const post of plan.posts) {
      const blob = embeddedVideoBlob({embed: post.record.embed})
      const telemetry = blob && publishableVideos.get(blob)
      if (telemetry) uploadIds.push(telemetry.uploadId)
    }
    metric('composer:publish:uncertain', {
      postCount: plan.posts.length,
      videoUploadIds: uploadIds,
      errorClass: errorClass(cause),
    })
  }

  function destroy({abandoned}: {abandoned?: VideoAbandonReason} = {}) {
    if (destroyed) return
    destroyed = true
    const running = [...tasks.values()]
    tasks.clear()
    for (const task of running) task.cancel({abandoned})
    compression.clear()
    videoUploadIds.clear()
  }

  return {
    start,
    cancel,
    forget,
    reportPublished,
    reportPublishUncertain,
    destroy,
  }
}
