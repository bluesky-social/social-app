import {
  type $Typed,
  type AppBskyEmbedRecord,
  type BskyAgent,
  type ChatBskyActorDefs,
  type ChatBskyConvoDefs,
  type ChatBskyConvoSendMessage,
} from '@atproto/api'

import {type MessagesEventBus} from '#/state/messages/events/agent'

export type ConvoParams = {
  convoId: string
  agent: BskyAgent
  events: MessagesEventBus
  /**
   * Returns the DIDs of the current user's conversation partners (every
   * member other than self). Called lazily when the agent needs to invalidate
   * block state after a send failure. Source of truth is the `useConvoQuery`
   * cache — see `ConvoProvider`.
   */
  getRecipientDids: () => string[]
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
}

export type ConvoDispatch =
  | {event: ConvoDispatchEvent.Init}
  | {event: ConvoDispatchEvent.Ready}
  | {event: ConvoDispatchEvent.Resume}
  | {event: ConvoDispatchEvent.Background}
  | {event: ConvoDispatchEvent.Suspend}
  | {event: ConvoDispatchEvent.Error; payload: ConvoError}

export type ConvoItem =
  | {
      type: 'message'
      key: string
      message: ChatBskyConvoDefs.MessageView
    }
  | {
      type: 'pending-message'
      key: string
      message: ChatBskyConvoDefs.MessageView
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
    }
  | {
      type: 'system-message'
      key: string
      message: ChatBskyConvoDefs.SystemMessageView
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
  optimisticEmbedView: $Typed<AppBskyEmbedRecord.View> | undefined,
) => void
type FetchMessageHistory = () => Promise<void>
type AddReaction = (messageId: string, reaction: string) => Promise<void>
type RemoveReaction = (messageId: string, reaction: string) => Promise<void>

export type ConvoStateUninitialized = {
  status: ConvoStatus.Uninitialized
  items: []
  error: undefined
  isFetchingHistory: false
  hasAllHistory: boolean
  deleteMessage: undefined
  sendMessage: undefined
  fetchMessageHistory: undefined
  addReaction: undefined
  removeReaction: undefined
}
export type ConvoStateInitializing = {
  status: ConvoStatus.Initializing
  items: []
  error: undefined
  isFetchingHistory: boolean
  hasAllHistory: boolean
  deleteMessage: undefined
  sendMessage: undefined
  fetchMessageHistory: undefined
  addReaction: undefined
  removeReaction: undefined
}
export type ConvoStateReady = {
  status: ConvoStatus.Ready
  items: ConvoItem[]
  relatedProfiles: Map<string, ChatBskyActorDefs.ProfileViewBasic>
  error: undefined
  isFetchingHistory: boolean
  hasAllHistory: boolean
  deleteMessage: DeleteMessage
  sendMessage: SendMessage
  fetchMessageHistory: FetchMessageHistory
  addReaction: AddReaction
  removeReaction: RemoveReaction
}
export type ConvoStateBackgrounded = {
  status: ConvoStatus.Backgrounded
  items: ConvoItem[]
  relatedProfiles: Map<string, ChatBskyActorDefs.ProfileViewBasic>
  error: undefined
  isFetchingHistory: boolean
  hasAllHistory: boolean
  deleteMessage: DeleteMessage
  sendMessage: SendMessage
  fetchMessageHistory: FetchMessageHistory
  addReaction: AddReaction
  removeReaction: RemoveReaction
}
export type ConvoStateSuspended = {
  status: ConvoStatus.Suspended
  items: ConvoItem[]
  relatedProfiles: Map<string, ChatBskyActorDefs.ProfileViewBasic>
  error: undefined
  isFetchingHistory: boolean
  hasAllHistory: boolean
  deleteMessage: DeleteMessage
  sendMessage: SendMessage
  fetchMessageHistory: FetchMessageHistory
  addReaction: AddReaction
  removeReaction: RemoveReaction
}
export type ConvoStateError = {
  status: ConvoStatus.Error
  items: []
  error: ConvoError
  isFetchingHistory: false
  hasAllHistory: false
  deleteMessage: undefined
  sendMessage: undefined
  fetchMessageHistory: undefined
  addReaction: undefined
  removeReaction: undefined
}
export type ConvoState =
  | ConvoStateUninitialized
  | ConvoStateInitializing
  | ConvoStateReady
  | ConvoStateBackgrounded
  | ConvoStateSuspended
  | ConvoStateError

export type ConvoEvent =
  | {
      type: 'invalidate-block-state'
      accountDids: string[]
    }
  | {
      type: 'account-disabled'
    }
