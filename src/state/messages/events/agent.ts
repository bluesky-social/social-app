import {BskyAgent, ChatBskyConvoGetLog} from '@atproto-labs/api'
import EventEmitter from 'eventemitter3'
import {nanoid} from 'nanoid/non-secure'

import {logger} from '#/logger'
import {
  MessagesEventBusDispatch,
  MessagesEventBusDispatchEvent,
  MessagesEventBusError,
  MessagesEventBusErrorCode,
  MessagesEventBusParams,
  MessagesEventBusState,
  MessagesEventBusStatus,
} from '#/state/messages/events/types'

const LOGGER_CONTEXT = 'MessagesEventBus'

const ACTIVE_POLL_INTERVAL = 3e3

export class MessagesEventBus {
  private id: string

  private agent: BskyAgent
  private __tempFromUserDid: string
  private emitter = new EventEmitter()

  private status: MessagesEventBusStatus = MessagesEventBusStatus.Uninitialized
  private pollInterval = ACTIVE_POLL_INTERVAL
  private error: MessagesEventBusError | undefined
  private latestRev: string | undefined = undefined

  private nextPoll: NodeJS.Timeout | undefined

  snapshot: MessagesEventBusState | undefined

  constructor(params: MessagesEventBusParams) {
    this.id = nanoid(3)
    this.agent = params.agent
    this.__tempFromUserDid = params.__tempFromUserDid

    this.subscribe = this.subscribe.bind(this)
    this.getSnapshot = this.getSnapshot.bind(this)
    this.init = this.init.bind(this)
    this.suspend = this.suspend.bind(this)
    this.resume = this.resume.bind(this)
    this.setPollInterval = this.setPollInterval.bind(this)
    this.trail = this.trail.bind(this)
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

  getSnapshot(): MessagesEventBusState {
    if (!this.snapshot) this.snapshot = this.generateSnapshot()
    // logger.debug(`${LOGGER_CONTEXT}: snapshotted`, {}, logger.DebugContext.convo)
    return this.snapshot
  }

  private generateSnapshot(): MessagesEventBusState {
    switch (this.status) {
      case MessagesEventBusStatus.Initializing: {
        return {
          status: MessagesEventBusStatus.Initializing,
          error: undefined,
          setPollInterval: this.setPollInterval,
          trail: this.trail,
        }
      }
      case MessagesEventBusStatus.Ready: {
        return {
          status: this.status,
          error: undefined,
          setPollInterval: this.setPollInterval,
          trail: this.trail,
        }
      }
      case MessagesEventBusStatus.Suspended: {
        return {
          status: this.status,
          error: undefined,
          setPollInterval: this.setPollInterval,
          trail: this.trail,
        }
      }
      case MessagesEventBusStatus.Error: {
        return {
          status: MessagesEventBusStatus.Error,
          error: this.error || {
            code: MessagesEventBusErrorCode.Unknown,
            retry: () => {
              this.init()
            },
          },
          setPollInterval: this.setPollInterval,
          trail: this.trail,
        }
      }
      default: {
        return {
          status: MessagesEventBusStatus.Uninitialized,
          error: undefined,
          setPollInterval: this.setPollInterval,
          trail: this.trail,
        }
      }
    }
  }

  dispatch(action: MessagesEventBusDispatch) {
    const prevStatus = this.status

    switch (this.status) {
      case MessagesEventBusStatus.Uninitialized: {
        switch (action.event) {
          case MessagesEventBusDispatchEvent.Init: {
            this.status = MessagesEventBusStatus.Initializing
            this.setup()
            break
          }
        }
        break
      }
      case MessagesEventBusStatus.Initializing: {
        switch (action.event) {
          case MessagesEventBusDispatchEvent.Ready: {
            this.status = MessagesEventBusStatus.Ready
            this.pollInterval = ACTIVE_POLL_INTERVAL
            this.restartPoll()
            break
          }
          case MessagesEventBusDispatchEvent.Error: {
            this.status = MessagesEventBusStatus.Error
            this.error = action.payload
            break
          }
        }
        break
      }
      case MessagesEventBusStatus.Ready: {
        switch (action.event) {
          case MessagesEventBusDispatchEvent.Suspend: {
            this.status = MessagesEventBusStatus.Suspended
            this.cancelNextPoll()
            break
          }
          case MessagesEventBusDispatchEvent.Error: {
            this.status = MessagesEventBusStatus.Error
            this.error = action.payload
            this.cancelNextPoll()
            break
          }
        }
        break
      }
      case MessagesEventBusStatus.Suspended: {
        switch (action.event) {
          case MessagesEventBusDispatchEvent.Resume: {
            this.status = MessagesEventBusStatus.Ready
            this.pollInterval = ACTIVE_POLL_INTERVAL
            this.restartPoll()
            break
          }
          case MessagesEventBusDispatchEvent.Error: {
            this.status = MessagesEventBusStatus.Error
            this.error = action.payload
            this.cancelNextPoll()
            break
          }
        }
        break
      }
      case MessagesEventBusStatus.Error: {
        switch (action.event) {
          case MessagesEventBusDispatchEvent.Init: {
            this.status = MessagesEventBusStatus.Initializing
            this.error = undefined
            this.latestRev = undefined
            this.setup()
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

    this.commit()
  }

  private async setup() {
    logger.debug(`${LOGGER_CONTEXT}: setup`, {}, logger.DebugContext.convo)

    try {
      await this.initializeLatestRev()

      // await new Promise(y => setTimeout(y, 2000))
      // throw new Error('UNCOMMENT TO TEST INIT FAILURE')
      this.dispatch({event: MessagesEventBusDispatchEvent.Ready})
    } catch (e: any) {
      logger.error(`${LOGGER_CONTEXT}: setup failed`)

      this.dispatch({
        event: MessagesEventBusDispatchEvent.Error,
        payload: {
          exception: e,
          code: MessagesEventBusErrorCode.InitFailed,
          retry: () => {
            this.init()
          },
        },
      })
    }
  }

  init() {
    logger.debug(`${LOGGER_CONTEXT}: init`, {}, logger.DebugContext.convo)
    this.dispatch({event: MessagesEventBusDispatchEvent.Init})
  }

  suspend() {
    logger.debug(`${LOGGER_CONTEXT}: suspend`, {}, logger.DebugContext.convo)
    this.dispatch({event: MessagesEventBusDispatchEvent.Suspend})
  }

  resume() {
    logger.debug(`${LOGGER_CONTEXT}: resume`, {}, logger.DebugContext.convo)
    this.dispatch({event: MessagesEventBusDispatchEvent.Resume})
  }

  setPollInterval(interval: number) {
    this.pollInterval = interval
    this.restartPoll()
  }

  trail(handler: (events: ChatBskyConvoGetLog.OutputSchema['logs']) => void) {
    this.emitter.on('events', handler)
    return () => {
      this.emitter.off('events', handler)
    }
  }

  private async initializeLatestRev() {
    logger.debug(
      `${LOGGER_CONTEXT}: initialize latest rev`,
      {},
      logger.DebugContext.convo,
    )

    // throw new Error('UNCOMMENT TO TEST INIT FAILURE')

    const response = await this.agent.api.chat.bsky.convo.listConvos(
      {
        limit: 1,
      },
      {
        headers: {
          Authorization: this.__tempFromUserDid,
        },
      },
    )

    const {convos} = response.data

    for (const convo of convos) {
      // set to latest rev
      if (convo.rev > (this.latestRev = this.latestRev || convo.rev)) {
        this.latestRev = convo.rev
      }
    }
  }

  private restartPoll() {
    logger.debug(
      `${LOGGER_CONTEXT}: restart poll`,
      {},
      logger.DebugContext.convo,
    )
    this.cancelNextPoll()
    this.pollLatestEvents()
  }

  private cancelNextPoll() {
    logger.debug(
      `${LOGGER_CONTEXT}: cancel next poll`,
      {},
      logger.DebugContext.convo,
    )
    if (this.nextPoll) clearTimeout(this.nextPoll)
  }

  private pollLatestEvents() {
    /*
     * Uncomment to view poll events
     */
    logger.debug(`${LOGGER_CONTEXT}: poll`, {}, logger.DebugContext.convo)

    this.nextPoll = setTimeout(() => {
      this.pollLatestEvents()
    }, this.pollInterval)

    this.fetchLatestEvents()
      .then(({events}) => {
        this.processLatestEvents(events)
      })
      .catch(e => {
        logger.error(`${LOGGER_CONTEXT}: poll events failed`)

        this.dispatch({
          event: MessagesEventBusDispatchEvent.Error,
          payload: {
            exception: e,
            code: MessagesEventBusErrorCode.PollFailed,
            retry: () => {
              this.init()
            },
          },
        })
      })
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
            cursor: this.latestRev,
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

  private processLatestEvents(
    events: ChatBskyConvoGetLog.OutputSchema['logs'],
  ) {
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
      this.emitter.emit('events', batch)
    }
  }
}
