import uuid from 'react-native-uuid'

export * from '#/logger/growthbook/identifiers/common'

/**
 * Stable session ID, persisted for the duration of the user's session
 */
export const getSessionId = () => {
  let id = sessionStorage.getItem('BSKY_SESSION_ID')
  if (!id) {
    id = uuid.v4()
    sessionStorage.setItem('BSKY_SESSION_ID', id)
  }
  return id
}
