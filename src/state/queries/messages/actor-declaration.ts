import {type DidString} from '@atproto/syntax'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {usePdsClient, useSession} from '#/state/session'
import {agentToLexClient} from '#/state/session/clients'
import {type SessionAgent} from '#/state/session/session-core'
import {resolveAllowGroupInvites} from '#/components/dms/util'
import {type app, chat, com} from '#/lexicons'
import {RQKEY as PROFILE_RKEY} from '../profile'

export function useUpdateActorDeclaration({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()
  const {currentAccount} = useSession()
  const pdsClient = usePdsClient()

  return useMutation({
    mutationFn: async (update: {
      allowIncoming?: 'all' | 'none' | 'following'
      allowGroupInvites?: 'all' | 'none' | 'following'
    }) => {
      if (!currentAccount) throw new Error('Not signed in')
      const current =
        queryClient.getQueryData<app.bsky.actor.defs.ProfileViewDetailed>(
          PROFILE_RKEY(currentAccount.did),
        )
      const allowIncoming =
        update.allowIncoming ??
        current?.associated?.chat?.allowIncoming ??
        'following'
      const allowGroupInvites = resolveAllowGroupInvites({
        allowIncoming,
        allowGroupInvites:
          update.allowGroupInvites ??
          current?.associated?.chat?.allowGroupInvites,
      })
      const result = await pdsClient.call(com.atproto.repo.putRecord, {
        repo: currentAccount.did as DidString,
        collection: 'chat.bsky.actor.declaration',
        rkey: 'self',
        record: {
          $type: 'chat.bsky.actor.declaration',
          allowIncoming,
          allowGroupInvites,
        },
      })
      return result
    },
    onMutate: update => {
      if (!currentAccount) return
      queryClient.setQueryData(
        PROFILE_RKEY(currentAccount?.did),
        (old?: app.bsky.actor.defs.ProfileViewDetailed) => {
          if (!old) return old
          const allowIncoming =
            update.allowIncoming ??
            old.associated?.chat?.allowIncoming ??
            'following'
          // resolve the same concrete value the server will receive, so
          // optimistic cache and persisted record stay aligned
          const allowGroupInvites = resolveAllowGroupInvites({
            allowIncoming,
            allowGroupInvites:
              update.allowGroupInvites ??
              old.associated?.chat?.allowGroupInvites,
          })
          return {
            ...old,
            associated: {
              ...old.associated,
              chat: {
                ...old.associated?.chat,
                allowIncoming,
                allowGroupInvites,
              },
            },
          } satisfies app.bsky.actor.defs.ProfileViewDetailed
        },
      )
    },
    onSuccess,
    onError: error => {
      logger.error(error)
      if (currentAccount) {
        void queryClient.invalidateQueries({
          queryKey: PROFILE_RKEY(currentAccount.did),
        })
      }
      onError?.(error)
    },
  })
}

// for use in the settings screen for testing
export function useDeleteActorDeclaration() {
  const {currentAccount} = useSession()
  const pdsClient = usePdsClient()

  return useMutation({
    mutationFn: async () => {
      if (!currentAccount) throw new Error('Not signed in')
      const result = await pdsClient.call(com.atproto.repo.deleteRecord, {
        repo: currentAccount.did as DidString,
        collection: 'chat.bsky.actor.declaration',
        rkey: 'self',
      })
      return result
    },
  })
}

export async function fetchActorDeclarationRecord({
  agent,
  did,
}: {
  agent: SessionAgent
  did?: string
}) {
  if (!did) return
  /*
   * This helper is called with a bridge `SessionAgent` threaded from
   * `#/ageAssurance/data`. Wrap it as an account lex `Client` so the record
   * read goes through the same path as the migrated hooks; the caller keeps
   * passing the agent until the bridge is removed (Phase 4). The cast is safe:
   * `agentToLexClient` only reads `did` and `fetchHandler`, both of which the
   * base `Agent` (and thus `SessionAgent`) provides - its `AtpAgent` parameter
   * type is just narrower than it needs. TODO(phase4): drop with the bridge.
   */
  const client = agentToLexClient(
    agent as unknown as Parameters<typeof agentToLexClient>[0],
  )
  const res = await client
    .get(chat.bsky.actor.declaration, {repo: did as DidString, rkey: 'self'})
    .catch(_e => undefined)
  return res?.value
}
