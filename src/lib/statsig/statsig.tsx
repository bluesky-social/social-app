import type React from 'react'

import {type Gate} from './gates'

/**
 * @deprecated use `logger.metric()` instead
 */
export function logEvent(
  _eventName: string,
  _rawMetadata: any,
  _options: {
    /**
     * Send to our data lake only, not to StatSig
     */
    lake?: boolean
  } = {lake: false},
) {}

const fn = () => false
export function useGate(): (_gateName: Gate, _options?: any) => boolean {
  return fn
}

export function Provider({children}: {children: React.ReactNode}) {
  return children
}
