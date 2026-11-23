/** Attempts an app-only handoff. Web has no equivalent API. */
export function tryOpen(_url: string): Promise<boolean> {
  return Promise.resolve(false)
}
