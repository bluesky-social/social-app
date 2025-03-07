export class VideoTooLargeError extends Error {
  constructor() {
    super('Videos cannot be larger than 100 MB')
    this.name = 'VideoTooLargeError'
  }
}

export class ServerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ServerError'
  }
}

export class UploadLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UploadLimitError'
  }
}
