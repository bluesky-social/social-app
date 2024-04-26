import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {Chat, ChatLog, Message} from '#/screens/Messages/Temp/query/types'

const DM_SERVICE = process.env.EXPO_PUBLIC_DM_SERVICE
const DM_DID = process.env.EXPO_PUBLIC_DM_DID

const HEADERS = {
  Authorization: DM_DID!,
}

export function useChat(chatId: string) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      const currentChat = queryClient.getQueryData(['chat', chatId])

      if (currentChat) {
        return currentChat as Chat
      }

      const messagesResponse = await fetch(
        `${DM_SERVICE}/xrpc/temp.dm.getChatMessages?chatId=${chatId}`,
        {
          headers: HEADERS,
        },
      )
      const messagesJson = (await messagesResponse.json()) as {
        messages: Message[]
        cursor: string
      }

      const chatResponse = await fetch(
        `${DM_SERVICE}/xrpc/temp.dm.getChat?chatId=${chatId}`,
        {
          headers: HEADERS,
        },
      )
      const chatJson = (await chatResponse.json()) as {
        chat: {
          id: string
          rev: string
          members: string[]
          unreadCount: number
        }
      }

      const newChat: Chat = {
        chatId,
        messages: messagesJson.messages,
        lastCursor: messagesJson.cursor,
        lastRev: chatJson.chat.rev,
      }

      queryClient.setQueryData(['chat', chatId], newChat)

      return newChat
    },
  })
}

interface SendMessageMutationVariables {
  message: string
  tempId: string
}

export function createTempId() {
  return Math.random().toString(36).substring(7).toString()
}

export function useSendMessageMutation(chatId: string) {
  const queryClient = useQueryClient()

  return useMutation<Message, Error, SendMessageMutationVariables, unknown>({
    mutationFn: async ({message, tempId}) => {
      const response = await fetch(
        `${DM_SERVICE}/xrpc/temp.dm.sendMessage?chatId=${chatId}`,
        {
          method: 'POST',
          headers: {
            ...HEADERS,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatId,
            message: {
              text: message,
            },
          }),
        },
      )
      return response.json()
    },
    onMutate: async variables => {
      queryClient.setQueryData(['chat', chatId], (prev: Chat) => {
        return {
          ...prev,
          messages: [
            {
              id: variables.tempId,
              text: variables.message,
            },
            ...prev.messages,
          ],
        }
      })
    },
    onSuccess: (result, variables) => {
      queryClient.setQueryData(['chat', chatId], (prev: Chat) => {
        return {
          ...prev,
          messages: prev.messages.map(m =>
            m.id === variables.tempId
              ? {
                  ...m,
                  id: result.id,
                }
              : m,
          ),
        }
      })
    },
    onError: (_, variables) => {
      console.log(_)
      queryClient.setQueryData(['chat', chatId], (prev: Chat) => ({
        ...prev,
        messages: prev.messages.filter(m => m.id !== variables.tempId),
      }))
    },
  })
}

export function useChatLogQuery() {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['chatLog'],
    queryFn: async () => {
      const prevLog = queryClient.getQueryData(['chatLog']) as ChatLog

      try {
        const response = await fetch(
          `${DM_SERVICE}/xrpc/temp.dm.getChatLog?cursor=${
            prevLog?.cursor ?? ''
          }`,
          {
            headers: HEADERS,
          },
        )
        const json: ChatLog = await response.json()

        for (const log of json.logs) {
          if (log.$type !== 'temp.dm.defs#logCreateMessage') continue

          queryClient.setQueryData(['chat', log.chatId], (prev: Chat) => {
            // What to do in this case
            if (!prev) return

            // HACK we don't know who the creator of a message is, so just filter by id for now
            if (prev.messages.find(m => m.id === log.message.id)) return prev

            return {
              ...prev,
              messages: [log.message, ...prev.messages],
            }
          })
        }

        return json
      } catch (e) {
        console.log(e)
      }
    },
    refetchInterval: 5000,
  })
}
