import {
  BskyAgent,
  ChatBskyConvoDefs,
  ChatBskyConvoListConvos,
  ChatBskyConvoMuteConvo,
  ChatBskyConvoUnmuteConvo,
} from '@atproto-labs/api'
import {InfiniteData, useMutation, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {useDmServiceUrlStorage} from '#/screens/Messages/Temp/useDmServiceUrlStorage'
import {RQKEY as CONVO_KEY} from './conversation'
import {RQKEY as CONVO_LIST_KEY} from './list-converations'
import {useHeaders} from './temp-headers'

export function useMuteConvo(
  convoId: string,
  {
    onSuccess,
    onError,
  }: {
    onSuccess?: (data: ChatBskyConvoMuteConvo.OutputSchema) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const headers = useHeaders()
  const {serviceUrl} = useDmServiceUrlStorage()

  return useMutation({
    mutationFn: async () => {
      const agent = new BskyAgent({service: serviceUrl})
      const {data} = await agent.api.chat.bsky.convo.muteConvo(
        {convoId},
        {headers, encoding: 'application/json'},
      )

      return data
    },
    onSuccess: data => {
      queryClient.setQueryData<ChatBskyConvoDefs.ConvoView>(
        CONVO_KEY(data.convo.id),
        prev => {
          if (!prev) return
          return {
            ...prev,
            muted: true,
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
                muted: true,
              }
            }),
          })),
        }
      })
      onSuccess?.(data)
    },
    onError: error => {
      logger.error(error)
      onError?.(error)
    },
  })
}

export function useUnmuteConvo(
  convoId: string,
  {
    onSuccess,
    onError,
  }: {
    onSuccess?: (data: ChatBskyConvoUnmuteConvo.OutputSchema) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const headers = useHeaders()
  const {serviceUrl} = useDmServiceUrlStorage()

  return useMutation({
    mutationFn: async () => {
      const agent = new BskyAgent({service: serviceUrl})
      const {data} = await agent.api.chat.bsky.convo.unmuteConvo(
        {convoId},
        {headers, encoding: 'application/json'},
      )

      return data
    },
    onSuccess: data => {
      queryClient.setQueryData<ChatBskyConvoDefs.ConvoView>(
        CONVO_KEY(data.convo.id),
        prev => {
          if (!prev) return
          return {
            ...prev,
            muted: false,
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
                muted: false,
              }
            }),
          })),
        }
      })
      onSuccess?.(data)
    },
    onError: error => {
      logger.error(error)
      onError?.(error)
    },
  })
}
