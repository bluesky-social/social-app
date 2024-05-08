import {AppBskyActorDefs} from '@atproto/api'
import {
  BskyAgent,
  ChatBskyConvoDefs,
  ChatBskyConvoGetLog,
  ChatBskyConvoSendMessage,
} from '@atproto-labs/api'
import {nanoid} from 'nanoid/non-secure'

import {logger} from '#/logger'
import {isNative} from '#/platform/detection'

export type ConvoParams = {
  convoId: string
  agent: BskyAgent
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
  HistoryFailed = 'historyFailed',
  PollFailed = 'pollFailed',
  Network = 'network',
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
      type: 'pending-retry'
      key: string
      retry: () => void
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

const ACTIVE_POLL_INTERVAL = 1e3
const BACKGROUND_POLL_INTERVAL = 10e3

// TODO temporary
let DEBUG_ACTIVE_CHAT: string | undefined

export function isConvoItemMessage(
  item: ConvoItem,
): item is ConvoItem & {type: 'message'} {
  if (!item) return false
  return (
    item.type === 'message' ||
    item.type === 'deleted-message' ||
    item.type === 'pending-message'
  )
}

export class Convo {
  private id: string

  private agent: BskyAgent
  private __tempFromUserDid: string

  private status: ConvoStatus = ConvoStatus.Uninitialized
  private pollInterval = ACTIVE_POLL_INTERVAL
  private error:
    | {
        code: ConvoErrorCode
        exception?: Error
        retry: () => void
      }
    | undefined
  private historyCursor: string | undefined | null = undefined
  private isFetchingHistory = false
  private eventsCursor: string | undefined = undefined

  private pastMessages: Map<
    string,
    ChatBskyConvoDefs.MessageView | ChatBskyConvoDefs.DeletedMessageView
  > = new Map()
  private newMessages: Map<
    string,
    ChatBskyConvoDefs.MessageView | ChatBskyConvoDefs.DeletedMessageView
  > = new Map()
  private pendingMessages: Map<
    string,
    {id: string; message: ChatBskyConvoSendMessage.InputSchema['message']}
  > = new Map()
  private deletedMessages: Set<string> = new Set()
  private footerItems: Map<string, ConvoItem> = new Map()
  private headerItems: Map<string, ConvoItem> = new Map()

  private isProcessingPendingMessages = false
  private pendingPoll: Promise<void> | undefined
  private nextPoll: NodeJS.Timeout | undefined

  convoId: string
  convo: ChatBskyConvoDefs.ConvoView | undefined
  sender: AppBskyActorDefs.ProfileViewBasic | undefined
  recipients: AppBskyActorDefs.ProfileViewBasic[] | undefined = undefined
  snapshot: ConvoState | undefined

  constructor(params: ConvoParams) {
    this.id = nanoid(3)
    this.convoId = params.convoId
    this.agent = params.agent
    this.__tempFromUserDid = params.__tempFromUserDid

    this.subscribe = this.subscribe.bind(this)
    this.getSnapshot = this.getSnapshot.bind(this)
    this.sendMessage = this.sendMessage.bind(this)
    this.deleteMessage = this.deleteMessage.bind(this)
    this.fetchMessageHistory = this.fetchMessageHistory.bind(this)

    if (DEBUG_ACTIVE_CHAT) {
      logger.error(`Convo: another chat was already active`, {
        convoId: this.convoId,
      })
    } else {
      DEBUG_ACTIVE_CHAT = this.convoId
    }
  }

  private commit() {
    this.snapshot = undefined
    this.subscribers.forEach(subscriber => subscriber())
  }

  private subscribers: (() => void)[] = []

  subscribe(subscriber: () => void) {
    if (this.subscribers.length === 0) this.init()

    this.subscribers.push(subscriber)

    return () => {
      this.subscribers = this.subscribers.filter(s => s !== subscriber)
      if (this.subscribers.length === 0) this.suspend()
    }
  }

  getSnapshot(): ConvoState {
    if (!this.snapshot) this.snapshot = this.generateSnapshot()
    // logger.debug('Convo: snapshotted', {}, logger.DebugContext.convo)
    return this.snapshot
  }

  private generateSnapshot(): ConvoState {
    switch (this.status) {
      case ConvoStatus.Initializing: {
        return {
          status: ConvoStatus.Initializing,
          items: [],
          convo: undefined,
          error: undefined,
          sender: undefined,
          recipients: undefined,
          isFetchingHistory: this.isFetchingHistory,
          deleteMessage: undefined,
          sendMessage: undefined,
          fetchMessageHistory: undefined,
        }
      }
      case ConvoStatus.Suspended:
      case ConvoStatus.Backgrounded:
      case ConvoStatus.Ready: {
        return {
          status: this.status,
          items: this.getItems(),
          convo: this.convo!,
          error: undefined,
          sender: this.sender!,
          recipients: this.recipients!,
          isFetchingHistory: this.isFetchingHistory,
          deleteMessage: this.deleteMessage,
          sendMessage: this.sendMessage,
          fetchMessageHistory: this.fetchMessageHistory,
        }
      }
      case ConvoStatus.Error: {
        return {
          status: ConvoStatus.Error,
          items: [],
          convo: undefined,
          error: this.error,
          sender: undefined,
          recipients: undefined,
          isFetchingHistory: false,
          deleteMessage: undefined,
          sendMessage: undefined,
          fetchMessageHistory: undefined,
        }
      }
      default: {
        return {
          status: ConvoStatus.Uninitialized,
          items: [],
          convo: undefined,
          error: undefined,
          sender: undefined,
          recipients: undefined,
          isFetchingHistory: false,
          deleteMessage: undefined,
          sendMessage: undefined,
          fetchMessageHistory: undefined,
        }
      }
    }
  }

  dispatch(action: ConvoDispatch) {
    const prevStatus = this.status

    switch (this.status) {
      case ConvoStatus.Uninitialized: {
        switch (action.event) {
          case ConvoDispatchEvent.Init: {
            this.status = ConvoStatus.Initializing
            this.setup()
            break
          }
        }
        break
      }
      case ConvoStatus.Initializing: {
        switch (action.event) {
          case ConvoDispatchEvent.Ready: {
            this.status = ConvoStatus.Ready
            this.pollInterval = ACTIVE_POLL_INTERVAL
            this.fetchMessageHistory().then(() => {
              this.restartPoll()
            })
            break
          }
          case ConvoDispatchEvent.Background: {
            this.status = ConvoStatus.Backgrounded
            this.pollInterval = BACKGROUND_POLL_INTERVAL
            this.fetchMessageHistory().then(() => {
              this.restartPoll()
            })
            break
          }
          case ConvoDispatchEvent.Suspend: {
            this.status = ConvoStatus.Suspended
            break
          }
          case ConvoDispatchEvent.Error: {
            this.status = ConvoStatus.Error
            this.error = action.payload
            break
          }
        }
        break
      }
      case ConvoStatus.Ready: {
        switch (action.event) {
          case ConvoDispatchEvent.Resume: {
            this.refreshConvo()
            this.restartPoll()
            break
          }
          case ConvoDispatchEvent.Background: {
            this.status = ConvoStatus.Backgrounded
            this.pollInterval = BACKGROUND_POLL_INTERVAL
            this.restartPoll()
            break
          }
          case ConvoDispatchEvent.Suspend: {
            this.status = ConvoStatus.Suspended
            this.cancelNextPoll()
            break
          }
          case ConvoDispatchEvent.Error: {
            this.status = ConvoStatus.Error
            this.error = action.payload
            this.cancelNextPoll()
            break
          }
        }
        break
      }
      case ConvoStatus.Backgrounded: {
        switch (action.event) {
          case ConvoDispatchEvent.Resume: {
            this.status = ConvoStatus.Ready
            this.pollInterval = ACTIVE_POLL_INTERVAL
            this.refreshConvo()
            // TODO truncate history if needed
            this.restartPoll()
            break
          }
          case ConvoDispatchEvent.Suspend: {
            this.status = ConvoStatus.Suspended
            this.cancelNextPoll()
            break
          }
          case ConvoDispatchEvent.Error: {
            this.status = ConvoStatus.Error
            this.error = action.payload
            this.cancelNextPoll()
            break
          }
        }
        break
      }
      case ConvoStatus.Suspended: {
        switch (action.event) {
          case ConvoDispatchEvent.Init: {
            this.status = ConvoStatus.Ready
            this.pollInterval = ACTIVE_POLL_INTERVAL
            this.refreshConvo()
            // TODO truncate history if needed
            this.restartPoll()
            break
          }
          case ConvoDispatchEvent.Resume: {
            this.status = ConvoStatus.Ready
            this.pollInterval = ACTIVE_POLL_INTERVAL
            this.refreshConvo()
            this.restartPoll()
            break
          }
          case ConvoDispatchEvent.Error: {
            this.status = ConvoStatus.Error
            this.error = action.payload
            break
          }
        }
        break
      }
      case ConvoStatus.Error: {
        switch (action.event) {
          case ConvoDispatchEvent.Init: {
            this.reset()
            break
          }
          case ConvoDispatchEvent.Resume: {
            this.reset()
            break
          }
          case ConvoDispatchEvent.Suspend: {
            this.status = ConvoStatus.Suspended
            break
          }
          case ConvoDispatchEvent.Error: {
            this.status = ConvoStatus.Error
            this.error = action.payload
            break
          }
        }
        break
      }
      default:
        break
    }

    logger.debug(
      `Convo: dispatch '${action.event}'`,
      {
        id: this.id,
        prev: prevStatus,
        next: this.status,
      },
      logger.DebugContext.convo,
    )

    this.commit()
  }

  private reset() {
    this.convo = undefined
    this.sender = undefined
    this.recipients = undefined
    this.snapshot = undefined

    this.status = ConvoStatus.Uninitialized
    this.error = undefined
    this.historyCursor = undefined
    this.eventsCursor = undefined

    this.pastMessages = new Map()
    this.newMessages = new Map()
    this.pendingMessages = new Map()
    this.deletedMessages = new Set()
    this.footerItems = new Map()
    this.headerItems = new Map()

    this.dispatch({event: ConvoDispatchEvent.Init})
  }

  private async setup() {
    try {
      const {convo, sender, recipients} = await this.fetchConvo()

      this.convo = convo
      this.sender = sender
      this.recipients = recipients

      /*
       * Some validation prior to `Ready` status
       */
      if (!this.convo) {
        throw new Error('Convo: could not find convo')
      }
      if (!this.sender) {
        throw new Error('Convo: could not find sender in convo')
      }
      if (!this.recipients) {
        throw new Error('Convo: could not find recipients in convo')
      }

      // await new Promise(y => setTimeout(y, 2000))
      // throw new Error('UNCOMMENT TO TEST INIT FAILURE')
      this.dispatch({event: ConvoDispatchEvent.Ready})
    } catch (e: any) {
      logger.error('Convo: setup() failed')

      this.dispatch({
        event: ConvoDispatchEvent.Error,
        payload: {
          exception: e,
          code: ConvoErrorCode.InitFailed,
          retry: () => {
            this.reset()
          },
        },
      })
    }
  }

  init() {
    this.dispatch({event: ConvoDispatchEvent.Init})
  }

  resume() {
    this.dispatch({event: ConvoDispatchEvent.Resume})
  }

  background() {
    this.dispatch({event: ConvoDispatchEvent.Background})
  }

  suspend() {
    this.dispatch({event: ConvoDispatchEvent.Suspend})
    DEBUG_ACTIVE_CHAT = undefined
  }

  private pendingFetchConvo:
    | Promise<{
        convo: ChatBskyConvoDefs.ConvoView
        sender: AppBskyActorDefs.ProfileViewBasic | undefined
        recipients: AppBskyActorDefs.ProfileViewBasic[]
      }>
    | undefined
  async fetchConvo() {
    if (this.pendingFetchConvo) return this.pendingFetchConvo

    this.pendingFetchConvo = new Promise<{
      convo: ChatBskyConvoDefs.ConvoView
      sender: AppBskyActorDefs.ProfileViewBasic | undefined
      recipients: AppBskyActorDefs.ProfileViewBasic[]
    }>(async (resolve, reject) => {
      try {
        const response = await this.agent.api.chat.bsky.convo.getConvo(
          {
            convoId: this.convoId,
          },
          {
            headers: {
              Authorization: this.__tempFromUserDid,
            },
          },
        )

        const convo = response.data.convo

        resolve({
          convo,
          sender: convo.members.find(m => m.did === this.__tempFromUserDid),
          recipients: convo.members.filter(
            m => m.did !== this.__tempFromUserDid,
          ),
        })
      } catch (e) {
        reject(e)
      } finally {
        this.pendingFetchConvo = undefined
      }
    })

    return this.pendingFetchConvo
  }

  async refreshConvo() {
    try {
      const {convo, sender, recipients} = await this.fetchConvo()
      // throw new Error('UNCOMMENT TO TEST REFRESH FAILURE')
      this.convo = convo || this.convo
      this.sender = sender || this.sender
      this.recipients = recipients || this.recipients
    } catch (e: any) {
      logger.error(`Convo: failed to refresh convo`)

      this.footerItems.set(ConvoItemError.Network, {
        type: 'error-recoverable',
        key: ConvoItemError.Network,
        code: ConvoItemError.Network,
        retry: () => {
          this.footerItems.delete(ConvoItemError.Network)
          this.resume()
        },
      })
      this.commit()
    }
  }

  async fetchMessageHistory() {
    logger.debug('Convo: fetch message history', {}, logger.DebugContext.convo)

    /*
     * If historyCursor is null, we've fetched all history.
     */
    if (this.historyCursor === null) return

    /*
     * Don't fetch again if a fetch is already in progress
     */
    if (this.isFetchingHistory) return

    /*
     * If we've rendered a retry state for history fetching, exit. Upon retry,
     * this will be removed and we'll try again.
     */
    if (this.headerItems.has(ConvoItemError.HistoryFailed)) return

    try {
      this.isFetchingHistory = true
      this.commit()

      /*
       * Delay if paginating while scrolled to prevent momentum scrolling from
       * jerking the list around, plus makes it feel a little more human.
       */
      if (this.pastMessages.size > 0) {
        await new Promise(y => setTimeout(y, 500))
        // throw new Error('UNCOMMENT TO TEST RETRY')
      }

      const response = await this.agent.api.chat.bsky.convo.getMessages(
        {
          cursor: this.historyCursor,
          convoId: this.convoId,
          limit: isNative ? 25 : 50,
        },
        {
          headers: {
            Authorization: this.__tempFromUserDid,
          },
        },
      )
      const {cursor, messages} = response.data

      this.historyCursor = cursor ?? null

      for (const message of messages) {
        if (
          ChatBskyConvoDefs.isMessageView(message) ||
          ChatBskyConvoDefs.isDeletedMessageView(message)
        ) {
          this.pastMessages.set(message.id, message)

          // set to latest rev
          if (
            message.rev > (this.eventsCursor = this.eventsCursor || message.rev)
          ) {
            this.eventsCursor = message.rev
          }
        }
      }
    } catch (e: any) {
      logger.error('Convo: failed to fetch message history')

      this.headerItems.set(ConvoItemError.HistoryFailed, {
        type: 'error-recoverable',
        key: ConvoItemError.HistoryFailed,
        code: ConvoItemError.HistoryFailed,
        retry: () => {
          this.headerItems.delete(ConvoItemError.HistoryFailed)
          this.fetchMessageHistory()
        },
      })
    } finally {
      this.isFetchingHistory = false
      this.commit()
    }
  }

  private restartPoll() {
    this.cancelNextPoll()
    this.pollLatestEvents()
  }

  private cancelNextPoll() {
    if (this.nextPoll) clearTimeout(this.nextPoll)
  }

  private pollLatestEvents() {
    /*
     * Uncomment to view poll events
     */
    logger.debug('Convo: poll events', {id: this.id}, logger.DebugContext.convo)

    try {
      this.fetchLatestEvents().then(({events}) => {
        this.applyLatestEvents(events)
      })
      this.nextPoll = setTimeout(() => {
        this.pollLatestEvents()
      }, this.pollInterval)
    } catch (e: any) {
      logger.error('Convo: poll events failed')

      this.cancelNextPoll()

      this.footerItems.set(ConvoItemError.PollFailed, {
        type: 'error-recoverable',
        key: ConvoItemError.PollFailed,
        code: ConvoItemError.PollFailed,
        retry: () => {
          this.footerItems.delete(ConvoItemError.PollFailed)
          this.commit()
          this.pollLatestEvents()
        },
      })

      this.commit()
    }
  }

  private pendingFetchLatestEvents:
    | Promise<{
        events: ChatBskyConvoGetLog.OutputSchema['logs']
      }>
    | undefined
  async fetchLatestEvents() {
    if (this.pendingFetchLatestEvents) return this.pendingFetchLatestEvents

    this.pendingFetchLatestEvents = new Promise<{
      events: ChatBskyConvoGetLog.OutputSchema['logs']
    }>(async (resolve, reject) => {
      try {
        // throw new Error('UNCOMMENT TO TEST POLL FAILURE')
        const response = await this.agent.api.chat.bsky.convo.getLog(
          {
            cursor: this.eventsCursor,
          },
          {
            headers: {
              Authorization: this.__tempFromUserDid,
            },
          },
        )
        const {logs} = response.data
        resolve({events: logs})
      } catch (e) {
        reject(e)
      } finally {
        this.pendingFetchLatestEvents = undefined
      }
    })

    return this.pendingFetchLatestEvents
  }

  private applyLatestEvents(events: ChatBskyConvoGetLog.OutputSchema['logs']) {
    let needsCommit = false

    for (const ev of events) {
      /*
       * If there's a rev, we should handle it. If there's not a rev, we don't
       * know what it is.
       */
      if (typeof ev.rev === 'string') {
        /*
         * We only care about new events
         */
        if (ev.rev > (this.eventsCursor = this.eventsCursor || ev.rev)) {
          /*
           * Update rev regardless of if it's a ev type we care about or not
           */
          this.eventsCursor = ev.rev

          /*
           * This is VERY important. We don't want to insert any messages from
           * your other chats.
           */
          if (ev.convoId !== this.convoId) continue

          if (
            ChatBskyConvoDefs.isLogCreateMessage(ev) &&
            ChatBskyConvoDefs.isMessageView(ev.message)
          ) {
            if (this.newMessages.has(ev.message.id)) {
              // Trust the ev as the source of truth on ordering
              this.newMessages.delete(ev.message.id)
            }
            this.newMessages.set(ev.message.id, ev.message)
            needsCommit = true
          } else if (
            ChatBskyConvoDefs.isLogDeleteMessage(ev) &&
            ChatBskyConvoDefs.isDeletedMessageView(ev.message)
          ) {
            /*
             * Update if we have this in state. If we don't, don't worry about it.
             */
            if (this.pastMessages.has(ev.message.id)) {
              /*
               * For now, we remove deleted messages from the thread, if we receive one.
               *
               * To support them, it'd look something like this:
               *   this.pastMessages.set(ev.message.id, ev.message)
               */
              this.pastMessages.delete(ev.message.id)
              this.newMessages.delete(ev.message.id)
              this.deletedMessages.delete(ev.message.id)
              needsCommit = true
            }
          }
        }
      }
    }

    if (needsCommit) {
      this.commit()
    }
  }

  async sendMessage(message: ChatBskyConvoSendMessage.InputSchema['message']) {
    // Ignore empty messages for now since they have no other purpose atm
    if (!message.text.trim()) return

    logger.debug('Convo: send message', {}, logger.DebugContext.convo)

    const tempId = nanoid()

    this.pendingMessages.set(tempId, {
      id: tempId,
      message,
    })
    this.commit()

    if (!this.isProcessingPendingMessages) {
      this.processPendingMessages()
    }
  }

  async processPendingMessages() {
    logger.debug(
      `Convo: processing messages (${this.pendingMessages.size} remaining)`,
      {},
      logger.DebugContext.convo,
    )

    const pendingMessage = Array.from(this.pendingMessages.values()).shift()

    /*
     * If there are no pending messages, we're done.
     */
    if (!pendingMessage) {
      this.isProcessingPendingMessages = false
      return
    }

    try {
      this.isProcessingPendingMessages = true

      // throw new Error('UNCOMMENT TO TEST RETRY')
      const {id, message} = pendingMessage

      const response = await this.agent.api.chat.bsky.convo.sendMessage(
        {
          convoId: this.convoId,
          message,
        },
        {
          encoding: 'application/json',
          headers: {
            Authorization: this.__tempFromUserDid,
          },
        },
      )
      const res = response.data

      /*
       * Insert into `newMessages` as soon as we have a real ID. That way, when
       * we get an event log back, we can replace in situ.
       */
      this.newMessages.set(res.id, {
        ...res,
        $type: 'chat.bsky.convo.defs#messageView',
        sender: this.sender,
      })
      this.pendingMessages.delete(id)

      await this.processPendingMessages()

      this.commit()
    } catch (e) {
      this.footerItems.set('pending-retry', {
        type: 'pending-retry',
        key: 'pending-retry',
        retry: this.batchRetryPendingMessages.bind(this),
      })
      this.commit()
    }
  }

  async batchRetryPendingMessages() {
    logger.debug(
      `Convo: retrying ${this.pendingMessages.size} pending messages`,
      {},
      logger.DebugContext.convo,
    )

    this.footerItems.delete('pending-retry')
    this.commit()

    try {
      const messageArray = Array.from(this.pendingMessages.values())
      const {data} = await this.agent.api.chat.bsky.convo.sendMessageBatch(
        {
          items: messageArray.map(({message}) => ({
            convoId: this.convoId,
            message,
          })),
        },
        {
          encoding: 'application/json',
          headers: {
            Authorization: this.__tempFromUserDid,
          },
        },
      )
      const {items} = data

      /*
       * Insert into `newMessages` as soon as we have a real ID. That way, when
       * we get an event log back, we can replace in situ.
       */
      for (const item of items) {
        this.newMessages.set(item.id, {
          ...item,
          $type: 'chat.bsky.convo.defs#messageView',
          sender: this.convo?.members.find(
            m => m.did === this.__tempFromUserDid,
          ),
        })
      }

      for (const pendingMessage of messageArray) {
        this.pendingMessages.delete(pendingMessage.id)
      }

      this.commit()
    } catch (e) {
      this.footerItems.set('pending-retry', {
        type: 'pending-retry',
        key: 'pending-retry',
        retry: this.batchRetryPendingMessages.bind(this),
      })
      this.commit()
    }
  }

  async deleteMessage(messageId: string) {
    logger.debug('Convo: delete message', {}, logger.DebugContext.convo)

    this.deletedMessages.add(messageId)
    this.commit()

    try {
      await this.agent.api.chat.bsky.convo.deleteMessageForSelf(
        {
          convoId: this.convoId,
          messageId,
        },
        {
          encoding: 'application/json',
          headers: {
            Authorization: this.__tempFromUserDid,
          },
        },
      )
    } catch (e) {
      this.deletedMessages.delete(messageId)
      this.commit()
      throw e
    }
  }

  /*
   * Items in reverse order, since FlatList inverts
   */
  getItems(): ConvoItem[] {
    const items: ConvoItem[] = []

    this.headerItems.forEach(item => {
      items.push(item)
    })

    this.pastMessages.forEach(m => {
      if (ChatBskyConvoDefs.isMessageView(m)) {
        items.unshift({
          type: 'message',
          key: m.id,
          message: m,
          nextMessage: null,
        })
      } else if (ChatBskyConvoDefs.isDeletedMessageView(m)) {
        items.unshift({
          type: 'deleted-message',
          key: m.id,
          message: m,
          nextMessage: null,
        })
      }
    })

    this.newMessages.forEach(m => {
      if (ChatBskyConvoDefs.isMessageView(m)) {
        items.push({
          type: 'message',
          key: m.id,
          message: m,
          nextMessage: null,
        })
      } else if (ChatBskyConvoDefs.isDeletedMessageView(m)) {
        items.push({
          type: 'deleted-message',
          key: m.id,
          message: m,
          nextMessage: null,
        })
      }
    })

    this.pendingMessages.forEach(m => {
      items.push({
        type: 'pending-message',
        key: m.id,
        message: {
          ...m.message,
          id: nanoid(),
          rev: '__fake__',
          sentAt: new Date().toISOString(),
          sender: this.sender,
        },
        nextMessage: null,
      })
    })

    this.footerItems.forEach(item => {
      items.push(item)
    })

    return items
      .filter(item => {
        if (isConvoItemMessage(item)) {
          return !this.deletedMessages.has(item.message.id)
        }
        return true
      })
      .map((item, i, arr) => {
        let nextMessage = null
        const isMessage = isConvoItemMessage(item)

        if (isMessage) {
          if (
            isMessage &&
            (ChatBskyConvoDefs.isMessageView(item.message) ||
              ChatBskyConvoDefs.isDeletedMessageView(item.message))
          ) {
            const next = arr[i + 1]

            if (
              isConvoItemMessage(next) &&
              next &&
              (ChatBskyConvoDefs.isMessageView(next.message) ||
                ChatBskyConvoDefs.isDeletedMessageView(next.message))
            ) {
              nextMessage = next.message
            }
          }

          return {
            ...item,
            nextMessage,
          }
        }

        return item
      })
  }
}
