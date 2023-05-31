import {makeAutoObservable} from 'mobx'
// import {XRPCError, XRPCInvalidResponseError} from '@atproto/xrpc' TODO

const MAX_ENTRIES = 300

interface LogEntry {
  id: string
  type?: string
  summary?: string
  details?: string
  ts?: number
}

let _lastTs: string
let _lastId: string
function genId(): string {
  let candidate = String(Date.now())
  if (_lastTs === candidate) {
    const id = _lastId + 'x'
    _lastId = id
    return id
  }
  _lastTs = candidate
  _lastId = candidate
  return candidate
}

export class LogModel {
  entries: LogEntry[] = []
  timers = new Map<string, number>()

  constructor() {
    makeAutoObservable(this)
  }

  add(entry: LogEntry) {
    this.entries.push(entry)
    while (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(50)
    }
  }

  debug(summary: string, details?: any) {
    details = detailsToStr(details)
    console.debug(summary, details || '')
    this.add({
      id: genId(),
      type: 'debug',
      summary,
      details,
      ts: Date.now(),
    })
  }

  warn(summary: string, details?: any) {
    details = detailsToStr(details)
    console.debug(summary, details || '')
    this.add({
      id: genId(),
      type: 'warn',
      summary,
      details,
      ts: Date.now(),
    })
  }

  error(summary: string, details?: any) {
    details = detailsToStr(details)
    console.debug(summary, details || '')
    this.add({
      id: genId(),
      type: 'error',
      summary,
      details,
      ts: Date.now(),
    })
  }

  time = (label = 'default') => {
    this.timers.set(label, performance.now())
  }

  timeEnd = (label = 'default', warn = false) => {
    const endTime = performance.now()
    if (this.timers.has(label)) {
      const elapsedTime = endTime - this.timers.get(label)!
      console.log(`${label}: ${elapsedTime.toFixed(3)}ms`)
      this.timers.delete(label)
    } else {
      warn && console.warn(`Timer with label '${label}' does not exist.`)
    }
  }
}

function detailsToStr(details?: any) {
  if (details && typeof details !== 'string') {
    if (
      // details instanceof XRPCInvalidResponseError || TODO
      details.constructor.name === 'XRPCInvalidResponseError'
    ) {
      return `The server gave an ill-formatted response.\nMethod: ${
        details.lexiconNsid
      }.\nError: ${details.validationError.toString()}`
    } else if (
      // details instanceof XRPCError || TODO
      details.constructor.name === 'XRPCError'
    ) {
      return `An XRPC error occurred.\nStatus: ${details.status}\nError: ${details.error}\nMessage: ${details.message}`
    } else if (details instanceof Error) {
      return details.toString()
    }
    return JSON.stringify(details, null, 2)
  }
  return details
}
