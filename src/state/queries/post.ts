import React from 'react'
import {AppBskyFeedDefs, AtUri} from '@atproto/api'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'

import {getAgent} from '#/state/session'
import {updatePostShadow} from '#/state/cache/post-shadow'
import {track} from '#/lib/analytics/analytics'

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
  return React.useCallback(
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

export function usePostLikeMutation() {
  return useMutation<
    {uri: string}, // responds with the uri of the like
    Error,
    {uri: string; cid: string; likeCount: number} // the post's uri, cid, and likes
  >({
    mutationFn: post => getAgent().like(post.uri, post.cid),
    onMutate(variables) {
      // optimistically update the post-shadow
      updatePostShadow(variables.uri, {
        likeCount: variables.likeCount + 1,
        likeUri: 'pending',
      })
    },
    onSuccess(data, variables) {
      // finalize the post-shadow with the like URI
      updatePostShadow(variables.uri, {
        likeUri: data.uri,
      })
      track('Post:Like')
    },
    onError(error, variables) {
      // revert the optimistic update
      updatePostShadow(variables.uri, {
        likeCount: variables.likeCount,
        likeUri: undefined,
      })
    },
  })
}

export function usePostUnlikeMutation() {
  return useMutation<
    void,
    Error,
    {postUri: string; likeUri: string; likeCount: number}
  >({
    mutationFn: async ({likeUri}) => {
      await getAgent().deleteLike(likeUri)
      track('Post:Unlike')
    },
    onMutate(variables) {
      // optimistically update the post-shadow
      updatePostShadow(variables.postUri, {
        likeCount: variables.likeCount - 1,
        likeUri: undefined,
      })
    },
    onError(error, variables) {
      // revert the optimistic update
      updatePostShadow(variables.postUri, {
        likeCount: variables.likeCount,
        likeUri: variables.likeUri,
      })
    },
  })
}

export function usePostRepostMutation() {
  return useMutation<
    {uri: string}, // responds with the uri of the repost
    Error,
    {uri: string; cid: string; repostCount: number} // the post's uri, cid, and reposts
  >({
    mutationFn: post => getAgent().repost(post.uri, post.cid),
    onMutate(variables) {
      // optimistically update the post-shadow
      updatePostShadow(variables.uri, {
        repostCount: variables.repostCount + 1,
        repostUri: 'pending',
      })
    },
    onSuccess(data, variables) {
      // finalize the post-shadow with the repost URI
      updatePostShadow(variables.uri, {
        repostUri: data.uri,
      })
      track('Post:Repost')
    },
    onError(error, variables) {
      // revert the optimistic update
      updatePostShadow(variables.uri, {
        repostCount: variables.repostCount,
        repostUri: undefined,
      })
    },
  })
}

export function usePostUnrepostMutation() {
  return useMutation<
    void,
    Error,
    {postUri: string; repostUri: string; repostCount: number}
  >({
    mutationFn: async ({repostUri}) => {
      await getAgent().deleteRepost(repostUri)
      track('Post:Unrepost')
    },
    onMutate(variables) {
      // optimistically update the post-shadow
      updatePostShadow(variables.postUri, {
        repostCount: variables.repostCount - 1,
        repostUri: undefined,
      })
    },
    onError(error, variables) {
      // revert the optimistic update
      updatePostShadow(variables.postUri, {
        repostCount: variables.repostCount,
        repostUri: variables.repostUri,
      })
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
