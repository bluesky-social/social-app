import BackgroundFetch, {
  BackgroundFetchStatus,
} from 'react-native-background-fetch'

export function configure(
  handler: (taskId: string) => Promise<void>,
  timeoutHandler: (taskId: string) => void,
): Promise<BackgroundFetchStatus> {
  return BackgroundFetch.configure(
    {minimumFetchInterval: 15},
    handler,
    timeoutHandler,
  )
}

export function finish(taskId: string) {
  return BackgroundFetch.finish(taskId)
}
