import {
  AppBskyActorDefs,
  BskyAgent,
  ChatBskyConvoDefs,
  ChatBskyConvoSendMessage,
} from '@atproto/api'

import {MessagesEventBus} from '#/state/messages/events/agent'

export type ConvoParams = {
  convoId: string
  agent: BskyAgent
  events: MessagesEventBus
}

export enum ConvoStatus {
  Uninitialized = 'uninitialized',
  Initializing = 'initializing',
  Ready = 'ready',
  Error = 'error',
  Backgrounded = 'backgrounded',
  Suspended = 'suspended',
  Disabled = 'disabled',
}

export enum ConvoItemError {
  /**
   * Error connecting to event firehose
   */
  FirehoseFailed = 'firehoseFailed',
  /**
   * Error fetching past messages
   */
  HistoryFailed = 'historyFailed',
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
  Disable = 'disable',
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
  | {
      event: ConvoDispatchEvent.Disable
    }

export type ConvoItem =
  | {
      type: 'message'
      key: string
      message: ChatBskyConvoDefs.MessageView
      nextMessage:
        | ChatBskyConvoDefs.MessageView
        | ChatBskyConvoDefs.DeletedMessageView
        | null
      prevMessage:
        | ChatBskyConvoDefs.MessageView
        | ChatBskyConvoDefs.DeletedMessageView
        | null
    }
  | {
      type: 'pending-message'
      key: string
      message: ChatBskyConvoDefs.MessageView
      nextMessage:
        | ChatBskyConvoDefs.MessageView
        | ChatBskyConvoDefs.DeletedMessageView
        | null
      prevMessage:
        | ChatBskyConvoDefs.MessageView
        | ChatBskyConvoDefs.DeletedMessageView
        | null
      failed: boolean
      /**
       * Retry sending the message. If present, the message is in a failed state.
       */
      retry?: () => void
    }
  | {
      type: 'deleted-message'
      key: string
      message: ChatBskyConvoDefs.DeletedMessageView
      nextMessage:
        | ChatBskyConvoDefs.MessageView
        | ChatBskyConvoDefs.DeletedMessageView
        | null
      prevMessage:
        | ChatBskyConvoDefs.MessageView
        | ChatBskyConvoDefs.DeletedMessageView
        | null
    }
  | {
      type: 'error'
      key: string
      code: ConvoItemError
      /**
       * If present, error is recoverable.
       */
      retry?: () => void
    }

type DeleteMessage = (messageId: string) => Promise<void>
type SendMessage = (
  message: ChatBskyConvoSendMessage.InputSchema['message'],
) => void
type FetchMessageHistory = () => Promise<void>

export type ConvoStateUninitialized = {
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
export type ConvoStateInitializing = {
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
export type ConvoStateReady = {
  status: ConvoStatus.Ready
  items: ConvoItem[]
  convo: ChatBskyConvoDefs.ConvoView
  error: undefined
  sender: AppBskyActorDefs.ProfileViewBasic
  recipients: AppBskyActorDefs.ProfileViewBasic[]
  isFetchingHistory: boolean
  deleteMessage: DeleteMessage
  sendMessage: SendMessage
  fetchMessageHistory: FetchMessageHistory
}
export type ConvoStateBackgrounded = {
  status: ConvoStatus.Backgrounded
  items: ConvoItem[]
  convo: ChatBskyConvoDefs.ConvoView
  error: undefined
  sender: AppBskyActorDefs.ProfileViewBasic
  recipients: AppBskyActorDefs.ProfileViewBasic[]
  isFetchingHistory: boolean
  deleteMessage: DeleteMessage
  sendMessage: SendMessage
  fetchMessageHistory: FetchMessageHistory
}
export type ConvoStateSuspended = {
  status: ConvoStatus.Suspended
  items: ConvoItem[]
  convo: ChatBskyConvoDefs.ConvoView
  error: undefined
  sender: AppBskyActorDefs.ProfileViewBasic
  recipients: AppBskyActorDefs.ProfileViewBasic[]
  isFetchingHistory: boolean
  deleteMessage: DeleteMessage
  sendMessage: SendMessage
  fetchMessageHistory: FetchMessageHistory
}
export type ConvoStateError = {
  status: ConvoStatus.Error
  items: []
  convo: undefined
  error: ConvoError
  sender: undefined
  recipients: undefined
  isFetchingHistory: false
  deleteMessage: undefined
  sendMessage: undefined
  fetchMessageHistory: undefined
}
export type ConvoStateDisabled = {
  status: ConvoStatus.Disabled
  items: ConvoItem[]
  convo: ChatBskyConvoDefs.ConvoView
  error: undefined
  sender: AppBskyActorDefs.ProfileViewBasic
  recipients: AppBskyActorDefs.ProfileViewBasic[]
  isFetchingHistory: boolean
  deleteMessage: DeleteMessage
  sendMessage: SendMessage
  fetchMessageHistory: FetchMessageHistory
}
export type ConvoState =
  | ConvoStateUninitialized
  | ConvoStateInitializing
  | ConvoStateReady
  | ConvoStateBackgrounded
  | ConvoStateSuspended
  | ConvoStateError
  | ConvoStateDisabled

export type ConvoEvent = {
  type: 'invalidate-block-state'
  accountDids: string[]
}
