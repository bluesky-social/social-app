import {type AtIdentifierString} from '@atproto/syntax'
import {type QueryClient, useQuery} from '@tanstack/react-query'

import {accumulate} from '#/lib/async/accumulate'
import {STALE} from '#/state/queries'
import {useAppviewClient, useSession} from '#/state/session'
import {app} from '#/lexicons'

export type MyListsFilter =
  | 'all'
  | 'curate'
  | 'mod'
  | 'all-including-subscribed'

const RQKEY_ROOT = 'my-lists'
export const RQKEY = (filter: MyListsFilter) => [RQKEY_ROOT, filter]

export function useMyListsQuery(filter: MyListsFilter) {
  const {currentAccount} = useSession()
  const client = useAppviewClient()
  return useQuery<app.bsky.graph.defs.ListView[]>({
    staleTime: STALE.MINUTES.ONE,
    queryKey: RQKEY(filter),
    async queryFn() {
      let lists: app.bsky.graph.defs.ListView[] = []
      const promises = [
        accumulate(cursor =>
          client
            .call(app.bsky.graph.getLists, {
              actor: currentAccount!.did as AtIdentifierString,
              cursor,
              limit: 50,
            })
            .then(res => ({
              cursor: res.cursor,
              items: res.lists,
            })),
        ),
      ]
      if (filter === 'all-including-subscribed' || filter === 'mod') {
        promises.push(
          accumulate(cursor =>
            client
              .call(app.bsky.graph.getListMutes, {
                cursor,
                limit: 50,
              })
              .then(res => ({
                cursor: res.cursor,
                items: res.lists,
              })),
          ),
        )
        promises.push(
          accumulate(cursor =>
            client
              .call(app.bsky.graph.getListBlocks, {
                cursor,
                limit: 50,
              })
              .then(res => ({
                cursor: res.cursor,
                items: res.lists,
              })),
          ),
        )
      }
      const resultset = await Promise.all(promises)
      for (const res of resultset) {
        for (let list of res) {
          if (
            filter === 'curate' &&
            list.purpose !== 'app.bsky.graph.defs#curatelist'
          ) {
            continue
          }
          if (
            filter === 'mod' &&
            list.purpose !== 'app.bsky.graph.defs#modlist'
          ) {
            continue
          }
          if (!lists.find(l => l.uri === list.uri)) {
            lists.push(list)
          }
        }
      }
      return lists
    },
    enabled: !!currentAccount,
  })
}

export function invalidate(qc: QueryClient, filter?: MyListsFilter) {
  if (filter) {
    qc.invalidateQueries({queryKey: RQKEY(filter)})
  } else {
    qc.invalidateQueries({queryKey: [RQKEY_ROOT]})
  }
}
