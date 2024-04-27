export const calculateDimensions = (
  maxWidth: number,
  originalHeight: number,
  originalWidth: number,
) => {
  const aspectRatio = originalWidth / originalHeight
  const newHeight = maxWidth / aspectRatio
  const newWidth = maxWidth
  return {
    width: newWidth,
    height: newHeight,
  }
}
