export class Logger {
  isDisabled: boolean

  constructor(isDisabled: boolean = process.env.NODE_ENV === 'production') {
    this.isDisabled = isDisabled
  }

  enable() {
    this.isDisabled = false
  }

  disable() {
    this.isDisabled = true
  }

  info(message?: any, ...optionalParams: any[]): void {
    if (!this.isDisabled) {
      console.info(message, ...optionalParams)
    }
  }

  warn(message?: any, ...optionalParams: any[]): void {
    if (!this.isDisabled) {
      console.warn(message, ...optionalParams)
    }
  }

  error(message?: any, ...optionalParams: any[]): void {
    if (!this.isDisabled) {
      console.error(message, ...optionalParams)
    }
  }
}

export const createLogger = (isDisabled?: boolean) => new Logger(isDisabled)
