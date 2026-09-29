import {RichText} from '@bsky/sdk/richtext'

import {type ComposerV2PlanResult} from '#/components/ComposerV2/planner'

/**
 * Summarize a plan result as structural data only (codes, counts, keys, URIs,
 * and embed types), omitting record text and gate rule payloads so it is safe
 * to display or inspect.
 */
export function summarizeComposerV2Plan({
  result,
}: {
  result: ComposerV2PlanResult
}) {
  if (!result.ok) {
    return {
      ok: false as const,
      errors: result.errors.map(({code, postIndex, collection}) => ({
        code,
        postIndex,
        collection,
      })),
    }
  }
  return {
    ok: true as const,
    postCount: result.posts.length,
    writeCount: result.writes.length,
    posts: result.posts.map(post => ({
      postId: post.postId,
      rkey: post.rkey,
      uri: post.uri,
      cid: post.cid,
      hasReply: !!post.record.reply,
      /*
       * Final reply relationship by reference only: at:// URIs are
       * structural (repo/collection/rkey), never post text.
       */
      replyRootUri: post.record.reply?.root.uri,
      replyParentUri: post.record.reply?.parent.uri,
      embedType:
        typeof post.record.embed === 'object' && post.record.embed
          ? (post.record.embed.$type ?? 'unknown')
          : undefined,
      textGraphemes: new RichText({text: post.record.text}).graphemeLength,
      tagCount: post.record.tags?.length ?? 0,
    })),
    /*
     * Gate record writes with the URI of the post each one governs, so
     * per-post gate associations are visible without the rule payloads.
     */
    gates: result.writes.flatMap(write => {
      if (write.$type !== 'com.atproto.repo.applyWrites#create') return []
      if (
        write.collection !== 'app.bsky.feed.threadgate' &&
        write.collection !== 'app.bsky.feed.postgate'
      ) {
        return []
      }
      const subject = (write.value as {post?: unknown}).post
      return [
        {
          collection: write.collection,
          rkey: write.rkey,
          postUri: typeof subject === 'string' ? subject : undefined,
        },
      ]
    }),
    writesByCollection: result.writes.reduce<Record<string, number>>(
      (counts, write) => {
        if (write.$type === 'com.atproto.repo.applyWrites#create') {
          counts[write.collection] = (counts[write.collection] ?? 0) + 1
        }
        return counts
      },
      {},
    ),
  }
}

export type PlanSummary = ReturnType<typeof summarizeComposerV2Plan>
