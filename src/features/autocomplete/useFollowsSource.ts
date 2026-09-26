import {useEffect} from 'react'

import {useProfileFollowsQuery} from '#/state/queries/profile-follows'
import {useSession} from '#/state/session'
import {type LocalSource} from '#/components/Autocomplete/types'

/*
 * The profile-follows query key ignores `limit`, so this must use the default
 * page size or it would collide with existing default-limit callers (DM
 * flows, SearchablePeopleList). Two default pages ≈ 60 profiles.
 */
const MAX_PAGES = 2

/**
 * The current account's follows as an autocomplete LocalSource, for instant
 * local mention matches while the remote typeahead request is in flight.
 * Empty when logged out.
 */
export function useFollowsSource(): LocalSource {
  const {currentAccount} = useSession()
  const {data, hasNextPage, isFetching, isError, fetchNextPage} =
    useProfileFollowsQuery(currentAccount?.did)

  const pages = data?.pages ?? []

  useEffect(() => {
    if (
      pages.length > 0 &&
      pages.length < MAX_PAGES &&
      hasNextPage &&
      !isFetching &&
      !isError
    ) {
      void fetchNextPage()
    }
  }, [pages.length, hasNextPage, isFetching, isError, fetchNextPage])

  return {
    key: 'follows',
    items: pages.slice(0, MAX_PAGES).flatMap(page =>
      page.follows.map(profile => ({
        key: profile.did,
        type: 'profile' as const,
        value: '@' + profile.handle,
        profile,
      })),
    ),
  }
}
