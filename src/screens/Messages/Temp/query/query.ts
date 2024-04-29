import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {useSession} from 'state/session'
import {useDmServiceUrlStorage} from '#/screens/Messages/Temp/useDmServiceUrlStorage'
import * as TempDmChatDefs from '#/temp/dm/defs'
import * as TempDmChatGetChat from '#/temp/dm/getChat'
import * as TempDmChatGetChatLog from '#/temp/dm/getChatLog'
import * as TempDmChatGetChatMessages from '#/temp/dm/getChatMessages'

/**
 * TEMPORARY, PLEASE DO NOT JUDGE ME REACT QUERY OVERLORDS 🙏
 * (and do not try this at home)
 */

function createHeaders(did: string) {
  return {
    Authorization: did,
  }
}

type Chat = {
  chatId: string
  messages: TempDmChatGetChatMessages.OutputSchema['messages']
  lastCursor?: string
  lastRev?: string
}

export function useChat(chatId: string) {
  const queryClient = useQueryClient()

  const {serviceUrl} = useDmServiceUrlStorage()
  const {currentAccount} = useSession()
  const did = currentAccount?.did ?? ''

  return useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      const currentChat = queryClient.getQueryData(['chat', chatId])

      if (currentChat) {
        return currentChat as Chat
      }

      const messagesResponse = await fetch(
        `${serviceUrl}/xrpc/temp.dm.getChatMessages?chatId=${chatId}`,
        {
          headers: createHeaders(did),
        },
      )

      if (!messagesResponse.ok) throw new Error('Failed to fetch messages')

      const messagesJson =
        (await messagesResponse.json()) as TempDmChatGetChatMessages.OutputSchema

      const chatResponse = await fetch(
        `${serviceUrl}/xrpc/temp.dm.getChat?chatId=${chatId}`,
        {
          headers: createHeaders(did),
        },
      )

      if (!chatResponse.ok) throw new Error('Failed to fetch chat')

      const chatJson =
        (await chatResponse.json()) as TempDmChatGetChat.OutputSchema

      const newChat = {
        chatId,
        messages: messagesJson.messages,
        lastCursor: messagesJson.cursor,
        lastRev: chatJson.chat.rev,
      } satisfies Chat

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

  const {serviceUrl} = useDmServiceUrlStorage()
  const {currentAccount} = useSession()
  const did = currentAccount?.did ?? ''

  return useMutation<
    TempDmChatDefs.Message,
    Error,
    SendMessageMutationVariables,
    unknown
  >({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mutationFn: async ({message, tempId}) => {
      const response = await fetch(
        `${serviceUrl}/xrpc/temp.dm.sendMessage?chatId=${chatId}`,
        {
          method: 'POST',
          headers: {
            ...createHeaders(did),
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

      if (!response.ok) throw new Error('Failed to send message')

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

  const {serviceUrl} = useDmServiceUrlStorage()
  const {currentAccount} = useSession()
  const did = currentAccount?.did ?? ''

  return useQuery({
    queryKey: ['chatLog'],
    queryFn: async () => {
      const prevLog = queryClient.getQueryData([
        'chatLog',
      ]) as TempDmChatGetChatLog.OutputSchema

      try {
        const response = await fetch(
          `${serviceUrl}/xrpc/temp.dm.getChatLog?cursor=${
            prevLog?.cursor ?? ''
          }`,
          {
            headers: createHeaders(did),
          },
        )

        if (!response.ok) throw new Error('Failed to fetch chat log')

        const json =
          (await response.json()) as TempDmChatGetChatLog.OutputSchema

        for (const log of json.logs) {
          if (TempDmChatDefs.isLogDeleteMessage(log)) {
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
        }

        return json
      } catch (e) {
        console.log(e)
      }
    },
    refetchInterval: 5000,
  })
}
