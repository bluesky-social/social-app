import {requireNativeModule} from 'expo'

const NativeModule = requireNativeModule('ExpoBackgroundNotificationHandler')

export async function resetGenericCountAsync(): Promise<void> {
  await NativeModule.resetGenericCountAsync()
}

export async function maybeIncrementMessagesCountAsync(
  convoId: string,
): Promise<boolean> {
  return await NativeModule.maybeIncrementMessagesCountAsync(convoId)
}

export async function maybeDecrementMessagesCountAsync(
  convoId: string,
): Promise<boolean> {
  return await NativeModule.maybeDecrementMessagesCountAsync(convoId)
}
