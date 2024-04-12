import {isWeb} from 'platform/detection'

export const OAUTH_CLIENT_ID = 'http://localhost/'
export const OAUTH_REDIRECT_URI = 'http://127.0.0.1:5173/'
export const OAUTH_SCOPE = 'openid profile email phone offline_access'
export const OAUTH_GRANT_TYPES = [
  'authorization_code',
  'refresh_token',
] as const
export const OAUTH_RESPONSE_TYPES = ['code', 'code id_token'] as const
export const DPOP_BOUND_ACCESS_TOKENS = true
export const OAUTH_APPLICATION_TYPE = isWeb ? 'web' : 'native' // TODO what should we put here for native

export const buildOAuthUrl = (serviceUrl: string, state: string) => {
  const url = new URL(serviceUrl)
  url.searchParams.set('client_id', OAUTH_CLIENT_ID)
  url.searchParams.set('redirect_uri', OAUTH_REDIRECT_URI)
  url.searchParams.set('response_type', OAUTH_RESPONSE_TYPES.join(' '))
  url.searchParams.set('scope', OAUTH_SCOPE)
  url.searchParams.set('state', state)
  return url.toString()
}
