import {Asset} from 'expo-media-library'

export {
  Album,
  Asset,
  requestPermissionsAsync,
  usePermissions,
} from 'expo-media-library'

export function getAssetExif(
  assetId: string,
): Promise<Record<string, unknown>> {
  return new Asset(assetId).getExif()
}
