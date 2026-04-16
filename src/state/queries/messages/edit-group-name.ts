import {
  ChatBskyConvoDefs,
  type ChatBskyConvoListConvos,
  type ChatBskyGroupEditGroup,
} from '@atproto/api'
import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import {DM_SERVICE_HEADERS} from '#/lib/constants'
import {logger} from '#/logger'
import {useAgent} from '#/state/session'
import {RQKEY as CONVO_KEY} from './conversation'
import {RQKEY_ROOT as CONVO_LIST_KEY} from './list-conversations'

export function useEditGroupName(
  convoId: string | undefined,
  {
    onSuccess,
    onError,
  }: {
    onSuccess?: (data: ChatBskyGroupEditGroup.OutputSchema) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    mutationFn: async ({name: groupName}: {name: string}) => {
      if (!convoId) throw new Error('No convoId provided')
      const {data} = await agent.chat.bsky.group.editGroup(
        {convoId, name: groupName},
        {headers: DM_SERVICE_HEADERS, encoding: 'application/json'},
      )
      return data
    },
    onMutate: ({name: groupName}) => {
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
          if (!ChatBskyConvoDefs.isGroupConvo(prev.kind)) return prev
          return {
            ...prev,
            kind: {
              ...prev.kind,
              name: groupName,
            },
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
              if (!ChatBskyConvoDefs.isGroupConvo(convo.kind)) return convo
              return {
                ...convo,
                kind: {
                  ...convo.kind,
                  name: groupName,
                },
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
      logger.error(e)
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
