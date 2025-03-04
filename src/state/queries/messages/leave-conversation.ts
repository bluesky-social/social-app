import {useMemo} from 'react'
import {ChatBskyConvoLeaveConvo, ChatBskyConvoListConvos} from '@atproto/api'
import {
  useMutation,
  useMutationState,
  useQueryClient,
} from '@tanstack/react-query'

import {logger} from '#/logger'
import {DM_SERVICE_HEADERS} from '#/state/queries/messages/const'
import {useAgent} from '#/state/session'
import {RQKEY_ROOT as CONVO_LIST_KEY} from './list-conversations'

const RQKEY_ROOT = 'leave-convo'
export function RQKEY(convoId: string | undefined) {
  return [RQKEY_ROOT, convoId]
}

export function useLeaveConvo(
  convoId: string | undefined,
  {
    onSuccess,
    onMutate,
    onError,
  }: {
    onMutate?: () => void
    onSuccess?: (data: ChatBskyConvoLeaveConvo.OutputSchema) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    mutationKey: RQKEY(convoId),
    mutationFn: async () => {
      if (!convoId) throw new Error('No convoId provided')

      const {data} = await agent.chat.bsky.convo.leaveConvo(
        {convoId},
        {headers: DM_SERVICE_HEADERS, encoding: 'application/json'},
      )

      return data
    },
    onMutate: () => {
      let prevPages: ChatBskyConvoListConvos.OutputSchema[] = []
      queryClient.setQueryData(
        [CONVO_LIST_KEY],
        (old?: {
          pageParams: Array<string | undefined>
          pages: Array<ChatBskyConvoListConvos.OutputSchema>
        }) => {
          if (!old) return old
          prevPages = old.pages
          return {
            ...old,
            pages: old.pages.map(page => {
              return {
                ...page,
                convos: page.convos.filter(convo => convo.id !== convoId),
              }
            }),
          }
        },
      )
      onMutate?.()
      return {prevPages}
    },
    onSuccess: data => {
      queryClient.invalidateQueries({queryKey: [CONVO_LIST_KEY]})
      onSuccess?.(data)
    },
    onError: (error, _, context) => {
      logger.error(error)
      queryClient.setQueryData(
        [CONVO_LIST_KEY],
        (old?: {
          pageParams: Array<string | undefined>
          pages: Array<ChatBskyConvoListConvos.OutputSchema>
        }) => {
          if (!old) return old
          return {
            ...old,
            pages: context?.prevPages || old.pages,
          }
        },
      )
      queryClient.invalidateQueries({queryKey: [CONVO_LIST_KEY]})
      onError?.(error)
    },
  })
}

/**
 * Gets currently pending and successful leave convo mutations
 *
 * @returns Array of `convoId`
 */
export function useLeftConvos() {
  const pending = useMutationState({
    filters: {mutationKey: [RQKEY_ROOT], status: 'pending'},
    select: mutation => mutation.options.mutationKey?.[1] as string | undefined,
  })
  const success = useMutationState({
    filters: {mutationKey: [RQKEY_ROOT], status: 'success'},
    select: mutation => mutation.options.mutationKey?.[1] as string | undefined,
  })
  return useMemo(
    () => [...pending, ...success].filter(id => id !== undefined),
    [pending, success],
  )
}
