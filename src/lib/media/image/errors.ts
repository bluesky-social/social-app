/**
 * An image's file is gone by the time we read it. In practice that means the
 * OS deleted it to free up space.
 */
export class ImageMissingError extends Error {
  constructor(path: string) {
    super(`Image file is missing: ${path}`)
    this.name = 'ImageMissingError'
  }
}
