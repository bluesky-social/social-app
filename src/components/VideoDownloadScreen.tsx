import React from 'react'
import {FFmpeg} from '@ffmpeg/ffmpeg'
import {fetchFile, toBlobURL} from '@ffmpeg/util'
import {parse} from 'hls-parser'
import {MasterPlaylist, MediaPlaylist, Variant} from 'hls-parser/types'

interface PostMessageData {
  action: 'progress' | 'error'
  messageStr?: string
  messageFloat?: number
}

function postMessage(data: PostMessageData) {
  try {
    // const _postMessage =
    //   @ts-expect-error safari webview only
    // window.webkit.messageHandlers.onMessage.postMessage ?? window.postMessage
    window.webkit.messageHandlers.onMessage.postMessage(JSON.stringify(data))
  } catch (e) {
    console.error(e)
  }
}

function createSegementUrl(originalUrl: string, newFile: string) {
  const parts = originalUrl.split('/')
  parts[parts.length - 1] = newFile
  return parts.join('/')
}

export function VideoDownloadScreen() {
  const ffmpegRef = React.useRef(new FFmpeg())

  const [dataUrl, setDataUrl] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
    const ffmpeg = ffmpegRef.current

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        'application/wasm',
      ),
    })
  }, [])

  const createMp4 = React.useCallback(async (videoUrl: string) => {
    // Get the master playlist and find the best variant
    const masterPlaylistRes = await fetch(videoUrl)
    const masterPlaylistText = await masterPlaylistRes.text()
    const masterPlaylist = parse(masterPlaylistText) as MasterPlaylist

    // If URL given is not a master playlist, we probably cannot handle this.
    if (!masterPlaylist.isMasterPlaylist) {
      postMessage({
        action: 'error',
        messageStr: 'A master playlist was not found in the provided playlist.',
      })
      // @TODO handle
      return
    }

    // Figure out what the best quality is. These should generally be in order, but we'll check them all just in case
    let bestVariant: Variant | undefined
    for (const variant of masterPlaylist.variants) {
      if (!bestVariant || variant.bandwidth > bestVariant.bandwidth) {
        bestVariant = variant
      }
    }

    // Should only happen if there was no variants at all given to us. Mostly for types.
    if (!bestVariant) {
      // @TODO handle
      postMessage({
        action: 'error',
        messageStr: 'No variants were found in the provided master playlist.',
      })
      return
    }

    const urlParts = videoUrl.split('/')
    urlParts[urlParts.length - 1] = bestVariant?.uri
    const bestVariantUrl = urlParts.join('/')

    // Download and parse m3u8
    const hlsFileRes = await fetch(bestVariantUrl)
    const hlsPlainText = await hlsFileRes.text()
    const playlist = parse(hlsPlainText) as MediaPlaylist

    // This one shouldn't be a master playlist - again just for types really
    if (playlist.isMasterPlaylist) {
      postMessage({
        action: 'error',
        messageStr: 'An unknown error has occurred.',
      })
      // @TODO handle
      return
    }

    const ffmpeg = ffmpegRef.current

    // Get the correctly ordered file names. We need to remove the tracking info from the end of the file name
    const segments = playlist.segments.map(segment => {
      return segment.uri.split('?')[0]
    })

    // Download each segment
    let error: string | null = null
    await Promise.all(
      playlist.segments.map(async segment => {
        const uri = createSegementUrl(bestVariantUrl, segment.uri)
        const filename = segment.uri.split('?')[0]

        const res = await fetch(uri)
        if (!res.ok) {
          error = 'Failed to download playlist segment.'
        }

        const blob = await res.blob()
        try {
          await ffmpeg.writeFile(filename, await fetchFile(blob))
        } catch (e: unknown) {
          error = 'Failed to write file.'
        }
      }),
    )

    // Do something if there was an error
    if (error) {
      postMessage({
        action: 'error',
        messageStr: error,
      })
      return
    }

    // Put the segments together
    await ffmpeg.exec([
      '-i',
      `concat:${segments.join('|')}`,
      '-c:v',
      'copy',
      'output.mp4',
    ])

    const fileData = await ffmpeg.readFile('output.mp4')
    // @ts-expect-error Don't feel like figuring this out. Checks out with the documentation.🙃
    const blob = new Blob([fileData.buffer], {type: 'video/mp4'})
    const dataUrl = await new Promise<string | null>(resolve => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
    return dataUrl
  }, [])

  React.useEffect(() => {
    const url = new URL(window.location.href)
    const videoUrl = url.searchParams.get('videoUrl')

    if (!videoUrl) {
      postMessage({action: 'error', messageStr: 'No video URL provided'})
    } else {
      setDataUrl(null)
      ;(async () => {
        await load()
        const mp4Res = await createMp4(videoUrl)

        if (!mp4Res) {
          postMessage({
            action: 'error',
            messageStr: 'An error occurred while creating the MP4.',
          })
          return
        }

        setDataUrl(mp4Res)
      })()
    }
  }, [createMp4, load])

  if (!dataUrl) return null

  return (
    <div>
      <a
        href={dataUrl}
        ref={el => {
          el?.click()
        }}
        download="video.mp4"
      />
    </div>
  )
}
