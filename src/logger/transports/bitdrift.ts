import {debug, error, info, warn} from '#/logger/bitdrift/lib'
import {LogLevel, Transport} from '#/logger/types'
import {prepareMetadata} from '#/logger/util'

const logFunctions = {
  [LogLevel.Debug]: debug,
  [LogLevel.Info]: info,
  [LogLevel.Log]: info,
  [LogLevel.Warn]: warn,
  [LogLevel.Error]: error,
} as const

export const bitdriftTransport: Transport = (
  level,
  context,
  message,
  metadata,
) => {
  const log = logFunctions[level]
  log(message.toString(), {
    // match Sentry payload
    context,
    ...prepareMetadata(metadata),
  })
}
