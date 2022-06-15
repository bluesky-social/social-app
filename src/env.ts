import {REACT_APP_AUTH_LOBBY} from '@env'

if (typeof REACT_APP_AUTH_LOBBY !== 'string') {
  throw new Error('ENV: No auth lobby provided')
}

export const AUTH_LOBBY = REACT_APP_AUTH_LOBBY
