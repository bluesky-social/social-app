type ImageUri = {
  uri: string
  width: number
  height: number
}

export function useImageDropZone(_opts: {
  enabled: boolean
  onDrop: (uris: ImageUri[]) => void
}) {
  return {isDraggingOver: false as const}
}
