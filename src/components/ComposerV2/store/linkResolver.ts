/*
 * Link resolution with supersession and failure classification.
 *
 * This module is deliberately independent of ComposerV2: it knows nothing about
 * posts, slots, or store state, only keyed requests. That keeps it movable to
 * `#/lib` if another surface needs the same behavior.
 */
import {
  EmbeddingDisabledError,
  type LinkResolvers,
  type ResolvedLink,
  resolveLink,
} from '#/lib/api/resolve'

/** Embedding-disabled is permanent; unknown failures can be retried. */
export type LinkResolutionFailureCode = 'embedding-disabled' | 'unknown'

export type LinkResolution =
  | {ok: true; link: ResolvedLink}
  | {
      ok: false
      code: LinkResolutionFailureCode
      /**
       * Whether the failure is worth retrying. Today only EmbeddingDisabledError
       * is permanent (the author has forbidden quoting); anything else is a
       * transient or unknown failure.
       */
      retryable: boolean
      /** The raw thrown value; untrusted, so keep it out of displayed state. */
      cause: unknown
    }

export type LinkResolver = {
  /**
   * Resolve `uri` for `key`, superseding any earlier request for that key.
   * Resolves to undefined when superseded, cancelled, or destroyed first.
   * Never rejects: synchronous throws and rejections become failures.
   */
  resolve(args: {key: string; uri: string}): Promise<LinkResolution | undefined>
  /** Drop the in-flight request for `key`, if any. */
  cancel(args: {key: string}): void
  /** Drop everything; later resolve calls resolve to undefined. Idempotent. */
  destroy(): void
}

/** Classify a thrown error from `resolveLink` into a failure result. */
function classifyFailure({cause}: {cause: unknown}): LinkResolution {
  if (cause instanceof EmbeddingDisabledError) {
    return {ok: false, code: 'embedding-disabled', retryable: false, cause}
  }
  return {ok: false, code: 'unknown', retryable: true, cause}
}

export function createLinkResolver({
  resolvers,
  resolve = resolveLink,
}: {
  resolvers: LinkResolvers
  /** Override the network call; useful for deterministic tests. */
  resolve?: typeof resolveLink
}): LinkResolver {
  /** The live request token per key; a settled request must still own it. */
  const current = new Map<string, object>()
  let destroyed = false

  return {
    resolve({key, uri}) {
      if (destroyed) return Promise.resolve(undefined)
      const token = {}
      current.set(key, token)

      const settle = (result: LinkResolution) => {
        if (current.get(key) !== token) return undefined
        current.delete(key)
        return result
      }
      try {
        return resolve(resolvers, uri).then(
          link => settle({ok: true, link}),
          cause => settle(classifyFailure({cause})),
        )
      } catch (cause) {
        /*
         * A synchronous throw is treated like a rejection. Settle on a later
         * turn so the caller can still cancel or supersede after resolve()
         * returns.
         */
        return Promise.resolve().then(() => settle(classifyFailure({cause})))
      }
    },
    cancel({key}) {
      current.delete(key)
    },
    destroy() {
      destroyed = true
      current.clear()
    },
  }
}
