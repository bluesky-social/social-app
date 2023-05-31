import {runInAction} from 'mobx'
import {deepObserve} from 'mobx-utils'
import set from 'lodash.set'

const ongoingActions = new Set<any>()

/**
 * This is a TypeScript function that optimistically updates data on the client-side before sending a
 * request to the server and rolling back changes if the request fails.
 * @param {T} model - The object or record that needs to be updated optimistically.
 * @param preUpdate - `preUpdate` is a function that is called before the server update is executed. It
 * can be used to perform any necessary actions or updates on the model or UI before the server update
 * is initiated.
 * @param serverUpdate - `serverUpdate` is a function that returns a Promise representing the server
 * update operation. This function is called after the previous state of the model has been recorded
 * and the `preUpdate` function has been executed. If the server update is successful, the `postUpdate`
 * function is called with the result
 * @param [postUpdate] - `postUpdate` is an optional callback function that will be called after the
 * server update is successful. It takes in the response from the server update as its parameter. If
 * this parameter is not provided, nothing will happen after the server update.
 * @returns A Promise that resolves to `void`.
 */
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
