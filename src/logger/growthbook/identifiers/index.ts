import uuid from 'react-native-uuid'

export * from '#/logger/growthbook/identifiers/common'

// TODO probably want to clear this
const sessionId = uuid.v4()
/**
 * Stable session ID, persisted for the duration of the user's session
 */
export const getSessionId = () => sessionId
