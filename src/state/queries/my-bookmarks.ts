import {CommunityLexiconBookmarksBookmark} from '@lexicon-community/types'
import {QueryClient, useQuery, UseQueryResult} from '@tanstack/react-query'

import {accumulate} from '#/lib/async/accumulate'
import {STALE} from '#/state/queries'
import {useAgent, useSession} from '#/state/session'

const RQKEY_ROOT = 'my-bookmarks'
export const RQKEY = () => [RQKEY_ROOT]

export function useMyBookmarksQuery(): UseQueryResult<
  CommunityLexiconBookmarksBookmark.Record[],
  Error
> {
  const {currentAccount} = useSession()
  const agent = useAgent()
  return useQuery<CommunityLexiconBookmarksBookmark.Record[]>({
    staleTime: STALE.MINUTES.ONE,
    queryKey: RQKEY(),
    async queryFn() {
      let bookmarks: CommunityLexiconBookmarksBookmark.Record[] = []
      const promises = [
        accumulate(cursor =>
          agent.com.atproto.repo
            .listRecords({
              repo: agent!.did ?? '',
              collection: 'community.lexicon.bookmarks.bookmark',
              cursor,
            })
            .then(res => ({
              cursor: res.data.cursor,
              items: res.data.records,
            })),
        ),
      ]

      const resultset = await Promise.all(promises)
      for (const res of resultset) {
        for (let bookmark of res) {
          const isValid =
            CommunityLexiconBookmarksBookmark.isRecord(bookmark.value) &&
            CommunityLexiconBookmarksBookmark.validateRecord(bookmark.value)
              .success
          if (isValid) {
            const recordVal =
              bookmark.value as CommunityLexiconBookmarksBookmark.Record
            recordVal.uri = bookmark.uri
            bookmarks.push(recordVal)
          }
        }
      }
      return bookmarks
    },
    enabled: !!currentAccount,
  })
}

export function invalidate(qc: QueryClient) {
  qc.invalidateQueries({queryKey: [RQKEY_ROOT]})
}
