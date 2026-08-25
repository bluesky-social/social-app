import {device, useStorage} from '#/storage'

export function useThreadgateNudged() {
  const [threadgateNudged = false, setThreadgateNudged] = useStorage(device, [
    'threadgateNudged',
  ])

  return [threadgateNudged, setThreadgateNudged] as const
}
