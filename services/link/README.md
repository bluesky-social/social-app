# Bsky link service

## Preview the link warning pages

Run `pnpm install` from the repo root, then from `services/link/`:

```sh
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

The standalone preview route is enabled only when `NODE_ENV=development`. It
returns 404 in production, test, or when `NODE_ENV` is unset. `dev:preview`
explicitly sets `NODE_ENV=development` and binds to loopback.

## AWS RDS IAM database authentication

By default the service connects with the credentials in
`LINK_DB_POSTGRES_URL` (and `LINK_DB_POSTGRES_MIGRATION_URL`, when set). Set
`LINK_DB_POSTGRES_AWS_IAM_AUTH=true` to authenticate to Amazon RDS with IAM
instead:

- Every new connection, for the service and for migrations, uses a freshly
  generated [IAM auth token](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.html)
  as its password. Credentials come from the default AWS provider chain (for
  example `AWS_ROLE_ARN` and `AWS_WEB_IDENTITY_TOKEN_FILE`, or the instance
  role). The region is `AWS_REGION`, or else taken from an
  `*.rds.amazonaws.com` hostname.
- TLS is required, and the server certificate and hostname are verified
  against the bundled Amazon RDS CA bundle (`certs/rds-global-bundle.pem`).
- The URLs must name the RDS endpoint hostname and a user granted `rds_iam`,
  with no password, for example
  `postgres://bskylink@mydb.abc123.us-east-1.rds.amazonaws.com:5432/bskylink`.
  Startup fails if a URL has a password, an IP address host, or any query
  parameter other than `sslmode=verify-full`.
