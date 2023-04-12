import {runInAction} from 'mobx'

const ongoingActions = new Set<string>()

export const updateDataOptimistically = async <T>(
  rootStore: T,
  valueKeys: (keyof T)[],
  newValues: (typeof rootStore)[keyof T][],
  serverUpdate: () => Promise<void>,
  actionKey: string,
): Promise<void> => {
  console.log('updateDataOptimistically', ongoingActions)
  if (ongoingActions.has(actionKey)) {
    return
  }
  ongoingActions.add(actionKey)
  const oldValues = valueKeys.map(valueKey => rootStore[valueKey])
  runInAction(() => {
    valueKeys.forEach((valueKey, index) => {
      rootStore[valueKey] = newValues[index]
    })
  })

  try {
    await serverUpdate()
  } catch (error) {
    console.error('Server update failed, reverting value', error)
    runInAction(() => {
      valueKeys.forEach((valueKey, index) => {
        rootStore[valueKey] = oldValues[index]
      })
    })
  } finally {
    ongoingActions.delete(actionKey)
  }
}
