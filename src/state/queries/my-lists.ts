import {type AppGndrGraphDefs} from '@gander-social-atproto/api'
import {type QueryClient, useQuery} from '@tanstack/react-query'

import {accumulate} from '#/lib/async/accumulate'
import {STALE} from '#/state/queries'
import {useAgent, useSession} from '#/state/session'

export type MyListsFilter =
  | 'all'
  | 'curate'
  | 'mod'
  | 'all-including-subscribed'

const RQKEY_ROOT = 'my-lists'
export const RQKEY = (filter: MyListsFilter) => [RQKEY_ROOT, filter]

export function useMyListsQuery(filter: MyListsFilter) {
  const {currentAccount} = useSession()
  const agent = useAgent()
  return useQuery<AppGndrGraphDefs.ListView[]>({
    staleTime: STALE.MINUTES.ONE,
    queryKey: RQKEY(filter),
    async queryFn() {
      let lists: AppGndrGraphDefs.ListView[] = []
      const promises = [
        accumulate(cursor =>
          agent.app.gndr.graph
            .getLists({
              actor: currentAccount!.did,
              cursor,
              limit: 50,
            })
            .then(res => ({
              cursor: res.data.cursor,
              items: res.data.lists,
            })),
        ),
      ]
      if (filter === 'all-including-subscribed' || filter === 'mod') {
        promises.push(
          accumulate(cursor =>
            agent.app.gndr.graph
              .getListMutes({
                cursor,
                limit: 50,
              })
              .then(res => ({
                cursor: res.data.cursor,
                items: res.data.lists,
              })),
          ),
        )
        promises.push(
          accumulate(cursor =>
            agent.app.gndr.graph
              .getListBlocks({
                cursor,
                limit: 50,
              })
              .then(res => ({
                cursor: res.data.cursor,
                items: res.data.lists,
              })),
          ),
        )
      }
      const resultset = await Promise.all(promises)
      for (const res of resultset) {
        for (let list of res) {
          if (
            filter === 'curate' &&
            list.purpose !== 'app.gndr.graph.defs#curatelist'
          ) {
            continue
          }
          if (
            filter === 'mod' &&
            list.purpose !== 'app.gndr.graph.defs#modlist'
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
