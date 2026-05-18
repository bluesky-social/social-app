/**
 * Emits the static `oauth-client-metadata.json` into the web build output.
 *
 * Runs at build time (chained off `build-web`). Reads the SAME
 * `src/config/oauth.shared.json` the browser client reads, so the hosted
 * client_id / scope / redirect_uris cannot drift from what the running app
 * registers. Mirrors getProdClientMetadata() in src/config/oauth.ts - keep
 * the two in lockstep (both are trivial templates over the shared JSON).
 *
 * client_id MUST equal the HTTPS URL this file is served at; redirect is
 * the site ROOT (no callback route - App.web.tsx detects callback params).
 */
/* eslint-disable import-x/no-nodejs-modules, @typescript-eslint/no-unsafe-member-access -- Node build script, not app source */
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.join(__dirname, '..')
const shared = require(
  path.join(projectRoot, 'src', 'config', 'oauth.shared.json'),
)

const baseUrl = process.env.EXPO_PUBLIC_OAUTH_BASE_URL || shared.defaultBaseUrl

const metadata = {
  client_id: `${baseUrl}/oauth-client-metadata.json`,
  client_name: shared.clientName,
  client_uri: baseUrl,
  redirect_uris: [`${baseUrl}/`],
  scope: shared.scope,
  token_endpoint_auth_method: 'none',
  response_types: ['code'],
  grant_types: ['authorization_code', 'refresh_token'],
  application_type: 'web',
  dpop_bound_access_tokens: true,
}

const outDir = path.join(projectRoot, 'web-build')
if (!fs.existsSync(outDir)) {
  console.error(
    `gen-oauth-metadata: ${outDir} does not exist (run after build-web)`,
  )
  process.exit(1)
}
const outFile = path.join(outDir, 'oauth-client-metadata.json')
fs.writeFileSync(outFile, JSON.stringify(metadata, null, 2) + '\n')
console.log(
  `gen-oauth-metadata: wrote ${outFile} (client_id ${metadata.client_id})`,
)
