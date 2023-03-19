import {Alert} from 'react-native'
import {Camera} from 'expo-camera'
import * as MediaLibrary from 'expo-media-library'
import {Linking} from 'react-native'
import {isWeb} from 'platform/detection'

const openSettings = () => {
  Linking.openURL('app-settings:')
}

const openPermissionAlert = (perm: string) => {
  Alert.alert(
    'Permission needed',
    `Bluesky does not have permission to access your ${perm}.`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {text: 'Open Settings', onPress: () => openSettings()},
    ],
  )
}

export function usePhotoLibraryPermission() {
  const [mediaLibraryPermissions] = MediaLibrary.usePermissions()
  const requestPhotoAccessIfNeeded = async () => {
    // On the, we use <input type="file"> to produce a filepicker
    // This does not need any permission granting.
    if (isWeb) {
      return true
    }

    if (mediaLibraryPermissions?.status === 'granted') {
      return true
    } else {
      openPermissionAlert('photo library')
      return false
    }
  }
  return {requestPhotoAccessIfNeeded}
}

export function useCameraPermission() {
  const [cameraPermissionStatus] = Camera.useCameraPermissions()

  const requestCameraAccessIfNeeded = async () => {
    if (cameraPermissionStatus?.granted) {
      return true
    } else {
      openPermissionAlert('camera')
      return false
    }
  }

  return {requestCameraAccessIfNeeded}
}
