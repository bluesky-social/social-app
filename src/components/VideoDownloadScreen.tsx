import React from 'react'
import {FFmpeg} from '@ffmpeg/ffmpeg'
import {fetchFile, toBlobURL} from '@ffmpeg/util'
import {parse} from 'hls-parser'
import {MasterPlaylist, MediaPlaylist, Variant} from 'hls-parser/types'

interface PostMessageData {
  action: 'progress' | 'complete' | 'error'
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

export function VideoDownloadScreen() {
  const ffmpegRef = React.useRef(new FFmpeg())

  const [dataUrl, setDataUrl] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
    const ffmpeg = ffmpegRef.current

    ffmpeg.on('log', ({message}: {message: string}) => {
      console.log(message)
    })

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
      postMessage({action: 'error', messageStr: 'Not a master playlist'})
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
      postMessage({action: 'error', messageStr: 'No variants found'})
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
      postMessage({action: 'error', messageStr: 'Is a master playlist'})
      // @TODO handle
      return
    }

    const ffmpeg = ffmpegRef.current

    // Get the correctly ordered file names. We need to remove the tracking info from the end of the file name
    const segments = playlist.segments.map(segment => {
      return segment.uri.split('?')[0]
    })

    // Download each segment
    let error = false
    await Promise.all(
      playlist.segments.map(async segment => {
        try {
          const uri = createUrl(bestVariantUrl, segment.uri)
          const filename = segment.uri.split('?')[0]
          const res = await fetch(uri)

          if (!res.ok) {
            error = true
          }

          const blob = await res.blob()
          await ffmpeg.writeFile(filename, await fetchFile(blob))
        } catch (e: any) {
          postMessage({
            action: 'error',
            messageStr: `Something happened: ${e.toString()}`,
          })
          console.log(e)
        }
      }),
    )

    // Do something if there was an error
    if (error) {
      // @TODO
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
    // @ts-expect-error lol idk TODO
    const blob = new Blob([fileData.buffer], {type: 'video/mp4'})
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    return dataUrl
  }, [])

  const createUrl = (originalUrl: string, newFile: string) => {
    const parts = originalUrl.split('/')
    parts[parts.length - 1] = newFile
    return parts.join('/')
  }

  React.useEffect(() => {
    const url = new URL(window.location.href)
    const videoUrl = url.searchParams.get('videoUrl')

    if (!videoUrl) {
      postMessage({action: 'error', messageStr: 'No video URL provided'})
    } else {
      ;(async () => {
        await load()
        const mp4Res = await createMp4(videoUrl)
        setDataUrl(mp4Res)
      })()
    }
  }, [createMp4, load])

  React.useEffect(() => {
    if (!dataUrl) return
  }, [dataUrl])

  if (!dataUrl) return null
  return (
    <div>
      <a
        href={dataUrl}
        ref={el => {
          el?.click()
          postMessage({action: 'error', messageStr: 'downloaded'})
        }}
        download="video.mp4"
      />
    </div>
  )
}
