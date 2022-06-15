/**
 * The environment is a place where services and shared dependencies between
 * models live. They are made available to every model via dependency injection.
 */

import {getEnv, IStateTreeNode} from 'mobx-state-tree'
import {ReactNativeStore} from './auth'
import {API} from '../api'

export class Environment {
  api = new API()
  authStore?: ReactNativeStore

  constructor() {}

  async setup() {
    this.authStore = await ReactNativeStore.load()
  }
}

/**
 * Extension to the MST models that adds the environment property.
 * Usage:
 *
 *   .extend(withEnvironment)
 *
 */
export const withEnvironment = (self: IStateTreeNode) => ({
  views: {
    get environment() {
      return getEnv<Environment>(self)
    },
  },
})
