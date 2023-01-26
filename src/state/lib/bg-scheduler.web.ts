type BackgroundFetchStatus = 0 | 1 | 2

export async function configure(
  _handler: (taskId: string) => Promise<void>,
  _timeoutHandler: (taskId: string) => Promise<void>,
): Promise<BackgroundFetchStatus> {
  // TODO
  return 0
}

export function finish(_taskId: string) {
  // TODO
}
