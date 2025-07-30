import {ExpoOAuthClient} from 'expo-atproto-auth'

import {BSKY_OAUTH_CLIENT} from './oauth-web-client'

export function createNativeOAuthClient() {
  return new ExpoOAuthClient({
    clientMetadata: {
      client_id: 'https://bsky.hailey.at/oauth-client-metadata.native.json',
      client_name: 'Bluesky Native App (Hailey Demo)',
      client_uri: 'https://bsky.hailey.at',
      redirect_uris: ['at.hailey.bsky:/auth/native/callback'],
      scope: 'atproto transition:generic transition:email transition:chat.bsky',
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
