# eurosky-oauth-worker

Stateless Cloudflare Worker that signs Eurosky's `private_key_jwt` OAuth
**client assertions**. It makes the Eurosky web app a *confidential* atproto
OAuth client (unlimited session lifetime + 180-day refresh tokens) without
putting the client private key in the browser.

It is **stateless**: no DB, no KV, no token storage. The only state is one
secret — the client private key. User tokens and DPoP keys stay in the
browser (IndexedDB), exactly as before.

## What it does

`POST` `{ header, payload }` (produced by `@atproto/oauth-client` in the app)
→ validates strict invariants → signs ES256 → returns `{ jws }`.

It is an assertion *minter*, not a generic signing oracle. Every request must
satisfy: `alg=ES256`, `kid` matches the key, `iss==sub==CLIENT_ID`, `aud` is
an `https` URL, `jti` present, short lifetime (≤300s), sane `iat`/`exp`. The
browser `Origin` is locked to `ALLOWED_ORIGIN`.

## Deploy

```bash
cd eurosky-oauth-worker
npm install

# 1. Set the private key secret. Paste the PRIVATE JWK JSON printed by
#    ../eurosky-social-app/scripts/gen-oauth-keypair.js (the block labelled
#    "PRIVATE JWK"). It is never committed and never leaves Cloudflare.
npx wrangler secret put OAUTH_PRIVATE_JWK

# 2. Confirm vars in wrangler.toml match your domain:
#      CLIENT_ID       = https://<domain>/oauth-client-metadata.json
#      ALLOWED_ORIGIN  = https://<domain>
#    (current: eurosky.atmo.tools)

# 3. Deploy
npx wrangler deploy
```

## Wire the app to it

The app calls `OAUTH_ASSERTION_URL` (see
`eurosky-social-app/src/config/oauth.ts`). Default:
`https://oauth.eurosky.atmo.tools/client-assertion`.

Either bind that route to this Worker (uncomment the `[[routes]]` block in
`wrangler.toml`, point DNS at it), or set
`EXPO_PUBLIC_OAUTH_ASSERTION_URL` at app build time to the Worker's actual
URL (e.g. its `*.workers.dev` URL).

Loopback/dev does NOT use this Worker — dev stays a public client.

## Key rotation

Generate a new keypair (`gen-oauth-keypair.js --force`), commit the new
public JWKS, redeploy the web build (regenerates
`oauth-client-metadata.json`), and `wrangler secret put OAUTH_PRIVATE_JWK`
with the new private key. The shared `kid` keeps old/new distinguishable;
publish both public keys briefly for a graceful rollover.
