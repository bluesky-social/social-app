import {BskyAgent, ChatBskyConvoGetLog} from '@atproto/api'
import EventEmitter from 'eventemitter3'
import {nanoid} from 'nanoid/non-secure'

import {networkRetry} from '#/lib/async/retry'
import {Logger} from '#/logger'
import {
  BACKGROUND_POLL_INTERVAL,
  DEFAULT_POLL_INTERVAL,
} from '#/state/messages/events/const'
import {
  MessagesEventBusDispatch,
  MessagesEventBusDispatchEvent,
  MessagesEventBusErrorCode,
  MessagesEventBusEvent,
  MessagesEventBusParams,
  MessagesEventBusStatus,
} from '#/state/messages/events/types'
import {DM_SERVICE_HEADERS} from '#/state/queries/messages/const'

const LOGGER_CONTEXT = 'MessagesEventBus'
const logger = Logger.create(Logger.Context.DMsAgent)

export class MessagesEventBus {
  private id: string

  private agent: BskyAgent
  private emitter = new EventEmitter<{event: [MessagesEventBusEvent]}>()

  private status: MessagesEventBusStatus = MessagesEventBusStatus.Initializing
  private latestRev: string | undefined = undefined
  private pollInterval = DEFAULT_POLL_INTERVAL
  private requestedPollIntervals: Map<string, number> = new Map()

  constructor(params: MessagesEventBusParams) {
    this.id = nanoid(3)
    this.agent = params.agent

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

  getLatestRev() {
    return this.latestRev
  }

  on(
    handler: (event: MessagesEventBusEvent) => void,
    options: {
      convoId?: string
    },
  ) {
    const handle = (event: MessagesEventBusEvent) => {
      if (event.type === 'logs' && options.convoId) {
        const filteredLogs = event.logs.filter(log => {
          if ('convoId' in log && log.convoId === options.convoId) {
            return log.convoId === options.convoId
          }
          return false
        })

        if (filteredLogs.length > 0) {
          handler({
            ...event,
            logs: filteredLogs,
          })
        }
      } else {
        handler(event)
      }
    }

    this.emitter.on('event', handle)

    return () => {
      this.emitter.off('event', handle)
    }
  }

  background() {
    logger.debug(`${LOGGER_CONTEXT}: background`, {})
    this.dispatch({event: MessagesEventBusDispatchEvent.Background})
  }

  suspend() {
    logger.debug(`${LOGGER_CONTEXT}: suspend`, {})
    this.dispatch({event: MessagesEventBusDispatchEvent.Suspend})
  }

  resume() {
    logger.debug(`${LOGGER_CONTEXT}: resume`, {})
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
            this.emitter.emit('event', {type: 'connect'})
            break
          }
          case MessagesEventBusDispatchEvent.Background: {
            this.status = MessagesEventBusStatus.Backgrounded
            this.resetPoll()
            this.emitter.emit('event', {type: 'connect'})
            break
          }
          case MessagesEventBusDispatchEvent.Suspend: {
            this.status = MessagesEventBusStatus.Suspended
            break
          }
          case MessagesEventBusDispatchEvent.Error: {
            this.status = MessagesEventBusStatus.Error
            this.emitter.emit('event', {type: 'error', error: action.payload})
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
            this.stopPoll()
            this.emitter.emit('event', {type: 'error', error: action.payload})
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
            this.stopPoll()
            this.emitter.emit('event', {type: 'error', error: action.payload})
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
            this.stopPoll()
            this.emitter.emit('event', {type: 'error', error: action.payload})
            break
          }
        }
        break
      }
      case MessagesEventBusStatus.Error: {
        switch (action.event) {
          case MessagesEventBusDispatchEvent.UpdatePoll: {
            // basically reset
            this.status = MessagesEventBusStatus.Initializing
            this.latestRev = undefined
            this.init()
            break
          }
          case MessagesEventBusDispatchEvent.Resume: {
            this.status = MessagesEventBusStatus.Ready
            this.resetPoll()
            this.emitter.emit('event', {type: 'connect'})
            break
          }
        }
        break
      }
      default:
        break
    }

    logger.debug(`${LOGGER_CONTEXT}: dispatch '${action.event}'`, {
      id: this.id,
      prev: prevStatus,
      next: this.status,
    })
  }

  private async init() {
    logger.debug(`${LOGGER_CONTEXT}: init`, {})

    try {
      const response = await networkRetry(2, () => {
        return this.agent.chat.bsky.convo.getLog(
          {},
          {headers: DM_SERVICE_HEADERS},
        )
      })
      // throw new Error('UNCOMMENT TO TEST INIT FAILURE')

      const {cursor} = response.data

      // should always be defined
      if (cursor) {
        if (!this.latestRev) {
          this.latestRev = cursor
        } else if (cursor > this.latestRev) {
          this.latestRev = cursor
        }
      }

      this.dispatch({event: MessagesEventBusDispatchEvent.Ready})
    } catch (e: any) {
      logger.error(e, {
        message: `${LOGGER_CONTEXT}: init failed`,
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
      case MessagesEventBusStatus.Backgrounded: {
        return BACKGROUND_POLL_INTERVAL
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
    // )

    try {
      const response = await networkRetry(2, () => {
        return this.agent.chat.bsky.convo.getLog(
          {
            cursor: this.latestRev,
          },
          {headers: DM_SERVICE_HEADERS},
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
        if ('rev' in ev && typeof ev.rev === 'string') {
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
          this.emitter.emit('event', {type: 'logs', logs: batch})
        } catch (e: any) {
          logger.error(e, {
            message: `${LOGGER_CONTEXT}: process latest events`,
          })
        }
      }
    } catch (e: any) {
      logger.error(e, {message: `${LOGGER_CONTEXT}: poll events failed`})

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
