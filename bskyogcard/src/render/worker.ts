import {loadFonts} from './fonts.js'
import {
  isMessage,
  isRenderJob,
  MAX_RENDER_BYTES,
  RENDER_REQUEST,
  RENDER_RESULT,
  serializeRenderError,
  type RenderResult,
  type RenderStage,
} from './protocol.js'
import {render} from './render.js'

const fonts = loadFonts()
let busy = false
process.once('disconnect', () => process.exit(0))
process.on('message', async (message: unknown) => {
  if (
    !isMessage(message) ||
    message.type !== RENDER_REQUEST ||
    !Number.isSafeInteger(message.id) ||
    typeof message.id !== 'number' ||
    !isRenderJob(message.job) ||
    busy
  ) {
    process.exit(1)
  }
  busy = true
  let stage: RenderStage = 'satori'
  let result: RenderResult
  let failed = false
  try {
    const png = await render(message.job, fonts, value => {
      stage = value
    })
    if (png.byteLength > MAX_RENDER_BYTES)
      throw new Error('Rendered image exceeds the IPC size limit')
    result = {type: RENDER_RESULT, id: message.id, png}
  } catch (err) {
    failed = true
    result = {
      type: RENDER_RESULT,
      id: message.id,
      error: serializeRenderError(err, stage),
    }
  }
  if (!process.connected) process.exit(0)
  busy = false
  process.send!(result, err => {
    if (failed || err) process.exit(1)
  })
})
process.send?.({type: 'ready'})
