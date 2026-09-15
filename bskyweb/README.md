## Build / Develop

### SPA Bundle (monolithic static javascript file)

To build the SPA bundle (`bundle.web.js`), first get a JavaScript development
environment set up. Either follow the top-level README, or something quick
like:

```bash
# install nodejs
nvm install
nvm use
npm install --global pnpm

# setup tools and deps (in top level of this repo)
pnpm install --frozen-lockfile

# run pnpm web dev server, if you wanted
pnpm web
```

Then build and copy over the big 'ol `bundle.web.js` file:

```bash
# in the top level of this repo
pnpm build-web
```

### Golang Daemon

Install golang. We generally develop against the current stable release of the language, as declared in `go.mod`.

In this directory (`bskyweb/`):

```bash
# re-build and run daemon
go run ./cmd/bskyweb serve

# build and output a binary
go build -o bskyweb ./cmd/bskyweb/
```

The easiest way to configure the daemon is to copy `example.env` to `.env` and
fill in auth values there.

## Feature-gate fallback

By default, `bskyweb` fetches the public GrowthBook configuration on startup and
every minute, with a five-second request timeout and a 1 MiB response limit.
The last valid payload is embedded as inert JSON in each app document. Requests
never wait for GrowthBook; an empty cache or an upstream outage cannot prevent
the page from loading. A snapshot that has not been successfully refreshed for
four hours is omitted. The worker's failures are logged by `bskyweb`.

`GROWTHBOOK_API_HOST` (default `https://events.bsky.app/gb`) and
`GROWTHBOOK_CLIENT_KEY` (default `sdk-7gkUkGy9wguUjyFe`) must match the web bundle's
`EXPO_PUBLIC_GROWTHBOOK_API_HOST` and `EXPO_PUBLIC_GROWTHBOOK_CLIENT_KEY` settings.
The corresponding `EXPO_PUBLIC_*` variables are also accepted by the server.
Set `FEATURE_GATE_BOOTSTRAP=false` to disable the server fetch and HTML payload.

The browser still uses the normal GrowthBook endpoint. If it fails or times out,
the embedded configuration supplies the rules and saved targeting groups. Newer
HTML rules also take precedence over an older SDK cache; later network updates
can replace them. The app document uses `Cache-Control: no-cache` so new document
loads revalidate. An already-open tab does not receive a new HTML snapshot during
SPA navigation. Native apps and static development pages use the existing SDK
behavior, and metrics continue to use their existing endpoint.

To verify that the SDK applied the embedded configuration, open the System log
under Settings > About (`/sys/log` on web) and look for
`GrowthBook HTML fallback applied`.
The entry includes the applied revision, feature count, and saved-group count.
`GrowthBook SDK configuration applied` records a configuration supplied by the
SDK instead, including recovery to a newer revision. These diagnostics are
available in production whenever a matching HTML snapshot is present. Repeated
refreshes of the same source and revision do not add duplicate entries.
