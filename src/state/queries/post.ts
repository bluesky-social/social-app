import {useCallback} from 'react'
import {AppBskyActorDefs, AppBskyFeedDefs, AtUri} from '@atproto/api'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {useToggleMutationQueue} from '#/lib/hooks/useToggleMutationQueue'
import {logEvent, LogEvents, toClout} from '#/lib/statsig/statsig'
import {updatePostShadow} from '#/state/cache/post-shadow'
import {Shadow} from '#/state/cache/types'
import {useAgent, useSession} from '#/state/session'
import * as userActionHistory from '#/state/userActionHistory'
import {useIsThreadMuted, useSetThreadMute} from '../cache/thread-mutes'
import {findProfileQueryData} from './profile'

const RQKEY_ROOT = 'post'
export const RQKEY = (postUri: string) => [RQKEY_ROOT, postUri]

export function usePostQuery(uri: string | undefined) {
  const agent = useAgent()
  return useQuery<AppBskyFeedDefs.PostView>({
    queryKey: RQKEY(uri || ''),
    async queryFn() {
      const urip = new AtUri(uri!)

      if (!urip.host.startsWith('did:')) {
        const res = await agent.resolveHandle({
          handle: urip.host,
        })
        urip.host = res.data.did
      }

      const res = await agent.getPosts({uris: [urip.toString()]})
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
  const agent = useAgent()
  return useCallback(
    async ({uri}: {uri: string}) => {
      return queryClient.fetchQuery({
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
            uris: [urip.toString()],
          })

          if (res.success && res.data.posts[0]) {
            return res.data.posts[0]
          }

          throw new Error('useGetPost: post not found')
        },
      })
    },
    [queryClient, agent],
  )
}

export function useGetPosts() {
  const queryClient = useQueryClient()
  const agent = useAgent()
  return useCallback(
    async ({uris}: {uris: string[]}) => {
      return queryClient.fetchQuery({
        queryKey: RQKEY(uris.join(',') || ''),
        async queryFn() {
          const res = await agent.getPosts({
            uris,
          })

          if (res.success) {
            return res.data.posts
          } else {
            throw new Error('useGetPosts failed')
          }
        },
      })
    },
    [queryClient, agent],
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
        userActionHistory.like([postUri])
        return likeUri
      } else {
        if (prevLikeUri) {
          await unlikeMutation.mutateAsync({
            postUri: postUri,
            likeUri: prevLikeUri,
          })
          userActionHistory.unlike([postUri])
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
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()
  const postAuthor = post.author
  const agent = useAgent()
  return useMutation<
    {uri: string}, // responds with the uri of the like
    Error,
    {uri: string; cid: string} // the post's uri and cid
  >({
    mutationFn: ({uri, cid}) => {
      let ownProfile: AppBskyActorDefs.ProfileViewDetailed | undefined
      if (currentAccount) {
        ownProfile = findProfileQueryData(queryClient, currentAccount.did)
      }
      logEvent('post:like', {
        logContext,
        doesPosterFollowLiker: postAuthor.viewer
          ? Boolean(postAuthor.viewer.followedBy)
          : undefined,
        doesLikerFollowPoster: postAuthor.viewer
          ? Boolean(postAuthor.viewer.following)
          : undefined,
        likerClout: toClout(ownProfile?.followersCount),
        postClout:
          post.likeCount != null &&
          post.repostCount != null &&
          post.replyCount != null
            ? toClout(post.likeCount + post.repostCount + post.replyCount)
            : undefined,
      })
      return agent.like(uri, cid)
    },
  })
}

function usePostUnlikeMutation(
  logContext: LogEvents['post:unlike']['logContext'],
) {
  const agent = useAgent()
  return useMutation<void, Error, {postUri: string; likeUri: string}>({
    mutationFn: ({likeUri}) => {
      logEvent('post:unlike', {logContext})
      return agent.deleteLike(likeUri)
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
  const agent = useAgent()
  return useMutation<
    {uri: string}, // responds with the uri of the repost
    Error,
    {uri: string; cid: string} // the post's uri and cid
  >({
    mutationFn: post => {
      logEvent('post:repost', {logContext})
      return agent.repost(post.uri, post.cid)
    },
  })
}

function usePostUnrepostMutation(
  logContext: LogEvents['post:unrepost']['logContext'],
) {
  const agent = useAgent()
  return useMutation<void, Error, {postUri: string; repostUri: string}>({
    mutationFn: ({repostUri}) => {
      logEvent('post:unrepost', {logContext})
      return agent.deleteRepost(repostUri)
    },
  })
}

export function usePostDeleteMutation() {
  const queryClient = useQueryClient()
  const agent = useAgent()
  return useMutation<void, Error, {uri: string}>({
    mutationFn: async ({uri}) => {
      await agent.deletePost(uri)
    },
    onSuccess(_, variables) {
      updatePostShadow(queryClient, variables.uri, {isDeleted: true})
    },
  })
}

export function useThreadMuteMutationQueue(
  post: Shadow<AppBskyFeedDefs.PostView>,
  rootUri: string,
) {
  const threadMuteMutation = useThreadMuteMutation()
  const threadUnmuteMutation = useThreadUnmuteMutation()
  const isThreadMuted = useIsThreadMuted(rootUri, post.viewer?.threadMuted)
  const setThreadMute = useSetThreadMute()

  const queueToggle = useToggleMutationQueue<boolean>({
    initialState: isThreadMuted,
    runMutation: async (_prev, shouldMute) => {
      if (shouldMute) {
        await threadMuteMutation.mutateAsync({
          uri: rootUri,
        })
        return true
      } else {
        await threadUnmuteMutation.mutateAsync({
          uri: rootUri,
        })
        return false
      }
    },
    onSuccess(finalIsMuted) {
      // finalize
      setThreadMute(rootUri, finalIsMuted)
    },
  })

  const queueMuteThread = useCallback(() => {
    // optimistically update
    setThreadMute(rootUri, true)
    return queueToggle(true)
  }, [setThreadMute, rootUri, queueToggle])

  const queueUnmuteThread = useCallback(() => {
    // optimistically update
    setThreadMute(rootUri, false)
    return queueToggle(false)
  }, [rootUri, setThreadMute, queueToggle])

  return [isThreadMuted, queueMuteThread, queueUnmuteThread] as const
}

function useThreadMuteMutation() {
  const agent = useAgent()
  return useMutation<
    {},
    Error,
    {uri: string} // the root post's uri
  >({
    mutationFn: ({uri}) => {
      logEvent('post:mute', {})
      return agent.api.app.bsky.graph.muteThread({root: uri})
    },
  })
}

function useThreadUnmuteMutation() {
  const agent = useAgent()
  return useMutation<{}, Error, {uri: string}>({
    mutationFn: ({uri}) => {
      logEvent('post:unmute', {})
      return agent.api.app.bsky.graph.unmuteThread({root: uri})
    },
  })
}
