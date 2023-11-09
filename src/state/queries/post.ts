import {AppBskyFeedDefs} from '@atproto/api'
import {
  useQuery,
  useQueryClient,
  useMutation,
  QueryClient,
} from '@tanstack/react-query'
import {useSession} from '../session'

export const RQKEY = (postUri: string) => ['post', postUri]

export function getCachedPost(
  queryClient: QueryClient,
  uri: string,
): AppBskyFeedDefs.PostView | undefined {
  return queryClient.getQueryData(RQKEY(uri))
}

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
  const queryClient = useQueryClient()
  return useMutation<
    {uri: string}, // responds with the uri of the like
    Error,
    {uri: string; cid: string}, // the post's uri and cid
    {likeCount: number}
  >(post => agent.like(post.uri, post.cid), {
    onMutate(variables) {
      // optimistically update the post-cache
      let likeCount = 0
      updatePostCache(queryClient, variables.uri, post => {
        likeCount = post.likeCount || 0
        return {
          ...post,
          likeCount: (post.likeCount || 0) + 1,
          viewer: {...(post.viewer || {}), like: 'pending'},
        }
      })
      return {likeCount}
    },
    onSuccess(data, variables) {
      // finalize the post-cache with the like URI
      updatePostCache(queryClient, variables.uri, post => {
        return {
          ...post,
          viewer: {...(post.viewer || {}), like: data.uri},
        }
      })
    },
    onError(error, variables, context) {
      // revert the optimistic update
      updatePostCache(queryClient, variables.uri, post => {
        return {
          ...post,
          likeCount: context?.likeCount,
          viewer: {...(post.viewer || {}), like: undefined},
        }
      })
    },
  })
}

export function usePostUnlikeMutation() {
  const {agent} = useSession()
  const queryClient = useQueryClient()
  return useMutation<
    void,
    Error,
    {postUri: string; likeUri: string},
    {likeCount: number}
  >(
    async ({likeUri}) => {
      await agent.deleteLike(likeUri)
    },
    {
      onMutate(variables) {
        // optimistically update the post-cache
        let likeCount = 0
        updatePostCache(queryClient, variables.postUri, post => {
          likeCount = post.likeCount || 0
          return {
            ...post,
            likeCount: (post.likeCount || 0) - 1,
            viewer: {...(post.viewer || {}), like: undefined},
          }
        })
        return {likeCount}
      },
      onError(error, variables, context) {
        // revert the optimistic update
        updatePostCache(queryClient, variables.postUri, post => {
          return {
            ...post,
            likeCount: context?.likeCount,
            viewer: {...(post.viewer || {}), like: variables.likeUri},
          }
        })
      },
    },
  )
}

export function usePostRepostMutation() {
  const {agent} = useSession()
  const queryClient = useQueryClient()
  return useMutation<
    {uri: string}, // responds with the uri of the repost
    Error,
    {uri: string; cid: string}, // the post's uri and cid
    {repostCount: number}
  >(post => agent.repost(post.uri, post.cid), {
    onMutate(variables) {
      // optimistically update the post-cache
      let repostCount = 0
      updatePostCache(queryClient, variables.uri, post => {
        repostCount = post.repostCount || 0
        return {
          ...post,
          repostCount: (post.repostCount || 0) + 1,
          viewer: {...(post.viewer || {}), repost: 'pending'},
        }
      })
      return {repostCount}
    },
    onSuccess(data, variables) {
      // finalize the post-cache with the repost URI
      updatePostCache(queryClient, variables.uri, post => {
        return {
          ...post,
          viewer: {...(post.viewer || {}), repost: data.uri},
        }
      })
    },
    onError(error, variables, context) {
      // revert the optimistic update
      updatePostCache(queryClient, variables.uri, post => {
        return {
          ...post,
          repostCount: context?.repostCount,
          viewer: {...(post.viewer || {}), repost: undefined},
        }
      })
    },
  })
}

export function usePostUnrepostMutation() {
  const {agent} = useSession()
  const queryClient = useQueryClient()
  return useMutation<
    void,
    Error,
    {postUri: string; repostUri: string},
    {repostCount: number}
  >(
    async ({repostUri}) => {
      await agent.deleteRepost(repostUri)
    },
    {
      onMutate(variables) {
        // optimistically update the post-cache
        let repostCount = 0
        updatePostCache(queryClient, variables.postUri, post => {
          repostCount = post.repostCount || 0
          return {
            ...post,
            repostCount: (post.repostCount || 0) - 1,
            viewer: {...(post.viewer || {}), like: undefined},
          }
        })
        return {repostCount}
      },
      onError(error, variables, context) {
        // revert the optimistic update
        updatePostCache(queryClient, variables.postUri, post => {
          return {
            ...post,
            repostCount: context?.repostCount,
            viewer: {...(post.viewer || {}), like: variables.repostUri},
          }
        })
      },
    },
  )
}

export function usePostDeleteMutation() {
  const {agent} = useSession()
  const queryClient = useQueryClient()
  return useMutation<void, Error, {uri: string}>(
    async ({uri}) => {
      await agent.deletePost(uri)
    },
    {
      onSuccess(data, variables) {
        queryClient.setQueryData(RQKEY(variables.uri), undefined)
      },
    },
  )
}

// internal methods
// =

function updatePostCache(
  queryClient: QueryClient,
  postUri: string,
  fn: (post: AppBskyFeedDefs.PostView) => AppBskyFeedDefs.PostView,
) {
  queryClient.setQueryData(
    RQKEY(postUri),
    (post: AppBskyFeedDefs.PostView | undefined) => {
      if (post) {
        return fn(post)
      }
    },
  )
}
