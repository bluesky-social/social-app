import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react'
import {useFocusEffect} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {useAppState} from '#/lib/appState'
import {Convo} from '#/state/messages/convo/agent'
import {
  type ConvoParams,
  type ConvoState,
  type ConvoStateBackgrounded,
  type ConvoStateDisabled,
  type ConvoStateReady,
  type ConvoStateSuspended,
} from '#/state/messages/convo/types'
import {isConvoActive} from '#/state/messages/convo/util'
import {useMessagesEventBus} from '#/state/messages/events'
import {
  RQKEY as getConvoKey,
  useMarkAsReadMutation,
} from '#/state/queries/messages/conversation'
import {RQKEY_ROOT as ListConvosQueryKeyRoot} from '#/state/queries/messages/list-conversations'
import {RQKEY as createProfileQueryKey} from '#/state/queries/profile'
import {useChatClient} from '#/state/session'
import {type GroupConvoMember} from '#/components/dms/util'
import {chat} from '#/lexicons'
import * as bsky from '#/types/bsky'

export * from '#/state/messages/convo/util'

/*
 * Only the member dids are compared, so accept any member-shaped arrays. This
 * also lets the old-typed `convo.convo.members` (from `#/components/dms/util`,
 * migrates in a later task) flow in alongside the new lexicon ConvoView
 * members.
 */
function membersChanged(a: Array<{did: string}>, b: Array<{did: string}>) {
  if (a.length !== b.length) return true
  const aDids = new Set(a.map(m => m.did))
  return b.some(m => !aDids.has(m.did))
}

const ChatContext = createContext<ConvoState | null>(null)
ChatContext.displayName = 'ChatContext'

export function useConvo() {
  const ctx = useContext(ChatContext)
  if (!ctx) {
    throw new Error('useConvo must be used within a ConvoProvider')
  }
  return ctx
}

/**
 * This hook should only be used when the Convo is "active", meaning the chat
 * is loaded and ready to be used, or its in a suspended or background state,
 * and ready for resumption.
 */
export function useConvoActive() {
  const ctx = useContext(ChatContext) as
    | ConvoStateReady
    | ConvoStateBackgrounded
    | ConvoStateSuspended
    | ConvoStateDisabled
  if (!ctx) {
    throw new Error('useConvo must be used within a ConvoProvider')
  }
  if (!isConvoActive(ctx)) {
    throw new Error(
      `useConvoActive must only be rendered when the Convo is ready.`,
    )
  }
  return ctx
}

export function ConvoProvider({
  children,
  convoId,
}: Pick<ConvoParams, 'convoId'> & {children: React.ReactNode}) {
  const queryClient = useQueryClient()
  const chatClient = useChatClient()
  const events = useMessagesEventBus()
  const [convo] = useState(() => {
    const placeholder =
      queryClient.getQueryData<chat.bsky.convo.defs.ConvoView>(
        getConvoKey(convoId),
      )
    return new Convo({
      convoId,
      chatClient,
      events,
      placeholderData: placeholder ? {convo: placeholder} : undefined,
    })
  })
  const service = useSyncExternalStore(convo.subscribe, convo.getSnapshot)
  const {mutate: markAsRead} = useMarkAsReadMutation()

  useEffect(() => {
    convo.updateClient(chatClient)
  }, [convo, chatClient])

  const appState = useAppState()
  const isActive = appState === 'active'
  useFocusEffect(
    useCallback(() => {
      if (isActive) {
        convo.resume()
        markAsRead({convoId})

        return () => {
          convo.background()
          markAsRead({convoId})
        }
      }
    }, [isActive, convo, convoId, markAsRead]),
  )

  useEffect(() => {
    return convo.on(event => {
      switch (event.type) {
        case 'invalidate-block-state': {
          for (const did of event.accountDids) {
            void queryClient.invalidateQueries({
              queryKey: createProfileQueryKey(did),
            })
          }
          void queryClient.invalidateQueries({
            queryKey: [ListConvosQueryKeyRoot],
          })
        }
      }
    })
  }, [convo, queryClient])

  useEffect(() => {
    const [root, id] = getConvoKey(convoId)
    return queryClient.getQueryCache().subscribe(event => {
      // Only react to data updates. Other event types (e.g. `added`) can be
      // emitted synchronously while another component reads this same query
      // during its render (React Query builds the query in `getOptimisticResult`),
      // and committing to the convo store then would set state on this provider
      // mid-render of that component.
      if (event.type !== 'updated') return
      const queryKey = event.query.queryKey as string[]
      if (queryKey[0] === root && queryKey[1] === id) {
        const data = event.query.state.data as
          | chat.bsky.convo.defs.ConvoView
          | undefined
        if (data && convo.convo && data.muted !== convo.convo.view.muted) {
          convo.updateMuted(data.muted)
        }
        if (
          data &&
          bsky.isType(chat.bsky.convo.defs.groupConvo, data.kind) &&
          convo.convo?.kind === 'group'
        ) {
          if (data.kind.name !== convo.convo.details.name) {
            convo.updateGroupName(data.kind.name)
          }
          if (data.kind.joinLink !== convo.convo.details.joinLink) {
            convo.updateJoinLink(data.kind.joinLink)
          }
          if (
            data.kind.lockStatus !== convo.convo.details.lockStatus ||
            data.kind.lockStatusModerationOverride !==
              convo.convo.details.lockStatusModerationOverride
          ) {
            convo.updateLockStatus(
              data.kind.lockStatus,
              data.kind.lockStatusModerationOverride,
            )
          }
        }
        if (
          data &&
          bsky.isType(chat.bsky.convo.defs.groupConvo, data.kind) &&
          convo.convo?.kind === 'group' &&
          (membersChanged(data.members, convo.convo.members) ||
            data.kind.memberCount !== convo.convo.details.memberCount)
        ) {
          convo.updateGroupMembers(
            data.members as GroupConvoMember[],
            data.kind.memberCount,
          )
        }
      }
    })
  }, [convo, convoId, queryClient])

  return <ChatContext.Provider value={service}>{children}</ChatContext.Provider>
}
