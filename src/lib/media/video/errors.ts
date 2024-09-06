export class VideoTooLargeError extends Error {
  constructor() {
    super('Videos cannot be larger than 100MB')
    this.name = 'VideoTooLargeError'
  }
}

export class ServerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ServerError'
  }
}
