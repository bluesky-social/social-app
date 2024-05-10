import {BskyAgent, ChatBskyConvoGetLog} from '@atproto-labs/api'
import EventEmitter from 'eventemitter3'
import {nanoid} from 'nanoid/non-secure'

import {networkRetry} from '#/lib/async/retry'
import {logger} from '#/logger'
import {DEFAULT_POLL_INTERVAL} from '#/state/messages/events/const'
import {
  MessagesEventBusDispatch,
  MessagesEventBusDispatchEvent,
  MessagesEventBusError,
  MessagesEventBusErrorCode,
  MessagesEventBusEvents,
  MessagesEventBusParams,
  MessagesEventBusStatus,
} from '#/state/messages/events/types'

const LOGGER_CONTEXT = 'MessagesEventBus'

export class MessagesEventBus {
  private id: string

  private agent: BskyAgent
  private __tempFromUserDid: string
  private emitter = new EventEmitter<MessagesEventBusEvents>()

  private status: MessagesEventBusStatus = MessagesEventBusStatus.Initializing
  private error: MessagesEventBusError | undefined
  private latestRev: string | undefined = undefined
  private pollInterval = DEFAULT_POLL_INTERVAL
  private requestedPollIntervals: Map<string, number> = new Map()

  constructor(params: MessagesEventBusParams) {
    this.id = nanoid(3)
    this.agent = params.agent
    this.__tempFromUserDid = params.__tempFromUserDid

    this.init()
  }

  requestPollInterval(interval: number) {
    const id = nanoid()
    this.requestedPollIntervals.set(id, interval)
    this.dispatch({
      event: MessagesEventBusDispatchEvent.UpdatePoll,
    })
    return () => {
      this.requestedPollIntervals.delete(id)
      this.dispatch({
        event: MessagesEventBusDispatchEvent.UpdatePoll,
      })
    }
  }

  trail(handler: (events: ChatBskyConvoGetLog.OutputSchema['logs']) => void) {
    this.emitter.on('events', handler)
    return () => {
      this.emitter.off('events', handler)
    }
  }

  trailConvo(
    convoId: string,
    handler: (events: ChatBskyConvoGetLog.OutputSchema['logs']) => void,
  ) {
    const handle = (events: ChatBskyConvoGetLog.OutputSchema['logs']) => {
      const convoEvents = events.filter(ev => {
        if (typeof ev.convoId === 'string' && ev.convoId === convoId) {
          return ev.convoId === convoId
        }
        return false
      })

      if (convoEvents.length > 0) {
        handler(convoEvents)
      }
    }

    this.emitter.on('events', handle)
    return () => {
      this.emitter.off('events', handle)
    }
  }

  getLatestRev() {
    return this.latestRev
  }

  onConnect(handler: () => void) {
    this.emitter.on('connect', handler)

    if (
      this.status === MessagesEventBusStatus.Ready ||
      this.status === MessagesEventBusStatus.Backgrounded ||
      this.status === MessagesEventBusStatus.Suspended
    ) {
      handler()
    }

    return () => {
      this.emitter.off('connect', handler)
    }
  }

  onError(handler: (payload?: MessagesEventBusError) => void) {
    this.emitter.on('error', handler)

    if (this.status === MessagesEventBusStatus.Error) {
      handler(this.error)
    }

    return () => {
      this.emitter.off('error', handler)
    }
  }

  background() {
    logger.debug(`${LOGGER_CONTEXT}: background`, {}, logger.DebugContext.convo)
    this.dispatch({event: MessagesEventBusDispatchEvent.Background})
  }

  suspend() {
    logger.debug(`${LOGGER_CONTEXT}: suspend`, {}, logger.DebugContext.convo)
    this.dispatch({event: MessagesEventBusDispatchEvent.Suspend})
  }

  resume() {
    logger.debug(`${LOGGER_CONTEXT}: resume`, {}, logger.DebugContext.convo)
    this.dispatch({event: MessagesEventBusDispatchEvent.Resume})
  }

  private dispatch(action: MessagesEventBusDispatch) {
    const prevStatus = this.status

    switch (this.status) {
      case MessagesEventBusStatus.Initializing: {
        switch (action.event) {
          case MessagesEventBusDispatchEvent.Ready: {
            this.status = MessagesEventBusStatus.Ready
            this.resetPoll()
            this.emitter.emit('connect')
            break
          }
          case MessagesEventBusDispatchEvent.Background: {
            this.status = MessagesEventBusStatus.Backgrounded
            this.resetPoll()
            this.emitter.emit('connect')
            break
          }
          case MessagesEventBusDispatchEvent.Suspend: {
            this.status = MessagesEventBusStatus.Suspended
            break
          }
          case MessagesEventBusDispatchEvent.Error: {
            this.status = MessagesEventBusStatus.Error
            this.error = action.payload
            this.emitter.emit('error', action.payload)
            break
          }
        }
        break
      }
      case MessagesEventBusStatus.Ready: {
        switch (action.event) {
          case MessagesEventBusDispatchEvent.Background: {
            this.status = MessagesEventBusStatus.Backgrounded
            this.resetPoll()
            break
          }
          case MessagesEventBusDispatchEvent.Suspend: {
            this.status = MessagesEventBusStatus.Suspended
            this.stopPoll()
            break
          }
          case MessagesEventBusDispatchEvent.Error: {
            this.status = MessagesEventBusStatus.Error
            this.error = action.payload
            this.stopPoll()
            this.emitter.emit('error', action.payload)
            break
          }
          case MessagesEventBusDispatchEvent.UpdatePoll: {
            this.resetPoll()
            break
          }
        }
        break
      }
      case MessagesEventBusStatus.Backgrounded: {
        switch (action.event) {
          case MessagesEventBusDispatchEvent.Resume: {
            this.status = MessagesEventBusStatus.Ready
            this.resetPoll()
            break
          }
          case MessagesEventBusDispatchEvent.Suspend: {
            this.status = MessagesEventBusStatus.Suspended
            this.stopPoll()
            break
          }
          case MessagesEventBusDispatchEvent.Error: {
            this.status = MessagesEventBusStatus.Error
            this.error = action.payload
            this.stopPoll()
            this.emitter.emit('error', action.payload)
            break
          }
          case MessagesEventBusDispatchEvent.UpdatePoll: {
            this.resetPoll()
            break
          }
        }
        break
      }
      case MessagesEventBusStatus.Suspended: {
        switch (action.event) {
          case MessagesEventBusDispatchEvent.Resume: {
            this.status = MessagesEventBusStatus.Ready
            this.resetPoll()
            break
          }
          case MessagesEventBusDispatchEvent.Background: {
            this.status = MessagesEventBusStatus.Backgrounded
            this.resetPoll()
            break
          }
          case MessagesEventBusDispatchEvent.Error: {
            this.status = MessagesEventBusStatus.Error
            this.error = action.payload
            this.stopPoll()
            this.emitter.emit('error', action.payload)
            break
          }
        }
        break
      }
      case MessagesEventBusStatus.Error: {
        switch (action.event) {
          case MessagesEventBusDispatchEvent.Resume: {
            // basically reset
            this.status = MessagesEventBusStatus.Initializing
            this.error = undefined
            this.latestRev = undefined
            this.init()
            break
          }
        }
        break
      }
      default:
        break
    }

    logger.debug(
      `${LOGGER_CONTEXT}: dispatch '${action.event}'`,
      {
        id: this.id,
        prev: prevStatus,
        next: this.status,
      },
      logger.DebugContext.convo,
    )
  }

  private async init() {
    logger.debug(`${LOGGER_CONTEXT}: init`, {}, logger.DebugContext.convo)

    try {
      const response = await networkRetry(2, () => {
        return this.agent.api.chat.bsky.convo.listConvos(
          {
            limit: 1,
          },
          {
            headers: {
              Authorization: this.__tempFromUserDid,
            },
          },
        )
      })
      // throw new Error('UNCOMMENT TO TEST INIT FAILURE')

      const {convos} = response.data

      for (const convo of convos) {
        if (convo.rev > (this.latestRev = this.latestRev || convo.rev)) {
          this.latestRev = convo.rev
        }
      }

      this.dispatch({event: MessagesEventBusDispatchEvent.Ready})
    } catch (e: any) {
      logger.error(e, {
        context: `${LOGGER_CONTEXT}: init failed`,
      })

      this.dispatch({
        event: MessagesEventBusDispatchEvent.Error,
        payload: {
          exception: e,
          code: MessagesEventBusErrorCode.InitFailed,
          retry: () => {
            this.dispatch({event: MessagesEventBusDispatchEvent.Resume})
          },
        },
      })
    }
  }

  /*
   * Polling
   */

  private isPolling = false
  private pollIntervalRef: NodeJS.Timeout | undefined

  private getPollInterval() {
    switch (this.status) {
      case MessagesEventBusStatus.Ready: {
        const requested = Array.from(this.requestedPollIntervals.values())
        const lowest = Math.min(DEFAULT_POLL_INTERVAL, ...requested)
        return lowest
      }
      default:
        return DEFAULT_POLL_INTERVAL
    }
  }

  private resetPoll() {
    this.pollInterval = this.getPollInterval()
    this.stopPoll()
    this.startPoll()
  }

  private startPoll() {
    if (!this.isPolling) this.poll()

    this.pollIntervalRef = setInterval(() => {
      if (this.isPolling) return
      this.poll()
    }, this.pollInterval)
  }

  private stopPoll() {
    if (this.pollIntervalRef) clearInterval(this.pollIntervalRef)
  }

  private async poll() {
    if (this.isPolling) return

    this.isPolling = true

    // logger.debug(
    //   `${LOGGER_CONTEXT}: poll`,
    //   {
    //     requestedPollIntervals: Array.from(
    //       this.requestedPollIntervals.values(),
    //     ),
    //   },
    //   logger.DebugContext.convo,
    // )

    try {
      const response = await networkRetry(2, () => {
        return this.agent.api.chat.bsky.convo.getLog(
          {
            cursor: this.latestRev,
          },
          {
            headers: {
              Authorization: this.__tempFromUserDid,
            },
          },
        )
      })

      // throw new Error('UNCOMMENT TO TEST POLL FAILURE')

      const {logs: events} = response.data

      let needsEmit = false
      let batch: ChatBskyConvoGetLog.OutputSchema['logs'] = []

      for (const ev of events) {
        /*
         * If there's a rev, we should handle it. If there's not a rev, we don't
         * know what it is.
         */
        if (typeof ev.rev === 'string') {
          /*
           * We only care about new events
           */
          if (ev.rev > (this.latestRev = this.latestRev || ev.rev)) {
            /*
             * Update rev regardless of if it's a ev type we care about or not
             */
            this.latestRev = ev.rev
            needsEmit = true
            batch.push(ev)
          }
        }
      }

      if (needsEmit) {
        try {
          this.emitter.emit('events', batch)
        } catch (e: any) {
          logger.error(e, {
            context: `${LOGGER_CONTEXT}: process latest events`,
          })
        }
      }
    } catch (e: any) {
      logger.error(e, {context: `${LOGGER_CONTEXT}: poll events failed`})

      this.dispatch({
        event: MessagesEventBusDispatchEvent.Error,
        payload: {
          exception: e,
          code: MessagesEventBusErrorCode.PollFailed,
          retry: () => {
            this.dispatch({event: MessagesEventBusDispatchEvent.Resume})
          },
        },
      })
    } finally {
      this.isPolling = false
    }
  }
}
