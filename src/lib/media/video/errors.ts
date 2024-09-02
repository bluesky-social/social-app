export class VideoTooLargeError extends Error {
  constructor() {
    super('Videos cannot be larger than 100MB')
    this.name = 'VideoTooLargeError'
  }
}
