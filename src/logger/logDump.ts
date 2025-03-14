import type {LogContext, LogLevel, Metadata} from '#/logger/types'

export type ConsoleTransportEntry = {
  id: string
  timestamp: number
  level: LogLevel
  context: LogContext | undefined
  message: string | Error
  metadata: Metadata
}

let entries: ConsoleTransportEntry[] = []

export function add(entry: ConsoleTransportEntry) {
  entries.unshift(entry)
  entries = entries.slice(0, 500)
}

export function getEntries() {
  return entries
}
