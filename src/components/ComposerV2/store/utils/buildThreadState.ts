import {
  type ThreadState,
  type ThreadStoreInitialState,
} from '#/components/ComposerV2/store/types'
import {buildThreadPost} from '#/components/ComposerV2/store/utils/buildThreadPost'

/**
 * Build the store-owned snapshot before any upload or URI resolution can start.
 * Adapters may share source gate values; editable gate data is copied here so
 * later caller mutations cannot affect live state.
 */
export function buildThreadState({
  input,
  createId,
}: {
  input: ThreadStoreInitialState
  createId: () => string
}): ThreadState {
  const posts: ThreadState['posts'] = {}
  for (const postInput of input.posts?.length ? input.posts : [{}]) {
    const postId = createId()
    posts[postId] = buildThreadPost({postId, createId, input: postInput})
  }
  return {
    posts,
    replyTo: input.replyTo
      ? {
          ...input.replyTo,
          langs: [...input.replyTo.langs],
          author: cloneSerializable({value: input.replyTo.author}),
          embed: input.replyTo.embed
            ? cloneSerializable({value: input.replyTo.embed})
            : undefined,
        }
      : undefined,
    threadgateAllowRules: input.threadgateAllowRules
      ? input.threadgateAllowRules.map(rule => cloneSerializable({value: rule}))
      : input.threadgateAllowRules,
    postgateEmbeddingRules: (input.postgateEmbeddingRules ?? []).map(rule =>
      cloneSerializable({value: rule}),
    ),
    draftId: input.draftId,
    isDirty: input.isDirty ?? false,
  }
}

export function cloneSerializable<T>({value}: {value: T}): T {
  if (Array.isArray(value)) {
    return value.map(item => cloneSerializable({value: item})) as T
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        cloneSerializable({value: item}),
      ]),
    ) as T
  }
  return value
}
