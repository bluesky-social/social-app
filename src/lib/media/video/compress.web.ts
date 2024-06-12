import * as Toast from '#/view/com/util/Toast'

const MAX_WIDTH = 1920
const MAX_HEIGHT = 1920
const MAX_VIDEO_SIZE = 1024 * 1024 * 100 // 100MB

export async function compressVideo(
  file: string,
  callbacks?: {
    onProgress: (progress: number) => void
  },
) {
  const {onProgress} = callbacks || {}
  const blob = await fetch(file).then(res => res.blob())
  const objectUrl = URL.createObjectURL(blob)

  const videoEl = document.createElement('video')
  videoEl.setAttribute('playsinline', 'playsinline')
  videoEl.setAttribute('controls', 'controls')
  videoEl.setAttribute('muted', 'muted')
  videoEl.setAttribute('src', objectUrl)
  try {
    await new Promise((resolve, reject) => {
      videoEl.addEventListener('error', reject, {once: true})
      videoEl.addEventListener('loadedmetadata', resolve, {once: true})
    })
  } catch (e) {
    console.error(e)
    Toast.show('Failed to load video, this video format may not be supported')
  }

  let {videoWidth, videoHeight} = videoEl
  let outputWidth = videoWidth
  let outputHeight = videoHeight
  if (outputWidth > outputHeight) {
    if (outputWidth > MAX_WIDTH) {
      const scale = MAX_WIDTH / outputWidth
      outputWidth = Math.round(outputWidth * scale)
      outputHeight = Math.round(outputHeight * scale)
    }
  } else {
    if (outputHeight > MAX_HEIGHT) {
      const scale = MAX_HEIGHT / outputHeight
      outputWidth = Math.round(outputWidth * scale)
      outputHeight = Math.round(outputHeight * scale)
    }
  }
  if (outputWidth % 2 === 1) outputWidth--
  if (outputHeight % 2 === 1) outputHeight--
  console.log({outputWidth, outputHeight})

  const canvas = document.createElement('canvas')
  canvas.width = outputWidth
  canvas.height = outputHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')
  ctx.fillStyle = '#fff'

  try {
    let wasTruncated = false
    const videoBlob = await new Promise<Blob>(async resolve => {
      const chunks: Blob[] = []
      let options = {
        mimeType: getSupportedMimeType(),
        videoBitsPerSecond: 200000,
      }
      const recorder = new MediaRecorder(canvas.captureStream(25), options)

      recorder.onerror = console.log
      recorder.ondataavailable = e => {
        let size = chunks.reduce((acc, chunk) => acc + chunk.size, 0)
        if (size + e.data.size > MAX_VIDEO_SIZE) {
          wasTruncated = true
          recorder.stop()
        } else {
          chunks.push(e.data)
        }
      }
      recorder.onstop = () => {
        resolve(new Blob(chunks, {type: recorder.mimeType}))
      }

      videoEl.play()
      recorder.start()

      let lastCapture = Date.now()
      while (
        recorder.state === 'recording' &&
        videoEl.currentTime < videoEl.duration
      ) {
        await new Promise(r => setTimeout(r, 1)) // NOTE: don't use requestAnimationFrame because it pauses with the tab isnt focused
        onProgress?.(videoEl.currentTime / videoEl.duration)
        ctx.fillRect(0, 0, outputWidth, outputHeight)
        ctx.drawImage(
          videoEl,
          0,
          0,
          videoWidth,
          videoHeight,
          0,
          0,
          outputWidth,
          outputHeight,
        )

        if (Date.now() - lastCapture > 500) {
          recorder.requestData()
          lastCapture = Date.now()
        }
      }
      if (recorder.state === 'recording') {
        recorder.stop()
      }
    })

    if (wasTruncated) {
      Toast.show('Video was too long and was truncated')
    }

    return {
      uri: URL.createObjectURL(videoBlob),
    }
  } catch (err) {
    console.error(err)
    Toast.show('Failed to compress video')
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function getSupportedMimeType() {
  if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264')) {
    return 'video/mp4;codecs=h264'
  } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
    return 'video/webm;codecs=h264'
  } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
    return 'video/webm;codecs=vp9'
  } else {
    throw new Error('No supported video codec found')
  }
}
