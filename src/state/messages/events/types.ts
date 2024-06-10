import {BskyAgent, ChatBskyConvoGetLog} from '@atproto/api'

export type MessagesEventBusParams = {
  agent: BskyAgent
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

export type MessagesEventBusEvent =
  | {
      type: 'connect'
    }
  | {
      type: 'error'
      error: MessagesEventBusError
    }
  | {
      type: 'logs'
      logs: ChatBskyConvoGetLog.OutputSchema['logs']
    }
