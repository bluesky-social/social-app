import {useEffect} from 'react'
import {type ChatBskyActorDefs, ChatBskyConvoDefs} from '@atproto/api'
import {type QueryClient, useQuery, useQueryClient} from '@tanstack/react-query'

import {DM_SERVICE_HEADERS} from '#/lib/constants'
import {useMessagesEventBus} from '#/state/messages/events'
import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAgent} from '#/state/session'
import * as bsky from '#/types/bsky'

const RQKEY_ROOT = 'listConvoMembers'
export const listConvoMembersQueryKey = (convoId: string) =>
  createQueryKey(RQKEY_ROOT, {convoId})

// group chat size is 50, so should fetch the whole list in one go
const LIMIT = 50

export function useListConvoMembersQuery({
  convoId,
  placeholderData,
}: {
  convoId: string
  placeholderData?: ChatBskyActorDefs.ProfileViewBasic[]
}) {
  const agent = useAgent()
  const queryClient = useQueryClient()
  const messagesBus = useMessagesEventBus()

  useEffect(() => {
    const unsub = messagesBus.on(
      ev => {
        if (ev.type !== 'logs') return

        function mutateList(
          fn: (
            update: ChatBskyActorDefs.ProfileViewBasic[],
          ) => ChatBskyActorDefs.ProfileViewBasic[],
        ) {
          queryClient.setQueryData<ChatBskyActorDefs.ProfileViewBasic[]>(
            listConvoMembersQueryKey(convoId),
            old => {
              if (!old) return // query doesn't exist yet, skip
              return fn(old)
            },
          )
        }

        for (const log of ev.logs) {
          if (ChatBskyConvoDefs.isLogAddMember(log)) {
            const data = log.message.data
            if (
              bsky.dangerousIsType<ChatBskyConvoDefs.SystemMessageDataAddMember>(
                data,
                ChatBskyConvoDefs.isSystemMessageDataAddMember,
              )
            ) {
              const newMember = log.relatedProfiles.find(
                r => r.did === data.member.did,
              )
              if (newMember) {
                mutateList(list => list.concat(newMember))
              }
            }
          } else if (ChatBskyConvoDefs.isLogRemoveMember(log)) {
            const data = log.message.data
            if (
              bsky.dangerousIsType<ChatBskyConvoDefs.SystemMessageDataRemoveMember>(
                data,
                ChatBskyConvoDefs.isSystemMessageDataRemoveMember,
              )
            ) {
              mutateList(list => list.filter(m => m.did !== data.member.did))
            }
          }
        }
      },
      {convoId},
    )
    return () => unsub()
  }, [convoId, messagesBus, queryClient])

  return useQuery({
    queryKey: listConvoMembersQueryKey(convoId),
    queryFn: async () => {
      const members = []
      let cursor

      do {
        const {data} = await agent.chat.bsky.convo.getConvoMembers(
          {convoId, cursor, limit: LIMIT},
          {headers: DM_SERVICE_HEADERS},
        )
        members.push(...data.members)
        cursor = data.cursor
      } while (cursor)

      return members
    },
    staleTime: STALE.MINUTES.THIRTY,
    placeholderData,
  })
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<ChatBskyActorDefs.ProfileViewBasic, void> {
  const queryDatas = queryClient.getQueriesData<
    ChatBskyActorDefs.ProfileViewBasic[]
  >({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData) continue
    for (const member of queryData) {
      if (member.did === did) {
        yield member
      }
    }
  }
}
