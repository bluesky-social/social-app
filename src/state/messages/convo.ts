import {AppBskyActorDefs} from '@atproto/api'
import {
  BskyAgent,
  ChatBskyConvoDefs,
  ChatBskyConvoSendMessage,
} from '@atproto-labs/api'
import {nanoid} from 'nanoid/non-secure'

import {isNative} from '#/platform/detection'

export type ConvoParams = {
  convoId: string
  agent: BskyAgent
  __tempFromUserDid: string
}

export enum ConvoStatus {
  Uninitialized = 'uninitialized',
  Initializing = 'initializing',
  Resuming = 'resuming',
  Ready = 'ready',
  Error = 'error',
  Suspended = 'suspended',
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

export type ConvoState =
  | {
      status: ConvoStatus.Uninitialized
    }
  | {
      status: ConvoStatus.Initializing
    }
  | {
      status: ConvoStatus.Ready
      items: ConvoItem[]
      convo: ChatBskyConvoDefs.ConvoView
      isFetchingHistory: boolean
      deleteMessage: (messageId: string) => void
      sendMessage: (
        message: ChatBskyConvoSendMessage.InputSchema['message'],
      ) => void
      fetchMessageHistory: () => void
    }
  | {
      status: ConvoStatus.Suspended
      items: ConvoItem[]
      convo: ChatBskyConvoDefs.ConvoView
      isFetchingHistory: boolean
    }
  | {
      status: ConvoStatus.Resuming
      items: ConvoItem[]
      convo: ChatBskyConvoDefs.ConvoView
      isFetchingHistory: boolean
    }
  | {
      status: ConvoStatus.Error
      error: any
    }

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
  private agent: BskyAgent
  private __tempFromUserDid: string

  private status: ConvoStatus = ConvoStatus.Uninitialized
  private error: any
  private historyCursor: string | undefined | null = undefined
  private isFetchingHistory = false
  private eventsCursor: string | undefined = undefined

  convoId: string
  convo: ChatBskyConvoDefs.ConvoView | undefined
  sender: AppBskyActorDefs.ProfileViewBasic | undefined

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

  private pendingEventIngestion: Promise<void> | undefined
  private isProcessingPendingMessages = false

  constructor(params: ConvoParams) {
    this.convoId = params.convoId
    this.agent = params.agent
    this.__tempFromUserDid = params.__tempFromUserDid

    /*
     * Bind methods used by `useSyncExternalStore`
     */
    this.subscribe = this.subscribe.bind(this)
    this.getSnapshot = this.getSnapshot.bind(this)
  }

  async refreshConvo() {
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
    this.convo = response.data.convo
    this.sender = this.convo.members.find(m => m.did === this.__tempFromUserDid)
  }

  async resume() {
    try {
      if (this.status === ConvoStatus.Uninitialized) {
        console.log('INITIALIZING')
        this.status = ConvoStatus.Initializing
        this.generateSnapshot()

        await this.refreshConvo()
        this.status = ConvoStatus.Ready
        this.generateSnapshot()

        await this.fetchMessageHistory()

        this.pollEvents()
      } else if (this.status === ConvoStatus.Suspended) {
        console.log('RESUMING')
        this.status = ConvoStatus.Resuming
        this.generateSnapshot()

        await this.refreshConvo()
        this.status = ConvoStatus.Ready
        this.generateSnapshot()

        await this.fetchMessageHistory()

        this.pollEvents()
      }
    } catch (e) {
      this.status = ConvoStatus.Error
      this.error = e
    }
  }

  async suspend() {
    this.status = ConvoStatus.Suspended
    this.generateSnapshot()
  }

  private async pollEvents() {
    if (this.status !== ConvoStatus.Ready) return
    if (this.pendingEventIngestion) return

    console.log('POLL')
    setTimeout(async () => {
      this.pendingEventIngestion = this.ingestLatestEvents()
      await this.pendingEventIngestion
      this.pendingEventIngestion = undefined
      this.pollEvents()
    }, 1e3)
  }

  async fetchMessageHistory() {
    if (this.status !== ConvoStatus.Ready) return

    /*
     * If historyCursor is null, we've fetched all history.
     */
    if (this.historyCursor === null) return

    /*
     * Don't fetch again if a fetch is already in progress
     */
    if (this.isFetchingHistory) return

    this.isFetchingHistory = true
    this.generateSnapshot()

    /*
     * Delay if paginating while scrolled to prevent momentum scrolling from
     * jerking the list around, plus makes it feel a little more human.
     */
    if (this.pastMessages.size > 0) {
      await new Promise(y => setTimeout(y, 500))
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

    this.historyCursor = cursor || null

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

    this.isFetchingHistory = false
    this.generateSnapshot()
  }

  async ingestLatestEvents() {
    if (this.status === ConvoStatus.Suspended) return

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

    for (const log of logs) {
      /*
       * If there's a rev, we should handle it. If there's not a rev, we don't
       * know what it is.
       */
      if (typeof log.rev === 'string') {
        /*
         * We only care about new events
         */
        if (log.rev > (this.eventsCursor = this.eventsCursor || log.rev)) {
          /*
           * Update rev regardless of if it's a log type we care about or not
           */
          this.eventsCursor = log.rev

          /*
           * This is VERY important. We don't want to insert any messages from
           * your other chats.
           */
          if (log.convoId !== this.convoId) continue

          if (
            ChatBskyConvoDefs.isLogCreateMessage(log) &&
            ChatBskyConvoDefs.isMessageView(log.message)
          ) {
            if (this.newMessages.has(log.message.id)) {
              // Trust the log as the source of truth on ordering
              this.newMessages.delete(log.message.id)
            }
            this.newMessages.set(log.message.id, log.message)
          } else if (
            ChatBskyConvoDefs.isLogDeleteMessage(log) &&
            ChatBskyConvoDefs.isDeletedMessageView(log.message)
          ) {
            /*
             * Update if we have this in state. If we don't, don't worry about it.
             */
            if (this.pastMessages.has(log.message.id)) {
              /*
               * For now, we remove deleted messages from the thread, if we receive one.
               *
               * To support them, it'd look something like this:
               *   this.pastMessages.set(log.message.id, log.message)
               */
              this.pastMessages.delete(log.message.id)
              this.newMessages.delete(log.message.id)
              this.deletedMessages.delete(log.message.id)
            }
          }
        }
      }
    }

    this.generateSnapshot()
  }

  async processPendingMessages() {
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

      this.generateSnapshot()
    } catch (e) {
      this.footerItems.set('pending-retry', {
        type: 'pending-retry',
        key: 'pending-retry',
        retry: this.batchRetryPendingMessages.bind(this),
      })
      this.generateSnapshot()
    }
  }

  async batchRetryPendingMessages() {
    this.footerItems.delete('pending-retry')
    this.generateSnapshot()

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

      this.generateSnapshot()
    } catch (e) {
      this.footerItems.set('pending-retry', {
        type: 'pending-retry',
        key: 'pending-retry',
        retry: this.batchRetryPendingMessages.bind(this),
      })
      this.generateSnapshot()
    }
  }

  async sendMessage(message: ChatBskyConvoSendMessage.InputSchema['message']) {
    if (this.status === ConvoStatus.Suspended) return
    // Ignore empty messages for now since they have no other purpose atm
    if (!message.text.trim()) return

    const tempId = nanoid()

    this.pendingMessages.set(tempId, {
      id: tempId,
      message,
    })
    this.generateSnapshot()

    if (!this.isProcessingPendingMessages) {
      this.processPendingMessages()
    }
  }

  async deleteMessage(messageId: string) {
    this.deletedMessages.add(messageId)
    this.generateSnapshot()

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
      this.generateSnapshot()
      throw e
    }
  }

  /*
   * Items in reverse order, since FlatList inverts
   */
  getItems(): ConvoItem[] {
    const items: ConvoItem[] = []

    // `newMessages` is in insertion order, unshift to reverse
    this.newMessages.forEach(m => {
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

    // `newMessages` is in insertion order, unshift to reverse
    this.pendingMessages.forEach(m => {
      items.unshift({
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
      items.unshift(item)
    })

    this.pastMessages.forEach(m => {
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

    return items
      .filter(item => {
        if (isConvoItemMessage(item)) {
          return !this.deletedMessages.has(item.message.id)
        }
        return true
      })
      .map((item, i) => {
        let nextMessage = null
        const isMessage = isConvoItemMessage(item)

        if (isMessage) {
          if (
            isMessage &&
            (ChatBskyConvoDefs.isMessageView(item.message) ||
              ChatBskyConvoDefs.isDeletedMessageView(item.message))
          ) {
            const next = items[i - 1]

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

  snapshot: ConvoState = {
    status: ConvoStatus.Uninitialized,
  }

  private generateSnapshot() {
    switch (this.status) {
      case ConvoStatus.Initializing: {
        this.snapshot = {
          status: ConvoStatus.Initializing,
        }
        break
      }
      case ConvoStatus.Ready: {
        this.snapshot = {
          status: this.status,
          items: this.getItems(),
          convo: this.convo!,
          isFetchingHistory: this.isFetchingHistory,
          deleteMessage: this.deleteMessage.bind(this),
          sendMessage: this.sendMessage.bind(this),
          fetchMessageHistory: this.fetchMessageHistory.bind(this),
        }
        break
      }
      case ConvoStatus.Suspended: {
        this.snapshot = {
          status: this.status,
          items: this.getItems(),
          convo: this.convo!,
          isFetchingHistory: this.isFetchingHistory,
        }
        break
      }
      case ConvoStatus.Resuming: {
        this.snapshot = {
          status: this.status,
          items: this.getItems(),
          convo: this.convo!,
          isFetchingHistory: this.isFetchingHistory,
        }
        break
      }
      case ConvoStatus.Error: {
        this.snapshot = {
          status: ConvoStatus.Error,
          error: this.error,
        }
        break
      }
      default: {
        this.snapshot = {
          status: ConvoStatus.Uninitialized,
        }
        break
      }
    }

    this.emitNewSnapshot()
  }

  private emitNewSnapshot() {
    this.subscribers.forEach(subscriber => subscriber())
  }

  private subscribers: (() => void)[] = []

  subscribe(subscriber: () => void) {
    console.log('SUBSCRIBED')
    this.subscribers.push(subscriber)
    this.resume()
    return () => {
      console.log('UN-SUBSCRIBED')
      this.suspend()
      this.subscribers = this.subscribers.filter(s => s !== subscriber)
    }
  }

  getSnapshot(): ConvoState {
    return this.snapshot
  }
}
