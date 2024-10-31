import {
  AppBskyActorDefs,
  BskyAgent,
  ChatBskyConvoDefs,
  ChatBskyConvoGetLog,
  ChatBskyConvoSendMessage,
} from '@atproto/api'
import {XRPCError} from '@atproto/xrpc'
import EventEmitter from 'eventemitter3'
import {nanoid} from 'nanoid/non-secure'

import {networkRetry} from '#/lib/async/retry'
import {logger} from '#/logger'
import {isNative} from '#/platform/detection'
import {
  ACTIVE_POLL_INTERVAL,
  BACKGROUND_POLL_INTERVAL,
  INACTIVE_TIMEOUT,
  NETWORK_FAILURE_STATUSES,
} from '#/state/messages/convo/const'
import {
  ConvoDispatch,
  ConvoDispatchEvent,
  ConvoError,
  ConvoErrorCode,
  ConvoEvent,
  ConvoItem,
  ConvoItemError,
  ConvoParams,
  ConvoState,
  ConvoStatus,
} from '#/state/messages/convo/types'
import {MessagesEventBus} from '#/state/messages/events/agent'
import {MessagesEventBusError} from '#/state/messages/events/types'
import {DM_SERVICE_HEADERS} from '#/state/queries/messages/const'

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
  private events: MessagesEventBus
  private senderUserDid: string

  private status: ConvoStatus = ConvoStatus.Uninitialized
  private error: ConvoError | undefined
  private oldestRev: string | undefined | null = undefined
  private isFetchingHistory = false
  private latestRev: string | undefined = undefined

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

  private isProcessingPendingMessages = false

  private lastActiveTimestamp: number | undefined

  private emitter = new EventEmitter<{event: [ConvoEvent]}>()

  convoId: string
  convo: ChatBskyConvoDefs.ConvoView | undefined
  sender: AppBskyActorDefs.ProfileViewBasic | undefined
  recipients: AppBskyActorDefs.ProfileViewBasic[] | undefined = undefined
  snapshot: ConvoState | undefined

  constructor(params: ConvoParams) {
    this.id = nanoid(3)
    this.convoId = params.convoId
    this.agent = params.agent
    this.events = params.events
    this.senderUserDid = params.agent.session?.did!

    this.subscribe = this.subscribe.bind(this)
    this.getSnapshot = this.getSnapshot.bind(this)
    this.sendMessage = this.sendMessage.bind(this)
    this.deleteMessage = this.deleteMessage.bind(this)
    this.fetchMessageHistory = this.fetchMessageHistory.bind(this)
    this.ingestFirehose = this.ingestFirehose.bind(this)
    this.onFirehoseConnect = this.onFirehoseConnect.bind(this)
    this.onFirehoseError = this.onFirehoseError.bind(this)
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
      case ConvoStatus.Disabled:
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
          error: this.error!,
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
            this.setupFirehose()
            this.requestPollInterval(ACTIVE_POLL_INTERVAL)
            break
          }
        }
        break
      }
      case ConvoStatus.Initializing: {
        switch (action.event) {
          case ConvoDispatchEvent.Ready: {
            this.status = ConvoStatus.Ready
            this.fetchMessageHistory()
            break
          }
          case ConvoDispatchEvent.Background: {
            this.status = ConvoStatus.Backgrounded
            this.fetchMessageHistory()
            this.requestPollInterval(BACKGROUND_POLL_INTERVAL)
            break
          }
          case ConvoDispatchEvent.Suspend: {
            this.status = ConvoStatus.Suspended
            this.cleanupFirehoseConnection?.()
            this.withdrawRequestedPollInterval()
            break
          }
          case ConvoDispatchEvent.Error: {
            this.status = ConvoStatus.Error
            this.error = action.payload
            this.cleanupFirehoseConnection?.()
            this.withdrawRequestedPollInterval()
            break
          }
          case ConvoDispatchEvent.Disable: {
            this.status = ConvoStatus.Disabled
            this.fetchMessageHistory() // finish init
            this.cleanupFirehoseConnection?.()
            this.withdrawRequestedPollInterval()
            break
          }
        }
        break
      }
      case ConvoStatus.Ready: {
        switch (action.event) {
          case ConvoDispatchEvent.Resume: {
            this.refreshConvo()
            this.requestPollInterval(ACTIVE_POLL_INTERVAL)
            break
          }
          case ConvoDispatchEvent.Background: {
            this.status = ConvoStatus.Backgrounded
            this.requestPollInterval(BACKGROUND_POLL_INTERVAL)
            break
          }
          case ConvoDispatchEvent.Suspend: {
            this.status = ConvoStatus.Suspended
            this.cleanupFirehoseConnection?.()
            this.withdrawRequestedPollInterval()
            break
          }
          case ConvoDispatchEvent.Error: {
            this.status = ConvoStatus.Error
            this.error = action.payload
            this.cleanupFirehoseConnection?.()
            this.withdrawRequestedPollInterval()
            break
          }
          case ConvoDispatchEvent.Disable: {
            this.status = ConvoStatus.Disabled
            this.cleanupFirehoseConnection?.()
            this.withdrawRequestedPollInterval()
            break
          }
        }
        break
      }
      case ConvoStatus.Backgrounded: {
        switch (action.event) {
          case ConvoDispatchEvent.Resume: {
            if (this.wasChatInactive()) {
              this.reset()
            } else {
              if (this.convo) {
                this.status = ConvoStatus.Ready
                this.refreshConvo()
                this.maybeRecoverFromNetworkError()
              } else {
                this.status = ConvoStatus.Initializing
                this.setup()
              }
              this.requestPollInterval(ACTIVE_POLL_INTERVAL)
            }
            break
          }
          case ConvoDispatchEvent.Suspend: {
            this.status = ConvoStatus.Suspended
            this.cleanupFirehoseConnection?.()
            this.withdrawRequestedPollInterval()
            break
          }
          case ConvoDispatchEvent.Error: {
            this.status = ConvoStatus.Error
            this.error = action.payload
            this.cleanupFirehoseConnection?.()
            this.withdrawRequestedPollInterval()
            break
          }
          case ConvoDispatchEvent.Disable: {
            this.status = ConvoStatus.Disabled
            this.cleanupFirehoseConnection?.()
            this.withdrawRequestedPollInterval()
            break
          }
        }
        break
      }
      case ConvoStatus.Suspended: {
        switch (action.event) {
          case ConvoDispatchEvent.Init: {
            this.reset()
            break
          }
          case ConvoDispatchEvent.Resume: {
            this.reset()
            break
          }
          case ConvoDispatchEvent.Error: {
            this.status = ConvoStatus.Error
            this.error = action.payload
            break
          }
          case ConvoDispatchEvent.Disable: {
            this.status = ConvoStatus.Disabled
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
          case ConvoDispatchEvent.Disable: {
            this.status = ConvoStatus.Disabled
            break
          }
        }
        break
      }
      case ConvoStatus.Disabled: {
        // can't do anything
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

    this.updateLastActiveTimestamp()
    this.commit()
  }

  private reset() {
    this.convo = undefined
    this.sender = undefined
    this.recipients = undefined
    this.snapshot = undefined

    this.status = ConvoStatus.Uninitialized
    this.error = undefined
    this.oldestRev = undefined
    this.latestRev = undefined

    this.pastMessages = new Map()
    this.newMessages = new Map()
    this.pendingMessages = new Map()
    this.deletedMessages = new Set()

    this.pendingMessageFailure = null
    this.fetchMessageHistoryError = undefined
    this.firehoseError = undefined

    this.dispatch({event: ConvoDispatchEvent.Init})
  }

  maybeRecoverFromNetworkError() {
    if (this.firehoseError) {
      this.firehoseError.retry()
      this.firehoseError = undefined
      this.commit()
    } else {
      this.batchRetryPendingMessages()
    }

    if (this.fetchMessageHistoryError) {
      this.fetchMessageHistoryError.retry()
      this.fetchMessageHistoryError = undefined
      this.commit()
    }
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

      const userIsDisabled = this.sender.chatDisabled as boolean

      if (userIsDisabled) {
        this.dispatch({event: ConvoDispatchEvent.Disable})
      } else {
        this.dispatch({event: ConvoDispatchEvent.Ready})
      }
    } catch (e: any) {
      logger.error(e, {context: 'Convo: setup failed'})

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
      this.commit()
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
  }

  /**
   * Called on any state transition, like when the chat is backgrounded. This
   * value is then checked on background -> foreground transitions.
   */
  private updateLastActiveTimestamp() {
    this.lastActiveTimestamp = Date.now()
  }
  private wasChatInactive() {
    if (!this.lastActiveTimestamp) return true
    return Date.now() - this.lastActiveTimestamp > INACTIVE_TIMEOUT
  }

  private requestedPollInterval: (() => void) | undefined
  private requestPollInterval(interval: number) {
    this.withdrawRequestedPollInterval()
    this.requestedPollInterval = this.events.requestPollInterval(interval)
  }
  private withdrawRequestedPollInterval() {
    if (this.requestedPollInterval) {
      this.requestedPollInterval()
    }
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
        const response = await networkRetry(2, () => {
          return this.agent.api.chat.bsky.convo.getConvo(
            {
              convoId: this.convoId,
            },
            {headers: DM_SERVICE_HEADERS},
          )
        })

        const convo = response.data.convo

        resolve({
          convo,
          sender: convo.members.find(m => m.did === this.senderUserDid),
          recipients: convo.members.filter(m => m.did !== this.senderUserDid),
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
      logger.error(e, {context: `Convo: failed to refresh convo`})
    }
  }

  private fetchMessageHistoryError:
    | {
        retry: () => void
      }
    | undefined
  async fetchMessageHistory() {
    logger.debug('Convo: fetch message history', {}, logger.DebugContext.convo)

    /*
     * If oldestRev is null, we've fetched all history.
     */
    if (this.oldestRev === null) return

    /*
     * Don't fetch again if a fetch is already in progress
     */
    if (this.isFetchingHistory) return

    /*
     * If we've rendered a retry state for history fetching, exit. Upon retry,
     * this will be removed and we'll try again.
     */
    if (this.fetchMessageHistoryError) return

    try {
      this.isFetchingHistory = true
      this.commit()

      const nextCursor = this.oldestRev // for TS
      const response = await networkRetry(2, () => {
        return this.agent.api.chat.bsky.convo.getMessages(
          {
            cursor: nextCursor,
            convoId: this.convoId,
            limit: isNative ? 30 : 60,
          },
          {headers: DM_SERVICE_HEADERS},
        )
      })
      const {cursor, messages} = response.data

      this.oldestRev = cursor ?? null

      for (const message of messages) {
        if (
          ChatBskyConvoDefs.isMessageView(message) ||
          ChatBskyConvoDefs.isDeletedMessageView(message)
        ) {
          /*
           * If this message is already in new messages, it was added by the
           * firehose ingestion, and we can safely overwrite it. This trusts
           * the server on ordering, and keeps it in sync.
           */
          if (this.newMessages.has(message.id)) {
            this.newMessages.delete(message.id)
          }
          this.pastMessages.set(message.id, message)
        }
      }
    } catch (e: any) {
      logger.error('Convo: failed to fetch message history')

      this.fetchMessageHistoryError = {
        retry: () => {
          this.fetchMessageHistory()
        },
      }
    } finally {
      this.isFetchingHistory = false
      this.commit()
    }
  }

  private cleanupFirehoseConnection: (() => void) | undefined
  private setupFirehose() {
    // remove old listeners, if exist
    this.cleanupFirehoseConnection?.()

    // reconnect
    this.cleanupFirehoseConnection = this.events.on(
      event => {
        switch (event.type) {
          case 'connect': {
            this.onFirehoseConnect()
            break
          }
          case 'error': {
            this.onFirehoseError(event.error)
            break
          }
          case 'logs': {
            this.ingestFirehose(event.logs)
            break
          }
        }
      },
      /*
       * This is VERY important — we only want events for this convo.
       */
      {convoId: this.convoId},
    )
  }

  private firehoseError: MessagesEventBusError | undefined

  onFirehoseConnect() {
    this.firehoseError = undefined
    this.batchRetryPendingMessages()
    this.commit()
  }

  onFirehoseError(error?: MessagesEventBusError) {
    this.firehoseError = error
    this.commit()
  }

  ingestFirehose(events: ChatBskyConvoGetLog.OutputSchema['logs']) {
    let needsCommit = false

    for (const ev of events) {
      /*
       * If there's a rev, we should handle it. If there's not a rev, we don't
       * know what it is.
       */
      if (typeof ev.rev === 'string') {
        const isUninitialized = !this.latestRev
        const isNewEvent = this.latestRev && ev.rev > this.latestRev

        /*
         * We received an event prior to fetching any history, so we can safely
         * use this as the initial history cursor
         */
        if (this.oldestRev === undefined && isUninitialized) {
          this.oldestRev = ev.rev
        }

        /*
         * We only care about new events
         */
        if (isNewEvent || isUninitialized) {
          /*
           * Update rev regardless of if it's a ev type we care about or not
           */
          this.latestRev = ev.rev

          if (
            ChatBskyConvoDefs.isLogCreateMessage(ev) &&
            ChatBskyConvoDefs.isMessageView(ev.message)
          ) {
            /**
             * If this message is already in new messages, it was added by our
             * sending logic, and is based on client-ordering. When we receive
             * the "commited" event from the log, we should replace this
             * reference and re-insert in order to respect the order we receied
             * from the log.
             */
            if (this.newMessages.has(ev.message.id)) {
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
            if (
              this.pastMessages.has(ev.message.id) ||
              this.newMessages.has(ev.message.id)
            ) {
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

  private pendingMessageFailure: 'recoverable' | 'unrecoverable' | null = null

  sendMessage(message: ChatBskyConvoSendMessage.InputSchema['message']) {
    // Ignore empty messages for now since they have no other purpose atm
    if (!message.text.trim() && !message.embed) return

    logger.debug('Convo: send message', {}, logger.DebugContext.convo)

    const tempId = nanoid()

    this.pendingMessageFailure = null
    this.pendingMessages.set(tempId, {
      id: tempId,
      message,
    })
    this.commit()

    if (!this.isProcessingPendingMessages && !this.pendingMessageFailure) {
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

      const {id, message} = pendingMessage

      const response = await this.agent.api.chat.bsky.convo.sendMessage(
        {
          convoId: this.convoId,
          message,
        },
        {encoding: 'application/json', headers: DM_SERVICE_HEADERS},
      )
      const res = response.data

      // remove from queue
      this.pendingMessages.delete(id)

      /*
       * Insert into `newMessages` as soon as we have a real ID. That way, when
       * we get an event log back, we can replace in situ.
       */
      this.newMessages.set(res.id, {
        ...res,
        $type: 'chat.bsky.convo.defs#messageView',
      })
      // render new message state, prior to firehose
      this.commit()

      // continue queue processing
      await this.processPendingMessages()
    } catch (e: any) {
      logger.error(e, {context: `Convo: failed to send message`})
      this.handleSendMessageFailure(e)
      this.isProcessingPendingMessages = false
    }
  }

  private handleSendMessageFailure(e: any) {
    if (e instanceof XRPCError) {
      if (NETWORK_FAILURE_STATUSES.includes(e.status)) {
        this.pendingMessageFailure = 'recoverable'
      } else {
        this.pendingMessageFailure = 'unrecoverable'

        switch (e.message) {
          case 'block between recipient and sender':
            this.emitter.emit('event', {
              type: 'invalidate-block-state',
              accountDids: [
                this.sender!.did,
                ...this.recipients!.map(r => r.did),
              ],
            })
            break
          case 'Account is disabled':
            this.dispatch({event: ConvoDispatchEvent.Disable})
            break
          case 'Convo not found':
          case 'Account does not exist':
          case 'recipient does not exist':
          case 'recipient requires incoming messages to come from someone they follow':
          case 'recipient has disabled incoming messages':
            break
          default:
            logger.warn(
              `Convo handleSendMessageFailure could not handle error`,
              {
                status: e.status,
                message: e.message,
              },
            )
            break
        }
      }
    } else {
      this.pendingMessageFailure = 'unrecoverable'
      logger.error(e, {
        context: `Convo handleSendMessageFailure received unknown error`,
      })
    }

    this.commit()
  }

  async batchRetryPendingMessages() {
    if (this.pendingMessageFailure === null) return

    const messageArray = Array.from(this.pendingMessages.values())
    if (messageArray.length === 0) return

    this.pendingMessageFailure = null
    this.commit()

    logger.debug(
      `Convo: batch retrying ${this.pendingMessages.size} pending messages`,
      {},
      logger.DebugContext.convo,
    )

    try {
      const {data} = await this.agent.api.chat.bsky.convo.sendMessageBatch(
        {
          items: messageArray.map(({message}) => ({
            convoId: this.convoId,
            message,
          })),
        },
        {encoding: 'application/json', headers: DM_SERVICE_HEADERS},
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
        })
      }

      for (const pendingMessage of messageArray) {
        this.pendingMessages.delete(pendingMessage.id)
      }

      this.commit()

      logger.debug(
        `Convo: sent ${this.pendingMessages.size} pending messages`,
        {},
        logger.DebugContext.convo,
      )
    } catch (e: any) {
      logger.error(e, {context: `Convo: failed to batch retry messages`})
      this.handleSendMessageFailure(e)
    }
  }

  async deleteMessage(messageId: string) {
    logger.debug('Convo: delete message', {}, logger.DebugContext.convo)

    this.deletedMessages.add(messageId)
    this.commit()

    try {
      await networkRetry(2, () => {
        return this.agent.api.chat.bsky.convo.deleteMessageForSelf(
          {
            convoId: this.convoId,
            messageId,
          },
          {encoding: 'application/json', headers: DM_SERVICE_HEADERS},
        )
      })
    } catch (e: any) {
      logger.error(e, {context: `Convo: failed to delete message`})
      this.deletedMessages.delete(messageId)
      this.commit()
      throw e
    }
  }

  on(handler: (event: ConvoEvent) => void) {
    this.emitter.on('event', handler)

    return () => {
      this.emitter.off('event', handler)
    }
  }

  /*
   * Items in reverse order, since FlatList inverts
   */
  getItems(): ConvoItem[] {
    const items: ConvoItem[] = []

    this.pastMessages.forEach(m => {
      if (ChatBskyConvoDefs.isMessageView(m)) {
        items.unshift({
          type: 'message',
          key: m.id,
          message: m,
          nextMessage: null,
          prevMessage: null,
        })
      } else if (ChatBskyConvoDefs.isDeletedMessageView(m)) {
        items.unshift({
          type: 'deleted-message',
          key: m.id,
          message: m,
          nextMessage: null,
          prevMessage: null,
        })
      }
    })

    if (this.fetchMessageHistoryError) {
      items.unshift({
        type: 'error',
        code: ConvoItemError.HistoryFailed,
        key: ConvoItemError.HistoryFailed,
        retry: () => {
          this.maybeRecoverFromNetworkError()
        },
      })
    }

    this.newMessages.forEach(m => {
      if (ChatBskyConvoDefs.isMessageView(m)) {
        items.push({
          type: 'message',
          key: m.id,
          message: m,
          nextMessage: null,
          prevMessage: null,
        })
      } else if (ChatBskyConvoDefs.isDeletedMessageView(m)) {
        items.push({
          type: 'deleted-message',
          key: m.id,
          message: m,
          nextMessage: null,
          prevMessage: null,
        })
      }
    })

    this.pendingMessages.forEach(m => {
      items.push({
        type: 'pending-message',
        key: m.id,
        message: {
          ...m.message,
          embed: undefined,
          $type: 'chat.bsky.convo.defs#messageView',
          id: nanoid(),
          rev: '__fake__',
          sentAt: new Date().toISOString(),
          /*
           * `getItems` is only run in "active" status states, where
           * `this.sender` is defined
           */
          sender: this.sender!,
        },
        nextMessage: null,
        prevMessage: null,
        failed: this.pendingMessageFailure !== null,
        retry:
          this.pendingMessageFailure === 'recoverable'
            ? () => {
                this.maybeRecoverFromNetworkError()
              }
            : undefined,
      })
    })

    if (this.firehoseError) {
      items.push({
        type: 'error',
        code: ConvoItemError.FirehoseFailed,
        key: ConvoItemError.FirehoseFailed,
        retry: () => {
          this.firehoseError?.retry()
        },
      })
    }

    return items
      .filter(item => {
        if (isConvoItemMessage(item)) {
          return !this.deletedMessages.has(item.message.id)
        }
        return true
      })
      .map((item, i, arr) => {
        let nextMessage = null
        let prevMessage = null
        const isMessage = isConvoItemMessage(item)

        if (isMessage) {
          if (
            ChatBskyConvoDefs.isMessageView(item.message) ||
            ChatBskyConvoDefs.isDeletedMessageView(item.message)
          ) {
            const next = arr[i + 1]

            if (
              isConvoItemMessage(next) &&
              (ChatBskyConvoDefs.isMessageView(next.message) ||
                ChatBskyConvoDefs.isDeletedMessageView(next.message))
            ) {
              nextMessage = next.message
            }

            const prev = arr[i - 1]

            if (
              isConvoItemMessage(prev) &&
              (ChatBskyConvoDefs.isMessageView(prev.message) ||
                ChatBskyConvoDefs.isDeletedMessageView(prev.message))
            ) {
              prevMessage = prev.message
            }
          }

          return {
            ...item,
            nextMessage,
            prevMessage,
          }
        }

        return item
      })
  }
}
