import React from 'react'
import {AppBskyActorDefs, BskyAgent} from '@atproto/api'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import AwaitLock from 'await-lock'
import Fuse from 'fuse.js'

import {logger} from '#/logger'
import {useSession} from '#/state/session'
import {useMyFollowsQuery} from '#/state/queries/my-follows'

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

export function useActorSearch() {
  const queryClient = useQueryClient()
  const {agent} = useSession()
  const {data: follows} = useMyFollowsQuery()

  const followsSearch = React.useMemo(() => {
    if (!follows) return undefined

    return new Fuse(follows, {
      includeScore: true,
      keys: ['displayName', 'handle'],
    })
  }, [follows])

  return React.useCallback(
    async ({query}: {query: string}) => {
      let searchResults: AppBskyActorDefs.ProfileViewBasic[] = []

      if (followsSearch) {
        const results = followsSearch.search(query)
        searchResults = results.map(({item}) => item)
      }

      try {
        const res = await queryClient.fetchQuery({
          // cached for 1 min
          staleTime: 60 * 1000,
          queryKey: ['search', query],
          queryFn: () =>
            agent.searchActorsTypeahead({
              term: query,
              limit: 8,
            }),
        })

        if (res.data.actors) {
          for (const actor of res.data.actors) {
            if (!searchResults.find(item => item.handle === actor.handle)) {
              searchResults.push(actor)
            }
          }
        }
      } catch (e) {
        logger.error('useActorSearch: searchActorsTypeahead failed', {error: e})
      }

      return searchResults
    },
    [agent, followsSearch, queryClient],
  )
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
