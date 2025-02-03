

export class AbortError extends Error {
  constructor() {
    super('Aborted')
    this.name = 'AbortError'
  }
}
