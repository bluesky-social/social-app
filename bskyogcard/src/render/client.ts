import cluster from 'node:cluster'

import {type Registry} from 'prom-client'

import {RenderPool} from './pool.js'
import {
  isRenderJob,
  isRenderResult,
  RENDER_CANCEL,
  RENDER_REQUEST,
  RENDER_TIMEOUT_MS,
  RenderError,
  RenderUnavailableError,
  type Renderer,
  type RenderJob,
} from './protocol.js'

/** In clustered mode the primary owns renderers independently of HTTP workers. */
export function createRenderer(registry?: Registry): Renderer {
  return cluster.isWorker ? new ClusterRenderer() : new RenderPool(1, registry)
}

class ClusterRenderer implements Renderer {
  private nextId = 0
  private stopping = false
  private pending?: {
    id: number
    resolve: (png: Buffer) => void
    reject: (err: Error) => void
    timer: ReturnType<typeof setTimeout>
    removeAbort: () => void
  }

  constructor() {
    process.on('message', this.onMessage)
    process.once('disconnect', this.onDisconnect)
  }

  private onMessage = (message: unknown) => {
    if (!isRenderResult(message) || message.id !== this.pending?.id) return
    const pending = this.take()
    if (!pending) return
    if ('png' in message) pending.resolve(message.png)
    else
      pending.reject(
        message.error.unavailable
          ? new RenderUnavailableError(message.error.message)
          : new RenderError(message.error),
      )
  }

  private onDisconnect = () => {
    this.stopping = true
    this.take()?.reject(
      new RenderUnavailableError('Render supervisor disconnected'),
    )
  }

  private take() {
    const pending = this.pending
    this.pending = undefined
    if (pending) {
      clearTimeout(pending.timer)
      pending.removeAbort()
    }
    return pending
  }

  private cancel() {
    const pending = this.take()
    if (!pending) return
    pending.reject(new RenderUnavailableError('Render request cancelled'))
    if (process.connected)
      process.send?.({type: RENDER_CANCEL, id: pending.id}, () => {})
  }

  render(job: RenderJob, signal?: AbortSignal): Promise<Buffer> {
    if (this.stopping || !process.connected || this.pending || signal?.aborted)
      return Promise.reject(new RenderUnavailableError())
    if (!isRenderJob(job))
      return Promise.reject(
        new RenderError({
          name: 'Error',
          message: 'Invalid or oversized render input',
        }),
      )
    return new Promise((resolve, reject) => {
      const abort = () => this.cancel()
      const id = this.nextId++
      this.pending = {
        id,
        resolve,
        reject,
        timer: setTimeout(() => this.cancel(), RENDER_TIMEOUT_MS + 1000),
        removeAbort: () => signal?.removeEventListener('abort', abort),
      }
      signal?.addEventListener('abort', abort, {once: true})
      try {
        process.send!({type: RENDER_REQUEST, id, job}, err => {
          if (err && this.pending?.id === id)
            this.take()?.reject(
              new RenderUnavailableError('Could not reach render supervisor'),
            )
        })
      } catch {
        this.take()?.reject(
          new RenderUnavailableError('Could not reach render supervisor'),
        )
      }
    })
  }

  async destroy() {
    this.stopping = true
    this.cancel()
    process.off('message', this.onMessage)
    process.off('disconnect', this.onDisconnect)
  }
}
