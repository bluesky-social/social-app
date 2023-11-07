import React from 'react'

import {logger} from '#/logger'
import {schema, Schema} from '#/state/persisted/schema'
import {migrate} from '#/state/persisted/legacy'
import * as store from '#/state/persisted/store'
import BroadcastChannel from '#/state/persisted/broadcast'

export type {Schema} from '#/state/persisted/schema'
export {schema} from '#/state/persisted/schema'

const broadcast = new BroadcastChannel('BSKY_BROADCAST_CHANNEL')
const UPDATE_EVENT = 'BSKY_UPDATE'

/**
 * Initializes and returns persisted data state, so that it can be passed to
 * the Provider.
 */
export async function init() {
  logger.debug('persisted state: initializing')

  try {
    await migrate() // migrate old store
    const stored = await store.read() // check for new store
    if (!stored) await store.write(schema) // opt: init new store
    return stored || schema // return new store
  } catch (e) {
    logger.error('persisted state: failed to load root state from storage', {
      error: e,
    })
    // AsyncStorage failured, but we can still continue in memory
    return schema
  }
}

export const PersistedContext = React.createContext<Schema>(schema)
export const PersistedSetStateContext = React.createContext<{
  setState: (fn: (prevState: Schema) => Schema) => void
}>({
  setState: () => {},
})

export function Provider({
  data,
  children,
}: React.PropsWithChildren<{data: Schema}>) {
  const [state, setState] = React.useState<Schema>(data)

  React.useEffect(() => {
    broadcast.onmessage = async ({data}) => {
      // validate event
      if (typeof data === 'object' && data.event === UPDATE_EVENT) {
        try {
          // read next state, possibly updated by another tab
          const next = await store.read()

          if (next) {
            logger.debug(
              `persisted state: handling update from broadcast channel`,
            )
            setState(next)
          } else {
            logger.error(
              `persisted state: handled update update from broadcast channel, but found no data`,
            )
          }
        } catch (e) {
          logger.error(
            `persisted state: failed handling update from broadcast channel`,
            {
              error: e,
            },
          )
        }
      }
    }

    return () => {
      broadcast.close()
    }
  }, [setState])

  /**
   * Commit a complete state object to storage, and broadcast to other tabs
   * that an update has occurred.
   */
  const _write = React.useCallback(async (next: Schema) => {
    try {
      await store.write(next)
      // must happen on next tick, otherwise the tab will read stale storage data
      setTimeout(() => broadcast.postMessage({event: UPDATE_EVENT}), 0)
      logger.debug(`persisted state: wrote root state to storage`)
    } catch (e) {
      logger.error(`persisted state: failed writing root state to storage`, {
        error: e,
      })
    }
  }, [])

  const _setState = React.useCallback(
    (fn: (prevState: Schema) => Schema) => {
      setState(s => {
        const next = fn(s)
        _write(next)
        return next
      })
    },
    [_write, setState],
  )

  return (
    <PersistedContext.Provider value={state}>
      <PersistedSetStateContext.Provider value={{setState: _setState}}>
        {children}
      </PersistedSetStateContext.Provider>
    </PersistedContext.Provider>
  )
}

export function usePersisted() {
  return React.useContext(PersistedContext)
}
