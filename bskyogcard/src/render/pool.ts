import {fork, type ChildProcess} from 'node:child_process'

import {Counter, Gauge, Registry} from 'prom-client'

import {httpLogger} from '../logger.js'
import {
  isMessage,
  isRenderJob,
  isRenderResult,
  RENDER_REQUEST,
  RENDER_TIMEOUT_MS,
  RenderError,
  RenderUnavailableError,
  type Renderer,
  type RenderJob,
} from './protocol.js'

type Pending = {
  id: number
  job: RenderJob
  resolve: (png: Buffer) => void
  reject: (err: Error) => void
  timer: ReturnType<typeof setTimeout>
  removeAbort: () => void
}

type Slot = {
  child?: ChildProcess
  closed?: Promise<void>
  pending?: Pending
  ready: boolean
  retiring?: 'failure' | 'cancel' | 'stop'
  failures: number
  retryAt: number
  startedAt: number
}

/** Owns a fixed number of disposable renderers, with no request queue. */
export class RenderPool implements Renderer {
  private slots: Slot[]
  private stopping = false
  private shutdown?: Promise<void>
  private nextId = 0
  private restarts: Counter

  constructor(size: number, registry = new Registry()) {
    if (!Number.isSafeInteger(size) || size < 1)
      throw new RangeError('Invalid render pool size')
    this.slots = Array.from({length: size}, () => ({
      ready: false,
      failures: 0,
      retryAt: 0,
      startedAt: 0,
    }))
    this.restarts = new Counter({
      name: 'bskyogcard_renderer_restarts_total',
      help: 'Failed renderer processes or starts requiring replacement; excludes cancellation and shutdown.',
      registers: [registry],
    })
    const slots = this.slots
    new Gauge({
      name: 'bskyogcard_renderers_busy',
      help: 'Render slots occupied by a request, including process startup.',
      registers: [registry],
      collect() {
        this.set(slots.filter(slot => slot.pending).length)
      },
    })
    new Gauge({
      name: 'bskyogcard_renderers_ready',
      help: 'Live initialized renderer processes, including busy processes.',
      registers: [registry],
      collect() {
        this.set(slots.filter(slot => slot.ready && !slot.retiring).length)
      },
    })
  }

  render(job: RenderJob, signal?: AbortSignal): Promise<Buffer> {
    if (this.stopping || signal?.aborted)
      return Promise.reject(new RenderUnavailableError('Rendering is stopping'))
    if (!isRenderJob(job))
      return Promise.reject(
        new RenderError({
          name: 'Error',
          message: 'Invalid or oversized render input',
        }),
      )
    const slot = this.slots.find(
      slot =>
        !slot.pending &&
        !slot.retiring &&
        (slot.child || performance.now() >= slot.retryAt),
    )
    if (!slot) return Promise.reject(new RenderUnavailableError())
    return new Promise((resolve, reject) => {
      const abort = () =>
        this.retire(
          slot,
          new RenderUnavailableError('Render request cancelled'),
          'cancel',
        )
      slot.pending = {
        id: this.nextId++,
        job,
        resolve,
        reject,
        timer: setTimeout(
          () =>
            this.retire(
              slot,
              new RenderError({
                name: 'TimeoutError',
                message: 'Renderer exceeded its 15-second deadline',
              }),
            ),
          RENDER_TIMEOUT_MS,
        ),
        removeAbort: () => signal?.removeEventListener('abort', abort),
      }
      signal?.addEventListener('abort', abort, {once: true})
      if (slot.child && slot.ready) this.send(slot)
      else this.spawn(slot)
    })
  }

  private spawn(slot: Slot) {
    slot.startedAt = performance.now()
    slot.ready = false
    let child: ChildProcess
    try {
      child = fork(
        new URL(
          import.meta.url.endsWith('.ts') ? './worker.ts' : './worker.js',
          import.meta.url,
        ),
        [],
        {
          serialization: 'advanced',
          stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
          env: {...process.env, NODE_UNIQUE_ID: undefined},
        },
      )
    } catch (err) {
      this.failed(slot)
      this.reject(
        slot,
        new RenderError({
          name: 'Error',
          message: 'Could not start renderer',
          stack: err instanceof Error ? err.stack : undefined,
        }),
      )
      return
    }
    slot.child = child
    slot.closed = new Promise(resolve => {
      child.once('close', (code, signal) => {
        if (!this.stopping && slot.retiring !== 'cancel') {
          this.failed(slot)
          httpLogger.warn(
            {pid: child.pid, code, signal},
            'renderer process exited',
          )
        } else {
          slot.retryAt = Math.max(performance.now(), slot.startedAt + 1000)
        }
        this.reject(
          slot,
          new RenderError({
            name: 'RendererExitError',
            message: 'Renderer process exited before completing the render',
          }),
        )
        slot.child = undefined
        slot.ready = false
        slot.retiring = undefined
        resolve()
      })
    })
    child.on('message', (message: unknown) => {
      if (slot.child !== child || slot.retiring) return
      if (isMessage(message) && message.type === 'ready' && !slot.ready) {
        slot.ready = true
        this.send(slot)
        return
      }
      if (!isRenderResult(message) || message.id !== slot.pending?.id) {
        this.retire(
          slot,
          new RenderError({
            name: 'ProtocolError',
            message: 'Invalid renderer response',
          }),
        )
      } else if ('error' in message) {
        this.retire(slot, new RenderError(message.error))
      } else {
        const pending = slot.pending
        slot.pending = undefined
        clearTimeout(pending.timer)
        pending.removeAbort()
        slot.failures = 0
        pending.resolve(message.png)
      }
    })
    child.once('error', err =>
      this.retire(
        slot,
        new RenderError({
          name: err.name,
          message: err.message,
          stack: err.stack,
        }),
      ),
    )
    child.once('disconnect', () => {
      if (!slot.retiring)
        this.retire(
          slot,
          new RenderError({
            name: 'RendererExitError',
            message: 'Renderer IPC disconnected',
          }),
        )
    })
  }

  private send(slot: Slot) {
    const pending = slot.pending
    if (!pending || !slot.child || slot.retiring) return
    try {
      slot.child.send(
        {type: RENDER_REQUEST, id: pending.id, job: pending.job},
        err => {
          if (err && slot.pending === pending)
            this.retire(
              slot,
              new RenderError({
                name: err.name,
                message: err.message,
                stack: err.stack,
              }),
            )
        },
      )
    } catch (err) {
      this.retire(
        slot,
        new RenderError({
          name: 'Error',
          message: 'Could not send render input',
          stack: err instanceof Error ? err.stack : undefined,
        }),
      )
    }
  }

  private reject(slot: Slot, err: Error) {
    const pending = slot.pending
    slot.pending = undefined
    if (!pending) return
    clearTimeout(pending.timer)
    pending.removeAbort()
    pending.reject(err)
  }

  private retire(slot: Slot, err: Error, reason: Slot['retiring'] = 'failure') {
    this.reject(slot, err)
    if (slot.retiring) return
    slot.retiring = reason
    slot.ready = false
    slot.child?.kill('SIGKILL')
  }

  private failed(slot: Slot) {
    slot.failures = Math.min(slot.failures + 1, 6)
    slot.retryAt =
      performance.now() + Math.min(1000 * 2 ** (slot.failures - 1), 30000)
    this.restarts.inc()
  }

  destroy() {
    this.shutdown ??= this.stop()
    return this.shutdown
  }

  private async stop() {
    this.stopping = true
    for (const slot of this.slots)
      this.retire(
        slot,
        new RenderUnavailableError('Rendering is stopping'),
        'stop',
      )
    await Promise.all(this.slots.map(slot => slot.closed))
  }
}
