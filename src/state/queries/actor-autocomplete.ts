import {AppBskyActorDefs} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'
import {useSession} from '../session'
import {useMyFollowsQuery} from './my-follows'

export const RQKEY = (prefix: string) => ['actor-autocomplete', prefix]

export function useActorAutocompleteQuery(prefix: string) {
  const {agent} = useSession()
  const {data: follows, isFetching} = useMyFollowsQuery()
  return useQuery<AppBskyActorDefs.ProfileViewBasic[]>({
    queryKey: RQKEY(prefix || ''),
    async queryFn() {
      const res = await agent.searchActorsTypeahead({
        term: prefix,
        limit: 8,
      })
      return computeSuggestions(prefix, follows, res.data.actors)
    },
    enabled: !isFetching && !!prefix,
  })
}

function computeSuggestions(
  prefix: string,
  follows: AppBskyActorDefs.ProfileViewBasic[] = [],
  searched: AppBskyActorDefs.ProfileViewBasic[] = [],
) {
  if (prefix) {
    const items: AppBskyActorDefs.ProfileViewBasic[] = []
    for (const item of follows) {
      if (prefixMatch(prefix, item)) {
        items.push(item)
      }
      if (items.length >= 8) {
        break
      }
    }
    for (const item of searched) {
      if (!items.find(item2 => item2.handle === item.handle)) {
        items.push({
          did: item.did,
          handle: item.handle,
          displayName: item.displayName,
          avatar: item.avatar,
        })
      }
    }
    return items
  } else {
    return follows
  }
}

function prefixMatch(
  prefix: string,
  info: AppBskyActorDefs.ProfileViewBasic,
): boolean {
  if (info.handle.includes(prefix)) {
    return true
  }
  if (info.displayName?.toLocaleLowerCase().includes(prefix)) {
    return true
  }
  return false
}
