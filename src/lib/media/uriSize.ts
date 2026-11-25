import {File} from 'expo-file-system'

export function getUriSize(uri: string): Promise<number> {
  const file = new File(uri)
  if (!file.exists) {
    throw new Error('Failed to read image size')
  }
  return Promise.resolve(file.size)
}
