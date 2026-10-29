# Bsky link service

## Preview the link warning pages

From `bskylink/`, run:

```sh
pnpm install
pnpm dev:preview
```

No database or Safelink credentials are needed. Open:

- Blocked link: <http://localhost:3000/_dev/link-warning>
- Warning: <http://localhost:3000/_dev/link-warning?type=warn>

Edit `src/html/linkWarningContents.ts` for markup and copy,
`src/html/linkWarningLayout.ts` for the document and CSS, and `locales/*.json`
for translations. Node restarts when imported source files change; refresh the
browser to see changes. Restart manually after editing locale JSON files.
Set `LINK_PORT` to use a different port.

The same preview route is available in the full service when
`NODE_ENV=development`. It returns 404 in production, test, or when `NODE_ENV` is
unset. `dev:preview` explicitly sets `NODE_ENV=development` and binds to loopback.
