import {type ChatInvite} from '../components/ChatInvite.js'
import {type StarterPack} from '../components/StarterPack.js'

export const RENDER_REQUEST = 'bskyogcard:render'
export const RENDER_CANCEL = 'bskyogcard:render-cancel'
export const RENDER_RESULT = 'bskyogcard:render-result'
export const RENDER_TIMEOUT_MS = 15000
export const MAX_RENDER_BYTES = 16 * 1024 * 1024

export type RenderStage = 'satori' | 'resvg'
export type RenderJob =
  | {kind: 'starter-pack'; props: Parameters<typeof StarterPack>[0]}
  | {kind: 'chat-invite'; props: Parameters<typeof ChatInvite>[0]}
  | {kind: 'avatar-bubbles'; props: {images: (Buffer | null)[]}}

export type SerializedRenderError = {
  name: string
  message: string
  stack?: string
  stage?: RenderStage
  unavailable?: boolean
}

export type RenderResult =
  | {type: typeof RENDER_RESULT; id: number; png: Buffer}
  | {type: typeof RENDER_RESULT; id: number; error: SerializedRenderError}

export type Renderer = {
  render(job: RenderJob, signal?: AbortSignal): Promise<Buffer>
  destroy(): Promise<void>
}

export function isMessage(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Checks the small IPC contract; never transfers records or request headers. */
export function isRenderJob(value: unknown): value is RenderJob {
  if (!isMessage(value) || !isMessage(value.props)) return false
  const props = value.props
  let images: unknown[]
  if (value.kind === 'starter-pack') {
    if (
      typeof props.title !== 'string' ||
      Buffer.byteLength(props.title) > 16384 ||
      typeof props.creatorDid !== 'string' ||
      props.creatorDid.length > 2048 ||
      !(props.images instanceof Map) ||
      props.images.size > 7 ||
      ![...props.images.keys()].every(
        key => typeof key === 'string' && key.length <= 2048,
      )
    )
      return false
    images = [...props.images.values()]
  } else if (value.kind === 'chat-invite') {
    if (
      typeof props.name !== 'string' ||
      Buffer.byteLength(props.name) > 16384 ||
      typeof props.ownerHandle !== 'string' ||
      props.ownerHandle.length > 2048
    )
      return false
    images = [props.ownerImage]
  } else if (value.kind === 'avatar-bubbles') {
    if (!Array.isArray(props.images) || props.images.length > 4) return false
    images = props.images
  } else {
    return false
  }
  let bytes = 0
  for (const image of images) {
    if (image === null) continue
    if (!Buffer.isBuffer(image)) return false
    bytes += image.byteLength
  }
  return bytes <= MAX_RENDER_BYTES
}

export function isRenderResult(value: unknown): value is RenderResult {
  if (
    !isMessage(value) ||
    value.type !== RENDER_RESULT ||
    !Number.isSafeInteger(value.id)
  )
    return false
  if (Buffer.isBuffer(value.png))
    return value.png.byteLength <= MAX_RENDER_BYTES
  const err = value.error
  return (
    isMessage(err) &&
    typeof err.name === 'string' &&
    typeof err.message === 'string' &&
    (err.stack === undefined || typeof err.stack === 'string') &&
    (err.stage === undefined ||
      err.stage === 'satori' ||
      err.stage === 'resvg') &&
    (err.unavailable === undefined || typeof err.unavailable === 'boolean')
  )
}

/** Retains the child stack without recreating a fatal WASM exception in HTTP. */
export class RenderError extends Error {
  readonly stage?: RenderStage
  readonly rendererErrorType: string

  constructor(error: SerializedRenderError) {
    super(error.message)
    this.name = 'RenderError'
    this.stage = error.stage
    this.rendererErrorType = error.name
    if (error.stack) this.stack = error.stack
  }
}

export class RenderUnavailableError extends Error {
  constructor(message = 'No renderer is available') {
    super(message)
    this.name = 'RenderUnavailableError'
  }
}

export function serializeRenderError(
  error: unknown,
  stage?: RenderStage,
): SerializedRenderError {
  return {
    name:
      error instanceof RenderError
        ? error.rendererErrorType
        : error instanceof Error
          ? error.name
          : 'Error',
    message:
      error instanceof Error
        ? error.message.slice(0, 16384)
        : 'Unknown rendering failure',
    stack: error instanceof Error ? error.stack?.slice(0, 65536) : undefined,
    stage: error instanceof RenderError ? error.stage : stage,
    unavailable: error instanceof RenderUnavailableError,
  }
}
