import {OAuthClientMetadata} from '@atproto/oauth-client-metadata'

import {Jwt} from '#/oauth-client-temp/jwk'

export type OAuthResponseMode = 'query' | 'fragment' | 'form_post'
export type OAuthResponseType = 'code' | 'code id_token'

export type OAuthEndpointName =
  | 'token'
  | 'revocation'
  | 'introspection'
  | 'pushed_authorization_request'

export type OAuthTokenType = 'Bearer' | 'DPoP'

export type OAuthAuthorizeOptions = {
  display?: 'page' | 'popup' | 'touch' | 'wap'
  id_token_hint?: string
  max_age?: number
  prompt?: 'login' | 'none' | 'consent' | 'select_account'
  scope?: string
  state?: string
  ui_locales?: string
}

export type OAuthTokenResponse = {
  issuer?: string
  sub?: string
  scope?: string
  id_token?: Jwt
  refresh_token?: string
  access_token: string
  token_type?: OAuthTokenType
  expires_in?: number
}

export type OAuthClientMetadataId = OAuthClientMetadata & {client_id: string}
