import {EventEmitter, NativeModulesProxy, Subscription} from 'expo-modules-core'

import {
  ChangeEventPayload,
  ExpoGetReferrerViewProps,
} from './src/ExpoGetReferrer.types'
// Import the native module. On web, it will be resolved to ExpoGetReferrer.web.ts
// and on native platforms to ExpoGetReferrer.ts
import ExpoGetReferrerModule from './src/ExpoGetReferrerModule'
import ExpoGetReferrerView from './src/ExpoGetReferrerView'

// Get the native constant value.
export const PI = ExpoGetReferrerModule.PI

export function hello(): string {
  return ExpoGetReferrerModule.hello()
}

export async function setValueAsync(value: string) {
  return await ExpoGetReferrerModule.setValueAsync(value)
}

const emitter = new EventEmitter(
  ExpoGetReferrerModule ?? NativeModulesProxy.ExpoGetReferrer,
)

export function addChangeListener(
  listener: (event: ChangeEventPayload) => void,
): Subscription {
  return emitter.addListener<ChangeEventPayload>('onChange', listener)
}

export {ChangeEventPayload, ExpoGetReferrerView, ExpoGetReferrerViewProps}
