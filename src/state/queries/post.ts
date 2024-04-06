import {useCallback} from 'react'
import {AppBskyFeedDefs, AtUri} from '@atproto/api'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {track} from '#/lib/analytics/analytics'
import {useToggleMutationQueue} from '#/lib/hooks/useToggleMutationQueue'
import {logEvent, LogEvents} from '#/lib/statsig/statsig'
import {updatePostShadow} from '#/state/cache/post-shadow'
import {Shadow} from '#/state/cache/types'
import {getAgent} from '#/state/session'

const RQKEY_ROOT = 'post'
export const RQKEY = (postUri: string) => [RQKEY_ROOT, postUri]

export function usePostQuery(uri: string | undefined) {
  return useQuery<AppBskyFeedDefs.PostView>({
    queryKey: RQKEY(uri || ''),
    async queryFn() {
      const res = await getAgent().getPosts({uris: [uri!]})
      if (res.success && res.data.posts[0]) {
        return res.data.posts[0]
      }

      throw new Error('No data')
    },
    enabled: !!uri,
  })
}

export function useGetPost() {
  const queryClient = useQueryClient()
  return useCallback(
    async ({uri}: {uri: string}) => {
      return queryClient.fetchQuery({
        queryKey: RQKEY(uri || ''),
        async queryFn() {
          const urip = new AtUri(uri)

          if (!urip.host.startsWith('did:')) {
            const res = await getAgent().resolveHandle({
              handle: urip.host,
            })
            urip.host = res.data.did
          }

          const res = await getAgent().getPosts({
            uris: [urip.toString()!],
          })

          if (res.success && res.data.posts[0]) {
            return res.data.posts[0]
          }

          throw new Error('useGetPost: post not found')
        },
      })
    },
    [queryClient],
  )
}

export function usePostLikeMutationQueue(
  post: Shadow<AppBskyFeedDefs.PostView>,
  logContext: LogEvents['post:like']['logContext'] &
    LogEvents['post:unlike']['logContext'],
) {
  const queryClient = useQueryClient()
  const postUri = post.uri
  const postCid = post.cid
  const initialLikeUri = post.viewer?.like
  const likeMutation = usePostLikeMutation(logContext, post)
  const unlikeMutation = usePostUnlikeMutation(logContext)

  const queueToggle = useToggleMutationQueue({
    initialState: initialLikeUri,
    runMutation: async (prevLikeUri, shouldLike) => {
      if (shouldLike) {
        const {uri: likeUri} = await likeMutation.mutateAsync({
          uri: postUri,
          cid: postCid,
        })
        return likeUri
      } else {
        if (prevLikeUri) {
          await unlikeMutation.mutateAsync({
            postUri: postUri,
            likeUri: prevLikeUri,
          })
        }
        return undefined
      }
    },
    onSuccess(finalLikeUri) {
      // finalize
      updatePostShadow(queryClient, postUri, {
        likeUri: finalLikeUri,
      })
    },
  })

  const queueLike = useCallback(() => {
    // optimistically update
    updatePostShadow(queryClient, postUri, {
      likeUri: 'pending',
    })
    return queueToggle(true)
  }, [queryClient, postUri, queueToggle])

  const queueUnlike = useCallback(() => {
    // optimistically update
    updatePostShadow(queryClient, postUri, {
      likeUri: undefined,
    })
    return queueToggle(false)
  }, [queryClient, postUri, queueToggle])

  return [queueLike, queueUnlike]
}

function usePostLikeMutation(
  logContext: LogEvents['post:like']['logContext'],
  post: Shadow<AppBskyFeedDefs.PostView>,
) {
  const postAuthorViewer = post.author.viewer
  return useMutation<
    {uri: string}, // responds with the uri of the like
    Error,
    {uri: string; cid: string} // the post's uri and cid
  >({
    mutationFn: ({uri, cid}) => {
      logEvent('post:like', {
        logContext,
        doesPosterFollowLiker: postAuthorViewer
          ? Boolean(postAuthorViewer.followedBy)
          : undefined,
        doesLikerFollowPoster: postAuthorViewer
          ? Boolean(postAuthorViewer.following)
          : undefined,
      })
      return getAgent().like(uri, cid)
    },
    onSuccess() {
      track('Post:Like')
    },
  })
}

function usePostUnlikeMutation(
  logContext: LogEvents['post:unlike']['logContext'],
) {
  return useMutation<void, Error, {postUri: string; likeUri: string}>({
    mutationFn: ({likeUri}) => {
      logEvent('post:unlike', {logContext})
      return getAgent().deleteLike(likeUri)
    },
    onSuccess() {
      track('Post:Unlike')
    },
  })
}

export function usePostRepostMutationQueue(
  post: Shadow<AppBskyFeedDefs.PostView>,
  logContext: LogEvents['post:repost']['logContext'] &
    LogEvents['post:unrepost']['logContext'],
) {
  const queryClient = useQueryClient()
  const postUri = post.uri
  const postCid = post.cid
  const initialRepostUri = post.viewer?.repost
  const repostMutation = usePostRepostMutation(logContext)
  const unrepostMutation = usePostUnrepostMutation(logContext)

  const queueToggle = useToggleMutationQueue({
    initialState: initialRepostUri,
    runMutation: async (prevRepostUri, shouldRepost) => {
      if (shouldRepost) {
        const {uri: repostUri} = await repostMutation.mutateAsync({
          uri: postUri,
          cid: postCid,
        })
        return repostUri
      } else {
        if (prevRepostUri) {
          await unrepostMutation.mutateAsync({
            postUri: postUri,
            repostUri: prevRepostUri,
          })
        }
        return undefined
      }
    },
    onSuccess(finalRepostUri) {
      // finalize
      updatePostShadow(queryClient, postUri, {
        repostUri: finalRepostUri,
      })
    },
  })

  const queueRepost = useCallback(() => {
    // optimistically update
    updatePostShadow(queryClient, postUri, {
      repostUri: 'pending',
    })
    return queueToggle(true)
  }, [queryClient, postUri, queueToggle])

  const queueUnrepost = useCallback(() => {
    // optimistically update
    updatePostShadow(queryClient, postUri, {
      repostUri: undefined,
    })
    return queueToggle(false)
  }, [queryClient, postUri, queueToggle])

  return [queueRepost, queueUnrepost]
}

function usePostRepostMutation(
  logContext: LogEvents['post:repost']['logContext'],
) {
  return useMutation<
    {uri: string}, // responds with the uri of the repost
    Error,
    {uri: string; cid: string} // the post's uri and cid
  >({
    mutationFn: post => {
      logEvent('post:repost', {logContext})
      return getAgent().repost(post.uri, post.cid)
    },
    onSuccess() {
      track('Post:Repost')
    },
  })
}

function usePostUnrepostMutation(
  logContext: LogEvents['post:unrepost']['logContext'],
) {
  return useMutation<void, Error, {postUri: string; repostUri: string}>({
    mutationFn: ({repostUri}) => {
      logEvent('post:unrepost', {logContext})
      return getAgent().deleteRepost(repostUri)
    },
    onSuccess() {
      track('Post:Unrepost')
    },
  })
}

export function usePostDeleteMutation() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, {uri: string}>({
    mutationFn: async ({uri}) => {
      await getAgent().deletePost(uri)
    },
    onSuccess(data, variables) {
      updatePostShadow(queryClient, variables.uri, {isDeleted: true})
      track('Post:Delete')
    },
  })
}
