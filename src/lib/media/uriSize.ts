import {getInfoAsync} from 'expo-file-system/legacy'

export async function getUriSize(uri: string): Promise<number> {
  const info = await getInfoAsync(uri)
  if (!info.exists) {
    throw new Error('Failed to read image size')
  }
  return info.size
}
