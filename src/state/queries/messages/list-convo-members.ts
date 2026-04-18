// FOR WHEN WE ADD THE ENDPOINT TO LIST MEMBERS

// import {type ChatBskyActorDefs} from '@atproto/api'
// import {useQuery} from '@tanstack/react-query'

// import {DM_SERVICE_HEADERS} from '#/lib/constants'
// import {STALE} from '#/state/queries'
// import {useAgent} from '#/state/session'
// import {RQKEY as getConvoKey} from './conversation'

// const LIMIT = 50

// const RQKEY_SEGMENT = 'members'
// // invalidating a convo will also invalidate its member query
// export const listConvoMembersKey = (convoId: string) => [
//   ...getConvoKey(convoId),
//   RQKEY_SEGMENT,
// ]

// export function useListConvoMembersQuery({convoId}: {convoId: string}) {
//   const agent = useAgent()

//   return useQuery({
//     queryKey: listConvoMembersKey(convoId),
//     queryFn: async () => {
//       const members: ChatBskyActorDefs.ProfileViewBasic[] = []
//       let cursor
//       do {
//         const {data} = await agent.chat.bsky.group.listMembers(
//           {convoId, cursor, limit: LIMIT},
//           {headers: DM_SERVICE_HEADERS},
//         )
//         for (const member of data.members) {
//           members.push(member)
//         }
//         cursor = data.cursor
//       } while (cursor)
//       return members
//     },
//     staleTime: STALE.MINUTES.THIRTY,
//     retry: 2,
//   })
// }
