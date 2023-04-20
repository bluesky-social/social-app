import {runInAction} from 'mobx'
import {deepObserve} from 'mobx-utils'
import set from 'lodash.set'

const ongoingActions = new Set<any>()

export const updateDataOptimistically = async <
  T extends Record<string, any>,
  U,
>(
  model: T,
  preUpdate: () => void,
  serverUpdate: () => Promise<U>,
  postUpdate?: (res: U) => void,
): Promise<void> => {
  if (ongoingActions.has(model)) {
    return
  }
  ongoingActions.add(model)

  const prevState: Map<string, any> = new Map<string, any>()
  const dispose = deepObserve(model, (change, path) => {
    if (change.observableKind === 'object') {
      if (change.type === 'update') {
        prevState.set(
          [path, change.name].filter(Boolean).join('.'),
          change.oldValue,
        )
      } else if (change.type === 'add') {
        prevState.set([path, change.name].filter(Boolean).join('.'), undefined)
      }
    }
  })
  preUpdate()
  dispose()

  try {
    const res = await serverUpdate()
    runInAction(() => {
      postUpdate?.(res)
    })
  } catch (error) {
    runInAction(() => {
      prevState.forEach((value, path) => {
        set(model, path, value)
      })
    })
    throw error
  } finally {
    ongoingActions.delete(model)
  }
}
