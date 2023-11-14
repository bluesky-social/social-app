import {AppBskyActorDefs, BskyAgent} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'
import {useSession} from '../session'
import {useMyFollowsQuery} from './my-follows'
import AwaitLock from 'await-lock'

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

export class ActorAutocomplete {
  // state
  isLoading = false
  isActive = false
  prefix = ''
  lock = new AwaitLock()

  // data
  suggestions: AppBskyActorDefs.ProfileViewBasic[] = []

  constructor(
    public agent: BskyAgent,
    public follows?: AppBskyActorDefs.ProfileViewBasic[] | undefined,
  ) {}

  setFollows(follows: AppBskyActorDefs.ProfileViewBasic[]) {
    this.follows = follows
  }

  async query(prefix: string) {
    const origPrefix = prefix.trim().toLocaleLowerCase()
    this.prefix = origPrefix
    await this.lock.acquireAsync()
    try {
      if (this.prefix) {
        if (this.prefix !== origPrefix) {
          return // another prefix was set before we got our chance
        }

        // start with follow results
        this.suggestions = computeSuggestions(this.prefix, this.follows)

        // ask backend
        const res = await this.agent.searchActorsTypeahead({
          term: this.prefix,
          limit: 8,
        })
        this.suggestions = computeSuggestions(
          this.prefix,
          this.follows,
          res.data.actors,
        )
      } else {
        this.suggestions = computeSuggestions(this.prefix, this.follows)
      }
    } finally {
      this.lock.release()
    }
  }
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
