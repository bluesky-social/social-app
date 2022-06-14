if (typeof process.env.REACT_APP_AUTH_LOBBY !== 'string') {
  throw new Error('ENV: No auth lobby provided')
}

export const AUTH_LOBBY = process.env.REACT_APP_AUTH_LOBBY
