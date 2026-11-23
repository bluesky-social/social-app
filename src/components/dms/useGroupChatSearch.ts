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
 * people, so group chats can't be found by their name otherwise. Unless the
 * recent chats are all loaded, fetches the group chats the first time it's
 * enabled with some text, then filters them locally as the text changes.
 * `isLoading` is only true for that first fetch.
 */
export function useGroupChatSearch({
  searchText,
  enabled,
}: {
  searchText: string
  enabled: boolean
}): {groups: ConvoWithDetails[]; isLoading: boolean} {
  const {currentAccount} = useSession()
  const query = searchText.trim().toLocaleLowerCase()
  /*
   * The recent chats the chat search lists already load. When there's no next
   * page it holds every chat, so it's searched instead of fetching the group
   * chats. Anyone with few chats, or none, gets results without waiting.
   */
  const {data: recent} = useListConvosQuery({
    enabled,
    status: 'accepted',
    lockStatus: 'unlocked',
  })
  const recentIsComplete = !!recent && !recent.pages.at(-1)?.cursor
  const {data: allGroups, isLoading} = useListConvosQuery({
    enabled: enabled && query.length > 0 && !recentIsComplete,
    status: 'accepted',
    lockStatus: 'unlocked',
    kind: 'group',
    limit: GROUP_CHAT_SEARCH_LIMIT,
  })

  const convoViews = recentIsComplete
    ? recent.pages.flatMap(page => page.convos)
    : allGroups?.pages[0].convos
  if (!enabled || !query || !convoViews) {
    return {groups: [], isLoading: !recentIsComplete && isLoading}
  }

  const groups: ConvoWithDetails[] = []
  for (const convoView of convoViews) {
    const convo = parseConvoView(convoView, currentAccount?.did)
    if (convo?.kind !== 'group') continue
    if (!convo.details.name.toLocaleLowerCase().includes(query)) continue
    groups.push(convo)
  }
  return {groups, isLoading: false}
}
