import {Alert} from 'react-native'
import {Camera} from 'expo-camera'
import * as MediaLibrary from 'expo-media-library'
import {Linking} from 'react-native'

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
