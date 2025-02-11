import {
  debug as bdDebug,
  error as bdError,
  info as bdInfo,
  warn as bdWarn,
} from '#/lib/bitdrift'
import {LogLevel, Transport} from '#/logger/types'

const logFunctions = {
  [LogLevel.Debug]: bdDebug,
  [LogLevel.Info]: bdInfo,
  [LogLevel.Log]: bdInfo,
  [LogLevel.Warn]: bdWarn,
  [LogLevel.Error]: bdError,
} as const

export const bitdriftTransport: Transport = (level, _context, message) => {
  const log = logFunctions[level]
  log('' + message)
}
