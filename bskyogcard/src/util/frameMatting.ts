export const MAT_WIDTH = 12

export function getWidthWithMat(width: number) {
  return width + MAT_WIDTH * 2
}

export function computeMatBorderRadius(borderRadius: number) {
  return borderRadius + MAT_WIDTH / 2
}
