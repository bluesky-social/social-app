/** Finite, positive width and height. Unknown or invalid sizes are false. */
export function validDimensions(value: {
  width?: number | null
  height?: number | null
}): value is {width: number; height: number} {
  const {width, height} = value
  return (
    typeof width === 'number' &&
    typeof height === 'number' &&
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width > 0 &&
    height > 0
  )
}
