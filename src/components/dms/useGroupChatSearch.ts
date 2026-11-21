import {useListConvosQuery} from '#/state/queries/messages/list-conversations'
import {useSession} from '#/state/session'
import {type ConvoWithDetails, parseConvoView} from '#/components/dms/util'

/**
 * The most group chats `listConvos` returns in one page. Searching only checks
 * this many, the most recent first.
 */
const GROUP_CHAT_SEARCH_LIMIT = 100

/**
 * Group chats whose name contains `searchText`. Profile search only finds
 * people, so group chats can't be found by their name otherwise. Fetches the
 * group chats the first time it's enabled with some text, then filters them
 * locally as the text changes.
 */
export function useGroupChatSearch({
  searchText,
  enabled,
}: {
  searchText: string
  enabled: boolean
}): {groups: ConvoWithDetails[]; isFetching: boolean} {
  const {currentAccount} = useSession()
  const query = searchText.trim().toLocaleLowerCase()
  const {data, isFetching} = useListConvosQuery({
    enabled: enabled && query.length > 0,
    status: 'accepted',
    lockStatus: 'unlocked',
    kind: 'group',
    limit: GROUP_CHAT_SEARCH_LIMIT,
  })

  if (!enabled || !query || !data) return {groups: [], isFetching}

  const groups: ConvoWithDetails[] = []
  for (const convoView of data.pages[0].convos) {
    const convo = parseConvoView(convoView, currentAccount?.did)
    if (convo?.kind !== 'group') continue
    if (!convo.details.name.toLocaleLowerCase().includes(query)) continue
    groups.push(convo)
  }
  return {groups, isFetching}
}
