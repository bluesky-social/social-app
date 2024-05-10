import {BskyAgent, ChatBskyConvoGetLog} from '@atproto-labs/api'

export type MessagesEventBusParams = {
  agent: BskyAgent
  __tempFromUserDid: string
}

export enum MessagesEventBusStatus {
  Initializing = 'initializing',
  Ready = 'ready',
  Error = 'error',
  Backgrounded = 'backgrounded',
  Suspended = 'suspended',
}

export enum MessagesEventBusDispatchEvent {
  Ready = 'ready',
  Error = 'error',
  Background = 'background',
  Suspend = 'suspend',
  Resume = 'resume',
  UpdatePoll = 'updatePoll',
}

export enum MessagesEventBusErrorCode {
  Unknown = 'unknown',
  InitFailed = 'initFailed',
  PollFailed = 'pollFailed',
}

export type MessagesEventBusError = {
  code: MessagesEventBusErrorCode
  exception?: Error
  retry: () => void
}

export type MessagesEventBusDispatch =
  | {
      event: MessagesEventBusDispatchEvent.Ready
    }
  | {
      event: MessagesEventBusDispatchEvent.Background
    }
  | {
      event: MessagesEventBusDispatchEvent.Suspend
    }
  | {
      event: MessagesEventBusDispatchEvent.Resume
    }
  | {
      event: MessagesEventBusDispatchEvent.Error
      payload: MessagesEventBusError
    }
  | {
      event: MessagesEventBusDispatchEvent.UpdatePoll
    }

export type TrailHandler = (
  events: ChatBskyConvoGetLog.OutputSchema['logs'],
) => void

export type RequestPollIntervalHandler = (interval: number) => () => void
export type OnConnectHandler = (handler: () => void) => () => void
export type OnDisconnectHandler = (
  handler: (error?: MessagesEventBusError) => void,
) => () => void

export type MessagesEventBusEvents = {
  events: [ChatBskyConvoGetLog.OutputSchema['logs']]
  connect: undefined
  error: [MessagesEventBusError] | undefined
}
