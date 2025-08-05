import {useCallback} from 'react'

import {useSaveNux} from '#/state/queries/nuxs'
import {ACTIVE_UPDATE_ID} from '#/components/PolicyUpdateOverlay/config'
import {device, useStorage} from '#/storage'

export function usePreemptivelyCompleteActivePolicyUpdate() {
  const {mutate: save} = useSaveNux()
  const [_completedForDevice, setCompletedForDevice] = useStorage(device, [
    ACTIVE_UPDATE_ID,
  ])

  return useCallback(() => {
    save({
      id: ACTIVE_UPDATE_ID,
      completed: true,
      data: undefined,
    })
    setCompletedForDevice(true)
  }, [save, setCompletedForDevice])
}
