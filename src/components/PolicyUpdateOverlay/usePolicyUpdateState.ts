import {useMemo} from 'react'

import {useNux, useSaveNux} from '#/state/queries/nuxs'
import {ACTIVE_UPDATE_ID} from '#/components/PolicyUpdateOverlay/config'
import {IS_DEV} from '#/env'
import {device, useStorage} from '#/storage'

export type PolicyUpdateState = {
  completed: boolean
  complete: () => void
}

export function usePolicyUpdateState() {
  const nux = useNux(ACTIVE_UPDATE_ID)
  const {mutate: save, variables} = useSaveNux()
  const deviceStorage = useStorage(device, [ACTIVE_UPDATE_ID])
  const debugOverride =
    useStorage(device, ['policyUpdateDebugOverride']) && IS_DEV
  return useMemo(() => {
    const nuxIsReady = nux.status === 'ready'
    const nuxIsCompleted = nux.nux?.completed === true
    const nuxIsOptimisticallyCompleted = !!variables?.completed
    const [completedForDevice, setCompletedForDevice] = deviceStorage

    const completed = computeCompletedState({
      nuxIsReady,
      nuxIsCompleted,
      nuxIsOptimisticallyCompleted,
      completedForDevice,
    })

    if (!debugOverride) {
      syncCompletedState({
        nuxIsReady,
        nuxIsCompleted,
        nuxIsOptimisticallyCompleted,
        completedForDevice,
        save,
        setCompletedForDevice,
      })
    }

    return {
      completed,
      complete() {
        save({
          id: ACTIVE_UPDATE_ID,
          completed: true,
          data: undefined,
        })
        setCompletedForDevice(true)
      },
    }
  }, [nux, save, variables, deviceStorage, debugOverride])
}

export function computeCompletedState({
  nuxIsReady,
  nuxIsCompleted,
  nuxIsOptimisticallyCompleted,
  completedForDevice,
}: {
  nuxIsReady: boolean
  nuxIsCompleted: boolean
  nuxIsOptimisticallyCompleted: boolean
  completedForDevice: boolean | undefined
}): boolean {
  /**
   * Assume completed to prevent flash
   */
  let completed = true

  /**
   * Prefer server state, if available
   */
  if (nuxIsReady) {
    completed = nuxIsCompleted
  }

  /**
   * Override with optimistic state or device state
   */
  if (nuxIsOptimisticallyCompleted || !!completedForDevice) {
    completed = true
  }

  return completed
}

export function syncCompletedState({
  nuxIsReady,
  nuxIsCompleted,
  nuxIsOptimisticallyCompleted,
  completedForDevice,
  save,
  setCompletedForDevice,
}: {
  nuxIsReady: boolean
  nuxIsCompleted: boolean
  nuxIsOptimisticallyCompleted: boolean
  completedForDevice: boolean | undefined
  save: ReturnType<typeof useSaveNux>['mutate']
  setCompletedForDevice: (value: boolean) => void
}) {
  /*
   * Sync device state to server state for this account
   */
  if (
    nuxIsReady &&
    !nuxIsCompleted &&
    !nuxIsOptimisticallyCompleted &&
    !!completedForDevice
  ) {
    save({
      id: ACTIVE_UPDATE_ID,
      completed: true,
      data: undefined,
    })
  } else if (nuxIsReady && nuxIsCompleted && !completedForDevice) {
    /*
     * Sync server state to device state
     */
    setCompletedForDevice(true)
  }
}
