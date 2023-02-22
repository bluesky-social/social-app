/*
At the moment, Web doesn't have any equivalence for these.
*/

export const PHOTO_LIBRARY = ''
export const CAMERA = ''

export async function hasAccess(_perm: any): Promise<boolean> {
  return true
}

export async function requestAccessIfNeeded(_perm: any): Promise<boolean> {
  return true
}

export async function requestPhotoAccessIfNeeded() {
  return requestAccessIfNeeded(PHOTO_LIBRARY)
}

export async function requestCameraAccessIfNeeded() {
  return requestAccessIfNeeded(CAMERA)
}
