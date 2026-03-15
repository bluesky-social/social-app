import {useEffect, useRef, useState} from 'react'

import {getImageDim} from '#/lib/media/manip'
import {blobToDataUri, isUriImage} from '#/lib/media/util'
import {textInputWebEmitter} from '#/view/com/composer/text-input/textInputWebEmitter'

export type MediaUri = {
  uri: string
  width: number
  height: number
  type: 'image' | 'video'
}

/**
 * Global body-level drag-and-drop handler for media on web.
 *
 * When `composerOpen` is true, dropped media is routed to the already-open
 * composer via `textInputWebEmitter` ('media-pasted'). The hook also emits
 * 'drag-state' so the composer can show its own drop overlay.
 *
 * When `composerOpen` is false, dropped media is passed to `onDrop` so the
 * caller can open the composer with it.
 */
export function useImageDropZone({
  enabled,
  composerOpen,
  onDrop,
}: {
  enabled: boolean
  composerOpen: boolean
  onDrop: (media: MediaUri[]) => void
}) {
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const dragCounterRef = useRef(0)
  const onDropRef = useRef(onDrop)
  onDropRef.current = onDrop
  const composerOpenRef = useRef(composerOpen)
  composerOpenRef.current = composerOpen

  useEffect(() => {
    if (!enabled) {
      setIsDraggingOver(false)
      dragCounterRef.current = 0
      return
    }

    const handleDragEnter = (event: DragEvent) => {
      event.preventDefault()
      if (event.dataTransfer?.types.includes('Files')) {
        dragCounterRef.current++
        if (dragCounterRef.current === 1) {
          setIsDraggingOver(true)
          if (composerOpenRef.current) {
            textInputWebEmitter.emit('drag-state', true)
          }
        }
      }
    }

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault()
    }

    const handleDragLeave = (event: DragEvent) => {
      event.preventDefault()
      dragCounterRef.current--
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0
        setIsDraggingOver(false)
        if (composerOpenRef.current) {
          textInputWebEmitter.emit('drag-state', false)
        }
      }
    }

    const handleDrop = async (event: DragEvent) => {
      event.preventDefault()
      dragCounterRef.current = 0
      setIsDraggingOver(false)

      if (composerOpenRef.current) {
        textInputWebEmitter.emit('drag-state', false)

        // Route to the open composer via the existing emitter
        const transfer = event.dataTransfer
        if (transfer) {
          getImageOrVideoFromUri(transfer.items, (uri: string) => {
            textInputWebEmitter.emit('media-pasted', uri)
          })
        }
        return
      }

      // Composer is not open — process media and pass to onDrop
      const transfer = event.dataTransfer
      if (!transfer) return

      const media: MediaUri[] = []

      for (let i = 0; i < transfer.files.length; i++) {
        const file = transfer.files[i]
        const isImage = file.type.startsWith('image/')
        const isVideo = file.type.startsWith('video/')
        if (!isImage && !isVideo) continue

        try {
          if (isImage) {
            const uri = await blobToDataUri(file)
            const {width, height} = await getImageDim(uri)
            media.push({uri, width, height, type: 'image'})
          } else {
            // Use an object URL to get dimensions — data URIs are too
            // large for the <video> element to reliably load metadata.
            const objectUrl = URL.createObjectURL(file)
            try {
              const {width, height} = await getVideoDim(objectUrl)
              const uri = await blobToDataUri(file)
              media.push({uri, width, height, type: 'video'})
            } finally {
              URL.revokeObjectURL(objectUrl)
            }
          }
        } catch (err) {
          console.error('Failed to process dropped media', err)
        }
      }

      if (media.length > 0) {
        onDropRef.current(media)
      }
    }

    document.body.addEventListener('dragenter', handleDragEnter)
    document.body.addEventListener('dragover', handleDragOver)
    document.body.addEventListener('dragleave', handleDragLeave)
    document.body.addEventListener('drop', handleDrop)

    return () => {
      document.body.removeEventListener('dragenter', handleDragEnter)
      document.body.removeEventListener('dragover', handleDragOver)
      document.body.removeEventListener('dragleave', handleDragLeave)
      document.body.removeEventListener('drop', handleDrop)
      dragCounterRef.current = 0
    }
  }, [enabled])

  return {isDraggingOver: isDraggingOver && !composerOpen}
}

function getVideoDim(uri: string): Promise<{width: number; height: number}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.onloadedmetadata = () => {
      resolve({width: video.videoWidth, height: video.videoHeight})
    }
    video.onerror = () => {
      reject(new Error('Failed to load video metadata'))
    }
    video.preload = 'metadata'
    video.src = uri
  })
}

/**
 * Extracts image/video URIs from a DataTransferItemList and passes each
 * to `callback`. Used for both drag-and-drop and paste handling.
 */
export function getImageOrVideoFromUri(
  items: DataTransferItemList,
  callback: (uri: string) => void,
) {
  for (let index = 0; index < items.length; index++) {
    const item = items[index]
    const type = item.type

    if (type === 'text/plain') {
      item.getAsString(async itemString => {
        if (isUriImage(itemString)) {
          const response = await fetch(itemString)
          const blob = await response.blob()

          if (blob.type.startsWith('image/')) {
            blobToDataUri(blob).then(callback, err => console.error(err))
          }

          if (blob.type.startsWith('video/')) {
            blobToDataUri(blob).then(callback, err => console.error(err))
          }
        }
      })
    } else if (type.startsWith('image/')) {
      const file = item.getAsFile()

      if (file) {
        blobToDataUri(file).then(callback, err => console.error(err))
      }
    } else if (type.startsWith('video/')) {
      const file = item.getAsFile()

      if (file) {
        blobToDataUri(file).then(callback, err => console.error(err))
      }
    }
  }
}
