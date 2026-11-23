import assert from 'node:assert'
import fs from 'node:fs'
import {describe, it} from 'node:test'

import {default as Pg} from 'pg'

import {envToCfg, readEnv} from './config.js'
import {awsIamPoolConfig, regionFromRdsHostname} from './db/awsIamAuth.js'
import {Database} from './db/index.js'

const RDS_HOST = 'mydb.c0ffee.us-west-2.rds.amazonaws.com'
const IAM_URL = `postgres://iam_user@${RDS_HOST}:5433/link`
const CA_BUNDLE = fs.readFileSync(
  new URL('../certs/rds-global-bundle.pem', import.meta.url),
  'utf8',
)

async function withEnv<T>(
  vars: Record<string, string | undefined>,
  fn: () => T | Promise<T>,
): Promise<T> {
  const saved = Object.fromEntries(
    Object.keys(vars).map(key => [key, process.env[key]]),
  )
  const apply = (values: Record<string, string | undefined>) => {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
  apply(vars)
  try {
    return await fn()
  } finally {
    apply(saved)
  }
}

function poolOptions(db: Database): Pg.PoolConfig {
  return (db.cfg.pool as unknown as {options: Pg.PoolConfig}).options
}

const iamCfg = (url: string, migrationUrl?: string) =>
  envToCfg({
    hostnames: [],
    dbPostgresUrl: url,
    dbPostgresMigrationUrl: migrationUrl,
    dbPostgresAwsIamAuth: true,
  })

void describe('AWS IAM database auth', () => {
  void it('is off by default and leaves the connection string untouched', async () => {
    const url = 'postgres://pg:password@localhost:5433/postgres?sslmode=disable'
    await withEnv({LINK_DB_POSTGRES_AWS_IAM_AUTH: undefined}, () => {
      assert.strictEqual(readEnv().dbPostgresAwsIamAuth, undefined)
    })
    const cfg = envToCfg({hostnames: [], dbPostgresUrl: url})
    assert.strictEqual(cfg.db.awsIamAuth, false)

    const db = Database.postgres({url: cfg.db.url})
    try {
      const options = poolOptions(db)
      assert.strictEqual(options.connectionString, url)
      assert.ok(!('password' in options))
      assert.ok(!('ssl' in options))
    } finally {
      await db.close()
    }
  })

  void it('reads LINK_DB_POSTGRES_AWS_IAM_AUTH', async () => {
    await withEnv({LINK_DB_POSTGRES_AWS_IAM_AUTH: 'true'}, () => {
      assert.strictEqual(readEnv().dbPostgresAwsIamAuth, true)
    })
  })

  void it('verifies the server certificate and hostname whatever the PG* env says', async () => {
    await withEnv(
      {
        PGSSLMODE: 'disable',
        PGPASSWORD: 'from-env',
        PGHOST: 'elsewhere.example',
        PGPORT: '1',
      },
      async () => {
        const db = Database.postgres({
          url: `${IAM_URL}?sslmode=verify-full`,
          awsIamAuth: true,
        })
        try {
          const options = poolOptions(db)
          assert.ok(!('connectionString' in options))

          // The pool hands these options to every client it creates
          const client = new Pg.Client(options)
          const connection = (client as unknown as {connection: {ssl: unknown}})
            .connection
          const expectedSsl = {ca: CA_BUNDLE, rejectUnauthorized: true}
          assert.deepStrictEqual(client.ssl, expectedSsl)
          assert.deepStrictEqual(connection.ssl, expectedSsl)
          assert.match(CA_BUNDLE, /BEGIN CERTIFICATE/)
          assert.strictEqual(client.host, RDS_HOST)
          assert.strictEqual(client.port, 5433)
          assert.strictEqual(client.user, 'iam_user')
          assert.strictEqual(client.database, 'link')
          assert.strictEqual(typeof client.password, 'function')
        } finally {
          await db.close()
        }
      },
    )
  })

  void it('signs a fresh token for every connection', async () => {
    let calls = 0
    const credentials = () => {
      calls++
      return Promise.resolve({
        accessKeyId: 'AKIDEXAMPLE',
        secretAccessKey: 'secret',
        sessionToken: `session-${calls}`,
      })
    }
    await withEnv({AWS_REGION: undefined}, async () => {
      // Each new pool client calls the password function while connecting
      const pool = new Pg.Pool(awsIamPoolConfig(IAM_URL, {credentials}))
      const password = (pool as unknown as {options: Pg.PoolConfig}).options
        .password as () => Promise<string>

      const first = await password()
      const second = await password()
      await pool.end()

      assert.strictEqual(calls, 2)
      assert.notStrictEqual(first, second)
      for (const [token, session] of [
        [first, 'session-1'],
        [second, 'session-2'],
      ]) {
        const url = new URL(`https://${token}`)
        assert.strictEqual(url.host, `${RDS_HOST}:5433`)
        assert.strictEqual(url.searchParams.get('Action'), 'connect')
        assert.strictEqual(url.searchParams.get('DBUser'), 'iam_user')
        assert.strictEqual(
          url.searchParams.get('X-Amz-Security-Token'),
          session,
        )
        assert.match(
          url.searchParams.get('X-Amz-Credential') ?? '',
          /^AKIDEXAMPLE\/\d{8}\/us-west-2\/rds-db\/aws4_request$/,
        )
      }
    })
  })

  void it('prefers AWS_REGION over the hostname', async () => {
    await withEnv({AWS_REGION: 'eu-west-1'}, async () => {
      const options = awsIamPoolConfig(IAM_URL, {
        credentials: {accessKeyId: 'AKIDEXAMPLE', secretAccessKey: 'secret'},
      })
      const token = await (options.password as () => Promise<string>)()
      assert.match(token, /AKIDEXAMPLE%2F\d{8}%2Feu-west-1%2Frds-db%2F/)
    })
  })

  void it('derives the region from RDS hostnames', () => {
    assert.strictEqual(regionFromRdsHostname(RDS_HOST), 'us-west-2')
    assert.strictEqual(
      regionFromRdsHostname(
        'db.cluster-ro-abc.ap-southeast-2.rds.amazonaws.com',
      ),
      'ap-southeast-2',
    )
    assert.strictEqual(
      regionFromRdsHostname('px.proxy-abc.us-gov-west-1.rds.amazonaws.com'),
      'us-gov-west-1',
    )
    assert.strictEqual(regionFromRdsHostname('db.example.com'), undefined)
  })

  void it('accepts sslmode=verify-full on both URLs', () => {
    const cfg = iamCfg(
      `${IAM_URL}?sslmode=verify-full`,
      `postgres://migrator@${RDS_HOST}/link`,
    )
    assert.strictEqual(cfg.db.awsIamAuth, true)
  })

  void it('refuses URLs that would bypass IAM auth or TLS verification', () => {
    const refused: [string, RegExp][] = [
      [
        `postgres://iam_user:hunter2@${RDS_HOST}/link`,
        /must not contain a password/,
      ],
      [`${IAM_URL}?password=hunter2`, /"password" query parameter/],
      [`${IAM_URL}?sslmode=require`, /sslmode must be verify-full/],
      [`${IAM_URL}?sslmode=verify-ca`, /sslmode must be verify-full/],
      [`${IAM_URL}?sslmode=disable`, /sslmode must be verify-full/],
      [`${IAM_URL}?sslmode=no-verify`, /sslmode must be verify-full/],
      [`${IAM_URL}?ssl=false`, /"ssl" query parameter/],
      [`${IAM_URL}?sslrootcert=/tmp/ca.pem`, /"sslrootcert" query parameter/],
      [`${IAM_URL}?host=elsewhere`, /"host" query parameter/],
      ['postgres://iam_user@10.0.0.5/link', /database hostname/],
      ['postgres://iam_user@[::1]/link', /database hostname/],
      ['postgres://iam_user@127.1/link', /database hostname/],
      ['postgres://iam_user@0x7f000001/link', /database hostname/],
      [`postgres://${RDS_HOST}/link`, /must include a user/],
      [`mysql://iam_user@${RDS_HOST}/link`, /postgres:\/\/ URL/],
      ['not a url', /not a valid URL/],
    ]
    for (const [url, expected] of refused) {
      assert.throws(
        () => iamCfg(url),
        err =>
          err instanceof Error &&
          err.message.startsWith('LINK_DB_POSTGRES_URL cannot be used') &&
          expected.test(err.message) &&
          !err.message.includes('hunter2'),
        url,
      )
    }
  })

  void it('refuses a migration URL with a password', () => {
    assert.throws(
      () => iamCfg(IAM_URL, `postgres://migrator:hunter2@${RDS_HOST}/link`),
      /^Error: LINK_DB_POSTGRES_MIGRATION_URL cannot be used with AWS IAM auth: it must not contain a password$/,
    )
  })
})
