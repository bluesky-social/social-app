import AsyncStorage from '@react-native-async-storage/async-storage'

const PREFIX = 'agent-labelers'

export async function saveLabelers(did: string, value: string[]) {
  await AsyncStorage.setItem(`${PREFIX}:${did}`, JSON.stringify(value))
}

export async function readLabelers(did: string): Promise<string[] | undefined> {
  const rawData = await AsyncStorage.getItem(`${PREFIX}:${did}`)
  return rawData ? JSON.parse(rawData) : undefined
}
