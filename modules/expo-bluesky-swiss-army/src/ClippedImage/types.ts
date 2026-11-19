export type ClipImageOptions = {
  /**
   * Remote (or `file://`) URL of the image to clip.
   */
  url: string
  /**
   * Width and height of the output, in points. The image is aspect-filled.
   */
  size: number
  /**
   * Corner radius of the clip, in points. Use `size / 2` for a circle.
   */
  cornerRadius: number
  /**
   * Pixels per point of the output, usually `PixelRatio.get()`.
   */
  scale: number
  /**
   * Color of an optional inset border, drawn inside the clip.
   */
  borderColor?: string
  /**
   * Width of the border, in points. Defaults to 0 (no border).
   */
  borderWidth?: number
}
