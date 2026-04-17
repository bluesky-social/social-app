import {
  type ChatBskyConvoDefs,
  type ChatBskyConvoListConvos,
  type ChatBskyConvoMuteConvo,
} from '@atproto/api'
import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import {DM_SERVICE_HEADERS} from '#/lib/constants'
import {useAgent} from '#/state/session'
import {RQKEY as CONVO_KEY} from './conversation'
import {RQKEY_ROOT as CONVO_LIST_KEY} from './list-conversations'

export function useMuteConvo(
  convoId: string | undefined,
  {
    onSuccess,
    onError,
  }: {
    onSuccess?: (data: ChatBskyConvoMuteConvo.OutputSchema) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    mutationFn: async ({mute}: {mute: boolean}) => {
      if (!convoId) throw new Error('No convoId provided')
      if (mute) {
        const {data} = await agent.chat.bsky.convo.muteConvo(
          {convoId},
          {headers: DM_SERVICE_HEADERS, encoding: 'application/json'},
        )
        return data
      } else {
        const {data} = await agent.chat.bsky.convo.unmuteConvo(
          {convoId},
          {headers: DM_SERVICE_HEADERS, encoding: 'application/json'},
        )
        return data
      }
    },
    onMutate: ({mute}) => {
      if (!convoId) return

      const prevConvo = queryClient.getQueryData<ChatBskyConvoDefs.ConvoView>(
        CONVO_KEY(convoId),
      )
      const prevListEntries = queryClient.getQueriesData<
        InfiniteData<ChatBskyConvoListConvos.OutputSchema>
      >({queryKey: [CONVO_LIST_KEY]})

      // Update for a single chat thread
      queryClient.setQueryData<ChatBskyConvoDefs.ConvoView>(
        CONVO_KEY(convoId),
        prev => {
          if (!prev) return
          return {
            ...prev,
            muted: mute,
          }
        },
      )

      // Update for the chat list
      queryClient.setQueriesData<
        InfiniteData<ChatBskyConvoListConvos.OutputSchema>
      >({queryKey: [CONVO_LIST_KEY]}, prev => {
        if (!prev?.pages) return
        return {
          ...prev,
          pages: prev.pages.map(page => ({
            ...page,
            convos: page.convos.map(convo => {
              if (convo.id !== convoId) return convo
              return {
                ...convo,
                muted: mute,
              }
            }),
          })),
        }
      })

      return {prevConvo, prevListEntries}
    },
    onSuccess: data => {
      onSuccess?.(data)
    },
    onError: (e, _variables, context) => {
      if (context?.prevConvo && convoId) {
        queryClient.setQueryData(CONVO_KEY(convoId), context.prevConvo)
      }
      if (context?.prevListEntries) {
        for (const [key, data] of context.prevListEntries) {
          queryClient.setQueryData(key, data)
        }
      }
      onError?.(e)
    },
  })
}
