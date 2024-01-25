import {useCallback} from 'react'
import {AppBskyFeedDefs, AtUri} from '@atproto/api'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {Shadow} from '#/state/cache/types'
import {getAgent} from '#/state/session'
import {updatePostShadow} from '#/state/cache/post-shadow'
import {track} from '#/lib/analytics/analytics'
import {useToggleMutationQueue} from '#/lib/hooks/useToggleMutationQueue'

export const RQKEY = (postUri: string) => ['post', postUri]

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
) {
  const postUri = post.uri
  const postCid = post.cid
  const initialLikeUri = post.viewer?.like
  const likeMutation = usePostLikeMutation()
  const unlikeMutation = usePostUnlikeMutation()

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
      updatePostShadow(postUri, {
        likeUri: finalLikeUri,
      })
    },
  })

  const queueLike = useCallback(() => {
    // optimistically update
    updatePostShadow(postUri, {
      likeUri: 'pending',
    })
    return queueToggle(true)
  }, [postUri, queueToggle])

  const queueUnlike = useCallback(() => {
    // optimistically update
    updatePostShadow(postUri, {
      likeUri: undefined,
    })
    return queueToggle(false)
  }, [postUri, queueToggle])

  return [queueLike, queueUnlike]
}

function usePostLikeMutation() {
  return useMutation<
    {uri: string}, // responds with the uri of the like
    Error,
    {uri: string; cid: string} // the post's uri and cid
  >({
    mutationFn: post => getAgent().like(post.uri, post.cid),
    onSuccess() {
      track('Post:Like')
    },
  })
}

function usePostUnlikeMutation() {
  return useMutation<void, Error, {postUri: string; likeUri: string}>({
    mutationFn: ({likeUri}) => getAgent().deleteLike(likeUri),
    onSuccess() {
      track('Post:Unlike')
    },
  })
}

export function usePostRepostMutationQueue(
  post: Shadow<AppBskyFeedDefs.PostView>,
) {
  const postUri = post.uri
  const postCid = post.cid
  const initialRepostUri = post.viewer?.repost
  const repostMutation = usePostRepostMutation()
  const unrepostMutation = usePostUnrepostMutation()

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
      updatePostShadow(postUri, {
        repostUri: finalRepostUri,
      })
    },
  })

  const queueRepost = useCallback(() => {
    // optimistically update
    updatePostShadow(postUri, {
      repostUri: 'pending',
    })
    return queueToggle(true)
  }, [postUri, queueToggle])

  const queueUnrepost = useCallback(() => {
    // optimistically update
    updatePostShadow(postUri, {
      repostUri: undefined,
    })
    return queueToggle(false)
  }, [postUri, queueToggle])

  return [queueRepost, queueUnrepost]
}

function usePostRepostMutation() {
  return useMutation<
    {uri: string}, // responds with the uri of the repost
    Error,
    {uri: string; cid: string} // the post's uri and cid
  >({
    mutationFn: post => getAgent().repost(post.uri, post.cid),
    onSuccess() {
      track('Post:Repost')
    },
  })
}

function usePostUnrepostMutation() {
  return useMutation<void, Error, {postUri: string; repostUri: string}>({
    mutationFn: ({repostUri}) => getAgent().deleteRepost(repostUri),
    onSuccess() {
      track('Post:Unrepost')
    },
  })
}

export function usePostDeleteMutation() {
  return useMutation<void, Error, {uri: string}>({
    mutationFn: async ({uri}) => {
      await getAgent().deletePost(uri)
    },
    onSuccess(data, variables) {
      updatePostShadow(variables.uri, {isDeleted: true})
      track('Post:Delete')
    },
  })
}
