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
  const _postMessage =
    // @ts-expect-error safari webview only
    window.webkit.messageHandlers.onMessage.postMessage ?? window.postMessage
  _postMessage(JSON.stringify(data))
}

export function VideoDownloadScreen() {
  const ffmpegRef = React.useRef(new FFmpeg())

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
        } catch (e) {
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
    const blobUrl = URL.createObjectURL(
      // @ts-expect-error idk TODO
      new Blob([fileData.buffer], {type: 'video/mp4'}),
    )
    return blobUrl
    // Send the blob url through post message
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
        postMessage({action: 'complete', messageStr: mp4Res})
      })()
    }
  }, [createMp4, load])

  return <div />
}
