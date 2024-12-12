import {
  debug as bdDebug,
  error as bdError,
  info as bdInfo,
  warn as bdWarn,
} from '@bitdrift/react-native'

import {LogLevel, Transport} from './types'

export function createBitdriftTransport(): Transport {
  const logFunctions = {
    [LogLevel.Debug]: bdDebug,
    [LogLevel.Info]: bdInfo,
    [LogLevel.Log]: bdInfo,
    [LogLevel.Warn]: bdWarn,
    [LogLevel.Error]: bdError,
  } as const

  return (level, message) => {
    const log = logFunctions[level]
    log(message.toString())
  }
}
