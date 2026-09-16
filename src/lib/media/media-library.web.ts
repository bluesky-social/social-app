import {type PermissionResponse, PermissionStatus} from 'expo'
import type {
  Album as NativeAlbum,
  Asset as NativeAsset,
  GranularPermission,
} from 'expo-media-library'

const noPermissionResponse: PermissionResponse = {
  status: PermissionStatus.UNDETERMINED,
  canAskAgain: true,
  granted: false,
  expires: 'never',
}

function unavailable(): Promise<never> {
  return Promise.reject(new Error('Media library is unavailable on web'))
}

export const Album = {
  create(
    _name: string,
    _assetRefs: string[] | NativeAsset[],
  ): Promise<NativeAlbum> {
    return unavailable()
  },
  get(_title: string): Promise<NativeAlbum | null> {
    return unavailable()
  },
}

export const Asset = {
  create(_filePath: string, _album?: NativeAlbum): Promise<NativeAsset> {
    return unavailable()
  },
}

export function requestPermissionsAsync(
  _writeOnly?: boolean,
  _granularPermissions?: GranularPermission[],
): Promise<PermissionResponse> {
  return Promise.resolve(noPermissionResponse)
}

export function usePermissions(_options?: {
  writeOnly?: boolean
  granularPermissions?: GranularPermission[]
}): [
  PermissionResponse | null,
  () => Promise<PermissionResponse>,
  () => Promise<PermissionResponse>,
] {
  const getPermission = () => Promise.resolve(noPermissionResponse)
  return [null, getPermission, getPermission]
}
