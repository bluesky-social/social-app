import React from 'react'
import {AppBskyFeedDefs, AtUri} from '@atproto/api'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'

import {useSession} from '#/state/session'
import {updatePostShadow} from '#/state/cache/post-shadow'
import {STALE} from '#/state/queries'

export const RQKEY = (postUri: string) => ['post', postUri]

export function usePostQuery(uri: string | undefined) {
  const {agent} = useSession()
  return useQuery<AppBskyFeedDefs.PostView>({
    staleTime: STALE.MINUTES.ONE,
    queryKey: RQKEY(uri || ''),
    async queryFn() {
      const res = await agent.getPosts({uris: [uri!]})
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
  const {agent} = useSession()
  return React.useCallback(
    async ({uri}: {uri: string}) => {
      return queryClient.fetchQuery({
        staleTime: STALE.MINUTES.ONE,
        queryKey: RQKEY(uri || ''),
        async queryFn() {
          const urip = new AtUri(uri)

          if (!urip.host.startsWith('did:')) {
            const res = await agent.resolveHandle({
              handle: urip.host,
            })
            urip.host = res.data.did
          }

          const res = await agent.getPosts({
            uris: [urip.toString()!],
          })

          if (res.success && res.data.posts[0]) {
            return res.data.posts[0]
          }

          throw new Error('useGetPost: post not found')
        },
      })
    },
    [agent, queryClient],
  )
}

export function usePostLikeMutation() {
  const {agent} = useSession()
  return useMutation<
    {uri: string}, // responds with the uri of the like
    Error,
    {uri: string; cid: string; likeCount: number} // the post's uri, cid, and likes
  >({
    mutationFn: post => agent.like(post.uri, post.cid),
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
  const {agent} = useSession()
  return useMutation<
    void,
    Error,
    {postUri: string; likeUri: string; likeCount: number}
  >({
    mutationFn: async ({likeUri}) => {
      await agent.deleteLike(likeUri)
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
  const {agent} = useSession()
  return useMutation<
    {uri: string}, // responds with the uri of the repost
    Error,
    {uri: string; cid: string; repostCount: number} // the post's uri, cid, and reposts
  >({
    mutationFn: post => agent.repost(post.uri, post.cid),
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
  const {agent} = useSession()
  return useMutation<
    void,
    Error,
    {postUri: string; repostUri: string; repostCount: number}
  >({
    mutationFn: async ({repostUri}) => {
      await agent.deleteRepost(repostUri)
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
  const {agent} = useSession()
  return useMutation<void, Error, {uri: string}>({
    mutationFn: async ({uri}) => {
      await agent.deletePost(uri)
    },
    onSuccess(data, variables) {
      updatePostShadow(variables.uri, {isDeleted: true})
    },
  })
}
