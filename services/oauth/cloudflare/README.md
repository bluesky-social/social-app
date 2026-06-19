# oauth (Cloudflare)

Cloudflare Workers twin of [`../bunny`](../bunny). Same client-assertion minter
(see [`../README.md`](../README.md) for what it does and the security model);
only the entrypoint and config source differ. Use this when deploying the brand
on Cloudflare instead of Bunny.

## Deploy

1. Edit `wrangler.jsonc`: just the worker `name`. `CLIENT_ID` / `ALLOWED_ORIGIN`
   are derived from `src/config/brand.json` at build; add a `vars` block
   only to override per deployment (e.g. staging). For local `wrangler dev`, put
   the key in `.dev.vars` (see `.dev.vars.example`) instead of `secret put`.
2. Set the private signing key as a secret (never a var):

   ```bash
   wrangler secret put OAUTH_PRIVATE_JWK   # paste the private ES256/P-256 JWK (incl. kid)
   ```

   The matching public JWK goes in `src/config/oauth.public-jwks.json` and is
   inlined into the static `oauth-client-metadata.json` at build
   (`scripts/gen-oauth-metadata.js`). Generate a keypair with
   `node scripts/gen-oauth-keypair.js`.
3. Deploy:

   ```bash
   wrangler deploy
   ```

4. Give the Worker a stable URL (a custom domain route like
   `oauth.<brand>` or the `workers.dev` URL) and point the app at it:
   `EXPO_PUBLIC_OAUTH_ASSERTION_URL=<that url>`.

No bindings or `nodejs_compat` needed - the Worker uses only Web Crypto + fetch
globals.

## Confidential vs public client

This Worker only exists for a **confidential** client. To run as a public
client instead (no Worker, no key), set the metadata's
`token_endpoint_auth_method` to `none` in the OAuth config and skip all of the
above; PKCE + redirect_uri pinning + DPoP carry the security either way.
