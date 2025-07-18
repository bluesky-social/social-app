import {Platform} from 'react-native'
import {ExpoOAuthClient} from 'expo-atproto-auth'
import {type OAuthClient} from '@atproto/oauth-client'
import {BrowserOAuthClient} from '@atproto/oauth-client-browser'

export const BSKY_OAUTH_CLIENT: OAuthClient =
  Platform.OS === 'web' ? createWebOAuthClient() : createNativeOAuthClient()

export function createWebOAuthClient() {
  return new BrowserOAuthClient({
    clientMetadata: {
      client_id: 'https://bsky.hailey.at/oauth-client-metadata.json',
      client_name: 'Bluesky (Hailey Demo)',
      client_uri: 'https://bsky.hailey.at',
      redirect_uris: ['https://bsky.hailey.at/auth/callback'],
      scope: 'atproto transition:generic',
      token_endpoint_auth_method: 'none',
      response_types: ['code'],
      grant_types: ['authorization_code', 'refresh_token'],
      application_type: 'web',
      dpop_bound_access_tokens: true,
    },
    handleResolver: 'https://bsky.social',
  })
}

export function createNativeOAuthClient() {
  return new ExpoOAuthClient({
    clientMetadata: {
      client_id: 'https://bsky.hailey.at/oauth-client-metadata.native.json',
      client_name: 'Bluesky Native App (Hailey Demo)',
      client_uri: 'https://bsky.hailey.at',
      redirect_uris: ['at.hailey.bsky:/auth/callback'],
      scope: 'atproto transition:generic',
      token_endpoint_auth_method: 'none',
      response_types: ['code'],
      grant_types: ['authorization_code', 'refresh_token'],
      application_type: 'native',
      dpop_bound_access_tokens: true,
    },
    handleResolver: 'https://bsky.social',
  })
}

export function getNativeOAuthClient() {
  return BSKY_OAUTH_CLIENT as ExpoOAuthClient
}

export function getWebOAuthClient() {
  return BSKY_OAUTH_CLIENT as BrowserOAuthClient
}
