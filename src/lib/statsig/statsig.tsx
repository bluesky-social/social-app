import type React from 'react'

import {type Metrics} from '#/logger'
import {type Gate} from './gates'

export type {Metrics as LogEvents}

/**
 * @deprecated use `logger.metric()` instead
 */
export function logEvent<E extends keyof Metrics>(
  _eventName: E & string,
  _rawMetadata: Metrics[E] & any,
  _options: {
    /**
     * Send to our data lake only, not to StatSig
     */
    lake?: boolean
  } = {lake: false},
) {}

export function useGate(): (_gateName: Gate, _options?: any) => boolean {
  return () => false
}

export function Provider({children}: {children: React.ReactNode}) {
  return children
}
