export function usePhotoLibraryPermission() {
  const requestPhotoAccessIfNeeded = async () => {
    // On the, we use <input type="file"> to produce a filepicker
    // This does not need any permission granting.
    return true
  }
  return {requestPhotoAccessIfNeeded}
}

export function useCameraPermission() {
  const requestCameraAccessIfNeeded = async () => {
    return false
  }

  return {requestCameraAccessIfNeeded}
}

export function useVideoLibraryPermission() {
  const requestVideoAccessIfNeeded = async () => {
    return true
  }

  return {requestVideoAccessIfNeeded}
}
