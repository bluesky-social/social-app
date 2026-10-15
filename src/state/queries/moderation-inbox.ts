import {type DidString} from '@atproto/syntax'
import {useLingui} from '@lingui/react/macro'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {MOD_PROXY_SERVICE} from '#/lib/constants'
import {isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAppviewClient, useSession} from '#/state/session'
import * as Toast from '#/components/Toast'
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

export function useModerationInboxReportQuery({
  moderationService,
  id,
  enabled = true,
}: {
  moderationService?: DidString
  id?: number
  enabled?: boolean
}) {
  const client = useAppviewClient()
  const {currentAccount, hasSession} = useSession()
  const did = currentAccount?.did

  return useQuery({
    queryKey: createQueryKey(QUERY_KEY_ROOT, {
      did,
      endpoint: 'report',
      moderationService,
      id,
    }),
    queryFn: async () => {
      if (!moderationService || id === undefined) {
        throw new Error('Missing moderation service or report ID')
      }
      return await client.call(
        tools.ozone.inbox.getReport,
        {id},
        {service: `${moderationService}#atproto_labeler`},
      )
    },
    staleTime: STALE.MINUTES.ONE,
    enabled:
      enabled && hasSession && !!did && !!moderationService && id !== undefined,
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

export function useModerationInboxNotificationPreferencesQuery(
  isEnabled = true,
) {
  const client = useAppviewClient()
  const {currentAccount, hasSession} = useSession()
  const did = currentAccount?.did

  return useQuery({
    queryKey: createQueryKey(QUERY_KEY_ROOT, {
      did,
      endpoint: 'notificationPreferences',
    }),
    queryFn: async () =>
      await client.call(
        tools.ozone.inbox.getNotificationPreferences,
        {},
        {service: MOD_PROXY_SERVICE},
      ),
    staleTime: STALE.MINUTES.ONE,
    enabled: isEnabled && hasSession && !!did,
  })
}

export function useUpdateModerationInboxNotificationPreferencesMutation() {
  const {t: l} = useLingui()
  const client = useAppviewClient()
  const queryClient = useQueryClient()
  const {currentAccount} = useSession()
  const queryKey = createQueryKey(QUERY_KEY_ROOT, {
    did: currentAccount?.did,
    endpoint: 'notificationPreferences',
  })

  return useMutation({
    mutationFn: async (
      preferences: tools.ozone.inbox.putNotificationPreferences.$InputBody,
    ) =>
      await client.call(
        tools.ozone.inbox.putNotificationPreferences,
        preferences,
        {service: MOD_PROXY_SERVICE},
      ),
    onMutate: async () => {
      await queryClient.cancelQueries({queryKey})
    },
    onSuccess: data => {
      queryClient.setQueryData(queryKey, data)
    },
    onError: error => {
      if (!isNetworkError(error)) {
        logger.error(
          'Could not update moderation inbox notification settings',
          {
            safeMessage: error,
          },
        )
      }
      Toast.show(l`Could not update notification settings`, {type: 'error'})
    },
  })
}

export function useUpdateModerationInboxSeenMutation() {
  const {t: l} = useLingui()
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
    onError: () => {
      Toast.show(l`Failed to mark all as read. Please try again.`, {
        type: 'error',
      })
    },
  })
}
