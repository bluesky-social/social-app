export type MediaUri = {
  uri: string
  width: number
  height: number
  type: 'image' | 'video'
}

export function useImageDropZone(_opts: {
  enabled: boolean
  composerOpen: boolean
  onDrop: (media: MediaUri[]) => void
}) {
  return {isDraggingOver: false as const}
}

export function getImageOrVideoFromUri(
  _items: DataTransferItemList,
  _callback: (uri: string) => void,
) {}
