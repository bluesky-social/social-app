import {
  ChatBskyConvoDefs,
  ChatBskyConvoListConvos,
  ChatBskyConvoMuteConvo,
} from '@atproto/api'
import {InfiniteData, useMutation, useQueryClient} from '@tanstack/react-query'

import {DM_SERVICE_HEADERS} from '#/state/queries/messages/const'
import {useAgent} from '#/state/session'
import {RQKEY as CONVO_KEY} from './conversation'
import {RQKEY as CONVO_LIST_KEY} from './list-conversations'

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
        const {data} = await agent.api.chat.bsky.convo.muteConvo(
          {convoId},
          {headers: DM_SERVICE_HEADERS, encoding: 'application/json'},
        )
        return data
      } else {
        const {data} = await agent.api.chat.bsky.convo.unmuteConvo(
          {convoId},
          {headers: DM_SERVICE_HEADERS, encoding: 'application/json'},
        )
        return data
      }
    },
    onSuccess: (data, params) => {
      queryClient.setQueryData<ChatBskyConvoDefs.ConvoView>(
        CONVO_KEY(data.convo.id),
        prev => {
          if (!prev) return
          return {
            ...prev,
            muted: params.mute,
          }
        },
      )
      queryClient.setQueryData<
        InfiniteData<ChatBskyConvoListConvos.OutputSchema>
      >(CONVO_LIST_KEY, prev => {
        if (!prev?.pages) return
        return {
          ...prev,
          pages: prev.pages.map(page => ({
            ...page,
            convos: page.convos.map(convo => {
              if (convo.id !== data.convo.id) return convo
              return {
                ...convo,
                muted: params.mute,
              }
            }),
          })),
        }
      })

      onSuccess?.(data)
    },
    onError: e => {
      onError?.(e)
    },
  })
}
