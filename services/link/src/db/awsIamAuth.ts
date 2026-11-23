import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {fromNodeProviderChain} from '@aws-sdk/credential-providers'
import {Signer, type SignerConfig} from '@aws-sdk/rds-signer'
import {type PoolConfig} from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Amazon RDS CA bundle for all commercial regions, from
 * https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
 */
const RDS_CA_BUNDLE_PATH = path.join(
  __dirname,
  '../../certs/rds-global-bundle.pem',
)

const RDS_HOSTNAME_REGION = /\.([a-z]{2}(?:-[a-z]+)+-\d+)\.rds\.amazonaws\.com$/

type Credentials = SignerConfig['credentials']

let defaultCredentials: Credentials

/**
 * The default AWS credential provider chain, created once so its cached
 * credentials are shared by every pool and connection.
 */
function getDefaultCredentials(): Credentials {
  defaultCredentials ??= fromNodeProviderChain()
  return defaultCredentials
}

export type AwsIamDbUrl = {
  host: string
  port: number
  user: string
  database?: string
}

/**
 * Parses a postgres URL for use with AWS IAM auth, refusing anything that
 * would replace the generated password or weaken certificate verification:
 * a password, an IP address host, or any query parameter except
 * `sslmode=verify-full`. `name` labels the URL in error messages.
 */
export function parseAwsIamDbUrl(
  url: string,
  name = 'postgres url',
): AwsIamDbUrl {
  function fail(reason: string): never {
    throw new Error(`${name} cannot be used with AWS IAM auth: ${reason}`)
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    fail('it is not a valid URL')
  }
  if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
    fail('it must be a postgres:// URL')
  }
  if (parsed.password) {
    fail('it must not contain a password')
  }
  const host = parsed.hostname
  if (!host || isIpAddress(host)) {
    fail('it must use the database hostname, for certificate verification')
  }
  const user = decodeURIComponent(parsed.username)
  if (!user) {
    fail('it must include a user')
  }

  for (const [key, value] of parsed.searchParams) {
    if (key !== 'sslmode') {
      fail(`it must not set the "${key}" query parameter`)
    }
    if (value !== 'verify-full') {
      fail('sslmode must be verify-full')
    }
  }

  return {
    host,
    port: parsed.port ? Number(parsed.port) : 5432,
    user,
    database: decodeURIComponent(parsed.pathname.slice(1)) || undefined,
  }
}

/** Whether a URL hostname is an IP address, in any spelling URL accepts. */
function isIpAddress(host: string): boolean {
  try {
    // postgres: URLs keep hosts as written (127.1, [::1]); http: canonicalizes
    const canonical = new URL(`http://${host}`).hostname
    return net.isIP(canonical.replace(/^\[(.*)\]$/, '$1')) !== 0
  } catch {
    return false
  }
}

/** Region of an `*.rds.amazonaws.com` endpoint hostname. */
export function regionFromRdsHostname(host: string): string | undefined {
  return RDS_HOSTNAME_REGION.exec(host)?.[1]
}

/**
 * node-postgres connection options that authenticate with a fresh RDS IAM
 * token for every new connection and verify the server certificate and
 * hostname against the RDS CA bundle. The URL is deliberately not passed as
 * `connectionString`, because node-postgres lets it override `password` and
 * `ssl`.
 */
export function awsIamPoolConfig(
  url: string,
  opts: {credentials?: Credentials; region?: string} = {},
): PoolConfig {
  const {host, port, user, database} = parseAwsIamDbUrl(url)
  const credentials = opts.credentials ?? getDefaultCredentials()
  /*
   * Without AWS_REGION or an RDS hostname, the signer falls back to the
   * region in the shared AWS config file.
   */
  const region =
    opts.region || process.env.AWS_REGION || regionFromRdsHostname(host)

  return {
    host,
    port,
    user,
    database,
    password: () =>
      new Signer({
        hostname: host,
        port,
        username: user,
        region,
        credentials,
      }).getAuthToken(),
    ssl: {
      ca: fs.readFileSync(RDS_CA_BUNDLE_PATH, 'utf8'),
      rejectUnauthorized: true,
    },
  }
}
