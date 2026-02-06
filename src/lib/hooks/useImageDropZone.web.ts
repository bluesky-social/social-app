import {useEffect, useRef, useState} from 'react'

import {getImageDim} from '#/lib/media/manip'
import {blobToDataUri} from '#/lib/media/util'

type ImageUri = {
  uri: string
  width: number
  height: number
}

export function useImageDropZone({
  enabled,
  onDrop,
}: {
  enabled: boolean
  onDrop: (uris: ImageUri[]) => void
}) {
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const dragCounterRef = useRef(0)
  const onDropRef = useRef(onDrop)
  onDropRef.current = onDrop

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
      }
    }

    const handleDrop = async (event: DragEvent) => {
      event.preventDefault()
      dragCounterRef.current = 0
      setIsDraggingOver(false)

      const transfer = event.dataTransfer
      if (!transfer) return

      const imageUris: ImageUri[] = []

      for (let i = 0; i < transfer.files.length; i++) {
        const file = transfer.files[i]
        if (!file.type.startsWith('image/')) continue

        try {
          const uri = await blobToDataUri(file)
          const {width, height} = await getImageDim(uri)
          imageUris.push({uri, width, height})
        } catch (err) {
          console.error('Failed to process dropped image', err)
        }
      }

      if (imageUris.length > 0) {
        onDropRef.current(imageUris)
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

  return {isDraggingOver}
}
