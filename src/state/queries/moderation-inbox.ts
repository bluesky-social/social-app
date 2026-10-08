import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {MOD_PROXY_SERVICE} from '#/lib/constants'
import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAppviewClient, useSession} from '#/state/session'
import {tools} from '#/lexicons'

const QUERY_KEY_ROOT = 'moderation-inbox'

type ReportsFilter = NonNullable<
  tools.ozone.inbox.listReports.$Params['filter']
>
type ActionedSubjectsFilter = NonNullable<
  tools.ozone.inbox.listActionedSubjects.$Params['filter']
>
type SeenSection = tools.ozone.inbox.updateSeen.$InputBody['sections'][number]

export function useModerationInboxReportsQuery(filter: ReportsFilter) {
  const client = useAppviewClient()
  const {currentAccount, hasSession} = useSession()
  const did = currentAccount?.did

  return useInfiniteQuery({
    queryKey: createQueryKey(QUERY_KEY_ROOT, {
      did,
      endpoint: 'reports',
      filter,
    }),
    queryFn: async ({pageParam}) =>
      await client.call(
        tools.ozone.inbox.listReports,
        {filter, limit: 100, cursor: pageParam},
        {service: MOD_PROXY_SERVICE},
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    staleTime: STALE.MINUTES.ONE,
    enabled: hasSession && !!did,
  })
}

export function useModerationInboxActionedSubjectsQuery(
  filter: ActionedSubjectsFilter,
) {
  const client = useAppviewClient()
  const {currentAccount, hasSession} = useSession()
  const did = currentAccount?.did

  return useInfiniteQuery({
    queryKey: createQueryKey(QUERY_KEY_ROOT, {
      did,
      endpoint: 'actionedSubjects',
      filter,
    }),
    queryFn: async ({pageParam}) =>
      await client.call(
        tools.ozone.inbox.listActionedSubjects,
        {filter, limit: 30, cursor: pageParam},
        {service: MOD_PROXY_SERVICE},
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    staleTime: STALE.MINUTES.ONE,
    enabled: hasSession && !!did,
  })
}

export function useModerationInboxAccountStatusQuery() {
  const client = useAppviewClient()
  const {currentAccount, hasSession} = useSession()
  const did = currentAccount?.did

  return useQuery({
    queryKey: createQueryKey(QUERY_KEY_ROOT, {did, endpoint: 'accountStatus'}),
    queryFn: async () =>
      await client.call(
        tools.ozone.inbox.getAccountStatus,
        {},
        {service: MOD_PROXY_SERVICE},
      ),
    staleTime: STALE.MINUTES.ONE,
    enabled: hasSession && !!did,
  })
}

export function useModerationInboxUnreadCountQuery(isEnabled = true) {
  const client = useAppviewClient()
  const {currentAccount, hasSession} = useSession()
  const did = currentAccount?.did

  return useQuery({
    queryKey: createQueryKey(QUERY_KEY_ROOT, {did, endpoint: 'unreadCount'}),
    queryFn: async () =>
      await client.call(
        tools.ozone.inbox.getUnreadCount,
        {},
        {service: MOD_PROXY_SERVICE},
      ),
    staleTime: STALE.SECONDS.THIRTY,
    enabled: isEnabled && hasSession && !!did,
  })
}

export function useUpdateModerationInboxSeenMutation() {
  const client = useAppviewClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sections: SeenSection[]) =>
      await client.call(
        tools.ozone.inbox.updateSeen,
        {sections},
        {service: MOD_PROXY_SERVICE},
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: [QUERY_KEY_ROOT]})
    },
  })
}
