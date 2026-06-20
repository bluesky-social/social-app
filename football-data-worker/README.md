# football-data.org worker

A first-party proxy in front of the football-data.org API for the live sports
widget (`src/features/liveSports/`). It handles two things the client can't:

- CORS: football-data.org sends no CORS headers, so web builds can't call it
  directly.
- Token secrecy: the `X-Auth-Token` is held by the proxy, not the client bundle.

The app points `EXPO_PUBLIC_FOOTBALLDATA_API_URL` at `<host>/v4` and sends no
token.

## Files

- `bunny/index.ts` - production Bunny.net Edge Script. Restricts requests to the
  allowed competition codes, injects the token, adds CORS, and briefly caches
  responses.
- `dev-proxy.mjs` - zero-dependency local Node proxy.

## Local development

```bash
FOOTBALLDATA_TOKEN=<token> node football-data-worker/dev-proxy.mjs
```

Then in `.env`:

```
EXPO_PUBLIC_FOOTBALLDATA_API_URL=http://localhost:8787/v4
EXPO_PUBLIC_FOOTBALLDATA_TOKEN=
```

## Production (Bunny)

Deploy `bunny/index.ts` as an Edge Script and set its env vars:

| Var                    | Required | Default | Notes                       |
| ---------------------- | -------- | ------- | --------------------------- |
| `FOOTBALLDATA_TOKEN`   | yes      | -       | football-data.org API token |
| `ALLOWED_COMPETITIONS` | no       | `WC`    | comma-separated codes       |
| `ALLOWED_ORIGIN`       | no       | `*`     | tighten to the app host     |
| `CACHE_SECONDS`        | no       | `30`    | cache TTL                   |

The web deploy points `EXPO_PUBLIC_FOOTBALLDATA_API_URL` at
`https://sports.mu.social/v4`, so deploy this script to that host.
