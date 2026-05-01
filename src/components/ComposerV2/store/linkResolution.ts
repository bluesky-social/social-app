/**
 * Link metadata resolution worker for the ComposerV2 store.
 *
 * Runs `resolveLink` (which classifies a URI as a post / feed / list /
 * starter-pack record or as an external link card) and reports the outcome
 * back via the `onResolve` callback. The store routes `kind: 'post'` outcomes
 * to the post's `quote` field and everything else to the `embed` field.
 *
 * No cancellation surface: cancellation is handled at the store level by
 * incrementing a per-post generation counter and ignoring stale callbacks.
 * The `__resolveLink` test seam (passed through from createThreadStore)
 * lets tests inject a controllable promise.
 */
import {
  type ResolvedLink,
  type resolveLink as defaultResolveLink,
} from '#/lib/api/resolve'
import {resolveLink as importedResolveLink} from '#/lib/api/resolve'
import {createPublicAgent} from '#/state/session/agent'
import {type LinkResolutionOutcome} from './types'

export type StartUriResolutionOptions = {
  postId: string
  uri: string
  /** Test seam; defaults to the imported resolveLink. */
  resolveLink?: typeof defaultResolveLink
  onResolve: (postId: string, outcome: LinkResolutionOutcome) => void
}

export function startUriResolution(opts: StartUriResolutionOptions): void {
  const fn = opts.resolveLink ?? importedResolveLink
  fn(createPublicAgent(), opts.uri).then(
    link => opts.onResolve(opts.postId, mapResolvedLink(link)),
    err =>
      opts.onResolve(opts.postId, {
        kind: 'embed',
        embed: {
          state: 'failed',
          uri: opts.uri,
          error: String((err && (err as Error).message) ?? err),
        },
      }),
  )
}

function mapResolvedLink(link: ResolvedLink): LinkResolutionOutcome {
  if (link.type === 'external') {
    return {
      kind: 'embed',
      embed: {
        state: 'external',
        uri: link.uri,
        title: link.title,
        description: link.description,
        thumb: link.thumb,
      },
    }
  }
  if (link.kind === 'post') {
    return {kind: 'post', record: link.record, view: link.view}
  }
  if (link.kind === 'feed') {
    return {
      kind: 'embed',
      embed: {state: 'feed', record: link.record, view: link.view},
    }
  }
  if (link.kind === 'list') {
    return {
      kind: 'embed',
      embed: {state: 'list', record: link.record, view: link.view},
    }
  }
  return {
    kind: 'embed',
    embed: {state: 'starter-pack', record: link.record, view: link.view},
  }
}
