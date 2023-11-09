import {AppBskyFeedDefs} from '@atproto/api'
import {useQuery, useMutation} from '@tanstack/react-query'
import {useSession} from '../session'
import {updatePostShadow} from '../cache/post-shadow'

export const RQKEY = (postUri: string) => ['post', postUri]

export function usePostQuery(uri: string | undefined) {
  const {agent} = useSession()
  return useQuery<AppBskyFeedDefs.PostView>(
    RQKEY(uri || ''),
    async () => {
      const res = await agent.getPosts({uris: [uri!]})
      if (res.success && res.data.posts[0]) {
        return res.data.posts[0]
      }

      throw new Error('No data')
    },
    {
      enabled: !!uri,
    },
  )
}

export function usePostLikeMutation() {
  const {agent} = useSession()
  return useMutation<
    {uri: string}, // responds with the uri of the like
    Error,
    {uri: string; cid: string; likeCount: number} // the post's uri, cid, and likes
  >(post => agent.like(post.uri, post.cid), {
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
  >(
    async ({likeUri}) => {
      await agent.deleteLike(likeUri)
    },
    {
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
    },
  )
}

export function usePostRepostMutation() {
  const {agent} = useSession()
  return useMutation<
    {uri: string}, // responds with the uri of the repost
    Error,
    {uri: string; cid: string; repostCount: number} // the post's uri, cid, and reposts
  >(post => agent.repost(post.uri, post.cid), {
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
  >(
    async ({repostUri}) => {
      await agent.deleteRepost(repostUri)
    },
    {
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
    },
  )
}

export function usePostDeleteMutation() {
  const {agent} = useSession()
  return useMutation<void, Error, {uri: string}>(
    async ({uri}) => {
      await agent.deletePost(uri)
    },
    {
      onSuccess(data, variables) {
        updatePostShadow(variables.uri, {isDeleted: true})
      },
    },
  )
}
