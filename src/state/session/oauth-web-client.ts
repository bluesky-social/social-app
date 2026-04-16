import {BrowserOAuthClient} from '@atproto/oauth-client-browser'

const OAUTH_BASE_URL: string =
  process.env.EXPO_PUBLIC_OAUTH_BASE_URL || 'https://blacksky.community'

const OAUTH_CLIENT_NAME: string =
  process.env.EXPO_PUBLIC_OAUTH_CLIENT_NAME || 'Blacksky Community'

const OAUTH_SCOPE =
  'atproto transition:generic transition:email transition:chat.bsky identity:handle account:email?action=manage account:status?action=manage'

function isLoopback() {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '[::1]' ||
    host === '::1'
  )
}

const BSKY_OAUTH_CLIENT = createWebOAuthClient()

function createWebOAuthClient() {
  if (isLoopback()) {
    // Loopback client: encode scope and redirect_uri in the client_id URL.
    // The authorization server uses hardcoded metadata for http://localhost
    // client_ids. Without explicit scope, only "atproto" is granted, which
    // lacks the transition:* scopes needed for appview/chat APIs.
    const port = window.location.port ? `:${window.location.port}` : ''
    const redirectUri = `http://127.0.0.1${port}/`
    const clientId =
      `http://localhost` +
      `?redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(OAUTH_SCOPE)}`

    return new BrowserOAuthClient({
      clientMetadata: {
        client_id: clientId,
        redirect_uris: [redirectUri],
        scope: OAUTH_SCOPE,
        token_endpoint_auth_method: 'none',
        response_types: ['code'],
        grant_types: ['authorization_code', 'refresh_token'],
        application_type: 'web',
        dpop_bound_access_tokens: true,
      },
      handleResolver: 'https://blacksky.app',
    })
  }

  return new BrowserOAuthClient({
    clientMetadata: {
      client_id: `${OAUTH_BASE_URL}/oauth-client-metadata.json`,
      client_name: OAUTH_CLIENT_NAME,
      client_uri: OAUTH_BASE_URL,
      redirect_uris: [`${OAUTH_BASE_URL}/auth/web/callback`],
      scope: OAUTH_SCOPE,
      token_endpoint_auth_method: 'none',
      response_types: ['code'],
      grant_types: ['authorization_code', 'refresh_token'],
      application_type: 'web',
      dpop_bound_access_tokens: true,
    },
    handleResolver: 'https://blacksky.app',
  })
}

export function getWebOAuthClient() {
  return BSKY_OAUTH_CLIENT
}
