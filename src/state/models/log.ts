import {makeAutoObservable} from 'mobx'
import {XRPCError, XRPCInvalidResponseError} from '@atproto/xrpc'
import {isObj, hasProp} from 'lib/type-guards'

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

  constructor() {
    makeAutoObservable(this, {serialize: false, hydrate: false})
  }

  serialize(): unknown {
    return {
      entries: this.entries.slice(-100),
    }
  }

  hydrate(v: unknown) {
    if (isObj(v)) {
      if (hasProp(v, 'entries') && Array.isArray(v.entries)) {
        this.entries = v.entries.filter(
          e => isObj(e) && hasProp(e, 'id') && typeof e.id === 'string',
        )
      }
    }
  }

  private add(entry: LogEntry) {
    this.entries.push(entry)
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
}

function detailsToStr(details?: any) {
  if (details && typeof details !== 'string') {
    if (
      details instanceof XRPCInvalidResponseError ||
      details.constructor.name === 'XRPCInvalidResponseError'
    ) {
      return `The server gave an ill-formatted response.\nMethod: ${
        details.lexiconNsid
      }.\nError: ${details.validationError.toString()}`
    } else if (
      details instanceof XRPCError ||
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
