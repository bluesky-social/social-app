import { NativeModulesProxy, EventEmitter, Subscription } from 'expo-modules-core';

// Import the native module. On web, it will be resolved to ExpoSelectableText.web.ts
// and on native platforms to ExpoSelectableText.ts
import ExpoSelectableTextModule from './src/ExpoSelectableTextModule';
import ExpoSelectableTextView from './src/ExpoSelectableTextView';
import { ChangeEventPayload, ExpoSelectableTextViewProps } from './src/ExpoSelectableText.types';

// Get the native constant value.
export const PI = ExpoSelectableTextModule.PI;

export function hello(): string {
  return ExpoSelectableTextModule.hello();
}

export async function setValueAsync(value: string) {
  return await ExpoSelectableTextModule.setValueAsync(value);
}

const emitter = new EventEmitter(ExpoSelectableTextModule ?? NativeModulesProxy.ExpoSelectableText);

export function addChangeListener(listener: (event: ChangeEventPayload) => void): Subscription {
  return emitter.addListener<ChangeEventPayload>('onChange', listener);
}

export { ExpoSelectableTextView, ExpoSelectableTextViewProps, ChangeEventPayload };
