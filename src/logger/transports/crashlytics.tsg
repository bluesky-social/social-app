import {getCrashlytics, log, recordError} from '#/logger/crashlytics/lib'
import {LogLevel, type Transport} from '#/logger/types'
import {prepareMetadata} from '#/logger/util'

export const crashlyticsTransport: Transport = (
  level,
  context,
  message,
  metadata,
) => {
  if (level === LogLevel.Error) {
    const payload =
      message instanceof Error ? message : new Error(message.toString())
    recordError(getCrashlytics(), payload)
  } else {
    let payload = `(${context ?? 'default'}) ${message.toString()}`
    payload += JSON.stringify(prepareMetadata(metadata))
    log(getCrashlytics(), payload)
  }
}
