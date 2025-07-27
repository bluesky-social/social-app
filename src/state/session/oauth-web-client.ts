import {Platform} from 'react-native'
import {type OAuthClient} from '@atproto/oauth-client'
import {BrowserOAuthClient} from '@atproto/oauth-client-browser'

import {createNativeOAuthClient} from './oauth-native-client'

export const BSKY_OAUTH_CLIENT: OAuthClient =
  Platform.OS === 'web' ? createWebOAuthClient() : createNativeOAuthClient()

export function createWebOAuthClient() {
  return new BrowserOAuthClient({
    clientMetadata: {
      client_id: 'https://bsky.hailey.at/oauth-client-metadata.json',
      client_name: 'Bluesky (Hailey Demo)',
      client_uri: 'https://bsky.hailey.at',
      redirect_uris: ['https://bsky.hailey.at/auth/web/callback'],
      scope: 'atproto transition:generic transition:email transition:chat.bsky',
      token_endpoint_auth_method: 'none',
      response_types: ['code'],
      grant_types: ['authorization_code', 'refresh_token'],
      application_type: 'web',
      dpop_bound_access_tokens: true,
    },
    handleResolver: 'https://bsky.social',
  })
}

export function getWebOAuthClient() {
  return BSKY_OAUTH_CLIENT as BrowserOAuthClient
}
