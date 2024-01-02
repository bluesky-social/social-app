export const calculateViewerDimensions = (
  startDimensions: {height: number; width: number},
  screenDimensions: {height: number; width: number},
  scale: number,
) => {
  'worklet'
  const imageAspect = startDimensions.width / startDimensions.height
  const screenAspect = screenDimensions.width / screenDimensions.height
  const isLandscape = imageAspect > screenAspect
  if (isLandscape) {
    return {
      width: scale * screenDimensions.width,
      height: (scale * screenDimensions.width) / imageAspect,
    }
  } else {
    return {
      width: scale * screenDimensions.height * imageAspect,
      height: scale * screenDimensions.height,
    }
  }
}
