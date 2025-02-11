import {LogLevel, Metadata} from '#/logger/types'

export const enabledLogLevels: {
  [key in LogLevel]: LogLevel[]
} = {
  [LogLevel.Debug]: [
    LogLevel.Debug,
    LogLevel.Info,
    LogLevel.Log,
    LogLevel.Warn,
    LogLevel.Error,
  ],
  [LogLevel.Info]: [LogLevel.Info, LogLevel.Log, LogLevel.Warn, LogLevel.Error],
  [LogLevel.Log]: [LogLevel.Log, LogLevel.Warn, LogLevel.Error],
  [LogLevel.Warn]: [LogLevel.Warn, LogLevel.Error],
  [LogLevel.Error]: [LogLevel.Error],
}

export function prepareMetadata(metadata: Metadata): Metadata {
  return Object.keys(metadata).reduce((acc, key) => {
    let value = metadata[key]
    if (value instanceof Error) {
      value = value.toString()
    }
    return {...acc, [key]: value}
  }, {})
}
