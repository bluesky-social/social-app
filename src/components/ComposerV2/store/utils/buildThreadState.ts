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
    draftId: input.draftId,
    isDirty: input.isDirty ?? false,
  }
}
