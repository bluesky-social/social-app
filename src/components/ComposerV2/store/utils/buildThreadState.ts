import {
  type ThreadState,
  type ThreadStoreInitialState,
} from '#/components/ComposerV2/store/types'
import {buildThreadPost} from '#/components/ComposerV2/store/utils/buildThreadPost'

/** All posts are constructed before any upload or URI resolution can start. */
export function buildThreadState(
  input: ThreadStoreInitialState,
  createId: () => string,
): ThreadState {
  const posts: ThreadState['posts'] = {}
  for (const postInput of input.posts?.length ? input.posts : [{}]) {
    const postId = createId()
    posts[postId] = buildThreadPost(postId, createId, postInput)
  }
  return {
    posts,
    replyTo: input.replyTo
      ? {
          ...input.replyTo,
          langs: [...input.replyTo.langs],
          author: cloneSerializable(input.replyTo.author),
          embed: input.replyTo.embed
            ? cloneSerializable(input.replyTo.embed)
            : undefined,
        }
      : undefined,
    threadgateAllowRules: input.threadgateAllowRules
      ? input.threadgateAllowRules.map(rule => cloneSerializable(rule))
      : input.threadgateAllowRules,
    postgateEmbeddingRules: (input.postgateEmbeddingRules ?? []).map(rule =>
      cloneSerializable(rule),
    ),
    draftId: input.draftId,
    isDirty: input.isDirty ?? false,
  }
}

export function cloneSerializable<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(item => cloneSerializable(item)) as T
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        cloneSerializable(item),
      ]),
    ) as T
  }
  return value
}
