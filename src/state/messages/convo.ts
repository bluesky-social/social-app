import {AppBskyActorDefs} from '@atproto/api'
import {
  BskyAgent,
  ChatBskyConvoDefs,
  ChatBskyConvoSendMessage,
} from '@atproto-labs/api'
import {EventEmitter} from 'eventemitter3'
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
  Ready = 'ready',
  Error = 'error',
  Destroyed = 'destroyed',
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
    }
  | {
      status: ConvoStatus.Error
      error: any
    }
  | {
      status: ConvoStatus.Destroyed
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
  }

  async initialize() {
    if (this.status !== 'uninitialized') return
    this.status = ConvoStatus.Initializing

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
      const {convo} = response.data

      this.convo = convo
      this.sender = this.convo.members.find(
        m => m.did === this.__tempFromUserDid,
      )
      this.status = ConvoStatus.Ready

      this.commit()

      await this.fetchMessageHistory()

      this.pollEvents()
    } catch (e) {
      this.status = ConvoStatus.Error
      this.error = e
    }
  }

  private async pollEvents() {
    if (this.status === ConvoStatus.Destroyed) return
    if (this.pendingEventIngestion) return
    setTimeout(async () => {
      this.pendingEventIngestion = this.ingestLatestEvents()
      await this.pendingEventIngestion
      this.pendingEventIngestion = undefined
      this.pollEvents()
    }, 5e3)
  }

  async fetchMessageHistory() {
    if (this.status === ConvoStatus.Destroyed) return
    // reached end
    if (this.historyCursor === null) return
    if (this.isFetchingHistory) return

    this.isFetchingHistory = true
    this.commit()

    /*
     * Delay if paginating while scrolled.
     *
     * TODO why does the FlatList jump without this delay?
     *
     * Tbh it feels a little more natural with a slight delay.
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
    this.commit()
  }

  async ingestLatestEvents() {
    if (this.status === ConvoStatus.Destroyed) return

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

    this.commit()
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

  async sendMessage(message: ChatBskyConvoSendMessage.InputSchema['message']) {
    if (this.status === ConvoStatus.Destroyed) return
    // Ignore empty messages for now since they have no other purpose atm
    if (!message.text.trim()) return

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

  async deleteMessage(messageId: string) {
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
  get items(): ConvoItem[] {
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

  destroy() {
    this.status = ConvoStatus.Destroyed
    this.commit()
  }

  get state(): ConvoState {
    switch (this.status) {
      case ConvoStatus.Initializing: {
        return {
          status: ConvoStatus.Initializing,
        }
      }
      case ConvoStatus.Ready: {
        return {
          status: ConvoStatus.Ready,
          items: this.items,
          convo: this.convo!,
          isFetchingHistory: this.isFetchingHistory,
        }
      }
      case ConvoStatus.Error: {
        return {
          status: ConvoStatus.Error,
          error: this.error,
        }
      }
      case ConvoStatus.Destroyed: {
        return {
          status: ConvoStatus.Destroyed,
        }
      }
      default: {
        return {
          status: ConvoStatus.Uninitialized,
        }
      }
    }
  }

  private _emitter = new EventEmitter()

  private commit() {
    this._emitter.emit('update')
  }

  on(event: 'update', cb: () => void) {
    this._emitter.on(event, cb)
  }

  off(event: 'update', cb: () => void) {
    this._emitter.off(event, cb)
  }
}
