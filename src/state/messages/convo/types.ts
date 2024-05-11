import {AppBskyActorDefs} from '@atproto/api'
import {
  BskyAgent,
  ChatBskyConvoDefs,
  ChatBskyConvoSendMessage,
} from '@atproto-labs/api'

import {MessagesEventBus} from '#/state/messages/events/agent'

export type ConvoParams = {
  convoId: string
  agent: BskyAgent
  events: MessagesEventBus
  __tempFromUserDid: string
}

export enum ConvoStatus {
  Uninitialized = 'uninitialized',
  Initializing = 'initializing',
  Ready = 'ready',
  Error = 'error',
  Backgrounded = 'backgrounded',
  Suspended = 'suspended',
}

export enum ConvoItemError {
  /**
   * Generic error
   */
  Network = 'network',
  /**
   * Error connecting to event firehose
   */
  FirehoseFailed = 'firehoseFailed',
  /**
   * Error fetching past messages
   */
  HistoryFailed = 'historyFailed',
  /**
   * Error sending new message
   */
  PendingFailed = 'pendingFailed',
}

export enum ConvoErrorCode {
  InitFailed = 'initFailed',
}

export type ConvoError = {
  code: ConvoErrorCode
  exception?: Error
  retry: () => void
}

export enum ConvoDispatchEvent {
  Init = 'init',
  Ready = 'ready',
  Resume = 'resume',
  Background = 'background',
  Suspend = 'suspend',
  Error = 'error',
}

export type ConvoDispatch =
  | {
      event: ConvoDispatchEvent.Init
    }
  | {
      event: ConvoDispatchEvent.Ready
    }
  | {
      event: ConvoDispatchEvent.Resume
    }
  | {
      event: ConvoDispatchEvent.Background
    }
  | {
      event: ConvoDispatchEvent.Suspend
    }
  | {
      event: ConvoDispatchEvent.Error
      payload: ConvoError
    }

export type ConvoItem =
  | {
      type: 'message' | 'pending-message'
      key: string
      message: ChatBskyConvoDefs.MessageView
      nextMessage:
        | ChatBskyConvoDefs.MessageView
        | ChatBskyConvoDefs.DeletedMessageView
        | null
    }
  | {
      type: 'deleted-message'
      key: string
      message: ChatBskyConvoDefs.DeletedMessageView
      nextMessage:
        | ChatBskyConvoDefs.MessageView
        | ChatBskyConvoDefs.DeletedMessageView
        | null
    }
  | {
      type: 'error-recoverable'
      key: string
      code: ConvoItemError
      retry: () => void
    }

export type ConvoState =
  | {
      status: ConvoStatus.Uninitialized
      items: []
      convo: undefined
      error: undefined
      sender: undefined
      recipients: undefined
      isFetchingHistory: false
      deleteMessage: undefined
      sendMessage: undefined
      fetchMessageHistory: undefined
    }
  | {
      status: ConvoStatus.Initializing
      items: []
      convo: undefined
      error: undefined
      sender: undefined
      recipients: undefined
      isFetchingHistory: boolean
      deleteMessage: undefined
      sendMessage: undefined
      fetchMessageHistory: undefined
    }
  | {
      status: ConvoStatus.Ready
      items: ConvoItem[]
      convo: ChatBskyConvoDefs.ConvoView
      error: undefined
      sender: AppBskyActorDefs.ProfileViewBasic
      recipients: AppBskyActorDefs.ProfileViewBasic[]
      isFetchingHistory: boolean
      deleteMessage: (messageId: string) => Promise<void>
      sendMessage: (
        message: ChatBskyConvoSendMessage.InputSchema['message'],
      ) => void
      fetchMessageHistory: () => void
    }
  | {
      status: ConvoStatus.Suspended
      items: ConvoItem[]
      convo: ChatBskyConvoDefs.ConvoView
      error: undefined
      sender: AppBskyActorDefs.ProfileViewBasic
      recipients: AppBskyActorDefs.ProfileViewBasic[]
      isFetchingHistory: boolean
      deleteMessage: (messageId: string) => Promise<void>
      sendMessage: (
        message: ChatBskyConvoSendMessage.InputSchema['message'],
      ) => Promise<void>
      fetchMessageHistory: () => Promise<void>
    }
  | {
      status: ConvoStatus.Backgrounded
      items: ConvoItem[]
      convo: ChatBskyConvoDefs.ConvoView
      error: undefined
      sender: AppBskyActorDefs.ProfileViewBasic
      recipients: AppBskyActorDefs.ProfileViewBasic[]
      isFetchingHistory: boolean
      deleteMessage: (messageId: string) => Promise<void>
      sendMessage: (
        message: ChatBskyConvoSendMessage.InputSchema['message'],
      ) => Promise<void>
      fetchMessageHistory: () => Promise<void>
    }
  | {
      status: ConvoStatus.Error
      items: []
      convo: undefined
      error: any
      sender: undefined
      recipients: undefined
      isFetchingHistory: false
      deleteMessage: undefined
      sendMessage: undefined
      fetchMessageHistory: undefined
    }
