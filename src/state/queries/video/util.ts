const UPLOAD_ENDPOINT = process.env.EXPO_PUBLIC_VIDEO_ROOT_ENDPOINT ?? ''

export const createVideoEndpointUrl = (
  route: string,
  params?: Record<string, string>,
) => {
  const url = new URL(`${UPLOAD_ENDPOINT}`)
  url.pathname = route
  if (params) {
    for (const key in params) {
      url.searchParams.set(key, params[key])
    }
  }
  return url.href
}
